import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime
from sqlmodel import SQLModel, Field
from uuid_extensions import uuid7

from app.core.datetime_utils import get_now_lima

class LogAuditoria(SQLModel, table=True):
    __tablename__ = "logs_auditoria"

    id: uuid.UUID = Field(default_factory=uuid7, primary_key=True, index=True)
    usuario_id: uuid.UUID | None = Field(default=None, foreign_key="usuarios.id", index=True)
    accion: str = Field(max_length=100)
    detalles: str | None = Field(default=None)
    creado_en: datetime = Field(
        default_factory=get_now_lima,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )