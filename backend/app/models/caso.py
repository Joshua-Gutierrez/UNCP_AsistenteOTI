import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime
from sqlmodel import SQLModel, Field
from uuid_extensions import uuid7

from app.core.datetime_utils import get_now_lima

class Caso(SQLModel, table=True):
    __tablename__ = "casos"

    id: uuid.UUID = Field(default_factory=uuid7, primary_key=True, index=True)
    tipo: str = Field(default="otros", max_length=50, index=True)
    mensaje: str
    estado: str = Field(max_length=50, index=True)  # 'atendido', 'manual', 'solicitud_soporte'
    creado_en: datetime = Field(
        default_factory=get_now_lima,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )