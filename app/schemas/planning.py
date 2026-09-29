from datetime import date as dt_date, time as dt_time
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
from app.models.task import PriorityEnum

class TaskRecommendation(BaseModel):
    id: int
    title: str
    priority: PriorityEnum
    estimated_duration_minutes: int
    due_time: Optional[dt_time] = None
    reason: str
    score: float

class ReplanSuggestion(BaseModel):
    current_time: str
    day_end_time: str
    available_minutes: int
    summary: str
    do_now: List[TaskRecommendation]
    move_to_tomorrow: List[TaskRecommendation]

class ApplyPlanRequest(BaseModel):
    reschedule_task_ids: List[int] = Field(..., description="List of task IDs to reschedule")
    target_date: dt_date = Field(..., description="Target date to move tasks to (YYYY-MM-DD)")


    @field_validator("reschedule_task_ids")
    @classmethod
    def validate_task_ids(cls, v: List[int]) -> List[int]:
        if not v:
            raise ValueError("reschedule_task_ids cannot be empty")
        return v

class ApplyPlanResponse(BaseModel):
    status: str = "success"
    updated_count: int

# ==================== Routine Planner Schemas ====================

class FixedCommitment(BaseModel):
    id: Optional[str] = None
    title: str = Field(..., min_length=1, description="Commitment title (e.g. College, Meeting, Travel)")
    start_time: str = Field(..., pattern=r"^\d{2}:\d{2}$", description="Start time in HH:MM format")
    end_time: str = Field(..., pattern=r"^\d{2}:\d{2}$", description="End time in HH:MM format")

class ProposedTimelineItem(BaseModel):
    id: str
    item_type: str = Field(..., description="'task' | 'commitment' | 'break'")
    title: str
    start_time: str
    end_time: str
    duration_minutes: int
    task_id: Optional[int] = None
    priority: Optional[PriorityEnum] = None
    goal_title: Optional[str] = None
    milestone_title: Optional[str] = None
    deadline: Optional[str] = None
    is_deadline_risk: bool = False

class UnscheduledTaskItem(BaseModel):
    task_id: int
    title: str
    estimated_duration_minutes: int
    priority: PriorityEnum
    deadline: Optional[str] = None
    reason: str
    is_deadline_risk: bool = False

class RoutinePlanProposalRequest(BaseModel):
    date: dt_date = Field(..., description="Planning target date")
    day_start_time: str = Field("07:00", pattern=r"^\d{2}:\d{2}$", description="Day start time (HH:MM)")
    day_end_time: str = Field("22:00", pattern=r"^\d{2}:\d{2}$", description="Day end time (HH:MM)")
    fixed_commitments: List[FixedCommitment] = Field(default_factory=list, description="Fixed commitments/unavailable blocks")
    selected_task_ids: List[int] = Field(..., description="List of candidate task IDs to schedule")

    @field_validator("selected_task_ids")
    @classmethod
    def validate_task_ids(cls, v: List[int]) -> List[int]:
        if not v:
            raise ValueError("Select at least one task.")
        return v

class RoutinePlanProposalResponse(BaseModel):
    date: str
    day_start_time: str
    day_end_time: str
    total_day_minutes: int
    commitments_minutes: int
    breaks_minutes: int
    available_capacity_minutes: int
    selected_workload_minutes: int
    scheduled_workload_minutes: int
    unscheduled_workload_minutes: int
    is_overloaded: bool
    overload_minutes: int
    capacity_status: str  # "enough" | "tight" | "overloaded"
    summary: str
    timeline: List[ProposedTimelineItem]
    unscheduled_tasks: List[UnscheduledTaskItem]

class UnscheduledDispositionItem(BaseModel):
    task_id: int
    action: str = Field(..., description="'move_tomorrow' | 'move_date' | 'backlog' | 'overtime' | 'keep_as_is'")
    target_date: Optional[dt_date] = None
    target_time: Optional[str] = None

class AcceptRoutinePlanItem(BaseModel):
    task_id: int
    due_date: dt_date
    due_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")


class AcceptRoutinePlanRequest(BaseModel):
    plan_items: List[AcceptRoutinePlanItem] = Field(default_factory=list, description="List of task scheduling items to commit")
    unscheduled_dispositions: Optional[List[UnscheduledDispositionItem]] = Field(default_factory=list, description="Dispositions for unscheduled tasks")

    @field_validator("plan_items")
    @classmethod
    def validate_plan_items(cls, v: List[AcceptRoutinePlanItem]) -> List[AcceptRoutinePlanItem]:
        return v

class AcceptRoutinePlanResponse(BaseModel):
    status: str = "success"
    updated_count: int
    message: str


