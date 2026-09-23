import uuid
from datetime import datetime
from pydantic import BaseModel, Field

class MensajeBase(BaseModel):
    sesion_id: uuid.UUID
    remitente: str = Field(description = "Indica quién envía el mensaje: 'usuario' o 'asistente'")
    contenido: str 
    
class MensajeCreate(MensajeBase):
    pass

class MensajeRead(MensajeBase):
    id: uuid.UUID
    creado_en: datetime
    
    class Config:
        from_attributes = True
        
