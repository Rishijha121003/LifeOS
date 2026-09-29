from datetime import date
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_, and_

from app.models.daily_review import DailyReview
from app.models.task import Task
from app.schemas.daily_review import DailyReviewCreate, DailyReviewUpdate


def _to_date_str(val) -> str:
    if val is None:
        return ""
    if isinstance(val, date):
        return val.isoformat()
    return str(val).split("T")[0]


def get_actual_daily_task_stats(db: Session, review_date: date) -> Tuple[int, int]:
    """
    Deterministically computes actual completed and rescheduled task counts for review_date from DB.
    """
    rev_str = review_date.isoformat() if isinstance(review_date, date) else str(review_date)
    all_tasks = db.scalars(select(Task)).all()
    completed_count = 0
    rescheduled_count = 0

    for t in all_tasks:
        due_str = _to_date_str(t.due_date)
        resched_str = _to_date_str(t.rescheduled_from_date)
        updated_str = _to_date_str(t.updated_at.date() if t.updated_at else None)

        # Completed tasks for review_date
        if t.completed and (due_str == rev_str or updated_str == rev_str):
            completed_count += 1

        # Rescheduled tasks from review_date
        if resched_str == rev_str or (t.rescheduled_count > 0 and updated_str == rev_str):
            rescheduled_count += 1

    return completed_count, rescheduled_count


def create_or_update_daily_review(db: Session, payload: DailyReviewCreate) -> DailyReview:
    completed_count, rescheduled_count = get_actual_daily_task_stats(db, payload.review_date)

    stmt = select(DailyReview).where(DailyReview.review_date == payload.review_date)
    review = db.scalars(stmt).first()

    if review:
        review.productivity_rating = payload.productivity_rating
        review.notes = payload.notes
        review.completed_tasks_count = completed_count
        review.rescheduled_tasks_count = rescheduled_count
    else:
        review = DailyReview(
            review_date=payload.review_date,
            productivity_rating=payload.productivity_rating,
            notes=payload.notes,
            completed_tasks_count=completed_count,
            rescheduled_tasks_count=rescheduled_count
        )
        db.add(review)

    db.commit()
    db.refresh(review)
    return review


def get_daily_review_by_date(db: Session, review_date: date) -> Optional[DailyReview]:
    stmt = select(DailyReview).where(DailyReview.review_date == review_date)
    return db.scalars(stmt).first()


def list_daily_reviews(db: Session, limit: int = 30) -> List[DailyReview]:
    stmt = select(DailyReview).order_by(DailyReview.review_date.desc()).limit(limit)
    return list(db.scalars(stmt).all())


def update_daily_review(db: Session, review: DailyReview, payload: DailyReviewUpdate) -> DailyReview:
    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(review, field, val)

    # Re-sync actual stats
    c_count, r_count = get_actual_daily_task_stats(db, review.review_date)
    review.completed_tasks_count = c_count
    review.rescheduled_tasks_count = r_count

    db.commit()
    db.refresh(review)
    return review
