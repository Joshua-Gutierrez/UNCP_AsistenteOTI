from contextlib import asynccontextmanager
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.v1 import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-calentar PaddleOCR en background para que esté listo antes de la primera imagen
    loop = asyncio.get_event_loop()
    async def _warm_up():
        try:
            from app.acciones import _obtener_lector
            await loop.run_in_executor(None, _obtener_lector)
            print("✅ PaddleOCR listo.")
        except Exception as e:
            print(f"⚠️  PaddleOCR no pudo pre-cargarse: {e}")
    asyncio.create_task(_warm_up())
    yield


app = FastAPI(title="UNCP Asistente Virtual API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(api_router, prefix="/api/v1")


