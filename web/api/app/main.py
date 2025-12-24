from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes_auth import router as auth_router
from app.routes_projects import router as projects_router
from app.routes_notes import router as notes_router
from app.routes_repositories import router as repositories_router
import os
import sqlite3

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Project Portfolio Manager API", version="0.2.0")

# CORS
origins = os.getenv("CORS_ORIGIN", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(notes_router)
app.include_router(repositories_router)

# Health check endpoints
@app.get("/healthz")
async def health():
    """Basic health check"""
    return {"status": "ok"}

@app.get("/readyz")
async def ready():
    """Readiness check: verify DB connectivity"""
    try:
        db_path = os.getenv("DATABASE_URL", "sqlite:////app/data/ppm.db")
        # Handle both sqlite://// and file paths
        if db_path.startswith("sqlite://"):
            db_file = db_path.replace("sqlite:///", "")
        else:
            db_file = db_path
        conn = sqlite3.connect(db_file)
        conn.execute("SELECT 1")
        conn.close()
        return {"ready": True, "db": "connected"}
    except Exception as e:
        return {"ready": False, "error": str(e)}, 503

@app.get("/")
async def root():
    """API root"""
    return {"message": "Project Portfolio Manager API v0.1.0"}
