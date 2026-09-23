# Sistema de Asistente Virtual - UNCP

## Descripción del Proyecto
Este repositorio contiene el código fuente del Sistema de Asistente Virtual (Chatbot) desarrollado para la Universidad Nacional del Centro del Perú (UNCP). La solución está estructurada bajo una arquitectura cliente-servidor e implementada como un Monorepo, separando las responsabilidades de la interfaz de usuario (Frontend) y la lógica de negocio (Backend).

## Arquitectura y Tecnologías
El sistema está construido utilizando el siguiente stack tecnológico:

**Backend:**
*   **Framework:** Python 3.10+ / FastAPI
*   **Base de Datos:** MySQL
*   **ORM y Migraciones:** SQLModel, Alembic
*   **Procesamiento:** PaddleOCR, OpenCV
*   **Despliegue Local:** Docker / Docker Compose

**Frontend:**
*   **Librería/Framework:** React 18+ / Vite
*   **Estilizado:** CSS / Componentes Funcionales

## Requisitos del Sistema
Para el despliegue local y desarrollo del sistema, se requiere tener instaladas las siguientes herramientas:
*   [Node.js](https://nodejs.org/es/) (v18.x o superior)
*   [Python](https://www.python.org/downloads/) (v3.10 o superior)
*   [Docker](https://www.docker.com/) y Docker Compose (Recomendado para la gestión de la base de datos)
*   [Git](https://git-scm.com/)

---

## Guía de Configuración y Despliegue

### 1. Variables de Entorno
El sistema requiere de variables de entorno para la conexión a la base de datos y otras configuraciones. En la raíz del proyecto, genere el archivo `.env` a partir del archivo de ejemplo:

```bash
cp .env.example .env
```
*Asegúrese de configurar correctamente las credenciales de acceso a la base de datos en el archivo generado.*

### 2. Configuración de la Base de Datos
Para inicializar la instancia de MySQL utilizando Docker:

```bash
docker-compose up -d
```

### 3. Despliegue del Backend (API Rest)
El backend requiere la creación de un entorno virtual aislado para gestionar sus dependencias.

```bash
# 1. Navegar al directorio del backend
cd backend

# 2. Inicializar el entorno virtual
python -m venv .venv

# 3. Activar el entorno virtual
# En entornos Windows:
.\.venv\Scripts\activate
# En entornos Unix/MacOS:
# source .venv/bin/activate

# 4. Instalar las dependencias del proyecto
pip install -r req.txt

# 5. Ejecutar migraciones de la base de datos (Alembic)
alembic upgrade head

# 6. Levantar el servicio
uvicorn app.main:app --reload
```
El servidor backend estará disponible en: `http://localhost:8000`

### 4. Despliegue del Frontend
Para inicializar la interfaz de usuario:

```bash
# 1. Navegar al directorio del frontend
cd frontend

# 2. Instalar los módulos de Node
npm install

# 3. Iniciar el servidor de desarrollo
npm run dev
```
La aplicación frontend estará disponible en el puerto indicado por Vite (típicamente `http://localhost:5173`).

---

## Estructura del Repositorio
*   `/backend`: Contiene la lógica principal de la API, modelos de base de datos, migraciones y endpoints.
*   `/frontend`: Contiene los componentes de React, vistas de administración y la interfaz de chat interactiva.
*   `docker-compose.yml`: Orquestación del contenedor de la base de datos relacional.
