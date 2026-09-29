from datetime import date
from typing import List, Dict, Optional, Union
from pydantic import BaseModel, Field

class ProductivityInsight(BaseModel):
    id: str
    type: str  # 'warning', 'info', 'positive'
    title: str
    explanation: str
    supporting_data: Dict[str, Union[str, int, float]]

class CompletionRateStats(BaseModel):
    rate_7_days: float
    rate_30_days: float
    total_completed_7_days: int
    total_scheduled_7_days: int
    total_completed_30_days: int
    total_scheduled_30_days: int

class PriorityDistribution(BaseModel):
    high_completed: int
    high_pending: int
    medium_completed: int
    medium_pending: int
    low_completed: int
    low_pending: int

class WorkloadVsCapacityStats(BaseModel):
    estimated_workload_minutes_today: int
    available_capacity_minutes_today: int
    capacity_variance_minutes: int

class PlanningAccuracyStats(BaseModel):
    tasks_analyzed: int = 0
    avg_variance_minutes: Optional[float] = None
    avg_underestimate_minutes: Optional[float] = None
    avg_overestimate_minutes: Optional[float] = None
    planned_minutes: Optional[int] = None
    actual_minutes: Optional[int] = None
    planning_vs_execution_gap_minutes: Optional[int] = None

class HabitConsistencyStats(BaseModel):
    total_habits: int = 0
    active_habits: int = 0
    average_current_streak: float = 0.0
    overall_30_day_completion_rate: float = 0.0

class GoalProgressSummary(BaseModel):
    total_goals: int = 0
    active_goals: int = 0
    completed_goals: int = 0
    average_goal_progress_percentage: float = 0.0

class PlanningBehaviorStats(BaseModel):
    rescheduled_tasks_count: int = 0
    missed_tasks_count: int = 0
    skipped_tasks_count: int = 0
    repeat_rescheduled_count: int = 0
    avg_reschedules_per_task: float = 0.0

class AnalyticsSummaryResponse(BaseModel):
    reference_date: date
    completion_rates: CompletionRateStats
    priority_distribution: PriorityDistribution
    workload_vs_capacity: WorkloadVsCapacityStats
    planning_accuracy: Optional[PlanningAccuracyStats] = None
    planning_behavior: Optional[PlanningBehaviorStats] = None
    habit_consistency: Optional[HabitConsistencyStats] = None
    goal_progress: Optional[GoalProgressSummary] = None
    insights: List[ProductivityInsight]
