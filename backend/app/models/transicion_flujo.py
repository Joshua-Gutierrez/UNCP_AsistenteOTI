import uuid
from typing import Any
from sqlalchemy import Column, JSON
from sqlmodel import SQLModel, Field
from uuid_extensions import uuid7

class OpcionFlujo(SQLModel, table=True):
    __tablename__ = "opciones_flujo"

    id: uuid.UUID = Field(default_factory=uuid7, primary_key=True, index=True)
    nodo_origen_id: uuid.UUID = Field(foreign_key="nodos_flujo.id", index=True)
    nodo_destino_id: uuid.UUID = Field(foreign_key="nodos_flujo.id", index=True)
    etiqueta: str | None = Field(default=None, max_length=150)
    valor_entrada: str | None = Field(default=None, max_length=150)
    orden: int = Field(default=0)
    condicion: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON, nullable=True))