import asyncio
import uuid
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlmodel import SQLModel, select
from app.models import Admin
from app.core.seguridad import hashear_password
from app.core.config import configuracion

async def create_admin():
    engine = create_async_engine(configuracion.database_url, echo=True)
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    async with async_session() as session:
        # Check if admin already exists
        result = await session.execute(select(Admin).where(Admin.correo == "admin@uncp.edu.pe"))
        existing = result.scalars().first()
        
        if existing:
            print("Admin user already exists")
            return
        
        # Create admin user
        admin = Admin(
            id=uuid.uuid4(),
            correo="admin@uncp.edu.pe",
            password_hash=hashear_password("admin123"),
            activo=True,
        )
        session.add(admin)
        await session.commit()
        print(f"Admin user created: {admin.correo} (password: admin123)")

if __name__ == "__main__":
    asyncio.run(create_admin())