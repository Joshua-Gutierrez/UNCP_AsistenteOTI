import uuid
from sqlmodel import SQLModel, Field
from uuid_extensions import uuid7

class Configuracion(SQLModel, table=True):
    __tablename__ = "configuraciones"

    id: uuid.UUID = Field(default_factory=uuid7, primary_key=True, index=True)
    clave: str = Field(unique=True, index=True, max_length=100)
    valor: str
    descripcion: str | None = Field(default=None)