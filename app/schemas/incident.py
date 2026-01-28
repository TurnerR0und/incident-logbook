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
    pass 

# 3. Response Schema (Output)
class IncidentResponse(IncidentBase):
    id: uuid.UUID
    status: IncidentStatus
    created_at: datetime
    owner_id: uuid.UUID

    # This allows Pydantic to read data directly from the SQLAlchemy object
    model_config = ConfigDict(from_attributes=True)