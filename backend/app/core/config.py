import os
from pydantic_settings import BaseSettings

class Configuracion(BaseSettings):
    database_url: str = os.environ.get("DATABASE_URL", "")
    secret_key: str = os.environ.get("SECRET_KEY", "cambiar_en_produccion_por_una_clave_segura")
    entorno: str = os.environ.get("ENTORNO", "desarrollo")

    # SMTP — Ethereal para pruebas, reemplazar con credenciales reales de la universidad
    smtp_host: str = os.environ.get("SMTP_HOST", "smtp.ethereal.email")
    smtp_port: int = int(os.environ.get("SMTP_PORT", "587"))
    smtp_usuario: str = os.environ.get("SMTP_USUARIO", "")
    smtp_password: str = os.environ.get("SMTP_PASSWORD", "")
    smtp_remitente: str = os.environ.get("SMTP_REMITENTE", "")

    class Config:
        env_file = ".env"
        case_sensitive = False

configuracion = Configuracion()

DATABASE_URL = configuracion.database_url