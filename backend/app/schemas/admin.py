from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from uuid import UUID

class LoginAdmin(BaseModel):
    correo: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class NodoOut(BaseModel):
    id: UUID
    codigo: str
    tipo: str
    contenido: str
    bandeja_destino: Optional[str] = None
    activo: bool
    posicion_x: int
    posicion_y: int

    class Config:
        from_attributes = True

class NodoIn(BaseModel):
    codigo: str
    tipo: str
    contenido: str
    bandeja_destino: Optional[str] = None
    activo: bool = True
    posicion_x: int = 0
    posicion_y: int = 0

class OpcionOut(BaseModel):
    id: UUID
    nodo_origen_id: UUID
    nodo_destino_id: UUID
    etiqueta: Optional[str] = None
    valor_entrada: Optional[str] = None
    orden: int
    condicion: dict | None = None

    class Config:
        from_attributes = True

class OpcionIn(BaseModel):
    nodo_origen_id: UUID
    nodo_destino_id: UUID
    etiqueta: Optional[str] = None
    valor_entrada: Optional[str] = None
    orden: int = 0
    condicion: dict | None = None

class CasoOut(BaseModel):
    id: UUID
    tipo: str
    mensaje: str
    estado: str
    creado_en: datetime

    class Config:
        from_attributes = True

class ValidacionArbol(BaseModel):
    valido: bool
    problemas: list[str]