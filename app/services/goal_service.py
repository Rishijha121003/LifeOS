from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.goal import Goal, GoalMilestone
from app.models.task import Task
from app.schemas.goal import GoalCreate, GoalUpdate, GoalMilestoneCreate, GoalMilestoneUpdate


def calculate_goal_progress(goal: Goal) -> float:
    """
    Calculates goal progress strictly according to hierarchy:
    - Tasks contribute to Milestones.
    - Milestones determine Goal progress.
    - If no milestones exist, direct tasks determine goal progress.
    """
    if goal.milestones and len(goal.milestones) > 0:
        milestone_scores = []
        for m in goal.milestones:
            if m.completed or m.status == "COMPLETED":
                milestone_scores.append(1.0)
            elif m.tasks and len(m.tasks) > 0:
                completed_tasks = sum(1 for t in m.tasks if t.completed)
                milestone_scores.append(completed_tasks / float(len(m.tasks)))
            else:
                milestone_scores.append(0.0)
        return round((sum(milestone_scores) / float(len(goal.milestones))) * 100.0, 2)
    elif goal.tasks and len(goal.tasks) > 0:
        completed_tasks = sum(1 for t in goal.tasks if t.completed)
        return round((completed_tasks / float(len(goal.tasks))) * 100.0, 2)
    return 0.0


def create_goal(db: Session, payload: GoalCreate) -> Goal:
    goal = Goal(
        title=payload.title,
        description=payload.description,
        category=payload.category,
        target_date=payload.target_date,
        status=payload.status,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)

    if payload.milestones:
        for m in payload.milestones:
            ms = GoalMilestone(
                goal_id=goal.id,
                title=m.title,
                due_date=m.due_date,
                order_index=m.order_index
            )
            db.add(ms)
        db.commit()
        db.refresh(goal)

    return goal


def get_goal(db: Session, goal_id: int) -> Optional[Goal]:
    return db.get(Goal, goal_id)


def list_goals(db: Session, category: Optional[str] = None, status: Optional[str] = None) -> List[Goal]:
    stmt = select(Goal)
    if category:
        stmt = stmt.where(Goal.category == category)
    if status:
        stmt = stmt.where(Goal.status == status)
    stmt = stmt.order_by(Goal.id)
    return list(db.scalars(stmt).all())


def update_goal(db: Session, goal: Goal, payload: GoalUpdate) -> Goal:
    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(goal, field, val)
    db.commit()
    db.refresh(goal)
    return goal


def delete_goal(db: Session, goal: Goal) -> None:
    db.delete(goal)
    db.commit()


def add_milestone(db: Session, goal_id: int, payload: GoalMilestoneCreate) -> GoalMilestone:
    ms = GoalMilestone(
        goal_id=goal_id,
        title=payload.title,
        due_date=payload.due_date,
        order_index=payload.order_index
    )
    db.add(ms)
    db.commit()
    db.refresh(ms)
    return ms


def update_milestone(db: Session, milestone: GoalMilestone, payload: GoalMilestoneUpdate) -> GoalMilestone:
    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(milestone, field, val)
    db.commit()
    db.refresh(milestone)
    return milestone


def delete_milestone(db: Session, milestone: GoalMilestone) -> None:
    db.delete(milestone)
    db.commit()


def link_task_to_goal(db: Session, task: Task, goal_id: int) -> Task:
    task.goal_id = goal_id
    db.commit()
    db.refresh(task)
    return task


def unlink_task_from_goal(db: Session, task: Task) -> Task:
    task.goal_id = None
    db.commit()
    db.refresh(task)
    return task
