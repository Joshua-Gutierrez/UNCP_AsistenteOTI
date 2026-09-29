from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, WebSocket, WebSocketDisconnect, status, Body
from app import crud
from sqlmodel import select, update
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import Optional
from uuid import UUID
import json

from app.db.database import get_session
from app.models import NodoFlujo, OpcionFlujo, Admin, Caso, HistorialCambiosFlujo, Usuario
from app.schemas.admin import (
    LoginAdmin, TokenResponse, NodoOut, NodoIn, OpcionOut, OpcionIn, 
    CasoOut, ValidacionArbol
)
from app.core.seguridad import hashear_password, verificar_password, crear_token, decodificar_token
from app.core.config import configuracion

router = APIRouter(prefix="/admin", tags=["Admin"])

# --- Autenticación ---

async def admin_actual(sesion_admin: str | None = Cookie(default=None), session: AsyncSession = Depends(get_session)) -> str:
    admin_id = decodificar_token(sesion_admin) if sesion_admin else None
    if not admin_id:
        raise HTTPException(status_code=401, detail="Sesión inválida o expirada")
    import uuid
    try:
        uid = uuid.UUID(admin_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Sesión inválida o expirada")
    
    admin = await session.get(Admin, uid)
    if not admin or not admin.activo:
        raise HTTPException(status_code=401, detail="Cuenta desactivada o eliminada")
    return str(admin.id)

@router.post("/login", response_model=TokenResponse)
async def login(
    datos: LoginAdmin,
    response: Response,
    session: AsyncSession = Depends(get_session),
):
    admin = await crud.get_admin_por_correo(session, datos.correo)
    
    if not admin or not verificar_password(datos.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    if not admin.activo:
        raise HTTPException(status_code=401, detail="Cuenta desactivada")
    
    token = crear_token(str(admin.id))
    response.set_cookie(
        key="sesion_admin",
        value=token,
        httponly=True,
        samesite="strict",
        secure=(configuracion.entorno == "produccion"),
        max_age=8 * 60 * 60,
    )
    return TokenResponse(access_token=token)

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("sesion_admin")
    return {"ok": True}

@router.get("/me")
async def verificar_sesion(admin_id: str = Depends(admin_actual)):
    return {"ok": True, "admin_id": admin_id}

# --- Dashboard: Casos ---

@router.get("/casos", response_model=list[CasoOut])
async def listar_casos(
    estado: str, 
    session: AsyncSession = Depends(get_session), 
    admin_id: str = Depends(admin_actual)
):
    if estado not in ("atendido", "manual", "solicitud_soporte"):
        raise HTTPException(status_code=400, detail="Estado inválido")
    
    return await crud.get_casos_por_estado(session, estado)

@router.get("/perfiles")
async def listar_perfiles(
    session: AsyncSession = Depends(get_session),
    admin_id: str = Depends(admin_actual),
):
    return await crud.get_usuarios_recientes(session)

@router.patch("/casos/{caso_id}/atender")
async def marcar_atendido(
    caso_id: UUID, 
    session: AsyncSession = Depends(get_session), 
    admin_id: str = Depends(admin_actual)
):
    caso = await session.get(Caso, caso_id)
    if not caso:
        raise HTTPException(status_code=404, detail="Caso no encontrado")
    
    caso.estado = "atendido"
    session.add(caso)
    await session.commit()
    return {"ok": True}

@router.get("/casos/{caso_id}/mensajes")
async def obtener_mensajes_caso(
    caso_id: str,
    session: AsyncSession = Depends(get_session),
    admin_id: str = Depends(admin_actual)
):
    import uuid
    caso = await session.get(Caso, uuid.UUID(caso_id))
    if not caso:
        raise HTTPException(status_code=404, detail="Caso no encontrado")
    
    if not caso.sesion_id:
        return []
    
    from app.models.mensaje import Mensaje
    mensajes = await session.exec(select(Mensaje).where(Mensaje.sesion_id == caso.sesion_id).order_by(Mensaje.creado_en))
    return mensajes.all()

# --- WebSocket Dashboard ---

conexiones_activas: list[WebSocket] = []

@router.websocket("/ws/dashboard")
async def websocket_dashboard(websocket: WebSocket):
    await websocket.accept()
    conexiones_activas.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        conexiones_activas.remove(websocket)

async def notificar_nuevo_caso(caso: Caso):
    for conexion in conexiones_activas:
        try:
            await conexion.send_json({"evento": "nuevo_caso", "caso_id": str(caso.id), "estado": caso.estado})
        except:
            pass

# --- Editor de Flujo: Nodos ---

@router.get("/nodos", response_model=list[NodoOut])
async def listar_nodos(session: AsyncSession = Depends(get_session), admin_id: str = Depends(admin_actual)):
    return await crud.get_nodos(session)

@router.post("/nodos", response_model=NodoOut, status_code=status.HTTP_201_CREATED)
async def crear_nodo(datos: NodoIn, session: AsyncSession = Depends(get_session), admin_id: str = Depends(admin_actual)):
    existente = await crud.get_nodo_por_codigo(session, datos.codigo)
    if existente:
        raise HTTPException(status_code=400, detail="El código del nodo ya existe")
    
    nodo = NodoFlujo(**datos.model_dump())
    session.add(nodo)
    await session.commit()
    await session.refresh(nodo)
    
    await registrar_auditoria(session, admin_id, str(nodo.id), "crear", None, datos.model_dump())
    return nodo

@router.put("/nodos/{nodo_id}", response_model=NodoOut)
async def editar_nodo(
    nodo_id: UUID, 
    datos: NodoIn, 
    session: AsyncSession = Depends(get_session), 
    admin_id: str = Depends(admin_actual)
):
    nodo = await session.get(NodoFlujo, nodo_id)
    if not nodo:
        raise HTTPException(status_code=404, detail="Nodo no encontrado")
    
    anteriores = {"codigo": nodo.codigo, "contenido": nodo.contenido, "activo": nodo.activo}
    
    for campo, valor in datos.model_dump().items():
        setattr(nodo, campo, valor)
    
    session.add(nodo)
    await session.commit()
    await session.refresh(nodo)
    
    await registrar_auditoria(session, admin_id, str(nodo.id), "editar", anteriores, datos.model_dump())
    return nodo

@router.delete("/nodos/{nodo_id}")
async def eliminar_nodo(
    nodo_id: UUID, 
    session: AsyncSession = Depends(get_session), 
    admin_id: str = Depends(admin_actual)
):
    nodo = await session.get(NodoFlujo, nodo_id)
    if not nodo:
        raise HTTPException(status_code=404, detail="Nodo no encontrado")

    if nodo.codigo == "menu_principal":
        raise HTTPException(
            status_code=400,
            detail="El nodo menu_principal es obligatorio y no se puede desactivar."
        )

    anteriores = {
        "codigo": nodo.codigo,
        "tipo": nodo.tipo,
        "contenido": nodo.contenido,
        "bandeja_destino": nodo.bandeja_destino,
        "activo": nodo.activo,
        "posicion_x": nodo.posicion_x,
        "posicion_y": nodo.posicion_y,
    }

    en_uso = await session.exec(
        select(OpcionFlujo).where(
            (OpcionFlujo.nodo_origen_id == nodo_id)
            | (OpcionFlujo.nodo_destino_id == nodo_id)
        )
    )
    conexiones = en_uso.all()
    for conexion in conexiones:
        await session.delete(conexion)

    nodo.activo = False
    session.add(nodo)
    await session.commit()

    await registrar_auditoria(session, admin_id, str(nodo_id), "desactivar", anteriores, {"activo": False})
    return {"ok": True, "desactivado": True, "conexiones_eliminadas": len(conexiones)}

# --- Editor de Flujo: Opciones (Conexiones) ---

@router.get("/opciones", response_model=list[OpcionOut])
async def listar_opciones(session: AsyncSession = Depends(get_session), admin_id: str = Depends(admin_actual)):
    return await crud.get_opciones(session)

@router.post("/opciones", response_model=OpcionOut, status_code=status.HTTP_201_CREATED)
async def crear_opcion(datos: OpcionIn, session: AsyncSession = Depends(get_session), admin_id: str = Depends(admin_actual)):
    origen = await session.get(NodoFlujo, datos.nodo_origen_id)
    destino = await session.get(NodoFlujo, datos.nodo_destino_id)
    
    if not origen:
        raise HTTPException(status_code=404, detail="Nodo origen no encontrado")
    if not destino:
        raise HTTPException(status_code=404, detail="Nodo destino no encontrado")
    if not origen.activo or not destino.activo:
        raise HTTPException(status_code=400, detail="No se pueden conectar nodos eliminados o inactivos")
    
    opcion = OpcionFlujo(**datos.model_dump())
    session.add(opcion)
    await session.commit()
    await session.refresh(opcion)
    return opcion


@router.put("/opciones/{opcion_id}", response_model=OpcionOut)
async def editar_opcion(
    opcion_id: UUID, 
    datos: OpcionIn, 
    session: AsyncSession = Depends(get_session), 
    admin_id: str = Depends(admin_actual)
):
    opcion = await session.get(OpcionFlujo, opcion_id)
    if not opcion:
        raise HTTPException(status_code=404, detail="Opción no encontrada")
    
    for campo, valor in datos.model_dump().items():
        setattr(opcion, campo, valor)
    
    session.add(opcion)
    await session.commit()
    await session.refresh(opcion)
    return opcion


@router.delete("/opciones/{opcion_id}")
async def eliminar_opcion(
    opcion_id: UUID, 
    session: AsyncSession = Depends(get_session), 
    admin_id: str = Depends(admin_actual)
):
    opcion = await session.get(OpcionFlujo, opcion_id)
    if not opcion:
        raise HTTPException(status_code=404, detail="Opción no encontrada")
    
    await session.delete(opcion)
    await session.commit()
    return {"ok": True}

# --- Plantillas de Nodos Compuestos ---

@router.post("/nodos/plantilla/verificacion-correo", status_code=status.HTTP_201_CREATED)
async def crear_plantilla_verificacion_correo(
    x: int = 100,
    y: int = 100,
    session: AsyncSession = Depends(get_session),
    admin_id: str = Depends(admin_actual),
):
    """Crea el cluster de verificación por correo institucional (Gmail/SMTP).

    Genera 4 nodos pre-cableados con código único:
      - correo_solicitar_XXX  (ACCION_CORREO) → pide el correo, valida y muestra confirmación
      - correo_exito_XXX      (MENSAJE_DINAMICO) → "Verificación exitosa. Continuando el chat."
      - correo_baneado_XXX   (ENVIAR_TEXTO) → mensaje de ban por intentos fallidos
      - correo_error_XXX     (ENVIAR_TEXTO) → correo no registrado / formato inválido

    Conexiones internas pre-cableadas:
      solicitar ──exito──► exito
      solicitar ──baneado──► baneado
    """
    import secrets as _secrets
    sufijo = _secrets.token_hex(4)  # 8 chars hex — hace el código único

    nodos_spec = [
        {
            "codigo": f"correo_solicitar_{sufijo}",
            "tipo": "ACCION_CORREO",
            "contenido": "Introduzca su correo institucional para continuar.",
            "bandeja_destino": None,
            "activo": True,
            "posicion_x": x,
            "posicion_y": y,
        },
        {
            "codigo": f"correo_exito_{sufijo}",
            "tipo": "MENSAJE_DINAMICO",
            "contenido": "Verificación exitosa. Continuando el chat.",
            "bandeja_destino": None,
            "activo": True,
            "posicion_x": x + 300,
            "posicion_y": y - 40,
        },
        {
            "codigo": f"correo_baneado_{sufijo}",
            "tipo": "ENVIAR_TEXTO",
            "contenido": (
                "Demasiados intentos fallidos. Por seguridad, "
                "deberá esperar 5 minutos antes de intentar de nuevo."
            ),
            "bandeja_destino": None,
            "activo": True,
            "posicion_x": x + 300,
            "posicion_y": y + 100,
        },
    ]

    nodos_creados: dict[str, NodoFlujo] = {}
    for spec in nodos_spec:
        existente = await crud.get_nodo_por_codigo(session, spec["codigo"])
        if existente:
            raise HTTPException(status_code=400, detail=f"El código '{spec['codigo']}' ya existe.")
        nodo = NodoFlujo(**spec)
        session.add(nodo)
        await session.flush()
        nodos_creados[spec["codigo"].split("_")[1]] = nodo  # clave: "solicitar" | "exito" | "baneado"

    # Clave por nombre semántico
    n_solicitar = nodos_creados["solicitar"]
    n_exito = nodos_creados["exito"]
    n_baneado = nodos_creados["baneado"]

    conexiones_internas = [
        {"nodo_origen_id": n_solicitar.id, "nodo_destino_id": n_exito.id,
         "etiqueta": "exito", "valor_entrada": "exito", "orden": 1},
        {"nodo_origen_id": n_solicitar.id, "nodo_destino_id": n_baneado.id,
         "etiqueta": "baneado", "valor_entrada": "baneado", "orden": 2},
    ]
    for conn in conexiones_internas:
        opcion = OpcionFlujo(**conn)
        session.add(opcion)

    await session.commit()

    # Refrescar para obtener IDs finales
    for nodo in nodos_creados.values():
        await session.refresh(nodo)

    return {
        "sufijo": sufijo,
        "nodos": {
            "solicitar": {"id": str(n_solicitar.id), "codigo": n_solicitar.codigo},
            "exito": {"id": str(n_exito.id), "codigo": n_exito.codigo},
            "baneado": {"id": str(n_baneado.id), "codigo": n_baneado.codigo},
        },
        "mensaje": (
            "Cluster Gmail creado. Conecta la entrada de 'solicitar' desde tu nodo de menú, "
            "y la salida 'exito' hacia el siguiente paso del flujo."
        ),
    }



# --- Validación del Árbol ---

@router.get("/nodos/validar", response_model=ValidacionArbol)
async def validar_arbol(session: AsyncSession = Depends(get_session), admin_id: str = Depends(admin_actual)):
    problemas = []
    nodos = await crud.get_nodos(session)
    opciones = await crud.get_opciones(session)
    
    ids_con_entrada = {o.nodo_destino_id for o in opciones}
    ids_con_salida = {o.nodo_origen_id for o in opciones}
    
    for nodo in nodos:
        if not nodo.activo:
            continue
        if nodo.codigo != "menu_principal" and nodo.id not in ids_con_entrada:
            problemas.append(f"El nodo '{nodo.codigo}' es inalcanzable (nadie lo referencia).")
        if nodo.tipo in ("menu", "condicion") and nodo.id not in ids_con_salida:
            problemas.append(f"El nodo '{nodo.codigo}' no tiene ninguna opción de salida.")
    
    return ValidacionArbol(valido=len(problemas) == 0, problemas=problemas)

# --- Auditoría ---

async def registrar_auditoria(
    db: AsyncSession, 
    admin_id: str, 
    nodo_id: str, 
    tipo_cambio: str, 
    datos_anteriores: dict | None, 
    datos_nuevos: dict | None
):
    import json
    entrada = HistorialCambiosFlujo(
        admin_id=UUID(admin_id),
        nodo_id=UUID(nodo_id),
        tipo_cambio=tipo_cambio,
        datos_anteriores=json.dumps(datos_anteriores) if datos_anteriores else None,
        datos_nuevos=json.dumps(datos_nuevos) if datos_nuevos else None,
    )
    db.add(entrada)
    await db.commit()

# --- Gestión de Administradores ---
from datetime import date, datetime, timezone
import io
from fastapi.responses import StreamingResponse
from sqlalchemy import func, text
from openpyxl import Workbook
from app.schemas.admin import AdminIn, AdminOut

async def requerir_superadmin(admin_id: str = Depends(admin_actual), session: AsyncSession = Depends(get_session)):
    import uuid
    admin = await session.get(Admin, uuid.UUID(admin_id))
    if not admin or admin.rol != "superadmin":
        raise HTTPException(403, "Solo un superadministrador puede gestionar cuentas.")
    return admin

@router.get("/administradores", response_model=list[AdminOut])
async def listar_administradores(db: AsyncSession = Depends(get_session), _=Depends(requerir_superadmin)):
    resultado = await db.execute(select(Admin))
    return resultado.scalars().all()

@router.post("/administradores", response_model=AdminOut)
async def crear_administrador(datos: AdminIn, db: AsyncSession = Depends(get_session), _=Depends(requerir_superadmin)):
    existente = await crud.get_admin_por_correo(db, datos.correo)
    if existente:
        raise HTTPException(400, "El correo ya está registrado.")
    
    nuevo_admin = Admin(
        correo=datos.correo,
        nombre=datos.nombre,
        password_hash=hashear_password(datos.password),
        rol=datos.rol,
    )
    db.add(nuevo_admin)
    await db.commit()
    await db.refresh(nuevo_admin)
    return nuevo_admin

@router.patch("/administradores/{id}/activo")
async def cambiar_estado_administrador(id: str, activo: bool, db: AsyncSession = Depends(get_session), _=Depends(requerir_superadmin)):
    import uuid
    admin = await db.get(Admin, uuid.UUID(id))
    if not admin:
        raise HTTPException(404, "Administrador no encontrado.")
    admin.activo = activo
    await db.commit()
    return {"ok": True, "activo": activo}

# --- Finalizar Atención ---

@router.patch("/casos/{caso_id}/finalizar")
async def finalizar_atencion(
    caso_id: str, 
    nota_cierre: str | None = Body(default=None, embed=True),
    db: AsyncSession = Depends(get_session), 
    admin_id: str = Depends(admin_actual)
):
    import uuid
    caso = await db.get(Caso, uuid.UUID(caso_id))
    if not caso:
        raise HTTPException(404, "Caso no encontrado.")
    caso.estado = "finalizado"
    caso.finalizado_en = datetime.now(timezone.utc)
    caso.atendido_por = uuid.UUID(admin_id)
    if nota_cierre:
        caso.nota_cierre = nota_cierre
    await db.commit()
    return {"ok": True, "estado": "finalizado"}

# --- Reportes ---

@router.get("/reportes/atenciones")
async def reporte_atenciones(
    fecha_inicio: date, fecha_fin: date,
    db: AsyncSession = Depends(get_session), admin_id: str = Depends(admin_actual),
):
    from app.models.sesion_chat import SesionChat
    from app.models.usuario import Usuario
    from datetime import timedelta
    
    fecha_fin_inclusive = fecha_fin + timedelta(days=1)
    
    resultado = await db.execute(
        select(
            Admin.nombre.label("admin_nombre"),
            Usuario.nombre.label("usuario_nombre"),
            Usuario.email.label("usuario_email"),
            Usuario.dni.label("usuario_dni"),
            Caso.codigo_ticket,
            Caso.nota_cierre,
            Caso.creado_en,
            Caso.finalizado_en,
            func.timestampdiff(text("SECOND"), Caso.creado_en, Caso.finalizado_en).label("tiempo_segundos")
        )
        .join(Caso, Caso.atendido_por == Admin.id)
        .outerjoin(SesionChat, Caso.sesion_id == SesionChat.id)
        .outerjoin(Usuario, SesionChat.usuario_id == Usuario.id)
        .where(
            Caso.finalizado_en >= fecha_inicio,
            Caso.finalizado_en < fecha_fin_inclusive
        )
        .order_by(Caso.finalizado_en.desc())
    )
    datos = resultado.all()
    return [
        {
            "admin_nombre": row.admin_nombre,
            "usuario_nombre": row.usuario_nombre or "Anónimo",
            "usuario_email": row.usuario_email or "N/A",
            "usuario_dni": row.usuario_dni or "N/A",
            "codigo_ticket": row.codigo_ticket or "S/T",
            "nota_cierre": row.nota_cierre or "",
            "creado_en": row.creado_en,
            "finalizado_en": row.finalizado_en,
            "tiempo_minutos": round((float(row.tiempo_segundos) or 0) / 60, 2)
        }
        for row in datos
    ]

@router.get("/reportes/atenciones/exportar")
async def exportar_reporte_excel(
    fecha_inicio: date, fecha_fin: date,
    db: AsyncSession = Depends(get_session), admin_id: str = Depends(admin_actual),
):
    from app.models.sesion_chat import SesionChat
    from app.models.usuario import Usuario
    from datetime import timedelta
    
    fecha_fin_inclusive = fecha_fin + timedelta(days=1)

    resultado = await db.execute(
        select(
            Admin.nombre.label("admin_nombre"),
            Usuario.nombre.label("usuario_nombre"),
            Usuario.email.label("usuario_email"),
            Usuario.dni.label("usuario_dni"),
            Caso.codigo_ticket,
            Caso.nota_cierre,
            Caso.creado_en,
            Caso.finalizado_en,
            func.timestampdiff(text("SECOND"), Caso.creado_en, Caso.finalizado_en).label("tiempo_segundos")
        )
        .join(Caso, Caso.atendido_por == Admin.id)
        .outerjoin(SesionChat, Caso.sesion_id == SesionChat.id)
        .outerjoin(Usuario, SesionChat.usuario_id == Usuario.id)
        .where(
            Caso.finalizado_en >= fecha_inicio,
            Caso.finalizado_en < fecha_fin_inclusive
        )
        .order_by(Caso.finalizado_en.desc())
    )
    datos = resultado.all()

    libro = Workbook()
    hoja = libro.active
    hoja.title = "Reporte de Atenciones"
    hoja.append(["Administrador", "Estudiante", "DNI", "Correo", "Ticket", "Nota Cierre", "Inicio", "Fin", "Tiempo (min)"])
    
    for fila in datos:
        minutos = round((float(fila.tiempo_segundos) or 0) / 60, 2) if fila.tiempo_segundos else 0
        hoja.append([
            fila.admin_nombre,
            fila.usuario_nombre or "Anónimo",
            fila.usuario_dni or "N/A",
            fila.usuario_email or "N/A",
            fila.codigo_ticket or "S/T",
            fila.nota_cierre or "",
            fila.creado_en.strftime("%Y-%m-%d %H:%M:%S") if fila.creado_en else "",
            fila.finalizado_en.strftime("%Y-%m-%d %H:%M:%S") if fila.finalizado_en else "",
            minutos
        ])

    buffer = io.BytesIO()
    libro.save(buffer)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=reporte_{fecha_inicio}_a_{fecha_fin}.xlsx"},
    )
