from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.services import task_service

router = APIRouter()

@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_in: TaskCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new task.
    """
    return task_service.create_task(db=db, task_in=task_in)

@router.get("/", response_model=List[TaskResponse])
def list_tasks(
    view: Optional[str] = Query(None, description="View filter: today, upcoming, or completed"),
    priority: Optional[str] = Query(None, description="Priority filter: low, medium, or high"),
    db: Session = Depends(get_db)
):
    """
    List tasks with optional filtering by view and priority.
    """
    try:
        return task_service.list_tasks(db=db, view=view, priority=priority)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db)
):
    """
    Retrieve a specific task by ID.
    """
    task = task_service.get_task(db=db, task_id=task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task

@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_in: TaskUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a task's details.
    """
    db_task = task_service.get_task(db=db, task_id=task_id)
    if not db_task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task_service.update_task(db=db, db_task=db_task, task_in=task_in)

@router.delete("/{task_id}", status_code=status.HTTP_200_OK)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a task.
    """
    db_task = task_service.get_task(db=db, task_id=task_id)
    if not db_task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    task_service.delete_task(db=db, db_task=db_task)
    return {"message": f"Task {task_id} deleted successfully"}

@router.patch("/{task_id}/complete", response_model=TaskResponse)
def complete_task(
    task_id: int,
    db: Session = Depends(get_db)
):
    """
    Mark a task as completed.
    """
    db_task = task_service.get_task(db=db, task_id=task_id)
    if not db_task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task_service.complete_task(db=db, db_task=db_task)

@router.patch("/{task_id}/reopen", response_model=TaskResponse)
def reopen_task(
    task_id: int,
    db: Session = Depends(get_db)
):
    """
    Reopen a completed task.
    """
    db_task = task_service.get_task(db=db, task_id=task_id)
    if not db_task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task_service.reopen_task(db=db, db_task=db_task)
