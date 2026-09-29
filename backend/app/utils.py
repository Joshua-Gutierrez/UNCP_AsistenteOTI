from urllib.parse import quote
from app.core.config import configuracion
import secrets

_ALFABETO_TICKET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"

def generar_codigo_ticket() -> str:
    sufijo = "".join(secrets.choice(_ALFABETO_TICKET) for _ in range(4))
    return f"UNCP-{sufijo}"

def generar_link_whatsapp(mensaje_contexto: str = "") -> str:
    texto = mensaje_contexto or "Hola, tengo una consulta derivada del chat Julie."
    return f"https://wa.me/{configuracion.whatsapp_numero_universidad}?text={quote(texto)}"
