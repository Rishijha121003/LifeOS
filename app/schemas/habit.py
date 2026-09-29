from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class HabitBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    frequency_type: str = Field("daily", description="'daily' or 'weekly'")
    target_days_per_week: int = Field(7, ge=1, le=7)
    priority: str = Field("medium", description="'low', 'medium', or 'high'")

class HabitCreate(HabitBase):
    pass

class HabitUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    frequency_type: Optional[str] = None
    target_days_per_week: Optional[int] = Field(None, ge=1, le=7)
    priority: Optional[str] = None
    archived: Optional[bool] = None

class HabitLogCreate(BaseModel):
    completed_date: date

class HabitLogResponse(BaseModel):
    id: int
    habit_id: int
    completed_date: date
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class HabitStats(BaseModel):
    current_streak: int
    best_streak: int
    total_completions: int
    completion_rate_30_days: float

class HabitResponse(HabitBase):
    id: int
    archived: bool
    created_at: datetime
    updated_at: datetime
    current_streak: int = 0
    best_streak: int = 0
    total_completions: int = 0
    model_config = ConfigDict(from_attributes=True)

class HabitDetailResponse(HabitResponse):
    logs: List[HabitLogResponse] = []
    stats: HabitStats
