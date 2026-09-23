import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy import Column, DateTime, JSON
from sqlmodel import SQLModel, Field, Relationship
from uuid_extensions import uuid7

from app.core.datetime_utils import get_now_lima

class SesionChat(SQLModel, table=True):
    __tablename__ = "sesiones_chat"

    id: uuid.UUID = Field(default_factory=uuid7, primary_key=True, index=True)
    usuario_id: uuid.UUID = Field(foreign_key="usuarios.id", index=True)
    nodo_actual_id: uuid.UUID | None = Field(default=None, foreign_key="nodos_flujo.id", index=True)
    contexto: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON, nullable=False, default=dict))
    historial_nodos: list[str] = Field(default_factory=list, sa_column=Column(JSON, nullable=False, default=list))
    
    activa: bool = Field(default=True)
    iniciada_en: datetime = Field(
        default_factory=get_now_lima,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    ultima_interaccion: datetime = Field(
        default_factory=get_now_lima,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )