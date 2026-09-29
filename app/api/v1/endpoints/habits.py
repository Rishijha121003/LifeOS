from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.habit import (
    HabitCreate, HabitUpdate, HabitResponse, HabitDetailResponse, HabitLogCreate, HabitLogResponse
)
from app.services.habit_service import (
    create_habit, get_habit, list_habits, update_habit, delete_habit, log_habit_completion, get_habit_stats
)

router = APIRouter()


@router.post("/", response_model=HabitResponse, status_code=status.HTTP_201_CREATED)
def create_new_habit(payload: HabitCreate, db: Session = Depends(get_db)):
    habit = create_habit(db, payload)
    stats = get_habit_stats(habit)
    res = HabitResponse.model_validate(habit)
    res.current_streak = stats.current_streak
    res.best_streak = stats.best_streak
    res.total_completions = stats.total_completions
    return res


@router.get("/", response_model=List[HabitResponse])
def get_all_habits(include_archived: bool = Query(False), db: Session = Depends(get_db)):
    habits = list_habits(db, include_archived=include_archived)
    results = []
    for h in habits:
        stats = get_habit_stats(h)
        item = HabitResponse.model_validate(h)
        item.current_streak = stats.current_streak
        item.best_streak = stats.best_streak
        item.total_completions = stats.total_completions
        results.append(item)
    return results


@router.get("/{habit_id}", response_model=HabitDetailResponse)
def get_habit_details(habit_id: int, db: Session = Depends(get_db)):
    habit = get_habit(db, habit_id)
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    stats = get_habit_stats(habit)
    return HabitDetailResponse(
        id=habit.id,
        title=habit.title,
        description=habit.description,
        frequency_type=habit.frequency_type,
        target_days_per_week=habit.target_days_per_week,
        priority=habit.priority,
        archived=habit.archived,
        created_at=habit.created_at,
        updated_at=habit.updated_at,
        current_streak=stats.current_streak,
        best_streak=stats.best_streak,
        total_completions=stats.total_completions,
        logs=[HabitLogResponse.model_validate(l) for l in habit.logs],
        stats=stats
    )


@router.patch("/{habit_id}", response_model=HabitResponse)
def update_existing_habit(habit_id: int, payload: HabitUpdate, db: Session = Depends(get_db)):
    habit = get_habit(db, habit_id)
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    updated = update_habit(db, habit, payload)
    stats = get_habit_stats(updated)
    res = HabitResponse.model_validate(updated)
    res.current_streak = stats.current_streak
    res.best_streak = stats.best_streak
    res.total_completions = stats.total_completions
    return res


@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_habit(habit_id: int, db: Session = Depends(get_db)):
    habit = get_habit(db, habit_id)
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    delete_habit(db, habit)


@router.post("/{habit_id}/log", response_model=HabitLogResponse, status_code=status.HTTP_201_CREATED)
def log_completion(habit_id: int, payload: HabitLogCreate, db: Session = Depends(get_db)):
    habit = get_habit(db, habit_id)
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    log = log_habit_completion(db, habit_id, payload.completed_date)
    return log
