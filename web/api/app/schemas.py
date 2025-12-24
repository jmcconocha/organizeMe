from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any

# Activity schemas
class ActivityBase(BaseModel):
    activity_type: str
    title: str
    description: Optional[str] = None
    url: Optional[str] = None
    author: Optional[str] = None
    timestamp: datetime

class Activity(ActivityBase):
    id: int
    project_id: int
    repository_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Repository schemas
class RepositoryBase(BaseModel):
    name: str
    full_name: str
    url: Optional[str] = None
    description: Optional[str] = None
    language: Optional[str] = None
    stars: int = 0
    forks: int = 0
    open_issues: int = 0

class RepositoryCreate(BaseModel):
    full_name: str  # e.g., "jmcconocha/organizeMe"
    project_id: int

class Repository(RepositoryBase):
    id: int
    project_id: int
    github_id: str
    last_synced: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    activities: List[Activity] = []
    
    class Config:
        from_attributes = True

# Project schemas
class ProjectBase(BaseModel):
    name: str
    domain: Optional[str] = None
    phase: Optional[str] = "prototype"
    complexity: Optional[str] = None
    tags: Optional[str] = None
    local_path: Optional[str] = None
    git_remote_url: Optional[str] = None
    status: Optional[str] = "backlog"

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    phase: Optional[str] = None
    complexity: Optional[str] = None
    tags: Optional[str] = None
    status: Optional[str] = None
    position: Optional[int] = None
    local_path: Optional[str] = None
    git_remote_url: Optional[str] = None

class Project(ProjectBase):
    id: int
    visibility: str
    position: int
    detected_tech_stack: Optional[Dict[str, Any]] = None
    last_scanned: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    repositories: List[Repository] = []
    
    class Config:
        from_attributes = True


class ProjectSummary(BaseModel):
    project_id: int
    status: str
    health: str
    repo_count: int
    open_issues: int
    last_activity_at: Optional[datetime] = None
    last_synced_at: Optional[datetime] = None
    summary: str
    recommendations: List[str] = []
    generator: str = "heuristic"
    ai_available: bool = False

# Note schemas
class NoteBase(BaseModel):
    content: str
    tags: Optional[str] = None

class NoteCreate(NoteBase):
    project_id: int

class NoteUpdate(BaseModel):
    content: Optional[str] = None
    tags: Optional[str] = None

class Note(NoteBase):
    id: int
    project_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Task schemas (for project-level kanban)
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "todo"

class TaskCreate(TaskBase):
    project_id: int

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    position: Optional[int] = None

class Task(TaskBase):
    id: int
    project_id: int
    position: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Scan schemas
class ScanBase(BaseModel):
    path: str
    max_depth: Optional[int] = 3

class ScanCreate(ScanBase):
    pass

class ScanResult(BaseModel):
    scan_id: int
    path: str
    results_count: int
    discovered_repos: List[Dict[str, Any]] = []
    created_at: datetime

class Scan(BaseModel):
    id: int
    scan_path: str
    projects_found: int
    projects_imported: int
    status: str
    error_message: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
