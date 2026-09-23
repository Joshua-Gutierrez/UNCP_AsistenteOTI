from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import bcrypt
import jwt
from app.core.config import configuracion

ALGORITMO = "HS256"
DURACION_TOKEN_HORAS = 8

def hashear_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verificar_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())

def crear_token(admin_id: str) -> str:
    expiracion = datetime.now(ZoneInfo("America/Lima")) + timedelta(hours=DURACION_TOKEN_HORAS)
    return jwt.encode({"sub": admin_id, "exp": expiracion}, configuracion.secret_key, algorithm=ALGORITMO)

def decodificar_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, configuracion.secret_key, algorithms=[ALGORITMO])
        return payload["sub"]
    except jwt.PyJWTError:
        return None