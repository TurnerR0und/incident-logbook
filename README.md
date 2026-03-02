# Incident Logbook

Incident Logbook is an async FastAPI service for tracking operational incidents with authenticated access and a PostgreSQL backend.

## What It Includes

- User registration and login
- JWT-based authentication
- Async SQLAlchemy integration
- Alembic migrations
- Docker Compose setup for API + database

## Tech Stack

- Python 3.12
- FastAPI
- PostgreSQL 15 with asyncpg
- SQLAlchemy 2.0
- Alembic
- Pydantic v2
- Docker and Docker Compose

## Quick Start (Docker)

Run:

docker-compose up --build

App URL:

http://localhost:8000

API docs:

http://localhost:8000/docs

## Local Development

1. Create and activate a virtual environment.

python -m venv venv
source venv/bin/activate

Windows PowerShell:
venv\Scripts\Activate.ps1

2. Install dependencies.

pip install -r requirements.txt

3. Start database only.

docker-compose up -d db

4. Apply migrations.

alembic upgrade head

5. Run API.

uvicorn app.main:app --reload

## Available Endpoints

- POST /auth/register
- POST /auth/login
- GET /

## Project Layout

- app/main.py: FastAPI app entrypoint
- app/database.py: async engine and session handling
- app/routers/: API route modules
- app/models/: SQLAlchemy models
- app/schemas/: Pydantic schemas
- alembic/: migration files and config
- docker-compose.yml: local service orchestration

## Contributing

1. Create a branch.
2. Make changes.
3. Open a pull request.
