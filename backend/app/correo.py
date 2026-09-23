"""Utilidades de correo para el nodo de verificación por email."""

import secrets

import aiosmtplib
from email.message import EmailMessage
from app import crud
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import configuracion
from app.models.usuario import Usuario


def generar_codigo() -> str:
    """Genera un código de 6 dígitos con padding de ceros, usando secrets (criptográficamente seguro)."""
    return f"{secrets.randbelow(1_000_000):06d}"


async def enviar_codigo_verificacion(correo_destino: str, codigo: str) -> None:
    """Envía el código de verificación al correo destino vía SMTP (STARTTLS).

    Con Ethereal el correo no llega al buzón real — aparece el link de vista previa
    en la consola del servidor. Al reemplazar las variables SMTP en .env por las
    credenciales institucionales, esta función funciona sin ningún cambio de código.
    """
    mensaje = EmailMessage()
    mensaje["From"] = configuracion.smtp_remitente
    mensaje["To"] = correo_destino
    mensaje["Subject"] = "Código de verificación — Asistente Virtual UNCP"
    mensaje.set_content(
        f"Su código de verificación es: {codigo}\n\n"
        "Este código expira en 5 minutos.\n\n"
        "Si no solicitó este código, ignore este mensaje."
    )

    await aiosmtplib.send(
        mensaje,
        hostname=configuracion.smtp_host,
        port=configuracion.smtp_port,
        username=configuracion.smtp_usuario,
        password=configuracion.smtp_password,
        start_tls=True,
    )


async def obtener_usuario_por_correo(db: AsyncSession, correo: str) -> Usuario | None:
    """Busca un usuario activo por su dirección de correo.

    Devuelve el objeto Usuario completo (no solo True/False) para poder mostrar
    el nombre en el mensaje de confirmación del boceto.
    """
    return await crud.get_usuario_por_email_activo(db, correo.strip().lower())
