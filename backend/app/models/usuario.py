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
    email: str = Field(unique=True, index=True, max_length=150)
    dni: str = Field(unique=True, index=True, max_length=9)
    activo: bool = Field(default=True)
    creado_en: datetime = Field(
        default_factory=get_now_lima,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )