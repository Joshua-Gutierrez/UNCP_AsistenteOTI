from fastapi import APIRouter, Depends, HTTPException
from app import crud
from sqlmodel.ext.asyncio.session import AsyncSession
from app.db.database import get_session
from app.models.sesion_chat import SesionChat
from app.models.mensaje import Mensaje
from app.models.nodo_flujo import NodoFlujo
from app.models.usuario import Usuario
from app.schemas.sesion_chat import SesionChatCreate, SesionChatRead
from app.services.flujo import construir_mensaje_nodo

router = APIRouter(prefix="/sesiones", tags=["Sesiones de Chat"])

@router.post("/anonima", response_model=SesionChatRead)
async def crear_sesion_anonima(db: AsyncSession = Depends(get_session)):
    usuario = await crud.get_usuario_por_email_activo(db, "anonimo@uncp.local")

    if not usuario:
        usuario = Usuario(
            nombre="Usuario anónimo",
            email="anonimo@uncp.local",
            dni="00000000",
        )
        db.add(usuario)
        await db.flush()

    sesion = SesionChat(usuario_id=usuario.id)
    db.add(sesion)
    await db.commit()
    await db.refresh(sesion)
    menu = await crud.get_nodo_raiz(db)
    if menu and menu.activo:
        sesion.nodo_actual_id = menu.id
        sesion.historial_nodos = [str(menu.id)]
        db.add(Mensaje(sesion_id=sesion.id, remitente="asistente", contenido=await construir_mensaje_nodo(db, menu)))
        db.add(sesion)
        await db.commit()
        await db.refresh(sesion)
    return sesion

@router.post("/", response_model=SesionChatRead)
async def crear_sesion(sesion_in: SesionChatCreate, db: AsyncSession = Depends(get_session)):
    # Verificar que el usuario asociado realmente exista en la base de datos
    usuario = await db.get(Usuario, sesion_in.usuario_id)
    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="El usuario especificado no existe."
        )

    # Crear y guardar la nueva sesión de chat
    db_sesion = SesionChat.model_validate(sesion_in)
    
    db.add(db_sesion)
    await db.commit()
    await db.refresh(db_sesion)
    
    return db_sesion