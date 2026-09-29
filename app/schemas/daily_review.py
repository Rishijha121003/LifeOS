from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class DailyReviewCreate(BaseModel):
    review_date: date
    productivity_rating: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None

class DailyReviewUpdate(BaseModel):
    productivity_rating: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None

class DailyReviewResponse(BaseModel):
    id: int
    review_date: date
    productivity_rating: Optional[int] = None
    notes: Optional[str] = None
    completed_tasks_count: int = 0
    rescheduled_tasks_count: int = 0
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class DailyReviewSummaryResponse(BaseModel):
    review_date: date
    existing_review: Optional[DailyReviewResponse] = None
    actual_completed_tasks_count: int = 0
    actual_rescheduled_tasks_count: int = 0
