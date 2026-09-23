import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.config import configuracion
from app.models.nodo_flujo import NodoFlujo

async def update_root():
    engine = create_async_engine(configuracion.database_url, echo=False)
    async with AsyncSession(engine) as session:
        result = await session.exec(select(NodoFlujo).where(NodoFlujo.codigo == 'menu_principal'))
        nodo = result.first()
        if nodo:
            nodo.es_nodo_raiz = True
            session.add(nodo)
            await session.commit()
            print('Root node updated successfully.')
        else:
            print('Menu principal not found.')

asyncio.run(update_root())
