import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, DateTime, Text
from sqlmodel import SQLModel, Field
from uuid_extensions import uuid7

from app.core.datetime_utils import get_now_lima

class HistorialCambiosFlujo(SQLModel, table=True):
    __tablename__ = "historial_cambios_flujo"

    id: uuid.UUID = Field(default_factory=uuid7, primary_key=True, index=True)
    admin_id: uuid.UUID = Field(foreign_key="admins.id", index=True)
    nodo_id: uuid.UUID = Field(foreign_key="nodos_flujo.id", index=True)
    tipo_cambio: str = Field(max_length=20)  # 'crear', 'editar', 'eliminar'
    datos_anteriores: str | None = Field(default=None, sa_column=Column(Text))
    datos_nuevos: str | None = Field(default=None, sa_column=Column(Text))
    creado_en: datetime = Field(
        default_factory=get_now_lima,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )