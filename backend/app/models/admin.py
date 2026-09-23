import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime
from sqlmodel import SQLModel, Field
from uuid_extensions import uuid7

from app.core.datetime_utils import get_now_lima

class Admin(SQLModel, table=True):
    __tablename__ = "admins"

    id: uuid.UUID = Field(default_factory=uuid7, primary_key=True, index=True)
    correo: str = Field(unique=True, index=True, max_length=150)
    password_hash: str = Field(max_length=255)
    activo: bool = Field(default=True)
    creado_en: datetime = Field(
        default_factory=get_now_lima,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )