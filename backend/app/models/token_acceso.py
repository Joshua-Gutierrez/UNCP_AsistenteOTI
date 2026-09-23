import uuid
from datetime import datetime
from sqlmodel import SQLModel, Field
from uuid_extensions import uuid7

class TokenAcceso(SQLModel, table=True):
    __tablename__ = "tokens_acceso"

    id: uuid.UUID = Field(default_factory=uuid7, primary_key=True, index=True)
    usuario_id: uuid.UUID = Field(foreign_key="usuarios.id", index=True)
    token: str = Field(unique=True, index=True)
    expiracion: datetime
    revocado: bool = Field(default=False)