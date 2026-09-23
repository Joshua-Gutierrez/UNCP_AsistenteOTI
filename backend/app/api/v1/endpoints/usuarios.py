from fastapi import APIRouter, Depends, HTTPException
from app import crud
from sqlmodel.ext.asyncio.session import AsyncSession
from app.db.database import get_session
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioRead

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

@router.post("/", response_model=UsuarioRead)
async def crear_usuario(usuario_in: UsuarioCreate, db: AsyncSession = Depends(get_session)):
    # Verificar si ya existe un usuario
    existing_user = await crud.get_usuario_por_dni_o_email(db, usuario_in.dni, usuario_in.email)
    
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Ya existe un usuario registrado con este DNI o correo electrónico."
        )

    # Crear la instancia del modelo de base de datos a partir del esquema Pydantic
    db_usuario = Usuario.model_validate(usuario_in)
    
    db.add(db_usuario)
    await db.commit()
    await db.refresh(db_usuario)
    
    return db_usuario