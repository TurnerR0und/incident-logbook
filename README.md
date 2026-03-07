# Incident Logbook

Incident Logbook is an async FastAPI service for tracking operational incidents with authenticated access, audit comments, and PostgreSQL persistence.

## Current Scope

- User registration and JWT login
- Incident creation, listing, retrieval, and updates
- Role-based access control with `is_admin`
- Incident comments for human notes and system audit events
- Filtering by status, severity, and creation date range
- Pagination on incident and comment list endpoints
- Async SQLAlchemy with Alembic migrations
- Docker Compose setup for API + PostgreSQL

## Tech Stack

- Python 3.12
- FastAPI
- SQLAlchemy 2.0 async ORM
- PostgreSQL 15 with `asyncpg`
- Alembic
- Pydantic v2
- Passlib bcrypt
- JWT via `python-jose`
- Docker and Docker Compose

## RBAC Model

- Standard users can view, edit, and comment only on incidents they own.
- Admin users can view, edit, and comment on all incidents.
- New users default to `is_admin = false`.

## Data Model Highlights

### User

- `id`
- `email`
- `password_hash`
- `is_admin`
- `created_at`

### Incident

- `id`
- `title`
- `description`
- `status`: `OPEN`, `INVESTIGATING`, `MITIGATED`, `RESOLVED`, `CLOSED`
- `severity`: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- `created_at`
- `started_at`
- `resolved_at`
- `updated_at`
- `root_cause`
- `owner_id`

### Incident Comment

- `id`
- `incident_id`
- `author_id`
- `body`
- `created_at`

## Audit Trail Behavior

- `PATCH /incidents/{incident_id}` automatically creates a system comment when `status` changes.
- `PATCH /incidents/{incident_id}` automatically creates a system comment when `severity` changes.
- System comments include the acting user email in the message body.

## Quick Start With Docker

Run:

```bash
docker-compose up --build
```

App URL:

`http://localhost:8000`

Interactive docs:

`http://localhost:8000/docs`

The Docker Compose setup injects:

`DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/incident_logbook`

## Local Development

1. Create and activate a virtual environment.

```bash
python3 -m venv venv
source venv/bin/activate
```

PowerShell:

```powershell
venv\Scripts\Activate.ps1
```

2. Install dependencies.

```bash
pip install -r requirements.txt
```

3. Start PostgreSQL.

```bash
docker-compose up -d db
```

4. Configure environment variables.

```bash
export DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/incident_logbook
export SECRET_KEY=change-me
export ALGORITHM=HS256
export ACCESS_TOKEN_EXPIRE_MINUTES=30
```

5. Apply migrations.

```bash
alembic upgrade head
```

6. Run the API.

```bash
uvicorn app.main:app --reload
```

## Authentication Flow

1. Register with `POST /auth/register`.
2. Log in with `POST /auth/login` using form fields:
   `username=<email>`
   `password=<password>`
3. Use the returned bearer token for authenticated requests:

```http
Authorization: Bearer <access_token>
```

## API Endpoints

### Auth

- `POST /auth/register`
- `POST /auth/login`

### Health

- `GET /`

### Incidents

- `POST /incidents`
- `GET /incidents`
- `GET /incidents/{incident_id}`
- `PATCH /incidents/{incident_id}`

`GET /incidents` supports:

- `status`
- `severity`
- `created_after`
- `created_before`
- `skip`
- `limit`

Example:

```text
/incidents?severity=HIGH&created_after=2026-02-01T00:00:00Z&created_before=2026-02-28T23:59:59Z
```

### Comments

- `POST /incidents/{incident_id}/comments`
- `GET /incidents/{incident_id}/comments`

`GET /incidents/{incident_id}/comments` supports:

- `skip`
- `limit`

Comments are returned in ascending `created_at` order.

## Request Examples

### Register

```json
{
  "email": "user@example.com",
  "password": "strong-password"
}
```

### Create Incident

```json
{
  "title": "API latency spike",
  "description": "p95 latency exceeded SLO for checkout traffic",
  "severity": "HIGH",
  "started_at": "2026-02-12T09:15:00Z",
  "root_cause": "Unknown"
}
```

### Update Incident

```json
{
  "status": "INVESTIGATING",
  "severity": "CRITICAL",
  "root_cause": "Database connection pool exhaustion"
}
```

### Add Comment

```json
{
  "body": "Traffic shifted away from the affected region."
}
```

## Project Layout

- `app/main.py`: FastAPI application entrypoint
- `app/database.py`: async engine and session management
- `app/core/security.py`: password hashing and JWT helpers
- `app/models/`: SQLAlchemy models
- `app/schemas/`: Pydantic request and response schemas
- `app/routers/`: API route modules
- `alembic/`: migration environment and version scripts
- `docker-compose.yml`: local API and PostgreSQL services
- `Dockerfile`: container image for the API

## Notes

- The API expects a valid `SECRET_KEY` for JWT signing. Do not leave it empty outside local experimentation.
- Admin promotion is not self-service; `is_admin` must be set outside the public registration flow.
- Tests are not included yet.
