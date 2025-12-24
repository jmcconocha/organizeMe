from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Note, Project, User
from app.schemas import Note as NoteSchema, NoteCreate, NoteUpdate
from app.dependencies import get_current_user
from typing import List

router = APIRouter(prefix="/api/notes", tags=["notes"])

@router.get("", response_model=List[NoteSchema])
async def list_notes(
    project_id: int = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List notes for projects owned by current user"""
    # Get all project IDs owned by current user
    project_ids = db.query(Project.id).filter(Project.owner_id == current_user.id).all()
    project_ids = [p[0] for p in project_ids]
    
    query = db.query(Note).filter(Note.project_id.in_(project_ids))
    if project_id and project_id in project_ids:
        query = query.filter(Note.project_id == project_id)
    return query.offset(skip).limit(limit).all()

@router.post("", response_model=NoteSchema)
async def create_note(
    note: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new note"""
    # Verify project exists and belongs to current user
    project = db.query(Project).filter(
        Project.id == note.project_id,
        Project.owner_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db_note = Note(**note.dict(), author_id=current_user.id)
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

@router.get("/{note_id}", response_model=NoteSchema)
async def get_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific note"""
    note = db.query(Note).join(Project).filter(
        Note.id == note_id,
        Project.owner_id == current_user.id
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

@router.patch("/{note_id}", response_model=NoteSchema)
async def update_note(
    note_id: int,
    note_update: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a note"""
    db_note = db.query(Note).join(Project).filter(
        Note.id == note_id,
        Project.owner_id == current_user.id
    ).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    for key, value in note_update.dict(exclude_unset=True).items():
        setattr(db_note, key, value)
    
    db.commit()
    db.refresh(db_note)
    return db_note

@router.delete("/{note_id}")
async def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a note"""
    db_note = db.query(Note).join(Project).filter(
        Note.id == note_id,
        Project.owner_id == current_user.id
    ).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    db.delete(db_note)
    db.commit()
    return {"deleted": True}
    
    db.commit()
    db.refresh(db_note)
    return db_note

@router.delete("/{note_id}")
async def delete_note(note_id: int, db: Session = Depends(get_db)):
    """Delete a note"""
    db_note = db.query(Note).filter(Note.id == note_id).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    db.delete(db_note)
    db.commit()
    return {"deleted": True}
