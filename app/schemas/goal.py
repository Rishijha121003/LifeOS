from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class GoalMilestoneBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    due_date: Optional[date] = None
    order_index: int = 0
    status: str = Field("NOT_STARTED", description="'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'")

class GoalMilestoneCreate(GoalMilestoneBase):
    pass

class GoalMilestoneUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    completed: Optional[bool] = None
    status: Optional[str] = None
    due_date: Optional[date] = None
    order_index: Optional[int] = None

class GoalMilestoneResponse(GoalMilestoneBase):
    id: int
    goal_id: int
    completed: bool
    status: str = "NOT_STARTED"
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class GoalBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: str = Field("General", max_length=50)
    target_date: Optional[date] = None
    status: str = Field("active", description="'active', 'completed', 'archived'")

class GoalCreate(GoalBase):
    milestones: Optional[List[GoalMilestoneCreate]] = None

class GoalUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = None
    target_date: Optional[date] = None
    status: Optional[str] = None

class TaskShortResponse(BaseModel):
    id: int
    title: str
    priority: str
    completed: bool
    due_date: Optional[date] = None
    model_config = ConfigDict(from_attributes=True)

class GoalResponse(GoalBase):
    id: int
    created_at: datetime
    updated_at: datetime
    progress_percentage: float = 0.0
    model_config = ConfigDict(from_attributes=True)

class GoalDetailResponse(GoalResponse):
    milestones: List[GoalMilestoneResponse] = []
    tasks: List[TaskShortResponse] = []
