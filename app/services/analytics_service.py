from datetime import date, timedelta, datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_

from app.models.task import Task, PriorityEnum
from app.models.habit import Habit
from app.models.goal import Goal
from app.models.daily_review import DailyReview
from app.schemas.analytics import (
    AnalyticsSummaryResponse, CompletionRateStats, PriorityDistribution,
    WorkloadVsCapacityStats, HabitConsistencyStats, GoalProgressSummary, ProductivityInsight,
    PlanningAccuracyStats, PlanningBehaviorStats
)
from app.services.habit_service import get_habit_stats
from app.services.goal_service import calculate_goal_progress
from app.services.planning_service import calculate_available_minutes, get_day_end_time_setting


def compute_analytics_summary(db: Session, reference_date: Optional[date] = None) -> AnalyticsSummaryResponse:
    ref_date = reference_date if reference_date else date.today()

    # 1. Completion Rates (7-day & 30-day)
    start_7 = ref_date - timedelta(days=6)
    start_30 = ref_date - timedelta(days=29)

    tasks_7 = list(db.scalars(select(Task).where(Task.due_date >= start_7, Task.due_date <= ref_date)).all())
    scheduled_7 = len(tasks_7)
    completed_7 = sum(1 for t in tasks_7 if t.completed)
    rate_7 = round((completed_7 / float(scheduled_7)) * 100.0, 2) if scheduled_7 > 0 else 0.0

    tasks_30 = list(db.scalars(select(Task).where(Task.due_date >= start_30, Task.due_date <= ref_date)).all())
    scheduled_30 = len(tasks_30)
    completed_30 = sum(1 for t in tasks_30 if t.completed)
    rate_30 = round((completed_30 / float(scheduled_30)) * 100.0, 2) if scheduled_30 > 0 else 0.0

    completion_rates = CompletionRateStats(
        rate_7_days=rate_7,
        rate_30_days=rate_30,
        total_completed_7_days=completed_7,
        total_scheduled_7_days=scheduled_7,
        total_completed_30_days=completed_30,
        total_scheduled_30_days=scheduled_30,
    )

    # 2. Priority Distribution
    all_tasks = list(db.scalars(select(Task)).all())
    p_dist = PriorityDistribution(
        high_completed=sum(1 for t in all_tasks if t.priority == PriorityEnum.HIGH and t.completed),
        high_pending=sum(1 for t in all_tasks if t.priority == PriorityEnum.HIGH and not t.completed),
        medium_completed=sum(1 for t in all_tasks if t.priority == PriorityEnum.MEDIUM and t.completed),
        medium_pending=sum(1 for t in all_tasks if t.priority == PriorityEnum.MEDIUM and not t.completed),
        low_completed=sum(1 for t in all_tasks if t.priority == PriorityEnum.LOW and t.completed),
        low_pending=sum(1 for t in all_tasks if t.priority == PriorityEnum.LOW and not t.completed),
    )

    # 3. Workload vs Capacity
    today_pending_tasks = list(db.scalars(
        select(Task).where(Task.due_date <= ref_date, Task.completed == False)
    ).all())
    workload_mins = sum(t.estimated_duration_minutes for t in today_pending_tasks)

    # Current time calculation for capacity
    curr_time_str = datetime.now().strftime("%H:%M")
    day_end_str = get_day_end_time_setting(db)
    avail_mins = calculate_available_minutes(curr_time_str, day_end_str)
    capacity_variance = avail_mins - workload_mins

    workload_vs_capacity = WorkloadVsCapacityStats(
        estimated_workload_minutes_today=workload_mins,
        available_capacity_minutes_today=avail_mins,
        capacity_variance_minutes=capacity_variance,
    )

    # 4. Habit Consistency
    habits = list(db.scalars(select(Habit)).all())
    active_habits = [h for h in habits if not h.archived]
    if active_habits:
        streaks = [get_habit_stats(h, ref_date).current_streak for h in active_habits]
        rates = [get_habit_stats(h, ref_date).completion_rate_30_days for h in active_habits]
        avg_streak = round(sum(streaks) / float(len(active_habits)), 1)
        avg_rate = round(sum(rates) / float(len(active_habits)), 2)
    else:
        avg_streak = 0.0
        avg_rate = 0.0

    habit_consistency = HabitConsistencyStats(
        total_habits=len(habits),
        active_habits=len(active_habits),
        average_current_streak=avg_streak,
        overall_30_day_completion_rate=avg_rate,
    )

    # 5. Goal Progress
    goals = list(db.scalars(select(Goal)).all())
    active_goals = [g for g in goals if g.status == "active"]
    completed_goals = [g for g in goals if g.status == "completed"]
    if active_goals:
        goal_progs = [calculate_goal_progress(g) for g in active_goals]
        avg_goal_prog = round(sum(goal_progs) / float(len(active_goals)), 2)
    else:
        avg_goal_prog = 0.0

    goal_progress = GoalProgressSummary(
        total_goals=len(goals),
        active_goals=len(active_goals),
        completed_goals=len(completed_goals),
        average_goal_progress_percentage=avg_goal_prog,
    )

    # 6. Planning Accuracy & Execution Gap (Across tasks with actual execution data)
    tasks_with_exec = [t for t in all_tasks if (t.actual_duration_minutes or 0) > 0]
    if tasks_with_exec:
        total_planned_exec = sum(t.estimated_duration_minutes or 30 for t in tasks_with_exec)
        total_actual_exec = sum(t.actual_duration_minutes for t in tasks_with_exec)
        gap = total_planned_exec - total_actual_exec
        variances = [abs(t.actual_duration_minutes - (t.estimated_duration_minutes or 30)) for t in tasks_with_exec]
        underestimates = [t.actual_duration_minutes - (t.estimated_duration_minutes or 30) for t in tasks_with_exec if t.actual_duration_minutes > (t.estimated_duration_minutes or 30)]
        overestimates = [(t.estimated_duration_minutes or 30) - t.actual_duration_minutes for t in tasks_with_exec if (t.estimated_duration_minutes or 30) > t.actual_duration_minutes]

        planning_accuracy = PlanningAccuracyStats(
            tasks_analyzed=len(tasks_with_exec),
            avg_variance_minutes=round(sum(variances) / float(len(tasks_with_exec)), 1),
            avg_underestimate_minutes=round(sum(underestimates) / float(len(underestimates)), 1) if underestimates else 0.0,
            avg_overestimate_minutes=round(sum(overestimates) / float(len(overestimates)), 1) if overestimates else 0.0,
            planned_minutes=total_planned_exec,
            actual_minutes=total_actual_exec,
            planning_vs_execution_gap_minutes=gap,
        )
    else:
        planning_accuracy = PlanningAccuracyStats()

    # 7. Planning Behavior (Rescheduled, Missed, Skipped)
    rescheduled_count = sum(1 for t in tasks_7 if (t.rescheduled_count or 0) > 0)
    missed_count = sum(1 for t in tasks_7 if t.status == 'MISSED' or (not t.completed and t.due_date and t.due_date < ref_date))
    skipped_count = sum(1 for t in tasks_7 if t.status == 'SKIPPED')
    repeat_rescheduled = sum(1 for t in tasks_7 if (t.rescheduled_count or 0) >= 2)
    avg_reschedules = round(sum(t.rescheduled_count or 0 for t in tasks_7) / float(len(tasks_7)), 2) if tasks_7 else 0.0

    planning_behavior = PlanningBehaviorStats(
        rescheduled_tasks_count=rescheduled_count,
        missed_tasks_count=missed_count,
        skipped_tasks_count=skipped_count,
        repeat_rescheduled_count=repeat_rescheduled,
        avg_reschedules_per_task=avg_reschedules,
    )

    # 8. Factual & Deterministic Personal Insights (Only with sufficient real data)
    insights: List[ProductivityInsight] = []

    # Insight A: Duration estimation variance pattern (min 2 tasks)
    if len(tasks_with_exec) >= 2 and planning_accuracy.avg_variance_minutes is not None and planning_accuracy.avg_variance_minutes >= 15:
        insights.append(ProductivityInsight(
            id="estimation_variance_pattern",
            type="info",
            title=f"Average Estimation Variance: {int(planning_accuracy.avg_variance_minutes)} mins",
            explanation=f"Across {len(tasks_with_exec)} completed tasks, your recorded focus time deviated by an average of {int(planning_accuracy.avg_variance_minutes)} minutes from planned estimates.",
            supporting_data={"tasks_analyzed": len(tasks_with_exec), "avg_variance": planning_accuracy.avg_variance_minutes}
        ))

    # Insight B: Long task rescheduling pattern (tasks >= 90 mins)
    long_tasks = [t for t in all_tasks if (t.estimated_duration_minutes or 30) >= 90]
    if len(long_tasks) >= 2:
        long_rescheduled = sum(1 for t in long_tasks if (t.rescheduled_count or 0) > 0)
        long_reschedule_rate = round((long_rescheduled / float(len(long_tasks))) * 100.0, 1)
        if long_reschedule_rate >= 50.0:
            insights.append(ProductivityInsight(
                id="long_tasks_reschedule_frequency",
                type="warning",
                title="Tasks ≥ 90 mins Are Rescheduled More Frequently",
                explanation=f"{int(long_reschedule_rate)}% of tasks estimated at 90+ minutes ({long_rescheduled} of {len(long_tasks)}) required rescheduling. Consider splitting long tasks into 45-min blocks.",
                supporting_data={"long_task_count": len(long_tasks), "rescheduled_count": long_rescheduled, "rate": long_reschedule_rate}
            ))

    # Insight C: Evening task rescheduling (scheduled at or after 20:00)
    evening_tasks = [t for t in all_tasks if t.due_time and t.due_time.hour >= 20]
    if len(evening_tasks) >= 2:
        evening_rescheduled = sum(1 for t in evening_tasks if (t.rescheduled_count or 0) > 0 or t.status == 'MISSED')
        if evening_rescheduled >= 2:
            insights.append(ProductivityInsight(
                id="evening_reschedule_pattern",
                type="warning",
                title="Frequently Rescheduled Tasks After 8:00 PM",
                explanation=f"{evening_rescheduled} of {len(evening_tasks)} tasks scheduled after 8:00 PM were rescheduled or missed. Shift critical work to earlier in the day.",
                supporting_data={"evening_tasks": len(evening_tasks), "rescheduled": evening_rescheduled}
            ))

    # Insight D: Repeated Rescheduling Pattern (rescheduled 3+ times)
    repeat_postponed_tasks = [t for t in all_tasks if (t.rescheduled_count or 0) >= 3]
    if repeat_postponed_tasks:
        insights.append(ProductivityInsight(
            id="repeat_postponement_warning",
            type="warning",
            title=f"{len(repeat_postponed_tasks)} Task(s) Repeatedly Rescheduled (3+ Times)",
            explanation=f"You have {len(repeat_postponed_tasks)} task(s) that have been rescheduled 3 or more times. Consider breaking them down into smaller steps or reducing their scope.",
            supporting_data={"repeat_postponed_count": len(repeat_postponed_tasks)}
        ))

    # Insight D: Factual Completion Summary
    if scheduled_7 >= 3:
        insights.append(ProductivityInsight(
            id="factual_weekly_completion",
            type="positive" if rate_7 >= 70.0 else "info",
            title=f"Weekly Execution: {completed_7} of {scheduled_7} Tasks Completed ({int(rate_7)}%)",
            explanation=f"Over the last 7 days, you completed {completed_7} tasks with {rescheduled_count} rescheduled and {missed_count} missed.",
            supporting_data={"completed": completed_7, "scheduled": scheduled_7, "rate": rate_7}
        ))

    return AnalyticsSummaryResponse(
        reference_date=ref_date,
        completion_rates=completion_rates,
        priority_distribution=p_dist,
        workload_vs_capacity=workload_vs_capacity,
        planning_accuracy=planning_accuracy,
        planning_behavior=planning_behavior,
        habit_consistency=habit_consistency,
        goal_progress=goal_progress,
        insights=insights
    )
