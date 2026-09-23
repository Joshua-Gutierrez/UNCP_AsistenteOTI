# Usamos una imagen ligera de Python oficial
FROM python:3.12-slim

# Directorio de trabajo dentro del contenedor
WORKDIR /app
# EVITA QUE LINUX SE CONGELE PIDIENDO CONFIRMACIONES DE ZONA HORARIA
ENV DEBIAN_FRONTEND=noninteractive
# Instalamos dependencias del sistema operativo (necesarias para Tesseract OCR y compilación)
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-spa \
    libtesseract-dev \
    libgl1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instalamos 'uv' de forma oficial y rápida en el contenedor
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copiamos los archivos de configuración de dependencias
COPY pyproject.toml uv.lock* ./

# Sincronizamos las dependencias usando uv (sin crear entorno virtual dentro del contenedor por rendimiento)
RUN uv sync --frozen --no-dev --no-install-project

# Copiamos el resto del código fuente del backend
COPY . .

# Exponemos el puerto donde corre FastAPI
EXPOSE 8000

# Comando para arrancar el servidor con Uvicorn
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
