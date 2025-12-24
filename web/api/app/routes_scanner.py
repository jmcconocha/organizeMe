"""
API routes for folder scanning functionality
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import os

from app.database import get_db
from app.schemas import ScanCreate, Scan, ScanResult, ProjectCreate, Project
from app.models import Scan as ScanModel, Project as ProjectModel
from app.worker.scanner import scan_directory

router = APIRouter(prefix="/api/scanner", tags=["scanner"])


@router.post("/scan", response_model=ScanResult)
async def trigger_scan(
    scan_data: ScanCreate,
    db: Session = Depends(get_db)
):
    """
    Scan a local folder for git repositories
    """
    # Validate path exists
    if not os.path.exists(scan_data.path):
        raise HTTPException(status_code=400, detail="Path does not exist")
    
    if not os.path.isdir(scan_data.path):
        raise HTTPException(status_code=400, detail="Path is not a directory")
    
    # Perform scan
    discovered_repos = scan_directory(
        scan_data.path,
        max_depth=scan_data.max_depth or 3
    )
    
    # Create scan record
    scan_record = ScanModel(
        path=scan_data.path,
        max_depth=scan_data.max_depth or 3,
        results_count=len(discovered_repos)
    )
    db.add(scan_record)
    db.commit()
    db.refresh(scan_record)
    
    return ScanResult(
        scan_id=scan_record.id,
        path=scan_record.path,
        results_count=scan_record.results_count,
        discovered_repos=discovered_repos,
        created_at=scan_record.created_at
    )


@router.get("/scans", response_model=List[Scan])
async def list_scans(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    List all folder scan history
    """
    scans = db.query(ScanModel).order_by(
        ScanModel.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    return scans


@router.get("/scans/{scan_id}", response_model=Scan)
async def get_scan(
    scan_id: int,
    db: Session = Depends(get_db)
):
    """
    Get details of a specific scan
    """
    scan = db.query(ScanModel).filter(ScanModel.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    return scan


@router.post("/import", response_model=List[Project])
async def import_projects(
    repos: List[dict],
    db: Session = Depends(get_db)
):
    """
    Import discovered repositories as projects
    
    Expected format:
    [
        {
            "name": "project-name",
            "local_path": "/path/to/repo",
            "git_remote_url": "https://github.com/user/repo",
            "description": "Project description",
            "detected_tech_stack": {"languages": ["Python"], "frameworks": ["FastAPI"]}
        }
    ]
    """
    created_projects = []
    
    for repo_data in repos:
        # Check if project already exists at this path
        existing = db.query(ProjectModel).filter(
            ProjectModel.local_path == repo_data.get("local_path")
        ).first()
        
        if existing:
            continue  # Skip duplicates
        
        # Create new project
        project = ProjectModel(
            name=repo_data.get("name", "Unnamed Project"),
            domain=repo_data.get("domain"),
            description=repo_data.get("description"),
            phase="active",
            local_path=repo_data.get("local_path"),
            git_remote_url=repo_data.get("git_remote_url"),
            detected_tech_stack=repo_data.get("detected_tech_stack"),
            status="backlog",  # Default kanban status
            position=0
        )
        
        db.add(project)
        created_projects.append(project)
    
    db.commit()
    
    # Refresh all projects
    for project in created_projects:
        db.refresh(project)
    
    return created_projects
