import enum
from datetime import date, time, datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Text, Date, Time, Boolean, DateTime, Enum, Integer, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.goal import Goal

class PriorityEnum(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True, index=True)
    due_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    priority: Mapped[PriorityEnum] = mapped_column(
        Enum(PriorityEnum, name="priority_enum", values_callable=lambda x: [e.value for e in x]),
        default=PriorityEnum.MEDIUM,
        nullable=False,
        index=True
    )
    completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), default="NOT_STARTED", nullable=False)
    
    # V0.2 Smart Planning & Execution Fields
    estimated_duration_minutes: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    actual_duration_minutes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    rescheduled_from_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    rescheduled_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # V0.3 Goal & Milestone Relationship
    goal_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("goals.id", ondelete="SET NULL"), nullable=True, index=True
    )
    goal: Mapped[Optional["Goal"]] = relationship("Goal", back_populates="tasks")

    milestone_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("goal_milestones.id", ondelete="SET NULL"), nullable=True, index=True
    )
    milestone: Mapped[Optional["GoalMilestone"]] = relationship("GoalMilestone", back_populates="tasks")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
