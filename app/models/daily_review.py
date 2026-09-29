from datetime import date, datetime
from typing import Optional
from sqlalchemy import Text, Date, Integer, DateTime, CheckConstraint, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class DailyReview(Base):
    __tablename__ = "daily_reviews"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, index=True)
    review_date: Mapped[date] = mapped_column(Date, unique=True, nullable=False, index=True)
    productivity_rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    completed_tasks_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    rescheduled_tasks_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        CheckConstraint(
            "productivity_rating IS NULL OR (productivity_rating >= 1 AND productivity_rating <= 5)",
            name="check_productivity_rating_range"
        ),
    )
