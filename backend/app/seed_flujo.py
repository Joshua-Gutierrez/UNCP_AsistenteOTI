"""Carga la estructura simplificada del árbol de decisiones y ordena los nodos por nivel."""

import asyncio

from sqlmodel import delete, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db.database import get_session
from app.models.historial_cambios_flujo import HistorialCambiosFlujo
from app.models.nodo_flujo import NodoFlujo
from app.models.transicion_flujo import OpcionFlujo

ARBOL = [
    ("menu_principal", "OPCION", "Bienvenido(a), soy Julie, su asistente virtual. ¿En qué puedo ayudarle?", None, 40, 320),
    ("menu_adesa", "OPCION", "¿Qué necesita sobre su cuenta ADESA?", None, 320, 80),
    ("respuesta_pagos", "FINAL_ATENDIDO", "Los códigos de pago se encuentran disponibles en la sección financiera de su intranet ADESA. Escriba 0 para volver al menú principal.", "atendido", 600, 20),
    ("respuesta_claves", "FINAL_ATENDIDO", "Para recuperar su clave de ADESA, utilice la opción 'Olvidé mi contraseña' en el portal institucional. Escriba 0 para volver al menú principal.", "atendido", 600, 140),
    ("menu_correo", "OPCION", "¿Qué necesita sobre su correo institucional?", None, 320, 320),
    ("respuesta_correo_pass", "FINAL_ATENDIDO", "Hemos iniciado el proceso de restablecimiento de su contraseña de correo institucional. Recibirá instrucciones en los próximos minutos. Escriba 0 para volver al menú principal.", "atendido", 600, 260),
    ("respuesta_correo_tel", "FINAL_ATENDIDO", "Su número de teléfono de recuperación ha sido actualizado correctamente. Escriba 0 para volver al menú principal.", "atendido", 600, 380),
    ("respuesta_correo_auth", "FINAL_ATENDIDO", "Su aplicación autenticadora ha sido actualizada correctamente. Escriba 0 para volver al menú principal.", "atendido", 600, 500),
    ("menu_soporte", "OPCION", "¿Qué tipo de soporte necesita?", None, 320, 620),
    ("soporte_office", "FINAL_SOPORTE", "Su solicitud ha sido registrada. El personal de TI se pondrá en contacto con usted en breve. Gracias por su paciencia.", "solicitud_soporte", 600, 560),
    ("soporte_especializado", "FINAL_SOPORTE", "Su solicitud de software especializado ha sido registrada y derivada al área correspondiente.", "solicitud_soporte", 600, 680),
    ("soporte_equipos", "FINAL_SOPORTE", "Su solicitud de soporte de equipos ha sido registrada. Un técnico se comunicará con usted a la brevedad.", "solicitud_soporte", 600, 800),
    ("otros", "FINAL_MANUAL", "Su consulta ha sido derivada a un asesor, quien se pondrá en contacto con usted a la brevedad.", "manual", 600, 920),
    ("solicitar_foto_dni", "ACCION", "Para continuar, toma una foto clara de tu DNI o selecciona una imagen.", None, 920, 80),
    ("verificar_ocr_dni", "ACCION", "Estamos verificando los datos de tu DNI.", None, 1160, 80),
    ("reintentar", "ACCION", "No pudimos leer el DNI. Envía otra foto, completa y nítida.", None, 1400, 0),
    ("revision_manual", "FINAL_MANUAL", "La validación requiere revisión manual. Un asesor se pondrá en contacto contigo.", "manual", 1400, 100),
    ("dni_no_registrado", "FINAL_MANUAL", "El DNI no coincide con el usuario registrado. Un asesor revisará tu caso.", "manual", 1400, 200),
    ("datos_incorrectos", "ACCION", "Los datos del DNI no coinciden. Envía una foto más clara.", None, 1400, 300),
]

CONEXIONES = [
    ("menu_principal", 1, "ADESA", "menu_adesa"),
    ("menu_principal", 2, "Correo institucional", "menu_correo"),
    ("menu_principal", 3, "Soporte técnico", "menu_soporte"),
    ("menu_adesa", 1, "Pagos", "respuesta_pagos"),
    ("menu_adesa", 2, "Restablecer clave", "respuesta_claves"),
    ("menu_correo", 1, "Restablecer contraseña", "respuesta_correo_pass"),
    ("menu_correo", 2, "Actualizar número de teléfono", "respuesta_correo_tel"),
    ("menu_correo", 3, "Cambiar aplicación autenticadora", "respuesta_correo_auth"),
    ("menu_soporte", 1, "Instalación de Office", "soporte_office"),
    ("menu_soporte", 2, "Software especializado de la carrera", "soporte_especializado"),
    ("menu_soporte", 3, "Equipos electrónicos", "soporte_equipos"),
    ("menu_soporte", 4, "Otro requerimiento", "otros"),
    ("solicitar_foto_dni", 1, "Verificar DNI", "verificar_ocr_dni"),
    ("verificar_ocr_dni", 1, "reintentar", "reintentar"),
    ("verificar_ocr_dni", 2, "revisión manual", "revision_manual"),
    ("verificar_ocr_dni", 3, "DNI no registrado", "dni_no_registrado"),
    ("verificar_ocr_dni", 4, "datos incorrectos", "datos_incorrectos"),
]


async def limpiar_nodos_legacy(db: AsyncSession) -> None:
    legacy_codes = {"menu_soporte_software", "respuesta_soporte", "soporte_software"}
    nodos = (await db.exec(select(NodoFlujo))).all()
    legacy_ids = [nodo.id for nodo in nodos if nodo.codigo in legacy_codes]

    if legacy_ids:
        await db.exec(delete(HistorialCambiosFlujo).where(HistorialCambiosFlujo.nodo_id.in_(legacy_ids)))
        await db.exec(delete(OpcionFlujo).where((OpcionFlujo.nodo_origen_id.in_(legacy_ids)) | (OpcionFlujo.nodo_destino_id.in_(legacy_ids))))
        await db.exec(delete(NodoFlujo).where(NodoFlujo.id.in_(legacy_ids)))
        print(f"Nodos legacy eliminados: {legacy_codes}")

    await db.commit()


async def crear_o_actualizar_nodos(db: AsyncSession) -> dict[str, NodoFlujo]:
    nodos_por_codigo: dict[str, NodoFlujo] = {}
    for codigo, tipo, contenido, bandeja, x, y in ARBOL:
        resultado = await db.exec(select(NodoFlujo).where(NodoFlujo.codigo == codigo))
        nodo = resultado.first()
        if nodo is None:
            nodo = NodoFlujo(codigo=codigo, tipo=tipo, contenido=contenido, bandeja_destino=bandeja, posicion_x=x, posicion_y=y)
            db.add(nodo)
            await db.flush()
            print(f"Nodo creado: {codigo}")
        else:
            print(f"Nodo ya existe, se conserva el contenido editado: {codigo}")

        nodos_por_codigo[codigo] = nodo

    await db.commit()
    return nodos_por_codigo


async def crear_conexiones(db: AsyncSession, nodos_por_codigo: dict[str, NodoFlujo]) -> None:
    for origen, orden, etiqueta, destino in CONEXIONES:
        origen_id = nodos_por_codigo[origen].id
        destino_id = nodos_por_codigo[destino].id
        resultado = await db.exec(select(OpcionFlujo).where(OpcionFlujo.nodo_origen_id == origen_id, OpcionFlujo.nodo_destino_id == destino_id))
        opcion = resultado.first()
        if opcion is None:
            ocupado = await db.exec(
                select(OpcionFlujo).where(
                    OpcionFlujo.nodo_origen_id == origen_id,
                    OpcionFlujo.orden == orden,
                )
            )
            if ocupado.first():
                print(f"Conexión omitida, el orden {orden} ya está personalizado: {origen}")
                continue
            opcion = OpcionFlujo(nodo_origen_id=origen_id, nodo_destino_id=destino_id, etiqueta=etiqueta, valor_entrada=str(orden), orden=orden)
            db.add(opcion)
            print(f"Conexión creada: {origen} --{orden}--> {destino}")
        else:
            opcion.etiqueta = etiqueta
            opcion.valor_entrada = str(orden)
            opcion.orden = orden
            print(f"Conexión ya existe, se actualiza: {origen} --{orden}--> {destino}")

    await db.commit()


async def main() -> None:
    async for db in get_session():
        await limpiar_nodos_legacy(db)
        nodos = await crear_o_actualizar_nodos(db)
        await crear_conexiones(db, nodos)
        print("\nÁrbol simplificado y reordenado correctamente.")
        break


if __name__ == "__main__":
    asyncio.run(main())
