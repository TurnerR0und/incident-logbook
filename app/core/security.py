from passlib.context import CryptContext
import os
from datetime import datetime, timedelta, timezone
from jose import jwt
# 1. Configuration
# We tell passlib to use "bcrypt", which is the industry standard for password hashing.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 1a. JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# 2. Hash a password
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# 3. Verify a password
# We will use this later for Login
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# 4. Create an access token 
def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
