import uuid
from datetime import datetime, timezone

from pydantic import BaseModel

class SesionChatBase(BaseModel):
    usuario_id: uuid.UUID
    activa: bool= True
    
class SesionChatCreate(SesionChatBase):
    pass

class SesionChatRead(SesionChatBase):
    id: uuid.UUID
    iniciada_en: datetime
    ultima_interaccion: datetime | None = None
    
    class Config:
        from_attributes = True