import uuid
from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime

# 1. Base Schema 
# Shared properties (things visible to everyone)
class UserBase(BaseModel):
    email: EmailStr

# 2. Input Schema (Registration)
# What we need to CREATE a user.
# We need the raw password here to hash it later.
class UserCreate(UserBase):
    password: str

# 3. Output Schema (Response)
# What we return to the client.
# NOTICE: We do NOT include the password or the hash here!
class UserResponse(UserBase):
    id: uuid.UUID
    created_at: datetime

    # This config tells Pydantic: "It's okay to read data from a pure Python class (ORM model)"
    # Without this, Pydantic expects a dictionary.
    model_config = ConfigDict(from_attributes=True)