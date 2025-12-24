from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Note, Project
from app.schemas import Note as NoteSchema, NoteCreate, NoteUpdate
from typing import List

router = APIRouter(prefix="/api/notes", tags=["notes"])

@router.get("", response_model=List[NoteSchema])
async def list_notes(
    project_id: int = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """List notes (single-user mode)"""
    query = db.query(Note)
    if project_id:
        query = query.filter(Note.project_id == project_id)
    return query.offset(skip).limit(limit).all()

@router.post("", response_model=NoteSchema)
async def create_note(
    note: NoteCreate,
    db: Session = Depends(get_db)
):
    """Create a new note"""
    # Verify project exists
    project = db.query(Project).filter(Project.id == note.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db_note = Note(**note.dict())
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

@router.get("/{note_id}", response_model=NoteSchema)
async def get_note(
    note_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific note"""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

@router.patch("/{note_id}", response_model=NoteSchema)
async def update_note(
    note_id: int,
    note_update: NoteUpdate,
    db: Session = Depends(get_db)
):
    """Update a note"""
    db_note = db.query(Note).filter(Note.id == note_id).first()
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
    
    for key, value in note_update.dict(exclude_unset=True).items():
        setattr(db_note, key, value)
    
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
