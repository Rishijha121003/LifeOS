from datetime import date, time, datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict
from app.models.task import PriorityEnum

class TaskBase(BaseModel):
    title: str = Field(..., description="Title of the task")
    description: Optional[str] = Field(None, description="Detailed task description")
    due_date: Optional[date] = Field(None, description="Due date (YYYY-MM-DD)")
    due_time: Optional[time] = Field(None, description="Due time (HH:MM:SS)")
    priority: PriorityEnum = Field(default=PriorityEnum.MEDIUM, description="Priority level")
    status: str = Field(default="NOT_STARTED", description="Execution status: NOT_STARTED, IN_PROGRESS, COMPLETED, SKIPPED, MISSED")
    estimated_duration_minutes: int = Field(default=30, ge=1, le=1440, description="Estimated task duration in minutes")
    actual_duration_minutes: int = Field(default=0, ge=0, description="Actual focused duration in minutes")
    goal_id: Optional[int] = Field(None, description="ID of linked goal")
    milestone_id: Optional[int] = Field(None, description="ID of linked milestone")

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Task title cannot be empty or whitespace only")
        return v.strip()

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None
    due_time: Optional[time] = None
    priority: Optional[PriorityEnum] = None
    completed: Optional[bool] = None
    status: Optional[str] = None
    estimated_duration_minutes: Optional[int] = Field(None, ge=1, le=1440)
    actual_duration_minutes: Optional[int] = Field(None, ge=0)
    rescheduled_from_date: Optional[date] = None
    rescheduled_count: Optional[int] = None
    goal_id: Optional[int] = None
    milestone_id: Optional[int] = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if not v or not v.strip():
                raise ValueError("Task title cannot be empty or whitespace only")
            return v.strip()
        return v

class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    due_date: Optional[date] = None
    due_time: Optional[time] = None
    priority: PriorityEnum
    completed: bool
    status: str = "NOT_STARTED"
    estimated_duration_minutes: int = 30
    actual_duration_minutes: int = 0
    rescheduled_from_date: Optional[date] = None
    rescheduled_count: int = 0
    goal_id: Optional[int] = None
    milestone_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
