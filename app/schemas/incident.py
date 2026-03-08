import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.incident import IncidentStatus, IncidentSeverity

# 1. Base Schema (Shared fields)
class IncidentBase(BaseModel):
    title: str
    description: str
    severity: IncidentSeverity

# 2. Create Schema (Input)
# We don't ask for status (default OPEN) or owner_id (we get that from the token)
class IncidentCreate(IncidentBase):
    started_at: datetime | None = None
    root_cause: str | None = None

# 3. Response Schema (Output)
class IncidentResponse(IncidentBase):
    id: uuid.UUID
    status: IncidentStatus
    created_at: datetime
    started_at: datetime | None
    resolved_at: datetime | None
    updated_at: datetime
    root_cause: str | None
    owner_id: uuid.UUID
    owner_email: str

    # This allows Pydantic to read data directly from the SQLAlchemy object
    model_config = ConfigDict(from_attributes=True)

# 4. Update Schema (Input)
# All fields are optional (None) because you might only want to change the status.
class IncidentUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: IncidentStatus | None = None
    severity: IncidentSeverity | None = None
    started_at: datetime | None = None
    root_cause: str | None = None
