"""
API routes for kanban board functionality
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas import (
    Project, ProjectUpdate,
    Task, TaskCreate, TaskUpdate
)
from app.models import Project as ProjectModel, Task as TaskModel

router = APIRouter(prefix="/api/kanban", tags=["kanban"])


@router.patch("/projects/{project_id}/status", response_model=Project)
async def update_project_status(
    project_id: int,
    status: str,
    position: int = None,
    db: Session = Depends(get_db)
):
    """
    Move a project to a different kanban column (status)
    
    Valid statuses: backlog, in-progress, review, done
    """
    valid_statuses = ["backlog", "in-progress", "review", "done"]
    if status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project.status = status
    
    # If position provided, update it
    if position is not None:
        project.position = position
    
    db.commit()
    db.refresh(project)
    
    return project


@router.post("/projects/reorder")
async def reorder_projects(
    updates: List[dict],
    db: Session = Depends(get_db)
):
    """
    Bulk update project positions within a status column
    
    Expected format:
    [
        {"id": 1, "position": 0},
        {"id": 2, "position": 1},
        {"id": 3, "position": 2}
    ]
    """
    for update in updates:
        project_id = update.get("id")
        position = update.get("position")
        
        if project_id is None or position is None:
            continue
        
        project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
        if project:
            project.position = position
    
    db.commit()
    
    return {"message": "Projects reordered successfully"}


# Task Management (Project-level kanban)

@router.get("/projects/{project_id}/tasks", response_model=List[Task])
async def list_project_tasks(
    project_id: int,
    status: str = None,
    db: Session = Depends(get_db)
):
    """
    List all tasks for a specific project, optionally filtered by status
    """
    # Verify project exists
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    query = db.query(TaskModel).filter(TaskModel.project_id == project_id)
    
    if status:
        query = query.filter(TaskModel.status == status)
    
    tasks = query.order_by(TaskModel.position).all()
    
    return tasks


@router.post("/projects/{project_id}/tasks", response_model=Task)
async def create_task(
    project_id: int,
    task: TaskCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new task for a project
    """
    # Verify project exists
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get max position for this status
    max_position = db.query(TaskModel).filter(
        TaskModel.project_id == project_id,
        TaskModel.status == task.status
    ).count()
    
    db_task = TaskModel(
        **task.dict(),
        project_id=project_id,
        position=max_position
    )
    
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    return db_task


@router.patch("/tasks/{task_id}", response_model=Task)
async def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a task (title, description, status, position)
    """
    db_task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update fields
    update_data = task_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_task, field, value)
    
    db.commit()
    db.refresh(db_task)
    
    return db_task


@router.delete("/tasks/{task_id}")
async def delete_task(
    task_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a task
    """
    db_task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(db_task)
    db.commit()
    
    return {"message": "Task deleted successfully"}


@router.post("/tasks/reorder")
async def reorder_tasks(
    updates: List[dict],
    db: Session = Depends(get_db)
):
    """
    Bulk update task positions within a status column
    
    Expected format:
    [
        {"id": 1, "position": 0, "status": "todo"},
        {"id": 2, "position": 1, "status": "todo"}
    ]
    """
    for update in updates:
        task_id = update.get("id")
        position = update.get("position")
        status = update.get("status")
        
        if task_id is None or position is None:
            continue
        
        task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
        if task:
            task.position = position
            if status:
                task.status = status
    
    db.commit()
    
    return {"message": "Tasks reordered successfully"}
