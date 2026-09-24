import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Text, String
from sqlmodel import SQLModel, Field
from uuid_extensions import uuid7

from app.core.datetime_utils import get_now_lima

class DocumentoIdentidad(SQLModel, table=True):
    __tablename__ = "documentos_identidad"

    id: uuid.UUID = Field(default_factory=uuid7, primary_key=True, index=True)
    usuario_id: uuid.UUID = Field(foreign_key="usuarios.id", index=True)
    tipo_documento: str = Field(max_length=50)
    ruta_archivo: str = Field(max_length=255)
    texto_extraido: str | None = Field(default=None, sa_column=Column(Text))
    dni_extraido: str | None = Field(default= None, sa_column=Column(String(20)))
    validado: bool = Field(default=False)
    creado_en: datetime = Field(
        default_factory=get_now_lima,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )