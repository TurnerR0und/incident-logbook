import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CommentCreate(BaseModel):
    body: str


class CommentResponse(BaseModel):
    id: uuid.UUID
    incident_id: uuid.UUID
    author_id: uuid.UUID
    body: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
