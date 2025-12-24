from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    domain = Column(String, nullable=True)  # e.g., "web", "embedded", "devops"
    phase = Column(String, default="prototype")  # prototype, mvp, production, stable, inactive
    complexity = Column(String, nullable=True)  # low, medium, high, very_high
    tags = Column(Text, nullable=True)  # comma-separated tags
    visibility = Column(String, default="private")  # private, team, public
    
    # New fields for local scanning
    local_path = Column(String, nullable=True)  # Path to local git repo
    git_remote_url = Column(String, nullable=True)  # Git remote URL if available
    detected_tech_stack = Column(JSON, nullable=True)  # Auto-detected technologies
    last_scanned = Column(DateTime, nullable=True)  # Last time folder was scanned
    
    # Kanban board fields
    status = Column(String, default="backlog")  # backlog, active, completed, archived
    position = Column(Integer, default=0)  # Position within status column
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    notes = relationship("Note", back_populates="project", cascade="all, delete-orphan")
    repositories = relationship("Repository", back_populates="project")
    activities = relationship("Activity", back_populates="project", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")

class Repository(Base):
    __tablename__ = "repositories"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    github_id = Column(String, unique=True, nullable=False)  # GitHub repo ID
    name = Column(String, nullable=False)  # e.g., "organizeMe"
    full_name = Column(String, nullable=False, index=True)  # e.g., "jmcconocha/organizeMe"
    url = Column(String)  # GitHub URL
    description = Column(Text)
    language = Column(String)  # Primary language
    stars = Column(Integer, default=0)
    forks = Column(Integer, default=0)
    open_issues = Column(Integer, default=0)
    last_synced = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    project = relationship("Project", back_populates="repositories")
    activities = relationship("Activity", back_populates="repository", cascade="all, delete-orphan")

class Activity(Base):
    __tablename__ = "activities"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    repository_id = Column(Integer, ForeignKey("repositories.id"), nullable=True)
    activity_type = Column(String)  # "commit", "pull_request", "issue", "release", "scan"
    title = Column(String)
    description = Column(Text, nullable=True)
    url = Column(String, nullable=True)
    author = Column(String, nullable=True)  # GitHub username or "system"
    timestamp = Column(DateTime)  # When the activity happened
    created_at = Column(DateTime, default=datetime.utcnow)
    
    project = relationship("Project", back_populates="activities")
    repository = relationship("Repository", back_populates="activities")

class Note(Base):
    __tablename__ = "notes"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    content = Column(Text, nullable=False)
    tags = Column(Text, nullable=True)  # comma-separated tags
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    project = relationship("Project", back_populates="notes")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="todo")  # todo, in_progress, done
    position = Column(Integer, default=0)  # Position within status column
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    project = relationship("Project", back_populates="tasks")

class Scan(Base):
    __tablename__ = "scans"
    
    id = Column(Integer, primary_key=True, index=True)
    scan_path = Column(String, nullable=False)  # Root path that was scanned
    projects_found = Column(Integer, default=0)  # Number of projects discovered
    projects_imported = Column(Integer, default=0)  # Number actually imported
    status = Column(String, default="pending")  # pending, running, completed, failed
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
