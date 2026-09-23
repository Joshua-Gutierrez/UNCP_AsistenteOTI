import uuid
from sqlmodel import SQLModel, Field
from uuid_extensions import uuid7

class NodoFlujo(SQLModel, table=True):
    __tablename__ = "nodos_flujo"

    id: uuid.UUID = Field(default_factory=uuid7, primary_key=True, index=True)
    codigo: str = Field(unique=True, max_length=100)
    tipo: str = Field(max_length=50)
    contenido: str
    bandeja_destino: str | None = Field(default=None, max_length=20)
    activo: bool = Field(default=True)
    es_nodo_raiz: bool = Field(default=False)
    posicion_x: int = Field(default=0)
    posicion_y: int = Field(default=0)