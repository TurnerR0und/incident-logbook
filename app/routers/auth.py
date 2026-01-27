from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.core.security import get_password_hash

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    # 1. Check if email already exists
    # We use 'await' because the DB is async
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalars().first()
    
    if existing_user:
        raise HTTPException(
            status_code=400, 
            detail="Email already registered"
        )

    # 2. Hash the password
    hashed_pwd = get_password_hash(user_data.password)

    # 3. Create the DB Model instance
    # Notice we map user_data.email -> email, but hashed_pwd -> password_hash
    new_user = User(
        email=user_data.email,
        password_hash=hashed_pwd
    )

    # 4. Add & Commit
    db.add(new_user)
    await db.commit()
    
    # 5. Refresh 
    # This fetches the new ID and created_at from Postgres back into Python
    await db.refresh(new_user)

    return new_user