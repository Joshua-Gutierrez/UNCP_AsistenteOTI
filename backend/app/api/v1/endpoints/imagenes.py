import uuid
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db.database import get_session
from app.models.mensaje import Mensaje
from app.models.sesion_chat import SesionChat
from app.models.usuario import Usuario
from app.schemas.mensaje import MensajeRead
from app.services.flujo import procesar_imagen
from app.core.datetime_utils import get_now_lima

router = APIRouter(prefix="/mensajes", tags=["Mensajes"])

@router.post("/imagen", response_model=List[MensajeRead])
async def enviar_imagen_dni(
    sesion_id: uuid.UUID,
    imagen: UploadFile = File(...),
    db: AsyncSession = Depends(get_session),
):
    sesion = await db.get(SesionChat, sesion_id)
    if not sesion:
        raise HTTPException(status_code=404, detail="La sesión de chat no existe.")

    if imagen.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=415, detail="Envía una imagen JPG, PNG o WebP.")

    usuario = await db.get(Usuario, sesion.usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="El usuario de la sesión no existe.")

    try:
        textos = await procesar_imagen(db, sesion, await imagen.read(), usuario)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        # Capturar errores internos (ej. PaddleOCR inicializando) y devolverlos
        # como 503 con headers CORS intactos — sin esto el navegador ve un error de CORS
        raise HTTPException(
            status_code=503,
            detail="El servicio de lectura de imagen no está disponible en este momento. Intenta en unos segundos."
        ) from error

    mensajes_asistente = []
    for texto in textos:
        msg = Mensaje(
            sesion_id=sesion.id,
            remitente="asistente",
            contenido=texto,
        )
        db.add(msg)
        mensajes_asistente.append(msg)

    sesion.ultima_interaccion = get_now_lima()
    db.add(sesion)
    await db.commit()

    for msg in mensajes_asistente:
        await db.refresh(msg)

    return mensajes_asistente