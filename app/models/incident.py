import uuid
from datetime import datetime
import enum
from sqlalchemy import String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base

class IncidentStatus(str, enum.Enum):
        "OPEN"
        "INVESTIGATING"
        "MITIGATED"
        "RESOLVED"
        "CLOSED"
class IncidentSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, 
        default=uuid.uuid4
    )
    
    title: Mapped[str] = mapped_column(String, index=True)
    description: Mapped[str] = mapped_column(String)
    
    # 2. Use the Enums in the Column definition
    status: Mapped[IncidentStatus] = mapped_column(
        Enum(IncidentStatus), 
        default=IncidentStatus.OPEN
    )
    severity: Mapped[IncidentSeverity] = mapped_column(
        Enum(IncidentSeverity)
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )

    # 3. The Relationship
    # We store the ID of the user who owns this incident
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    
    # This helps SQLAlchemy know how to fetch the User object from an Incident
    # We will add the other side of this ("incidents = ...") to the User model next.
    owner = relationship("User", back_populates="incidents")    