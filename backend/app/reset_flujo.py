"""
Borra el arbol de decisiones y las conversaciones asociadas para recargarlo
con app.seed_flujo.

Herramienta de desarrollo: elimina todos los mensajes, casos, sesiones y
nodos del flujo. Conserva usuarios y administradores.

Ejecutar con: python -m app.reset_flujo
"""

import asyncio

from sqlmodel import delete
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db.database import get_session
from app.models.caso import Caso
from app.models.historial_cambios_flujo import HistorialCambiosFlujo
from app.models.mensaje import Mensaje
from app.models.nodo_flujo import NodoFlujo
from app.models.sesion_chat import SesionChat
from app.models.transicion_flujo import OpcionFlujo


async def resetear_flujo(db: AsyncSession) -> None:
    """Elimina las filas respetando las dependencias de las claves foraneas."""
    await db.exec(delete(Mensaje))
    await db.exec(delete(Caso))
    await db.exec(delete(HistorialCambiosFlujo))
    await db.exec(delete(SesionChat))
    await db.exec(delete(OpcionFlujo))
    await db.exec(delete(NodoFlujo))
    await db.commit()


async def main() -> None:
    async for db in get_session():
        await resetear_flujo(db)
        print("Arbol de decisiones y conversaciones asociadas eliminados correctamente.")
        break


if __name__ == "__main__":
    asyncio.run(main())
