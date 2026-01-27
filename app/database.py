from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
# We will use pydantic_settings later, but for now let's use os/dotenv to keep it clear
import os
from dotenv import load_dotenv

# 1. Load the .env file
load_dotenv() 

# 2. Get the URL. 
# We default to a placeholder if it's missing (helps avoid hard crashes during simple tests)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/incident_logbook")

# 3. Create the Async Engine
# echo=True prints every SQL query to your console (great for learning!)
engine = create_async_engine(DATABASE_URL, echo=True)

# 4. Create the Session Factory
# This is what we will use to create a new session for every request
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False 
    # expire_on_commit=False is important in async settings to prevent 
    # SQLAlchemy from trying to refresh data when you access it after a commit.
)

# 5. The Declarative Base
# All our database models (Users, Incidents) will inherit from this class
class Base(DeclarativeBase):
    pass

# 6. Dependency Injection helper
# We will use this in FastAPI routes later: "Give me a DB session, then close it when I'm done"
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()