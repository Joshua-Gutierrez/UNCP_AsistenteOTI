import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime
from sqlmodel import SQLModel, Field
from uuid_extensions import uuid7

from app.core.datetime_utils import get_now_lima

class Usuario(SQLModel, table=True):
    __tablename__ = "usuarios"

    id: uuid.UUID = Field(default_factory=uuid7, primary_key=True, index=True)
    nombre: str = Field(max_length=150)
    email: str | None = Field(default=None, unique=True, index=True, max_length=150)
    dni: str = Field(unique=True, index=True, max_length=15)
    rol: str = Field(default="estudiante", max_length=20)  # estudiante, administrativo, docente, etc.
    activo: bool = Field(default=True)
    
    # Nuevos campos del Excel
    codigo: str | None = Field(default=None, index=True, max_length=20)
    telefono_whatsapp: str | None = Field(default=None, max_length=20)
    facultad: str | None = Field(default=None, max_length=150)
    escuela: str | None = Field(default=None, max_length=150)
    programa: str | None = Field(default=None, max_length=150)
    plan: str | None = Field(default=None, max_length=100)
    ciclo: str | None = Field(default=None, max_length=20)
    creditos: float | None = Field(default=None)
    sexo: str | None = Field(default=None, max_length=1)
    edad: int | None = Field(default=None)
    departamento: str | None = Field(default=None, max_length=100)
    provincia: str | None = Field(default=None, max_length=100)
    distrito: str | None = Field(default=None, max_length=100)

    creado_en: datetime = Field(
        default_factory=get_now_lima,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )