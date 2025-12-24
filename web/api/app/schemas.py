from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: int
    role: str
    created_at: datetime
    last_login_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# Project schemas
class ProjectBase(BaseModel):
    name: str
    domain: Optional[str] = None
    phase: Optional[str] = "prototype"
    complexity: Optional[str] = None
    tags: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    phase: Optional[str] = None
    complexity: Optional[str] = None
    tags: Optional[str] = None

class Project(ProjectBase):
    id: int
    owner_id: int
    visibility: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

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
    author_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
