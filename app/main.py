from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # <-- 1. Import this
from app.routers import auth
from app.routers import comments
from app.routers import incidents

app = FastAPI(title="Incident Logbook")

# <-- 2. Add this entire middleware block -->
# We explicitly allow Vite's default ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, PATCH, etc.)
    allow_headers=["*"],  # Allows all headers (like our Authorization Bearer token!)
)

app.include_router(auth.router)
app.include_router(comments.router)
app.include_router(incidents.router)

@app.get("/")
async def root():
    return {"message": "Incident Logbook API is running"}