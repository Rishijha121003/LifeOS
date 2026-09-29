from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.daily_review import (
    DailyReviewCreate, DailyReviewUpdate, DailyReviewResponse, DailyReviewSummaryResponse
)
from app.services.daily_review_service import (
    create_or_update_daily_review, get_daily_review_by_date, list_daily_reviews,
    update_daily_review, get_actual_daily_task_stats
)

router = APIRouter()


@router.post("/", response_model=DailyReviewResponse, status_code=status.HTTP_201_CREATED)
def submit_daily_review(payload: DailyReviewCreate, db: Session = Depends(get_db)):
    review = create_or_update_daily_review(db, payload)
    return review


@router.get("/", response_model=List[DailyReviewResponse])
def get_reviews_history(limit: int = Query(30, ge=1, le=365), db: Session = Depends(get_db)):
    return list_daily_reviews(db, limit=limit)


@router.get("/summary", response_model=DailyReviewSummaryResponse)
def get_daily_review_summary(target_date: Optional[date] = Query(None), db: Session = Depends(get_db)):
    ref_date = target_date if target_date else date.today()
    existing = get_daily_review_by_date(db, ref_date)
    c_count, r_count = get_actual_daily_task_stats(db, ref_date)
    
    return DailyReviewSummaryResponse(
        review_date=ref_date,
        existing_review=DailyReviewResponse.model_validate(existing) if existing else None,
        actual_completed_tasks_count=c_count,
        actual_rescheduled_tasks_count=r_count
    )


@router.get("/{review_date}", response_model=DailyReviewResponse)
def get_review_for_date(review_date: date, db: Session = Depends(get_db)):
    review = get_daily_review_by_date(db, review_date)
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Daily review not found for date")
    return review


@router.patch("/{review_date}", response_model=DailyReviewResponse)
def update_review_for_date(review_date: date, payload: DailyReviewUpdate, db: Session = Depends(get_db)):
    review = get_daily_review_by_date(db, review_date)
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Daily review not found for date")
    updated = update_daily_review(db, review, payload)
    return updated
