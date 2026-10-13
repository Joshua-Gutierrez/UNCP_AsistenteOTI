"""Script para generar y actualizar los correos de estudiantes en la tabla usuarios.

Regla: e_codigo@uncp.edu.pe (en minúsculas)

Uso:
    cd backend
    python actualizar_correos_estudiantes.py
"""

import asyncio
from sqlalchemy import text
from sqlmodel.ext.asyncio.session import AsyncSession
from app.db.database import get_session


async def actualizar_correos():
    async for db in get_session():
        # Ejecutar la actualización según la regla e_<codigo>@uncp.edu.pe
        query = text("""
            UPDATE usuarios 
            SET email = CONCAT('e_', LOWER(TRIM(codigo)), '@uncp.edu.pe')
            WHERE codigo IS NOT NULL AND TRIM(codigo) != '';
        """)
        resultado = await db.exec(query)
        await db.commit()
        print(f"Filas afectadas: {resultado.rowcount}")

        # Comprobar cuántos usuarios tienen email ahora
        check = await db.exec(text("SELECT count(*) FROM usuarios WHERE email IS NOT NULL;"))
        total = check.scalar()
        print(f"Total de usuarios con correo en la base de datos: {total}")
        break

    from app.db.database import engine
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(actualizar_correos())
