from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import sqlite3

app = FastAPI(title="Project Portfolio Manager API", version="0.1.0")

# CORS
origins = os.getenv("CORS_ORIGIN", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        db_file = db_path.replace("sqlite:////", "")
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

@app.get("/api/projects")
async def list_projects():
    """Placeholder: list projects"""
    return {"projects": []}

@app.post("/api/projects")
async def create_project():
    """Placeholder: create project"""
    return {"id": 1, "name": "Example Project"}
