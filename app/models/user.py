import uuid
from datetime import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    # 1. The ID
    # We use UUIDs instead of Integers (1, 2, 3). 
    # Why? It prevents "enumeration attacks" (guessing user 4 exists because you are user 5).
    # default=uuid.uuid4 generates it on the Python side if not provided.
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )

    # 2. Basic Fields
    # unique=True creates a constraint in Postgres so you can't have duplicate emails.
    # index=True makes searching by email lightning fast (vital for login).
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    
    # We store the HASH, never the password.
    password_hash: Mapped[str] = mapped_column(String, nullable=False)

    # 3. Timestamps
    # func.now() tells Postgres "Use your own server clock when this row is inserted".
    # This is safer than using Python's datetime.now() because timezone mismatches can happen.
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )

    # We'll add relationships (like 'incidents') later. 
    # For now, keep the model isolated to test the migration system.