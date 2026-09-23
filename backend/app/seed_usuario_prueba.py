"""Script de semilla: crea el usuario de prueba Allie Thompson (Ethereal SMTP).

Uso:
    cd backend
    python -m app.seed_usuario_prueba

Este usuario tiene el correo que coincide con las credenciales SMTP de Ethereal,
lo que permite probar el flujo completo de verificación por correo sin cuenta real.
"""

import asyncio

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db.database import get_session
from app.models.usuario import Usuario


USUARIO_PRUEBA = {
    "nombre": "Allie Thompson",
    "email": "allie.thompson@ethereal.email",
    "dni": "99999999",
    "activo": True,
}


async def main() -> None:
    async for db in get_session():
        await crear_usuario_prueba(db)
        break


async def crear_usuario_prueba(db: AsyncSession) -> None:
    existente = (
        await db.exec(select(Usuario).where(Usuario.email == USUARIO_PRUEBA["email"]))
    ).first()

    if existente:
        print(f"[seed] El usuario de prueba ya existe: id={existente.id}")
        print(f"       Nombre : {existente.nombre}")
        print(f"       Email  : {existente.email}")
        print(f"       DNI    : {existente.dni}")
        return

    usuario = Usuario(**USUARIO_PRUEBA)
    db.add(usuario)
    await db.commit()
    await db.refresh(usuario)
    print(f"[seed] Usuario de prueba creado exitosamente:")
    print(f"       id     : {usuario.id}")
    print(f"       Nombre : {usuario.nombre}")
    print(f"       Email  : {usuario.email}")
    print(f"       DNI    : {usuario.dni}")


if __name__ == "__main__":
    asyncio.run(main())
