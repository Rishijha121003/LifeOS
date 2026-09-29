from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select

from app.db.session import get_db
from app.models.task import Task
from app.schemas.planning import (
    ReplanSuggestion,
    ApplyPlanRequest,
    ApplyPlanResponse,
    RoutinePlanProposalRequest,
    RoutinePlanProposalResponse,
    AcceptRoutinePlanRequest,
    AcceptRoutinePlanResponse,
)
from app.services.planning_service import (
    get_day_end_time_setting,
    get_day_start_time_setting,
    generate_replan_suggestion,
    apply_replan_plan,
    generate_routine_plan_proposal,
    apply_routine_plan,
)

router = APIRouter()

@router.get(
    "/suggest",
    response_model=ReplanSuggestion,
    status_code=status.HTTP_200_OK,
    summary="Get smart replanning suggestions",
    description="Calculates a recommended daily plan for today's incomplete tasks without modifying the database."
)
def get_planning_suggestion(
    target_end_time: Optional[str] = Query(None, description="Optional override for day_end_time (HH:MM)"),
    current_time: Optional[str] = Query(None, description="Optional override for current local time (HH:MM)"),
    current_date: Optional[str] = Query(None, description="Optional override for current local date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
) -> ReplanSuggestion:
    now = datetime.now()
    curr_time_str = current_time if current_time else now.strftime("%H:%M")
    curr_date_str = current_date if current_date else now.strftime("%Y-%m-%d")
    
    day_end_time_str = target_end_time if target_end_time else get_day_end_time_setting(db)

    # Read-only task retrieval
    tasks = list(db.scalars(select(Task)).all())

    return generate_replan_suggestion(
        tasks=tasks,
        current_time_str=curr_time_str,
        today_date_str=curr_date_str,
        day_end_time_str=day_end_time_str
    )

@router.post(
    "/apply",
    response_model=ApplyPlanResponse,
    status_code=status.HTTP_200_OK,
    summary="Apply user-approved rescheduling plan",
    description="Transactionally moves approved tasks to target_date, updating rescheduled_from_date and rescheduled_count."
)
def apply_planning_plan(
    payload: ApplyPlanRequest,
    db: Session = Depends(get_db)
) -> ApplyPlanResponse:
    count = apply_replan_plan(
        db=db,
        reschedule_task_ids=payload.reschedule_task_ids,
        target_date=payload.target_date
    )
    return ApplyPlanResponse(status="success", updated_count=count)

# ==================== Routine Planner Endpoints ====================

@router.get(
    "/routine/settings",
    summary="Get user day boundary settings for routine planning",
    status_code=status.HTTP_200_OK
)
def get_routine_planning_settings(
    db: Session = Depends(get_db)
):
    return {
        "day_start_time": get_day_start_time_setting(db),
        "day_end_time": get_day_end_time_setting(db)
    }

@router.post(
    "/routine/propose",
    response_model=RoutinePlanProposalResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate deterministic routine plan proposal",
    description="Generates a realistic daily plan from available time, commitments, and candidate tasks without mutating the database."
)
def propose_routine_plan(
    payload: RoutinePlanProposalRequest,
    db: Session = Depends(get_db)
) -> RoutinePlanProposalResponse:
    # Read-only task retrieval with goal & milestone
    stmt = (
        select(Task)
        .options(selectinload(Task.goal), selectinload(Task.milestone))
        .where(Task.id.in_(payload.selected_task_ids))
    )
    tasks = list(db.scalars(stmt).all())

    proposal = generate_routine_plan_proposal(
        tasks=tasks,
        target_date=payload.date,
        day_start_time_str=payload.day_start_time,
        day_end_time_str=payload.day_end_time,
        fixed_commitments=[c.model_dump() for c in payload.fixed_commitments]
    )

    return RoutinePlanProposalResponse(**proposal)

@router.post(
    "/routine/accept",
    response_model=AcceptRoutinePlanResponse,
    status_code=status.HTTP_200_OK,
    summary="Accept and persist routine plan",
    description="Persists scheduled time and date to tasks in the database while preserving IDs, goals, milestones, and metadata."
)
def accept_routine_plan_endpoint(
    payload: AcceptRoutinePlanRequest,
    db: Session = Depends(get_db)
) -> AcceptRoutinePlanResponse:
    count = apply_routine_plan(
        db=db,
        plan_items=payload.plan_items,
        unscheduled_dispositions=payload.unscheduled_dispositions
    )
    return AcceptRoutinePlanResponse(
        status="success",
        updated_count=count,
        message=f"Successfully applied routine plan ({count} task(s) updated)."
    )

