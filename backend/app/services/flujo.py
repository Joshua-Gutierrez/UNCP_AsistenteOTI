from collections.abc import Sequence
import re

from app import crud
# pyrefly: ignore [missing-import]
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.caso import Caso
from app.models.nodo_flujo import NodoFlujo
from app.models.sesion_chat import SesionChat
from app.models.transicion_flujo import OpcionFlujo



ESTADOS_FINALES = {
    "FINAL_ATENDIDO": "atendido",
    "FINAL_MANUAL": "manual",
    "FINAL_SOPORTE": "solicitud_soporte",
}


async def es_nodo_terminal(db: AsyncSession, nodo: NodoFlujo) -> bool:
    opciones = await obtener_opciones_de_nodo(db, nodo.id)
    return len(opciones) == 0


async def _crear_caso_si_corresponde(db: AsyncSession, sesion: SesionChat, nodo: NodoFlujo) -> None:
    if not await es_nodo_terminal(db, nodo):
        return

    tipo_consulta = sesion.contexto.get("tipo_consulta", "otros")
    if nodo.tipo in {"ENVIAR_TEXTO", "FINAL", "texto", "final"}:
        estado = "atendido"
        if nodo.tipo == "FINAL":
            estado = nodo.bandeja_destino or "manual"
    elif nodo.tipo in ESTADOS_FINALES:
        estado = ESTADOS_FINALES[nodo.tipo]
    elif nodo.tipo in {"menu", "condicion", "OPCION"}:
        return
    else:
        return

    caso = Caso(
        tipo=tipo_consulta,
        mensaje=nodo.contenido,
        estado=estado,
    )
    db.add(caso)
    await db.commit()
    await db.refresh(caso)

    try:
        from app.api.v1.endpoints.admin import notificar_nuevo_caso
        await notificar_nuevo_caso(caso)
    except Exception:
        pass


def _registrar_nodo(sesion: SesionChat, nodo: NodoFlujo) -> None:
    historial = list(sesion.historial_nodos or [])
    historial.append(str(nodo.id))
    sesion.historial_nodos = historial


def _orden_efectivo(opcion: OpcionFlujo, posicion: int) -> int:
    if opcion.orden > 0:
        return opcion.orden
    if opcion.valor_entrada and opcion.valor_entrada.strip().isdigit():
        return int(opcion.valor_entrada.strip())
    return posicion


def _quitar_opciones_embebidas(contenido: str) -> str:
    lineas = contenido.splitlines()
    limpias = [linea for linea in lineas if not re.match(r"^\s*\d+[.)]\s*", linea)]
    return "\n".join(limpias).strip()


async def obtener_opciones_de_nodo(
    db: AsyncSession,
    nodo_id,
) -> list[tuple[OpcionFlujo, NodoFlujo, int]]:
    resultado = await crud.get_opciones_de_nodo(db, nodo_id)
    filas = list(enumerate(resultado, start=1))
    filas.sort(
        key=lambda fila: (
            _orden_efectivo(fila[1][0], fila[0])
            if fila[1][0].orden > 0 or (fila[1][0].valor_entrada or "").strip().isdigit()
            else 100000 + fila[0],
            str(fila[1][0].id),
        )
    )
    return [
        (opcion, destino, _orden_efectivo(opcion, posicion))
        for posicion, (_, (opcion, destino)) in enumerate(filas, start=1)
    ]


async def construir_mensaje_nodo(
    db: AsyncSession,
    nodo: NodoFlujo,
) -> str:
    opciones = await obtener_opciones_de_nodo(db, nodo.id)
    if not nodo.es_nodo_raiz and nodo.tipo not in {"menu", "condicion"}:
        return nodo.contenido

    lineas = [_quitar_opciones_embebidas(nodo.contenido), ""]
    for opcion, destino, orden in opciones:
        etiqueta = opcion.etiqueta or destino.codigo.replace("_", " ")
        lineas.append(f"{orden}. {etiqueta}")
    return "\n".join(lineas).strip()


async def _buscar_destino_por_resultado(
    db: AsyncSession,
    nodo_origen: NodoFlujo,
    resultado: str,
) -> NodoFlujo | None:
    # 1. Buscar primero entre las transiciones salientes del nodo actual
    opciones = await obtener_opciones_de_nodo(db, nodo_origen.id)
    for opcion, destino, _ in opciones:
        if (
            opcion.valor_entrada == resultado
            or destino.codigo == resultado
            or destino.codigo.startswith(resultado + "_")
            or (opcion.etiqueta or "").strip().lower() == resultado.lower()
        ):
            return destino

    # 2. Fallback: buscar nodo global con ese código exacto
    if resultado not in {"reintentar", "revision_manual", "dni_no_registrado", "datos_incorrectos"}:
        destino = await crud.get_nodo_por_codigo(db, resultado)
        if destino:
            return destino

    if resultado == "exito":
        return await crud.get_nodo_raiz(db)
    if resultado == "error":
        return await crud.get_nodo_por_codigo(db, "reintentar")
    return None


async def _manejar_accion_correo(
    db: AsyncSession,
    sesion: SesionChat,
    nodo_actual: NodoFlujo,
    texto_usuario: str,
) -> list[str]:
    """Máquina de estados para el nodo de verificación por correo.

    Etapas en sesion.contexto["etapa_correo"]:
        "solicitar"         → espera el correo institucional del usuario
        "verificar_codigo"  → espera el código OTP enviado al correo
    """
    from app.acciones import (  # importación diferida para evitar ciclos
        solicitar_correo,
        enviar_codigo_correo,
        verificar_codigo_correo,
        MAX_INTENTOS_CODIGO,
        DURACION_BANEO_MINUTOS,
    )
    from sqlalchemy.orm.attributes import flag_modified

    etapa = sesion.contexto.get("etapa_correo", "solicitar")

    if etapa == "solicitar":
        resultado = await solicitar_correo(db, sesion, texto_usuario)

        if resultado == "primera_vez":
            return [nodo_actual.contenido]

        if resultado == "formato_invalido":
            return ["Formato de correo inválido. Por favor, intente nuevamente."]

        if resultado == "no_registrado":
            return ["Correo no registrado en el sistema. Intente con otro correo."]

        # resultado == "continuar" → correo válido, usuario encontrado
        nombre = sesion.contexto.get("nombre_usuario", "")
        correo = sesion.contexto.get("correo_usuario", "")

        sesion.contexto["etapa_correo"] = "verificar_codigo"
        flag_modified(sesion, "contexto")

        await enviar_codigo_correo(db, sesion)
        flag_modified(sesion, "contexto")

        return [
            f"Validación exitosa. Identificado como:\n"
            f"Nombre: {nombre}\n"
            f"Correo: {correo}\n\n"
            f"Se envió un código a su correo institucional. Introdúzcalo a continuación."
        ]

    # etapa == "verificar_codigo"
    resultado = await verificar_codigo_correo(db, sesion, texto_usuario)

    if resultado == "baneado":
        # Limpiar estado de correo y navegar al nodo de baneo del flujo
        sesion.contexto.pop("etapa_correo", None)
        flag_modified(sesion, "contexto")
        destino_baneado = await _buscar_destino_por_resultado(db, nodo_actual, "baneado")
        if destino_baneado and destino_baneado.activo:
            sesion.nodo_actual_id = destino_baneado.id
            _registrar_nodo(sesion, destino_baneado)
            ctx = sesion.contexto or {}
            mensajes, nodo_final = await _seguir_cadena_automatica(db, sesion, destino_baneado, ctx)
            await _crear_caso_si_corresponde(db, sesion, nodo_final)
            return mensajes
        # Fallback si no hay nodo conectado
        return [
            f"Demasiados intentos fallidos. Por seguridad, "
            f"deberá esperar {DURACION_BANEO_MINUTOS} minutos antes de intentar de nuevo."
        ]

    if resultado == "expirado":
        flag_modified(sesion, "contexto")
        return ["El código expiró. Se ha enviado un nuevo código a su correo. Introdúzcalo a continuación."]

    if resultado == "incorrecto":
        intentos = sesion.contexto.get("intentos_codigo", 1)
        restantes = MAX_INTENTOS_CODIGO - intentos
        return [f"Código incorrecto. Le quedan {restantes} intento(s)."]

    # resultado == "exito" → navegar por todos los nodos automáticos y recopilar mensajes
    flag_modified(sesion, "contexto")
    sesion.contexto.pop("etapa_correo", None)
    flag_modified(sesion, "contexto")

    destino_exito = await _buscar_destino_por_resultado(db, nodo_actual, "exito")
    if destino_exito and destino_exito.activo:
        sesion.nodo_actual_id = destino_exito.id
        _registrar_nodo(sesion, destino_exito)
        ctx = sesion.contexto or {}
        # Recopilar el mensaje de CADA nodo atravesado automáticamente
        mensajes, nodo_final = await _seguir_cadena_automatica(db, sesion, destino_exito, ctx)
        await _crear_caso_si_corresponde(db, sesion, nodo_final)
        return mensajes

    return ["Verificación exitosa. Continuando el chat."]


def _interpolar_contexto(texto: str, contexto: dict) -> str:
    """Sustituye {placeholders} con valores del contexto de sesión."""
    try:
        return texto.format_map(contexto)
    except (KeyError, ValueError):
        return texto


async def _seguir_cadena_automatica(
    db: AsyncSession,
    sesion: SesionChat,
    nodo_inicial: NodoFlujo,
    ctx: dict,
    profundidad_max: int = 5,
) -> tuple[list[str], NodoFlujo]:
    """Recorre automáticamente la cadena de nodos con una sola transición sin valor_entrada.

    Devuelve la lista de mensajes de TODOS los nodos recorridos (incluido el inicial)
    y el último nodo alcanzado.
    """
    mensajes: list[str] = [_interpolar_contexto(nodo_inicial.contenido, ctx)]
    nodo = nodo_inicial

    for _ in range(profundidad_max):
        opciones = await obtener_opciones_de_nodo(db, nodo.id)
        if len(opciones) != 1:
            break
        opcion, destino, _ = opciones[0]
        # Solo avanzar si la transición no requiere un valor explícito del usuario
        if opcion.valor_entrada and opcion.valor_entrada.strip():
            break
        if not destino.activo:
            break
        sesion.nodo_actual_id = destino.id
        _registrar_nodo(sesion, destino)
        nodo = destino
        mensajes.append(_interpolar_contexto(nodo.contenido, ctx))

    return mensajes, nodo


async def procesar_respuesta(
    db: AsyncSession,
    sesion: SesionChat,
    texto_usuario: str,
) -> list[str]:
    texto = texto_usuario.strip().lower()
    menu = await crud.get_nodo_raiz(db)
    if not menu or not menu.activo:
        return ["El menú principal no está disponible en este momento."]

    if texto in {"0", "menu", "menú"}:
        for campo in ("etapa_correo", "correo_ingresado", "codigo_verificacion",
                      "codigo_expira_en", "intentos_codigo", "baneado_hasta"):
            sesion.contexto.pop(campo, None)
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(sesion, "contexto")
        sesion.nodo_actual_id = menu.id
        _registrar_nodo(sesion, menu)
        return [await construir_mensaje_nodo(db, menu)]

    nodo_actual = await db.get(NodoFlujo, sesion.nodo_actual_id) if sesion.nodo_actual_id else menu
    if not nodo_actual or not nodo_actual.activo:
        sesion.nodo_actual_id = menu.id
        _registrar_nodo(sesion, menu)
        return [await construir_mensaje_nodo(db, menu)]

    # ── Nodo de verificación por correo ──────────────────────────────────────
    if nodo_actual.tipo.upper() == "ACCION_CORREO":
        return await _manejar_accion_correo(db, sesion, nodo_actual, texto_usuario)

    # ── Flujo normal por opciones numéricas ──────────────────────────────────
    opciones = await obtener_opciones_de_nodo(db, nodo_actual.id)
    if not texto.isdigit():
        return [f"Escribe el número de una opción.\n\n{await construir_mensaje_nodo(db, nodo_actual)}"]

    numero = int(texto)
    seleccion = next((fila for fila in opciones if fila[2] == numero), None)
    if not seleccion:
        return [f"Opción no válida.\n\n{await construir_mensaje_nodo(db, nodo_actual)}"]

    _, destino, _ = seleccion
    if not destino.activo:
        return ["Esa opción no está disponible actualmente."]

    if destino.codigo == "menu_adesa":
        sesion.contexto["tipo_consulta"] = "adesa"
    elif destino.codigo == "menu_correo":
        sesion.contexto["tipo_consulta"] = "correo"
    elif destino.codigo == "menu_soporte":
        sesion.contexto["tipo_consulta"] = "soporte"

    sesion.nodo_actual_id = destino.id
    _registrar_nodo(sesion, destino)

    if destino.tipo.upper() == "ACCION_CORREO":
        sesion.contexto["etapa_correo"] = "solicitar"
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(sesion, "contexto")
        return [destino.contenido]

    if await es_nodo_terminal(db, destino):
        await _crear_caso_si_corresponde(db, sesion, destino)

    return [await construir_mensaje_nodo(db, destino)]


async def procesar_imagen(
    db: AsyncSession,
    sesion: SesionChat,
    imagen_bytes: bytes,
    usuario,
) -> list[str]:
    from app.acciones import validar_imagen_dni
    resultado = await validar_imagen_dni(sesion, imagen_bytes, usuario, db)
    
    nodo_actual = await db.get(NodoFlujo, sesion.nodo_actual_id)
    destino = await _buscar_destino_por_resultado(db, nodo_actual, resultado)
    
    if not destino:
        raise ValueError("No existe una salida configurada para el resultado: " + resultado)

    if resultado != "exito":
        nodo_para_continuar = nodo_actual
    else:
        nodo_para_continuar = destino

    sesion.nodo_actual_id = nodo_para_continuar.id
    _registrar_nodo(sesion, destino)

    ctx = sesion.contexto or {}
    
    # _seguir_cadena_automatica ya incluye el mensaje del nodo inicial en su lista
    # No agregar contenido_inicial por separado para evitar duplicados
    mensajes_nuevos, nodo_final = await _seguir_cadena_automatica(db, sesion, destino, ctx)
    
    await _crear_caso_si_corresponde(db, sesion, nodo_final)

    return mensajes_nuevos
