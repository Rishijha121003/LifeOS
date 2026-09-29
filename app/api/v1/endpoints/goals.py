from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.task import Task
from app.models.goal import GoalMilestone
from app.schemas.goal import (
    GoalCreate, GoalUpdate, GoalResponse, GoalDetailResponse,
    GoalMilestoneCreate, GoalMilestoneUpdate, GoalMilestoneResponse
)
from app.schemas.task import TaskResponse
from app.services.goal_service import (
    create_goal, get_goal, list_goals, update_goal, delete_goal,
    add_milestone, update_milestone, delete_milestone,
    link_task_to_goal, unlink_task_from_goal, calculate_goal_progress
)

router = APIRouter()


@router.post("/", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
def create_new_goal(payload: GoalCreate, db: Session = Depends(get_db)):
    goal = create_goal(db, payload)
    res = GoalResponse.model_validate(goal)
    res.progress_percentage = calculate_goal_progress(goal)
    return res


@router.get("/", response_model=List[GoalResponse])
def get_all_goals(
    category: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    goals = list_goals(db, category=category, status=status_filter)
    results = []
    for g in goals:
        item = GoalResponse.model_validate(g)
        item.progress_percentage = calculate_goal_progress(g)
        results.append(item)
    return results


@router.get("/{goal_id}", response_model=GoalDetailResponse)
def get_goal_details(goal_id: int, db: Session = Depends(get_db)):
    goal = get_goal(db, goal_id)
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    res = GoalDetailResponse.model_validate(goal)
    res.progress_percentage = calculate_goal_progress(goal)
    return res


@router.patch("/{goal_id}", response_model=GoalResponse)
def update_existing_goal(goal_id: int, payload: GoalUpdate, db: Session = Depends(get_db)):
    goal = get_goal(db, goal_id)
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    updated = update_goal(db, goal, payload)
    res = GoalResponse.model_validate(updated)
    res.progress_percentage = calculate_goal_progress(updated)
    return res


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_goal(goal_id: int, db: Session = Depends(get_db)):
    goal = get_goal(db, goal_id)
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    delete_goal(db, goal)


@router.post("/{goal_id}/milestones", response_model=GoalMilestoneResponse, status_code=status.HTTP_201_CREATED)
def create_goal_milestone(goal_id: int, payload: GoalMilestoneCreate, db: Session = Depends(get_db)):
    goal = get_goal(db, goal_id)
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    ms = add_milestone(db, goal_id, payload)
    return ms


@router.patch("/milestones/{milestone_id}", response_model=GoalMilestoneResponse)
def update_goal_milestone(milestone_id: int, payload: GoalMilestoneUpdate, db: Session = Depends(get_db)):
    ms = db.get(GoalMilestone, milestone_id)
    if not ms:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found")
    updated = update_milestone(db, ms, payload)
    return updated


@router.delete("/milestones/{milestone_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_goal_milestone(milestone_id: int, db: Session = Depends(get_db)):
    ms = db.get(GoalMilestone, milestone_id)
    if not ms:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found")
    delete_milestone(db, ms)


@router.post("/{goal_id}/tasks/{task_id}/link", response_model=TaskResponse)
def link_task(goal_id: int, task_id: int, db: Session = Depends(get_db)):
    goal = get_goal(db, goal_id)
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    linked_task = link_task_to_goal(db, task, goal_id)
    return linked_task


@router.post("/tasks/{task_id}/unlink", response_model=TaskResponse)
def unlink_task(task_id: int, db: Session = Depends(get_db)):
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    unlinked_task = unlink_task_from_goal(db, task)
    return unlinked_task
