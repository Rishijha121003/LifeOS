from datetime import date
import pytest
from sqlalchemy.exc import IntegrityError
from app.models.task import Task, PriorityEnum
from app.models.habit import Habit, HabitLog
from app.models.goal import Goal, GoalMilestone
from app.models.daily_review import DailyReview


def test_habit_and_log_creation_and_cascade(db_session):
    # Create Habit
    habit = Habit(
        title="Daily Reading",
        description="Read 20 pages of tech books",
        frequency_type="daily",
        target_days_per_week=7,
        priority="high"
    )
    db_session.add(habit)
    db_session.commit()
    db_session.refresh(habit)

    assert habit.id is not None
    assert habit.archived is False
    assert habit.target_days_per_week == 7

    # Create HabitLog
    today = date(2026, 8, 21)
    log = HabitLog(habit_id=habit.id, completed_date=today)
    db_session.add(log)
    db_session.commit()
    db_session.refresh(log)

    assert log.id is not None
    assert log.habit_id == habit.id
    assert log.completed_date == today

    # Verify duplicate date log raises IntegrityError
    duplicate_log = HabitLog(habit_id=habit.id, completed_date=today)
    db_session.add(duplicate_log)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

    # Verify Cascade Delete
    db_session.delete(habit)
    db_session.commit()
    assert db_session.query(HabitLog).filter(HabitLog.habit_id == habit.id).first() is None


def test_goal_milestone_and_task_linking(db_session):
    # Create Goal
    goal = Goal(
        title="Master Distributed Systems",
        description="Deep dive into consensus algorithms and replication",
        category="Career",
        target_date=date(2026, 12, 31),
        status="active"
    )
    db_session.add(goal)
    db_session.commit()
    db_session.refresh(goal)

    assert goal.id is not None
    assert goal.status == "active"

    # Add Milestone
    ms = GoalMilestone(
        goal_id=goal.id,
        title="Read Raft Paper",
        completed=False,
        order_index=1
    )
    db_session.add(ms)

    # Link Task to Goal
    task = Task(
        title="Implement Raft Leader Election",
        priority=PriorityEnum.HIGH,
        due_date=date(2026, 9, 1),
        estimated_duration_minutes=90,
        goal_id=goal.id
    )
    db_session.add(task)
    db_session.commit()
    db_session.refresh(task)

    assert task.goal_id == goal.id
    assert task.goal.title == "Master Distributed Systems"
    assert len(goal.tasks) == 1
    assert goal.tasks[0].title == "Implement Raft Leader Election"


def test_daily_review_creation(db_session):
    review = DailyReview(
        review_date=date(2026, 8, 21),
        productivity_rating=5,
        notes="Productive day! Completed all high-priority tasks.",
        completed_tasks_count=4,
        rescheduled_tasks_count=1
    )
    db_session.add(review)
    db_session.commit()
    db_session.refresh(review)

    assert review.id is not None
    assert review.productivity_rating == 5
    assert review.completed_tasks_count == 4
    assert review.rescheduled_tasks_count == 1


def test_existing_task_without_goal_backward_compatibility(db_session):
    # Create standard V0.1/V0.2 task without goal_id
    task = Task(
        title="Stand-alone V0.1 Task",
        priority=PriorityEnum.MEDIUM
    )
    db_session.add(task)
    db_session.commit()
    db_session.refresh(task)

    assert task.id is not None
    assert task.goal_id is None
    assert task.goal is None
