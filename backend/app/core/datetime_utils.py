from datetime import datetime
from zoneinfo import ZoneInfo

def get_now_lima() -> datetime:
    """Devuelve la fecha y hora actual en la zona horaria de Perú (America/Lima)."""
    return datetime.now(ZoneInfo("America/Lima"))
