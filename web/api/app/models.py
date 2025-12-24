from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String)
    password_hash = Column(String)
    role = Column(String, default="member")  # admin, member, viewer
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login_at = Column(DateTime, nullable=True)
    github_username = Column(String, nullable=True)  # For OAuth integration
    github_token = Column(String, nullable=True)  # Encrypted in production
    
    projects = relationship("Project", back_populates="owner")
    notes = relationship("Note", back_populates="author")
    repositories = relationship("Repository", back_populates="owner")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    domain = Column(String, nullable=True)  # e.g., "web", "embedded", "devops"
    phase = Column(String, default="prototype")  # prototype, mvp, production, stable, inactive
    complexity = Column(String, nullable=True)  # low, medium, high, very_high
    tags = Column(Text, nullable=True)  # comma-separated tags
    visibility = Column(String, default="private")  # private, team, public
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    owner = relationship("User", back_populates="projects")
    notes = relationship("Note", back_populates="project", cascade="all, delete-orphan")
    repositories = relationship("Repository", back_populates="project")
    activities = relationship("Activity", back_populates="project", cascade="all, delete-orphan")

class Repository(Base):
    __tablename__ = "repositories"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
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
    owner = relationship("User", back_populates="repositories")
    activities = relationship("Activity", back_populates="repository", cascade="all, delete-orphan")

class Activity(Base):
    __tablename__ = "activities"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    repository_id = Column(Integer, ForeignKey("repositories.id"), nullable=True)
    activity_type = Column(String)  # "commit", "pull_request", "issue", "release"
    title = Column(String)
    description = Column(Text, nullable=True)
    url = Column(String, nullable=True)
    author = Column(String, nullable=True)  # GitHub username
    timestamp = Column(DateTime)  # When the activity happened
    created_at = Column(DateTime, default=datetime.utcnow)
    
    project = relationship("Project", back_populates="activities")
    repository = relationship("Repository", back_populates="activities")

class Note(Base):
    __tablename__ = "notes"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    tags = Column(Text, nullable=True)  # comma-separated tags
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    project = relationship("Project", back_populates="notes")
    author = relationship("User", back_populates="notes")
