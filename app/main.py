from fastapi import FastAPI
from app.routers import auth
from app.routers import comments
from app.routers import incidents

app = FastAPI(title="Incident Logbook")

app.include_router(auth.router)
app.include_router(comments.router)
app.include_router(incidents.router)

@app.get("/")
async def root():
    return {"message": "Incident Logbook API is running"}
