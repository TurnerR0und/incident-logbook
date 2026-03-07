import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool

from app.core.security import get_password_hash
from app.main import app
from app.database import Base, get_db
from app.models.incident import Incident, IncidentSeverity, IncidentStatus
from app.models.user import User

# Connect to the TEST database we just created
TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/incident_logbook_test"


@pytest_asyncio.fixture(scope="function")
async def db_engine():
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        poolclass=NullPool,
    )
    try:
        yield engine
    finally:
        await engine.dispose()

@pytest_asyncio.fixture(scope="function")
async def db_session(db_engine):
    """Creates a fresh database schema for every test, then drops it."""
    testing_session_local = async_sessionmaker(
        bind=db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with db_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with testing_session_local() as session:
        yield session
        
    async with db_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture(scope="function")
async def client(db_session):
    """Provides an async HTTP client to make requests to our FastAPI app."""
    
    # Override the dependency to use our test session
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    # Use ASGITransport to bypass the network and test the app directly
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    # Clean up overrides after the test
    app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def create_user(db_session):
    async def _create_user(
        email: str,
        password: str = "password123",
        is_admin: bool = False,
    ) -> User:
        user = User(
            email=email,
            password_hash=get_password_hash(password),
            is_admin=is_admin,
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        return user

    return _create_user


@pytest_asyncio.fixture(scope="function")
async def auth_headers(client, create_user):
    async def _auth_headers(
        email: str,
        password: str = "password123",
        is_admin: bool = False,
    ) -> dict[str, str]:
        await create_user(email=email, password=password, is_admin=is_admin)

        response = await client.post(
            "/auth/login",
            data={"username": email, "password": password},
        )
        assert response.status_code == 200

        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}

    return _auth_headers


@pytest_asyncio.fixture(scope="function")
async def login_headers(client):
    async def _login_headers(
        email: str,
        password: str = "password123",
    ) -> dict[str, str]:
        response = await client.post(
            "/auth/login",
            data={"username": email, "password": password},
        )
        assert response.status_code == 200

        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}

    return _login_headers


@pytest_asyncio.fixture(scope="function")
async def create_incident(db_session):
    async def _create_incident(
        owner_id,
        *,
        title: str = "Database outage",
        description: str = "Primary database unavailable",
        severity: IncidentSeverity = IncidentSeverity.HIGH,
        status: IncidentStatus = IncidentStatus.OPEN,
        created_at=None,
        started_at=None,
        resolved_at=None,
        root_cause: str | None = None,
    ) -> Incident:
        incident = Incident(
            title=title,
            description=description,
            severity=severity,
            status=status,
            owner_id=owner_id,
            root_cause=root_cause,
        )

        if created_at is not None:
            incident.created_at = created_at
        if started_at is not None:
            incident.started_at = started_at
        if resolved_at is not None:
            incident.resolved_at = resolved_at

        db_session.add(incident)
        await db_session.commit()
        await db_session.refresh(incident)
        return incident

    return _create_incident
