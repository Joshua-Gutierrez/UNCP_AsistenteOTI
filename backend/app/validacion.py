import re
import unicodedata
from rapidfuzz import fuzz

UMBRAL_SIMILITUD_NOMBRE = 75  # 0-100; ajustable sin tocar la lógica


def _normalizar_texto(texto: str) -> str:
    """Mayúsculas, sin tildes, sin caracteres especiales (como '<' del MRZ)
    y sin espacios extra — reduce el ruido típico de OCR antes de comparar."""
    texto = texto.strip().upper()
    texto = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii")
    texto = re.sub(r"[^A-Z0-9]+", " ", texto)
    texto = re.sub(r"\s+", " ", texto).strip()
    return texto


def _normalizar_dni(dni: str) -> str:
    return re.sub(r"\D", "", dni)  # solo dígitos, sin espacios ni guiones


def nombre_aparece_en_texto_ocr(texto_ocr_completo: str, nombre_referencia: str) -> bool:
    """Verificación multi-capa para documentos de identidad peruanos:
    1. Score global token_set_ratio >= 75.
    2. Si es menor (por ruido, reflejos o concatenación tipo 'STEVENBRAD'/'JOSHUAAARON'),
       valida palabra por palabra permitiendo subcadenas y tolerancia OCR.
    """
    texto = _normalizar_texto(texto_ocr_completo)
    nombre = _normalizar_texto(nombre_referencia)

    if not texto or not nombre:
        return False

    # 1. Chequeo rápido
    if fuzz.token_set_ratio(nombre, texto) >= UMBRAL_SIMILITUD_NOMBRE:
        return True

    palabras = [p for p in nombre.split() if len(p) >= 3]
    if not palabras:
        return False

    tokens_ocr = texto.split()

    # 2. Búsqueda inteligente por palabra
    aciertos = 0
    for palabra in palabras:
        # a) Está como subcadena en el texto o dentro de algún token OCR (ej: STEVEN en STEVENBRAD)
        if palabra in texto or any(palabra in tok for tok in tokens_ocr):
            aciertos += 1
            continue
        # b) Tolerancia a confusión de caracteres OCR (Levenshtein / similitud >= 80%)
        if any(fuzz.ratio(palabra, tok) >= 80 or fuzz.partial_ratio(palabra, tok) >= 85 for tok in tokens_ocr):
            aciertos += 1

    # Se aprueba si coincide al menos el 60% de las palabras y mínimo 2 palabras
    minimo = max(2, int(len(palabras) * 0.6)) if len(palabras) >= 2 else len(palabras)
    return aciertos >= minimo


def dni_coincide_exacto(*valores: str) -> bool:
    """Todos los valores de DNI recibidos deben ser idénticos entre sí."""
    normalizados = {_normalizar_dni(v) for v in valores if v}
    return len(normalizados) == 1 and "" not in normalizados
