from datetime import date, timedelta
from typing import List, Optional, Tuple, Dict
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.habit import Habit, HabitLog
from app.schemas.habit import HabitCreate, HabitUpdate, HabitStats


def calculate_habit_streaks(completed_dates: List[date], reference_date: Optional[date] = None) -> Tuple[int, int]:
    """
    Calculates current_streak and best_streak deterministically from a list of completed dates.
    reference_date defaults to date.today().
    """
    if not completed_dates:
        return 0, 0

    unique_dates = sorted(set(completed_dates))
    ref_date = reference_date if reference_date else date.today()

    # Calculate Best Streak
    best_streak = 0
    curr_run = 0
    prev_date: Optional[date] = None

    for d in unique_dates:
        if prev_date is None or d == prev_date + timedelta(days=1):
            curr_run += 1
        else:
            curr_run = 1
        if curr_run > best_streak:
            best_streak = curr_run
        prev_date = d

    # Calculate Current Streak relative to ref_date (or ref_date - 1)
    current_streak = 0
    date_set = set(unique_dates)

    start_date = ref_date
    if start_date not in date_set:
        start_date = ref_date - timedelta(days=1)

    if start_date in date_set:
        check = start_date
        while check in date_set:
            current_streak += 1
            check -= timedelta(days=1)

    return current_streak, best_streak


def calculate_30_day_completion_rate(completed_dates: List[date], reference_date: Optional[date] = None) -> float:
    if not completed_dates:
        return 0.0
    ref_date = reference_date if reference_date else date.today()
    cutoff_date = ref_date - timedelta(days=29)
    valid_completions = sum(1 for d in set(completed_dates) if cutoff_date <= d <= ref_date)
    return round((valid_completions / 30.0) * 100.0, 2)


def create_habit(db: Session, payload: HabitCreate) -> Habit:
    habit = Habit(
        title=payload.title,
        description=payload.description,
        frequency_type=payload.frequency_type,
        target_days_per_week=payload.target_days_per_week,
        priority=payload.priority,
    )
    db.add(habit)
    db.commit()
    db.refresh(habit)
    return habit


def get_habit(db: Session, habit_id: int) -> Optional[Habit]:
    return db.get(Habit, habit_id)


def list_habits(db: Session, include_archived: bool = False) -> List[Habit]:
    stmt = select(Habit)
    if not include_archived:
        stmt = stmt.where(Habit.archived == False)
    stmt = stmt.order_by(Habit.id)
    return list(db.scalars(stmt).all())


def update_habit(db: Session, habit: Habit, payload: HabitUpdate) -> Habit:
    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(habit, field, val)
    db.commit()
    db.refresh(habit)
    return habit


def delete_habit(db: Session, habit: Habit) -> None:
    db.delete(habit)
    db.commit()


def log_habit_completion(db: Session, habit_id: int, completed_date: date) -> HabitLog:
    # Check duplicate
    stmt = select(HabitLog).where(
        HabitLog.habit_id == habit_id,
        HabitLog.completed_date == completed_date
    )
    existing = db.scalars(stmt).first()
    if existing:
        return existing

    log = HabitLog(habit_id=habit_id, completed_date=completed_date)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def get_habit_stats(habit: Habit, reference_date: Optional[date] = None) -> HabitStats:
    completed_dates = [log.completed_date for log in habit.logs]
    current_streak, best_streak = calculate_habit_streaks(completed_dates, reference_date)
    rate = calculate_30_day_completion_rate(completed_dates, reference_date)
    return HabitStats(
        current_streak=current_streak,
        best_streak=best_streak,
        total_completions=len(completed_dates),
        completion_rate_30_days=rate
    )
