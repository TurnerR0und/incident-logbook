import asyncio
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.models.incident import Incident
from app.models.incident_comment import IncidentComment
async def make_admin(email: str):
    # get_db() is an async generator, so we iterate once to grab the yielded session
    async for db in get_db():
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        
        if user:
            user.is_admin = True
            await db.commit()
            print(f"👑 Success! {email} is now an Admin.")
        else:
            print(f"❌ User {email} not found. Register them in the UI first!")
        
        break # We only need the session once, so we break out of the generator

if __name__ == "__main__":
    # Replace with the email you registered in your frontend!
    target_email = "benkturner@gmail.com" 
    asyncio.run(make_admin(target_email))