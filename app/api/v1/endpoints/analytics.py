from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.analytics import AnalyticsSummaryResponse
from app.services.analytics_service import compute_analytics_summary

router = APIRouter()


@router.get("/summary", response_model=AnalyticsSummaryResponse)
def get_productivity_analytics_summary(
    reference_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    return compute_analytics_summary(db, reference_date=reference_date)
