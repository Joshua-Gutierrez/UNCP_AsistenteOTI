import re

# Patrón MRZ: "PER" pegado a los 8 dígitos (zona estandarizada del DNI peruano)
_PATRON_DNI_MRZ = re.compile(r"PER(\d{8})")
# Patrón DNIe: Busca CUI o DNI seguido opcionalmente de Nro/N° y 8 dígitos
_PATRON_DNIE = re.compile(r"(?:CUI|DNI)\b\s*(?:N(?:RO|R|º|°|O)?[\.\s]*)?(\d{8})(?!\d)", re.IGNORECASE)
# Respaldo: 8 dígitos sueltos
_PATRON_DNI_GENERICO = re.compile(r"(?<!\d)\d{8}(?!\d)")

import cv2
import numpy as np
from paddleocr import PaddleOCR

_lector_ocr = None

def _obtener_lector():
    global _lector_ocr
    if _lector_ocr is None:
        _lector_ocr = PaddleOCR(use_angle_cls=True, lang="es", show_log=False)
    return _lector_ocr
from sqlalchemy.orm.attributes import flag_modified
from app import crud

from app.models.documento_identidad import DocumentoIdentidad
from app.models.sesion_chat import SesionChat
from app.models.usuario import Usuario


def _normalizar(valor: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", valor.upper())


def _nombre_coincide(nombre_registrado: str, texto_ocr: str) -> bool:
    palabras = [
        palabra
        for palabra in re.findall(r"[A-ZÁÉÍÓÚÜÑ]+", nombre_registrado.upper())
        if len(palabra) > 2
    ]
    texto = texto_ocr.upper()
    return len(palabras) >= 2 and sum(palabra in texto for palabra in palabras) >= max(2, len(palabras) - 1)


async def invocar_flujo_ocr(sesion: SesionChat, nodo_siguiente: str) -> str:
    sesion.contexto["nodo_post_ocr_exito"] = nodo_siguiente
    flag_modified(sesion, "contexto")
    return "solicitar_foto_dni"


_PATRONES_POR_DOCUMENTO = {
    "dni": re.compile(r"PER(\d{8})"),
    "pasaporte": re.compile(r"[A-Z]{2}\d{6,9}"),
    "c4": re.compile(r"C4[\s-]?(\d{6,9})"),
    "carnet_biblioteca": re.compile(r"\b\d{6,8}\b"),
}

def extraer_numero_documento(texto: str, tipo_documento: str) -> str | None:
    if tipo_documento == "dni":
        return _extraer_dni_del_texto(texto)

    patron = _PATRONES_POR_DOCUMENTO.get(tipo_documento)
    if not patron:
        return None
    coincidencia = patron.search(texto.upper().replace(" ", ""))
    if not coincidencia:
        return None
    return coincidencia.group(1) if coincidencia.groups() else coincidencia.group()

def _extraer_dni_del_texto(texto: str) -> str | None:
    """Conserva compatibilidad para el flujo original de DNI."""
    texto_norm = texto.upper().replace(" ", "")
    m = _PATRON_DNI_MRZ.search(texto_norm)
    if m:
        return m.group(1)
        
    m_dnie = _PATRON_DNIE.search(texto)
    if m_dnie:
        return m_dnie.group(1)
        
    m2 = _PATRON_DNI_GENERICO.search(texto)
    return m2.group() if m2 else None


async def verificar_ocr_dni(
    sesion: SesionChat,
    texto_extraido: str,
    usuario: Usuario,
    db,
) -> str:
    """Extrae el DNI del OCR y lo busca en la tabla usuarios.
    Si la sesión es anónima (dni=00000000), busca el usuario real por DNI extraído.
    Si la sesión ya tiene un usuario real, compara directamente.
    """
    dni_extraido = _extraer_dni_del_texto(texto_extraido)
    if not dni_extraido:
        return "error"

    dni_normalizado = _normalizar(dni_extraido)

    # Si la sesión es anónima, buscar el usuario real por DNI en la BD
    if _normalizar(usuario.dni) == "00000000":
        usuario_real = await crud.get_usuario_por_dni(db, dni_extraido)
        if not usuario_real:
            # El DNI existe en el doc pero no está registrado en el sistema
            return "error"
        # Asociar la sesión al usuario real
        sesion.usuario_id = usuario_real.id
        sesion.contexto["nombre_usuario"] = usuario_real.nombre
        sesion.contexto["correo_usuario"] = usuario_real.email
        flag_modified(sesion, "contexto")
        return "exito"

    # Sesión ya tiene usuario real: comparar DNI directamente
    if dni_normalizado == _normalizar(usuario.dni):
        sesion.contexto["nombre_usuario"] = usuario.nombre
        sesion.contexto["correo_usuario"] = usuario.email
        flag_modified(sesion, "contexto")
        return "exito"

    return "error"


def extraer_texto_dni(contenido: bytes) -> str:
    imagen = cv2.imdecode(np.frombuffer(contenido, dtype=np.uint8), cv2.IMREAD_COLOR)
    if imagen is None:
        raise ValueError("El archivo no contiene una imagen válida.")

    lector = _obtener_lector()
    resultados = lector.ocr(imagen, cls=True)
    
    if not resultados or not resultados[0]:
        return ""
        
    return "\n".join(linea[1][0] for linea in resultados[0])


async def validar_imagen_dni(sesion: SesionChat, contenido: bytes, usuario: Usuario, db) -> str:
    texto_extraido = extraer_texto_dni(contenido)
    dni_identificado = _extraer_dni_del_texto(texto_extraido)
    resultado = await verificar_ocr_dni(sesion, texto_extraido, usuario, db)
    documento = DocumentoIdentidad(
        usuario_id=sesion.usuario_id,  # usar el usuario_id actualizado (puede ser el real)
        tipo_documento="DNI",
        ruta_archivo="memoria",
        texto_extraido=texto_extraido,
        dni_extraido=dni_identificado,
        validado=resultado == "exito",
    )
    db.add(documento)
    return resultado


# ─────────────────────────────────────────────────────────────────────────────
# Nodo de Verificación por Correo Institucional
# ─────────────────────────────────────────────────────────────────────────────

from datetime import datetime, timedelta
from app.core.datetime_utils import get_now_lima
from app.correo import generar_codigo, enviar_codigo_verificacion, obtener_usuario_por_correo  # noqa: E402

MAX_INTENTOS_CODIGO = 3
DURACION_BANEO_MINUTOS = 5
DURACION_CODIGO_MINUTOS = 5


def _ahora() -> datetime:
    return get_now_lima()


async def solicitar_correo(db, sesion: SesionChat, texto_usuario: str | None) -> str:
    """Valida el correo ingresado y busca al usuario en la BD.

    Retorna:
        "primera_vez"         → aún no se ha ingresado nada (el nodo muestra su contenido)
        "formato_invalido"    → correo con formato incorrecto
        "no_registrado"       → correo no existe en usuarios
        "continuar"           → correo válido, usuario encontrado
    """
    if texto_usuario is None:
        return "primera_vez"

    correo = texto_usuario.strip().lower()
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", correo):
        return "formato_invalido"

    usuario = await obtener_usuario_por_correo(db, correo)
    if usuario is None:
        return "no_registrado"

    # Guardar datos del usuario identificado en el contexto de sesión
    sesion.contexto["correo_ingresado"] = correo
    sesion.contexto["nombre_usuario"] = usuario.nombre
    sesion.contexto["correo_usuario"] = usuario.email
    flag_modified(sesion, "contexto")
    return "continuar"


async def enviar_codigo_correo(db, sesion: SesionChat) -> None:
    """Genera un código OTP, lo guarda en contexto y lo envía por correo."""
    codigo = generar_codigo()
    sesion.contexto["codigo_verificacion"] = codigo
    sesion.contexto["codigo_expira_en"] = (
        _ahora() + timedelta(minutes=DURACION_CODIGO_MINUTOS)
    ).isoformat()
    sesion.contexto["intentos_codigo"] = 0
    # Limpiar baneo anterior si existía
    sesion.contexto.pop("baneado_hasta", None)
    flag_modified(sesion, "contexto")

    correo_destino = sesion.contexto["correo_ingresado"]
    await enviar_codigo_verificacion(correo_destino, codigo)


async def verificar_codigo_correo(db, sesion: SesionChat, texto_usuario: str) -> str:
    """Verifica el código OTP ingresado.

    Retorna:
        "baneado"    → demasiados intentos fallidos
        "expirado"   → código expirado (se reenvía automáticamente)
        "incorrecto" → código no coincide
        "exito"      → código correcto
    """
    # Comprobar baneo activo
    baneado_hasta_str = sesion.contexto.get("baneado_hasta")
    if baneado_hasta_str and _ahora() < datetime.fromisoformat(baneado_hasta_str):
        return "baneado"

    # Comprobar expiración
    expira_str = sesion.contexto.get("codigo_expira_en")
    if expira_str and _ahora() > datetime.fromisoformat(expira_str):
        # Reenviar código automáticamente
        await enviar_codigo_correo(db, sesion)
        flag_modified(sesion, "contexto")
        return "expirado"

    # Verificar código
    if texto_usuario.strip() == sesion.contexto.get("codigo_verificacion"):
        # Limpiar datos de verificación del contexto
        for campo in ("codigo_verificacion", "codigo_expira_en", "intentos_codigo", "baneado_hasta"):
            sesion.contexto.pop(campo, None)
        flag_modified(sesion, "contexto")
        return "exito"

    # Código incorrecto — incrementar intentos
    intentos = sesion.contexto.get("intentos_codigo", 0) + 1
    sesion.contexto["intentos_codigo"] = intentos
    flag_modified(sesion, "contexto")

    if intentos >= MAX_INTENTOS_CODIGO:
        sesion.contexto["baneado_hasta"] = (
            _ahora() + timedelta(minutes=DURACION_BANEO_MINUTOS)
        ).isoformat()
        flag_modified(sesion, "contexto")
        return "baneado"

    return "incorrecto"


# ─────────────────────────────────────────────────────────────────────────────
# Validación Completa Multidocumento
# ─────────────────────────────────────────────────────────────────────────────

async def elegir_tipo_documento(db, sesion, mensaje_usuario: str | None) -> str:
    if mensaje_usuario is None:
        return "continuar"
    tipo = mensaje_usuario.strip().lower()
    
    # Mapeo de opciones numéricas a tipos de documento
    mapeo = {
        "1": "dni",
        "2": "pasaporte",
        "3": "c4",
        "4": "carnet_biblioteca"
    }
    
    # Si ingresó el número (botón) o el texto directo
    tipo_final = mapeo.get(tipo, tipo)
    
    if tipo_final not in ("dni", "pasaporte", "c4", "carnet_biblioteca"):
        return "reintentar"
    sesion.contexto["tipo_documento"] = tipo_final
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(sesion, "contexto")
    return "continuar"


async def extraer_datos_ocr(db, sesion, imagen_bytes: bytes | None | str) -> str:
    if imagen_bytes is None or not isinstance(imagen_bytes, bytes):
        return "reintentar"
    texto = extraer_texto_dni(imagen_bytes)
    numero = extraer_numero_documento(texto, sesion.contexto.get("tipo_documento", "dni"))
    if not numero:
        return "reintentar"
    sesion.contexto["numero_documento_ocr"] = numero
    sesion.contexto["texto_ocr_completo"] = texto  # Se guarda el texto crudo completo
    flag_modified(sesion, "contexto")
    return "continuar"


async def solicitar_datos_manuales(db, sesion, mensaje_usuario: str | None) -> str:
    if mensaje_usuario is None:
        return "continuar"

    lineas = [l.strip() for l in mensaje_usuario.strip().split("\n") if l.strip()]
    if len(lineas) != 5:
        # Aquí el bot podría enviar un mensaje extra diciendo que le faltan datos,
        # pero según la arquitectura, debe reintentar con el nodo original.
        return "reintentar"

    sesion.contexto["datos_manuales"] = {
        "nombre_completo": lineas[0],
        "dni": lineas[1],
        "codigo_estudiante": lineas[2],
        "whatsapp": lineas[3],
        "correo": lineas[4],
    }
    flag_modified(sesion, "contexto")
    return "continuar"


from app.validacion import nombre_aparece_en_texto_ocr, dni_coincide_exacto, _normalizar_dni

async def validar_coincidencia_total(db, sesion, mensaje_usuario) -> str:
    datos_manuales = sesion.contexto.get("datos_manuales", {})
    form_data = sesion.contexto.get("form_data", {})
    
    # Pre-llenamos con datos_manuales por retrocompatibilidad
    datos = {
        "nombre_completo": datos_manuales.get("nombre_completo", ""),
        "dni": datos_manuales.get("dni", ""),
        "codigo_estudiante": datos_manuales.get("codigo_estudiante", ""),
        "whatsapp": datos_manuales.get("whatsapp", ""),
        "correo": datos_manuales.get("correo", "")
    }

    # Asignación heurística desde form_data
    for k, v in form_data.items():
        k_baja = k.lower()
        if "nombre" in k_baja or "apellidos" in k_baja:
            # Si el form separa nombre y apellidos, concatenamos
            if "nombre_completo" not in datos or not datos["nombre_completo"]:
                datos["nombre_completo"] = v
            else:
                datos["nombre_completo"] = f"{datos['nombre_completo']} {v}"
        elif "dni" in k_baja or "documento" in k_baja:
            datos["dni"] = v
        elif "código" in k_baja or "codigo" in k_baja:
            datos["codigo_estudiante"] = v
        elif "whatsapp" in k_baja or "teléfono" in k_baja or "telefono" in k_baja or "celular" in k_baja:
            datos["whatsapp"] = v
        elif "correo" in k_baja or "email" in k_baja:
            datos["correo"] = v

    usuario = await crud.get_usuario_por_dni(db, datos.get("dni", ""))

    if usuario is None:
        return "manual" # No existe el usuario con ese DNI

    # 1) ANCLA DURA — si el DNI no coincide exacto en los 3 lugares, se corta aquí
    if not dni_coincide_exacto(
        datos.get("dni", ""),
        sesion.contexto.get("numero_documento_ocr", ""),
        usuario.dni,
    ):
        return "manual"

    # 2) Nombre — se busca dentro del texto completo que extrajo el OCR,
    #    verificando contra el nombre ingresado por el usuario O contra el nombre oficial en BD
    texto_ocr = sesion.contexto.get("texto_ocr_completo", "")
    nombre_valido = (
        nombre_aparece_en_texto_ocr(texto_ocr, datos.get("nombre_completo", ""))
        or (usuario.nombre and nombre_aparece_en_texto_ocr(texto_ocr, usuario.nombre))
    )
    if not nombre_valido:
        return "manual"

    # 3) El resto — exacto, no viene del OCR
    if datos.get("codigo_estudiante") != usuario.codigo:
        return "manual"
    
    # Manejar whatsapp que podría ser nulo en BD
    whatsapp_ingresado = _normalizar_dni(datos.get("whatsapp", ""))
    whatsapp_bd = _normalizar_dni(usuario.telefono_whatsapp or "")
    if whatsapp_bd and whatsapp_ingresado != whatsapp_bd:
        return "manual"
        
    correo_req = (datos.get("correo") or "").strip().lower()
    correo_bd = (usuario.email or "").strip().lower()
    if correo_bd and correo_req != correo_bd:
        return "manual"

    # La validación de WhatsApp y Correo se hace arriba (ignorando nulos)
    # y ya no poblamos la base de datos si estaban vacíos.
    sesion.usuario_id = usuario.id
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(sesion, "contexto")
    return "exito"

MANEJADORES_ACCION = {
    "elegir_tipo_documento": elegir_tipo_documento,
    "solicitar_foto_documento": extraer_datos_ocr,
    "extraer_datos_ocr": extraer_datos_ocr,
    "solicitar_datos_manuales": solicitar_datos_manuales,
    "validar_coincidencia_total": validar_coincidencia_total,
}
