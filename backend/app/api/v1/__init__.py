from fastapi import APIRouter
from app.api.v1.endpoints.usuarios import router as usuarios_router
from app.api.v1.endpoints.sesiones import router as sesiones_router
from app.api.v1.endpoints.mensajes import router as mensajes_router
from app.api.v1.endpoints.admin import router as admin_router
from app.api.v1.endpoints.imagenes import router as imagenes_router


api_router = APIRouter()
api_router.include_router(usuarios_router)
api_router.include_router(sesiones_router)
api_router.include_router(mensajes_router)
api_router.include_router(admin_router) 
api_router.include_router(imagenes_router)



