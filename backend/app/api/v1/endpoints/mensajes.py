import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from app import crud
from sqlmodel.ext.asyncio.session import AsyncSession
from app.db.database import get_session
from app.models.sesion_chat import SesionChat
from app.models.mensaje import Mensaje
from app.services.flujo import procesar_respuesta
from app.schemas.mensaje import MensajeCreate, MensajeRead

router = APIRouter(prefix="/mensajes", tags=["Mensajes"])

@router.post("/", response_model=List[MensajeRead])
async def enviar_mensaje(mensaje_in: MensajeCreate, db: AsyncSession = Depends(get_session)):
    sesion = await db.get(SesionChat, mensaje_in.sesion_id)
    if not sesion:
        raise HTTPException(status_code=404, detail="La sesión de chat no existe.")

    mensaje_usuario = Mensaje.model_validate(mensaje_in)
    db.add(mensaje_usuario)

    textos = await procesar_respuesta(db, sesion, mensaje_in.contenido)

    mensajes_asistente = []
    for texto in textos:
        msg = Mensaje(
            sesion_id=sesion.id,
            remitente="asistente",
            contenido=texto,
        )
        db.add(msg)
        mensajes_asistente.append(msg)

    db.add(sesion)
    await db.commit()

    for msg in mensajes_asistente:
        await db.refresh(msg)

    return mensajes_asistente

@router.get("/{sesion_id}", response_model=List[MensajeRead])
async def obtener_historial_chat(sesion_id: uuid.UUID, db: AsyncSession = Depends(get_session)):
    sesion = await db.get(SesionChat, sesion_id)
    if not sesion:
        raise HTTPException(
            status_code=404, 
            detail="La sesión de chat no existe."
        )

    mensajes = await crud.get_mensajes_por_sesion(db, sesion_id)

    return mensajes