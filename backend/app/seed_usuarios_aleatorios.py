"""Script de semilla: crea usuarios aleatorios para probar el formulario.

Uso:
    cd backend
    python -m app.seed_usuarios_aleatorios
"""

import asyncio
import random
import string

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db.database import get_session
from app.models.usuario import Usuario


NOMBRES = ["Juan", "Maria", "Carlos", "Ana", "Luis", "Laura", "Pedro", "Sofia", "Jorge", "Lucia"]
APELLIDOS = ["Perez", "Gomez", "Rodriguez", "Fernandez", "Lopez", "Diaz", "Martinez", "Gonzalez", "Garcia", "Sanchez"]


def generar_usuario_aleatorio():
    nombre_completo = f"{random.choice(NOMBRES)} {random.choice(APELLIDOS)} {random.choice(APELLIDOS)}"
    dni = f"7{random.randint(1000000, 9999999)}"
    codigo = f"202{random.randint(1000, 9999)}"
    telefono = f"9{random.randint(10000000, 99999999)}"
    
    # Generar email institucional según regla: e_codigo@uncp.edu.pe
    email = f"e_{codigo.lower()}@uncp.edu.pe"
    
    return {
        "nombre": nombre_completo,
        "email": email,
        "dni": dni,
        "codigo": codigo,
        "telefono_whatsapp": telefono,
        "rol": "estudiante",
        "activo": True,
        "facultad": "Ingenieria de Sistemas",
        "escuela": "Ingenieria de Sistemas",
    }


async def main() -> None:
    async for db in get_session():
        print("Generando 5 usuarios aleatorios completos para pruebas de formulario...")
        for _ in range(5):
            await crear_usuario_prueba(db, generar_usuario_aleatorio())
        break


async def crear_usuario_prueba(db: AsyncSession, datos: dict) -> None:
    existente = (
        await db.exec(select(Usuario).where(Usuario.dni == datos["dni"]))
    ).first()

    if existente:
        print(f"[seed] El usuario con DNI {datos['dni']} ya existe.")
        return

    usuario = Usuario(**datos)
    db.add(usuario)
    await db.commit()
    await db.refresh(usuario)
    
    print("-" * 40)
    print(f"Usuario Creado (ID: {usuario.id})")
    print(f"  Nombre completo : {usuario.nombre}")
    print(f"  DNI             : {usuario.dni}")
    print(f"  Código          : {usuario.codigo}")
    print(f"  WhatsApp        : {usuario.telefono_whatsapp}")
    print(f"  Correo          : {usuario.email}")


if __name__ == "__main__":
    asyncio.run(main())
