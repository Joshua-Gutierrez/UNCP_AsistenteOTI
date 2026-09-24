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


def _extraer_dni_del_texto(texto: str) -> str | None:
    """Extrae los 8 dígitos del DNI usando primero el patrón MRZ, luego DNIe, y al final genérico."""
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
