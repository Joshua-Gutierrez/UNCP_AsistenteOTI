from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from app.db.database import get_session
from app import crud

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.get("/seguimiento")
async def consultar_seguimiento(dni: str, ticket: str, db: AsyncSession = Depends(get_session)):
    caso = await crud.buscar_caso_por_dni_y_ticket(db, dni, ticket.upper())
    if not caso:
        raise HTTPException(status_code=404, detail="No encontramos una solicitud con esos datos.")
    return {
        "codigo_ticket": caso.codigo_ticket,
        "tipo": caso.tipo,
        "estado": caso.estado,
        "creado_en": caso.creado_en,
        "finalizado_en": caso.finalizado_en,
    }
