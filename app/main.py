from fastapi import FastAPI
from app.routers import auth

app = FastAPI(title="Incident Logbook")

app.include_router(auth.router)

@app.get("/")
async def root():
    return {"message": "Incident Logbook API is running"}