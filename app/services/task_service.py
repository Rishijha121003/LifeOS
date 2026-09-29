from datetime import date, datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.task import Task, PriorityEnum
from app.schemas.task import TaskCreate, TaskUpdate

def create_task(db: Session, task_in: TaskCreate) -> Task:
    """
    Creates a new task in the database.
    """
    db_task = Task(
        title=task_in.title,
        description=task_in.description,
        due_date=task_in.due_date,
        due_time=task_in.due_time,
        priority=task_in.priority,
        status=task_in.status if task_in.status else "NOT_STARTED",
        estimated_duration_minutes=task_in.estimated_duration_minutes,
        actual_duration_minutes=task_in.actual_duration_minutes or 0,
        goal_id=task_in.goal_id,
        milestone_id=task_in.milestone_id,
        completed=False
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def get_task(db: Session, task_id: int) -> Optional[Task]:
    """
    Retrieves a single task by ID.
    """
    stmt = select(Task).where(Task.id == task_id)
    return db.scalars(stmt).first()

def list_tasks(
    db: Session,
    view: Optional[str] = None,
    priority: Optional[str] = None
) -> List[Task]:
    """
    Lists tasks with optional filtering by view (today, upcoming, completed) and priority.
    """
    stmt = select(Task)
    today = date.today()

    if view == "today":
        stmt = stmt.where(Task.due_date == today)
    elif view == "upcoming":
        stmt = stmt.where(Task.due_date > today, Task.completed == False)
    elif view == "completed":
        stmt = stmt.where(Task.completed == True)

    if priority:
        # Validate priority string if provided
        try:
            priority_enum = PriorityEnum(priority.lower())
            stmt = stmt.where(Task.priority == priority_enum)
        except ValueError:
            raise ValueError(f"Invalid priority filter value: '{priority}'. Must be low, medium, or high.")

    # Order tasks by due date, due time, then newest ID first
    stmt = stmt.order_by(Task.due_date.asc().nulls_last(), Task.due_time.asc().nulls_last(), Task.id.desc())
    return list(db.scalars(stmt).all())

def update_task(db: Session, db_task: Task, task_in: TaskUpdate) -> Task:
    """
    Updates an existing task's fields and maintains execution status consistency.
    """
    update_data = task_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_task, field, value)
    
    if "completed" in update_data:
        if update_data["completed"]:
            db_task.status = "COMPLETED"
            if not db_task.actual_duration_minutes:
                db_task.actual_duration_minutes = db_task.estimated_duration_minutes
        else:
            db_task.status = "NOT_STARTED"
    elif "status" in update_data:
        if update_data["status"] == "COMPLETED":
            db_task.completed = True
            if not db_task.actual_duration_minutes:
                db_task.actual_duration_minutes = db_task.estimated_duration_minutes
        elif update_data["status"] in ("NOT_STARTED", "IN_PROGRESS", "SKIPPED", "MISSED"):
            db_task.completed = False

    db_task.updated_at = datetime.now()
    db.commit()
    db.refresh(db_task)
    return db_task

def delete_task(db: Session, db_task: Task) -> None:
    """
    Deletes a task from the database.
    """
    db.delete(db_task)
    db.commit()

def complete_task(db: Session, db_task: Task) -> Task:
    """
    Marks a task as completed and records execution duration.
    """
    db_task.completed = True
    db_task.status = "COMPLETED"
    if not db_task.actual_duration_minutes:
        db_task.actual_duration_minutes = db_task.estimated_duration_minutes
    db_task.updated_at = datetime.now()
    db.commit()
    db.refresh(db_task)
    return db_task

def reopen_task(db: Session, db_task: Task) -> Task:
    """
    Reopens a completed task.
    """
    db_task.completed = False
    db_task.status = "NOT_STARTED"
    db_task.updated_at = datetime.now()
    db.commit()
    db.refresh(db_task)
    return db_task
