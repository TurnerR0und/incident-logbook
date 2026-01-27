from passlib.context import CryptContext

# 1. Configuration
# We tell passlib to use "bcrypt", which is the industry standard for password hashing.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 2. Hash a password
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# 3. Verify a password
# We will use this later for Login
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)