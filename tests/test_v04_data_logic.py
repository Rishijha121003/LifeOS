import pytest
from datetime import date
from app.models.task import Task
from app.models.goal import Goal, GoalMilestone
from app.services.task_service import create_task, update_task, complete_task, reopen_task
from app.services.goal_service import calculate_goal_progress
from app.schemas.task import TaskCreate, TaskUpdate


def test_task_execution_status_and_actual_duration(db_session):
    # 1. Create task with estimated duration
    payload = TaskCreate(
        title="FastAPI Microservice Refinement",
        priority="high",
        estimated_duration_minutes=120,
        due_date=date.today(),
    )
    task = create_task(db_session, payload)
    assert task.status == "NOT_STARTED"
    assert task.completed is False
    assert task.estimated_duration_minutes == 120
    assert task.actual_duration_minutes == 0

    # 2. Update task to IN_PROGRESS and log focus minutes
    update_payload = TaskUpdate(
        status="IN_PROGRESS",
        actual_duration_minutes=45,
    )
    task = update_task(db_session, task, update_payload)
    assert task.status == "IN_PROGRESS"
    assert task.actual_duration_minutes == 45
    assert task.completed is False

    # 3. Log additional focus minutes and complete task
    update_payload = TaskUpdate(
        status="COMPLETED",
        actual_duration_minutes=95,
        completed=True,
    )
    task = update_task(db_session, task, update_payload)
    assert task.status == "COMPLETED"
    assert task.completed is True
    assert task.actual_duration_minutes == 95

    # 4. Reopen task
    reopened = reopen_task(db_session, task)
    assert reopened.completed is False
    assert reopened.status == "NOT_STARTED"
    assert reopened.actual_duration_minutes == 95  # Duration preserved!


def test_focus_timer_duration_accumulation_and_task_state(db_session):
    # 1. Create a task
    task = create_task(db_session, TaskCreate(
        title="LeetCode Daily Problem",
        priority="medium",
        estimated_duration_minutes=45
    ))

    # 2. First interrupted session of 20 minutes
    task = update_task(db_session, task, TaskUpdate(actual_duration_minutes=20))
    assert task.actual_duration_minutes == 20
    assert task.completed is False  # Must NOT auto-complete task!

    # 3. Second session of 35 minutes accumulates
    task = update_task(db_session, task, TaskUpdate(actual_duration_minutes=task.actual_duration_minutes + 35))
    assert task.actual_duration_minutes == 55
    assert task.completed is False

    # 4. Complete task and reopen: actual duration must be intact
    completed = complete_task(db_session, task)
    assert completed.completed is True
    assert completed.actual_duration_minutes == 55

    reopened = reopen_task(db_session, completed)
    assert reopened.completed is False
    assert reopened.actual_duration_minutes == 55


def test_goal_milestone_and_task_hierarchy_no_double_counting(db_session):
    # Create Goal
    goal = Goal(
        title="Master Cloud Systems",
        category="Career",
        target_date=date(2026, 12, 31),
    )
    db_session.add(goal)
    db_session.commit()
    db_session.refresh(goal)

    # Create Milestone 1
    m1 = GoalMilestone(
        goal_id=goal.id,
        title="Deploy Kubernetes cluster",
        status="IN_PROGRESS",
        order_index=1,
    )
    # Create Milestone 2
    m2 = GoalMilestone(
        goal_id=goal.id,
        title="Set up CI/CD Pipeline",
        status="NOT_STARTED",
        order_index=2,
    )
    db_session.add_all([m1, m2])
    db_session.commit()
    db_session.refresh(goal)

    # Create 2 tasks under Milestone 1
    t1 = create_task(db_session, TaskCreate(
        title="Write deployment YAML",
        priority="high",
        goal_id=goal.id,
        milestone_id=m1.id
    ))
    t2 = create_task(db_session, TaskCreate(
        title="Configure ingress controller",
        priority="high",
        goal_id=goal.id,
        milestone_id=m1.id
    ))
    db_session.refresh(goal)

    # Initial state: 0 tasks completed -> Goal progress 0%
    assert calculate_goal_progress(goal) == 0.0

    # Complete 1 of 2 tasks in Milestone 1 -> M1 is 50%, M2 is 0% -> Goal is 25.0%
    complete_task(db_session, t1)
    db_session.refresh(goal)
    assert calculate_goal_progress(goal) == 25.0

    # Complete second task in Milestone 1 -> M1 is 100%, M2 is 0% -> Goal is 50.0%
    complete_task(db_session, t2)
    db_session.refresh(goal)
    assert calculate_goal_progress(goal) == 50.0

    # Mark Milestone 2 completed -> Goal is 100.0%
    m2.completed = True
    m2.status = "COMPLETED"
    db_session.commit()
    db_session.refresh(goal)
    assert calculate_goal_progress(goal) == 100.0


def test_recovery_capacity_calculations(db_session):
    from app.services.planning_service import calculate_recovery_capacity

    today_str = date.today().isoformat()

    # 1. Create candidate task (missed/overdue)
    candidate = create_task(db_session, TaskCreate(
        title="DBMS Assignment",
        priority="high",
        estimated_duration_minutes=45,
        due_date=date.today(),
    ))

    # 2. Create another scheduled task for today (90 min)
    other_task = create_task(db_session, TaskCreate(
        title="Full Stack Project",
        priority="medium",
        estimated_duration_minutes=90,
        due_date=date.today(),
    ))

    # 3. Create a completed task for today (60 min)
    completed_task = create_task(db_session, TaskCreate(
        title="Morning Lecture Review",
        priority="low",
        estimated_duration_minutes=60,
        due_date=date.today(),
    ))
    complete_task(db_session, completed_task)

    all_tasks = [candidate, other_task, completed_task]

    # Scenario A: Free time with scheduled tasks (18:00 to 22:00 = 240m total; other task = 90m -> 150m free)
    # Completed task (60m) must NOT consume recovery capacity!
    # Candidate task (45m) must NOT be double-counted!
    result = calculate_recovery_capacity(
        tasks=all_tasks,
        candidate_task_id=candidate.id,
        current_time_str="18:00",
        today_date_str=today_str,
        day_end_time_str="22:00"
    )
    assert result["time_remaining_minutes"] == 240
    assert result["occupied_minutes"] == 90  # Only other incomplete task
    assert result["free_recovery_minutes"] == 150
    assert result["candidate_duration_minutes"] == 45
    assert result["fits_today"] is True
    assert result["recommended_target"] == "today"
    assert result["has_deadline_conflict"] is False
    assert result["can_split"] is False

    # Scenario B: Overloaded day / Insufficient slot (0 free minutes) -> No fake split!
    # If remaining time is only 60m (21:00 to 22:00), other task takes 90m -> 0m free recovery
    overload_result = calculate_recovery_capacity(
        tasks=all_tasks,
        candidate_task_id=candidate.id,
        current_time_str="21:00",
        today_date_str=today_str,
        day_end_time_str="22:00"
    )
    assert overload_result["time_remaining_minutes"] == 60
    assert overload_result["occupied_minutes"] == 90
    assert overload_result["free_recovery_minutes"] == 0
    assert overload_result["fits_today"] is False
    assert overload_result["recommended_target"] == "tomorrow"
    assert overload_result["has_deadline_conflict"] is True  # Due today but cannot fit!
    assert overload_result["can_split"] is False  # 0m free -> NO FAKE 0m SPLIT!
    assert overload_result["split_today_minutes"] == 0

    # Scenario C: Valid split session (Task is 45m, today has 20m free)
    # Remaining time = 110m, other task = 90m -> 20m free
    split_result = calculate_recovery_capacity(
        tasks=all_tasks,
        candidate_task_id=candidate.id,
        current_time_str="20:10",
        today_date_str=today_str,
        day_end_time_str="22:00"
    )
    assert split_result["time_remaining_minutes"] == 110
    assert split_result["free_recovery_minutes"] == 20
    assert split_result["fits_today"] is False
    assert split_result["has_deadline_conflict"] is True
    assert split_result["can_split"] is True
    assert split_result["split_today_minutes"] == 20
    assert split_result["split_tomorrow_minutes"] == 25  # 45 - 20 = 25m

    # Scenario D: No available time left today (current time >= day_end_time)
    past_end_result = calculate_recovery_capacity(
        tasks=all_tasks,
        candidate_task_id=candidate.id,
        current_time_str="22:30",
        today_date_str=today_str,
        day_end_time_str="22:00"
    )
    assert past_end_result["time_remaining_minutes"] == 0
    assert past_end_result["free_recovery_minutes"] == 0
    assert past_end_result["fits_today"] is False
    assert past_end_result["recommended_target"] == "tomorrow"
    assert past_end_result["can_split"] is False


def test_smart_reschedule_overtime_deadline_and_slot_verification(db_session):
    from app.services.planning_service import calculate_recovery_capacity, find_next_available_slot
    from datetime import timedelta

    today = date.today()
    today_str = today.isoformat()
    tomorrow_str = (today + timedelta(days=1)).isoformat()

    # 1. Candidate task due today (45m)
    candidate = create_task(db_session, TaskCreate(
        title="DSA Practice",
        priority="high",
        estimated_duration_minutes=45,
        due_date=today,
    ))

    # 2. Existing tasks tomorrow: 07:00 to 08:30 (90m)
    tomorrow_task = create_task(db_session, TaskCreate(
        title="Operating Systems Lecture",
        priority="high",
        due_date=today + timedelta(days=1),
        due_time="07:00",
        estimated_duration_minutes=90,
    ))

    all_tasks = [candidate, tomorrow_task]

    # Slot search: Tomorrow 07:00 is occupied (07:00 - 08:30). The next verified open slot starts at 08:30!
    start_slot, end_slot = find_next_available_slot(all_tasks, tomorrow_str, duration_minutes=45, earliest_start_hour=7)
    assert start_slot == "08:30"
    assert end_slot == "09:15"  # 08:30 + 45m = 09:15

    # 3. Recovery calculation when 0 normal capacity remains (22:00 day end)
    rec = calculate_recovery_capacity(
        tasks=all_tasks,
        candidate_task_id=candidate.id,
        current_time_str="22:00",
        today_date_str=today_str,
        day_end_time_str="22:00"
    )
    assert rec["free_recovery_minutes"] == 0
    assert rec["fits_today"] is False
    assert rec["has_deadline_conflict"] is True
    assert rec["overtime_required_minutes"] == 45
    assert rec["can_split"] is False  # Exactly 0m normal capacity -> No fake split!

    # 4. Applying Overtime preserves due_date=today, records scheduled time, increments rescheduled_count
    updated_overtime = update_task(db_session, candidate, TaskUpdate(
        due_date=today,
        due_time="22:00",
        rescheduled_count=(candidate.rescheduled_count or 0) + 1,
    ))
    assert updated_overtime.due_date == today
    assert updated_overtime.due_time.strftime("%H:%M") == "22:00"
    assert updated_overtime.rescheduled_count == 1
    assert updated_overtime.estimated_duration_minutes == 45  # Preserved

    # 5. Applying Move & Extend Deadline explicitly updates due_date to tomorrow and increments count
    updated_extend = update_task(db_session, candidate, TaskUpdate(
        due_date=today + timedelta(days=1),
        due_time="08:30",
        rescheduled_count=updated_overtime.rescheduled_count + 1,
    ))
    assert updated_extend.due_date == today + timedelta(days=1)
    assert updated_extend.due_time.strftime("%H:%M") == "08:30"
    assert updated_extend.rescheduled_count == 2



def test_planning_accuracy_and_behavior_calculations(db_session):
    from app.services.analytics_service import compute_analytics_summary

    today = date.today()

    # 1. Test empty dataset behavior (graceful zeros for counts, None for unknown calculations)
    summary = compute_analytics_summary(db_session, today)
    assert summary.completion_rates.rate_7_days == 0.0
    assert summary.planning_accuracy.tasks_analyzed == 0
    assert summary.planning_accuracy.planning_vs_execution_gap_minutes is None
    assert summary.planning_behavior.rescheduled_tasks_count == 0
    assert summary.planning_behavior.missed_tasks_count == 0
    assert summary.planning_behavior.skipped_tasks_count == 0

    # 2. Add Task 1: Estimated 120m, Actual 95m (Completed, Overestimated by 25m)
    t1 = create_task(db_session, TaskCreate(
        title="FastAPI Project",
        priority="high",
        due_date=today,
        estimated_duration_minutes=120,
    ))
    update_task(db_session, t1, TaskUpdate(actual_duration_minutes=95, status="COMPLETED", completed=True))

    # 3. Add Task 2: Estimated 45m, Actual 60m (Completed, Underestimated by 15m)
    t2 = create_task(db_session, TaskCreate(
        title="DBMS Assignment",
        priority="high",
        due_date=today,
        estimated_duration_minutes=45,
    ))
    update_task(db_session, t2, TaskUpdate(actual_duration_minutes=60, status="COMPLETED", completed=True))

    # 4. Add Task 3: Skipped Task (30m)
    t3 = create_task(db_session, TaskCreate(
        title="Optional Reading",
        priority="low",
        due_date=today,
        estimated_duration_minutes=30,
    ))
    update_task(db_session, t3, TaskUpdate(status="SKIPPED"))

    # 5. Add Task 4: Rescheduled Task (60m)
    t4 = create_task(db_session, TaskCreate(
        title="Algorithm Practice",
        priority="medium",
        due_date=today,
        estimated_duration_minutes=60,
    ))
    update_task(db_session, t4, TaskUpdate(rescheduled_count=2, status="NOT_STARTED"))

    # 6. Recompute analytics summary
    res = compute_analytics_summary(db_session, today)

    # Verify Execution Overview
    assert res.completion_rates.total_scheduled_7_days == 4
    assert res.completion_rates.total_completed_7_days == 2
    assert res.completion_rates.rate_7_days == 50.0

    # Verify Planning Accuracy & Execution Gap
    # Planned = 120 + 45 = 165m
    # Actual = 95 + 60 = 155m
    # Gap = 165 - 155 = +10m
    # Variance = (25 + 15) / 2 = 20.0m
    assert res.planning_accuracy.tasks_analyzed == 2
    assert res.planning_accuracy.planned_minutes == 165
    assert res.planning_accuracy.actual_minutes == 155
    assert res.planning_accuracy.planning_vs_execution_gap_minutes == 10
    assert res.planning_accuracy.avg_variance_minutes == 20.0
    assert res.planning_accuracy.avg_overestimate_minutes == 25.0
    assert res.planning_accuracy.avg_underestimate_minutes == 15.0

    # Verify Planning Behavior
    assert res.planning_behavior.skipped_tasks_count == 1
    assert res.planning_behavior.rescheduled_tasks_count == 1
    assert res.planning_behavior.repeat_rescheduled_count == 1

    # Verify Data-driven Factual Insights
    insight_ids = [i.id for i in res.insights]
    assert "factual_weekly_completion" in insight_ids
    assert "estimation_variance_pattern" in insight_ids


def test_analytics_period_consistency_and_zero_vs_unknown_semantics(db_session):
    from datetime import timedelta
    from app.services.analytics_service import compute_analytics_summary
    from app.services.planning_service import calculate_available_minutes, calculate_recovery_capacity

    ref_date = date(2026, 8, 20)
    
    # 1. Test Zero vs Unknown Semantics on fresh session
    empty_summary = compute_analytics_summary(db_session, reference_date=ref_date)
    # Zero counts: genuine 0
    assert empty_summary.planning_behavior.rescheduled_tasks_count == 0
    assert empty_summary.planning_behavior.missed_tasks_count == 0
    assert empty_summary.planning_behavior.skipped_tasks_count == 0
    # Unknown gap: None (not 0)
    assert empty_summary.planning_accuracy.planning_vs_execution_gap_minutes is None
    assert empty_summary.planning_accuracy.avg_variance_minutes is None
    # Insights: Empty when insufficient data
    assert len(empty_summary.insights) == 0

    # 2. Add tasks across different periods:
    # Today task (2026-08-20)
    t_today = create_task(db_session, TaskCreate(
        title="Today Task",
        due_date=ref_date,
        estimated_duration_minutes=60,
        priority="high"
    ))
    # Earlier this week task (2026-08-17)
    t_week = create_task(db_session, TaskCreate(
        title="Mid-week Task",
        due_date=ref_date - timedelta(days=3),
        estimated_duration_minutes=45,
        priority="medium"
    ))
    # Older task from last month (2026-07-10)
    t_old = create_task(db_session, TaskCreate(
        title="Old Task",
        due_date=ref_date - timedelta(days=40),
        estimated_duration_minutes=90,
        priority="low"
    ))

    # Complete t_today with recorded actual duration
    update_task(db_session, t_today, TaskUpdate(status="COMPLETED", completed=True, actual_duration_minutes=50))
    # Complete t_week without actual duration recorded
    update_task(db_session, t_week, TaskUpdate(status="COMPLETED", completed=True))

    summary = compute_analytics_summary(db_session, reference_date=ref_date)
    
    # 7-day period includes t_today and t_week (2 scheduled, 2 completed -> 100%)
    assert summary.completion_rates.total_scheduled_7_days == 2
    assert summary.completion_rates.total_completed_7_days == 2
    assert summary.completion_rates.rate_7_days == 100.0

    # Planning vs execution gap calculated on completed tasks with recorded duration
    assert summary.planning_accuracy.tasks_analyzed == 2
    assert summary.planning_accuracy.planned_minutes == 105
    assert summary.planning_accuracy.actual_minutes == 95
    assert summary.planning_accuracy.planning_vs_execution_gap_minutes == 10

    # Available capacity calculation for 18:00 with 22:00 end time -> 240 mins
    avail = calculate_available_minutes(current_time_str="18:00", day_end_time_str="22:00")
    assert avail == 240



