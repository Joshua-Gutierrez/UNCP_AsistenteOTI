from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.admin import Admin
from app.models.caso import Caso
from app.models.mensaje import Mensaje
from app.models.nodo_flujo import NodoFlujo
from app.models.sesion_chat import SesionChat
from app.models.transicion_flujo import OpcionFlujo
from app.models.usuario import Usuario

async def get_usuario_por_email_activo(db: AsyncSession, email: str) -> Usuario | None:
    resultado = await db.exec(select(Usuario).where(Usuario.email == email, Usuario.activo == True))
    return resultado.first()

async def get_usuario_por_dni(db: AsyncSession, dni: str) -> Usuario | None:
    resultado = await db.exec(select(Usuario).where(Usuario.dni == dni))
    return resultado.first()

async def get_usuario_por_dni_o_email(db: AsyncSession, dni: str, email: str) -> Usuario | None:
    resultado = await db.exec(select(Usuario).where((Usuario.dni == dni) | (Usuario.email == email)))
    return resultado.first()

async def get_usuarios_recientes(db: AsyncSession) -> list[Usuario]:
    resultado = await db.exec(select(Usuario).order_by(Usuario.creado_en.desc()))
    return resultado.all()

async def get_admin_por_correo(db: AsyncSession, correo: str) -> Admin | None:
    resultado = await db.exec(select(Admin).where(Admin.correo == correo))
    return resultado.first()

async def get_casos_por_estado(db: AsyncSession, estado: str):
    statement = (
        select(Caso, Usuario)
        .outerjoin(SesionChat, Caso.sesion_id == SesionChat.id)
        .outerjoin(Usuario, SesionChat.usuario_id == Usuario.id)
        .where(Caso.estado == estado)
        .order_by(Caso.creado_en.desc())
    )
    resultados = await db.exec(statement)
    
    casos_out = []
    for caso, usuario in resultados:
        # Create a dictionary starting with Caso fields
        caso_dict = caso.model_dump()
        
        # Merge user data if present, otherwise set to anonymous
        if usuario:
            caso_dict["usuario_nombre"] = usuario.nombre
            caso_dict["usuario_dni"] = usuario.dni
            caso_dict["usuario_email"] = usuario.email
            caso_dict["rol"] = usuario.rol
        else:
            caso_dict["usuario_nombre"] = "Anónimo"
            caso_dict["rol"] = "anónimo"
            
        casos_out.append(caso_dict)
        
    return casos_out

async def get_mensajes_por_sesion(db: AsyncSession, sesion_id) -> list[Mensaje]:
    resultado = await db.exec(select(Mensaje).where(Mensaje.sesion_id == sesion_id).order_by(Mensaje.creado_en.asc()))
    return resultado.all()

async def get_nodos(db: AsyncSession) -> list[NodoFlujo]:
    resultado = await db.exec(select(NodoFlujo))
    return resultado.all()

async def get_nodo_por_codigo(db: AsyncSession, codigo: str) -> NodoFlujo | None:
    resultado = await db.exec(select(NodoFlujo).where(NodoFlujo.codigo == codigo))
    return resultado.first()

async def get_nodo_raiz(db: AsyncSession) -> NodoFlujo | None:
    resultado = await db.exec(select(NodoFlujo).where(NodoFlujo.es_nodo_raiz == True))
    return resultado.first()

async def get_opciones(db: AsyncSession) -> list[OpcionFlujo]:
    resultado = await db.exec(select(OpcionFlujo))
    return resultado.all()

async def get_opcion(db: AsyncSession, origen_id, destino_id) -> OpcionFlujo | None:
    resultado = await db.exec(select(OpcionFlujo).where(
        OpcionFlujo.nodo_origen_id == origen_id,
        OpcionFlujo.nodo_destino_id == destino_id
    ))
    return resultado.first()

async def get_opciones_de_nodo(db: AsyncSession, nodo_id) -> list[tuple[OpcionFlujo, NodoFlujo]]:
    resultado = await db.exec(
        select(OpcionFlujo, NodoFlujo)
        .join(NodoFlujo, NodoFlujo.id == OpcionFlujo.nodo_destino_id)
        .where(OpcionFlujo.nodo_origen_id == nodo_id)
    )
    return resultado.all()

async def buscar_caso_por_dni_y_ticket(db: AsyncSession, dni: str, ticket: str):
    statement = (
        select(Caso)
        .join(SesionChat, Caso.sesion_id == SesionChat.id)
        .join(Usuario, SesionChat.usuario_id == Usuario.id)
        .where(Usuario.dni == dni, Caso.codigo_ticket == ticket)
    )
    resultado = await db.exec(statement)
    return resultado.first()
