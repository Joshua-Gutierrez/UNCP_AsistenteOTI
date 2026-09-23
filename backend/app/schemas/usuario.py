import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

class UsuarioBase(BaseModel):
    nombre: str = Field(max_length=150)
    email: EmailStr
    dni: str = Field(max_length=9)
    activo: bool = True
    
class UsuarioCreate(UsuarioBase):
    pass

class UsuarioRead(UsuarioBase):
    id: uuid.UUID
    creado_en: datetime
    
    class Config:
        from_attributes = True