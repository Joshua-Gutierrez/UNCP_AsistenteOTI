import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime
from sqlmodel import SQLModel, Field
from uuid_extensions import uuid7

from app.core.datetime_utils import get_now_lima

class Mensaje(SQLModel, table=True):
    __tablename__ = "mensajes"

    id: uuid.UUID = Field(default_factory=uuid7, primary_key=True, index=True)
    sesion_id: uuid.UUID = Field(foreign_key="sesiones_chat.id", index=True)
    remitente: str = Field(max_length=50)  # 'usuario' o 'bot'
    contenido: str
    creado_en: datetime = Field(
        default_factory=get_now_lima,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )