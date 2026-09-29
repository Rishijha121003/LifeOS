from datetime import date, time
import pytest
from app.models.task import Task, PriorityEnum
from app.services.planning_service import (
    calculate_available_minutes,
    calculate_task_score,
    rank_tasks,
    generate_replan_suggestion,
)

def create_dummy_task(
    task_id: int,
    title: str,
    priority: PriorityEnum = PriorityEnum.MEDIUM,
    due_date: str = "2026-08-21",
    due_time_str: str = None,
    duration: int = 30,
    completed: bool = False,
) -> Task:
    d = date.fromisoformat(due_date) if due_date else None
    t = time.fromisoformat(due_time_str) if due_time_str else None
    return Task(
        id=task_id,
        title=title,
        priority=priority,
        due_date=d,
        due_time=t,
        estimated_duration_minutes=duration,
        completed=completed,
    )

def test_available_minutes_calculation():
    assert calculate_available_minutes("21:00", "23:00") == 120
    assert calculate_available_minutes("22:30", "23:00") == 30
    assert calculate_available_minutes("23:30", "23:00") == 0
    assert calculate_available_minutes("18:00", "22:00") == 240

def test_task_scoring_priority_and_overdue():
    today = "2026-08-21"
    
    # 1. Base Priority Scores
    high_task = create_dummy_task(1, "High Task", priority=PriorityEnum.HIGH, due_date=today)
    med_task = create_dummy_task(2, "Med Task", priority=PriorityEnum.MEDIUM, due_date=today)
    low_task = create_dummy_task(3, "Low Task", priority=PriorityEnum.LOW, due_date=today)
    
    score_high = calculate_task_score(high_task, "12:00", today)
    score_med = calculate_task_score(med_task, "12:00", today)
    score_low = calculate_task_score(low_task, "12:00", today)
    
    assert score_high == 300.0
    assert score_med == 200.0
    assert score_low == 100.0

    # 2. Overdue Bonus (+150)
    overdue_task = create_dummy_task(4, "Overdue Task", priority=PriorityEnum.MEDIUM, due_date="2026-08-20")
    overdue_score = calculate_task_score(overdue_task, "12:00", today)
    assert overdue_score == 350.0  # 200 (med) + 150 (overdue)

    # 3. Overdue due_time today (+150)
    overdue_time_task = create_dummy_task(5, "Overdue Time", priority=PriorityEnum.LOW, due_date=today, due_time_str="10:00")
    score_past_due = calculate_task_score(overdue_time_task, "12:00", today)
    assert score_past_due == 250.0  # 100 (low) + 150 (overdue time)

def test_due_time_urgency():
    today = "2026-08-21"
    # Task due at 13:00, current time 12:00 (60 mins remaining)
    # Urgency = max(0, 100 - 60/15) = 100 - 4 = 96
    urgent_task = create_dummy_task(1, "Urgent", priority=PriorityEnum.MEDIUM, due_date=today, due_time_str="13:00")
    score = calculate_task_score(urgent_task, "12:00", today)
    assert round(score, 1) == 296.0  # 200 (medium) + 96 (urgency)

def test_deterministic_sorting_and_tie_breakers():
    today = "2026-08-21"
    t1 = create_dummy_task(1, "Task A", priority=PriorityEnum.MEDIUM, due_date=today, duration=60)
    t2 = create_dummy_task(2, "Task B", priority=PriorityEnum.HIGH, due_date=today, duration=45)
    t3 = create_dummy_task(3, "Task C", priority=PriorityEnum.MEDIUM, due_date=today, duration=30)
    
    ranked = rank_tasks([t1, t2, t3], "12:00", today)
    # High priority t2 first, then between t3 and t1 (same priority 200), shorter duration t3 (30m) before t1 (60m)
    assert ranked[0][0].id == 2
    assert ranked[1][0].id == 3
    assert ranked[2][0].id == 1

def test_greedy_allocation_and_oversized_skip():
    today = "2026-08-21"
    # Available capacity: 21:00 to 22:30 = 90 mins
    # t1: High priority, 120 mins (Does NOT fit)
    # t2: Medium priority, 45 mins (Fits!)
    # t3: Low priority, 30 mins (Fits!)
    t1 = create_dummy_task(1, "Big Task", priority=PriorityEnum.HIGH, due_date=today, duration=120)
    t2 = create_dummy_task(2, "Medium Task", priority=PriorityEnum.MEDIUM, due_date=today, duration=45)
    t3 = create_dummy_task(3, "Small Task", priority=PriorityEnum.LOW, due_date=today, duration=30)

    suggestion = generate_replan_suggestion([t1, t2, t3], "21:00", today, "22:30")
    
    assert suggestion.available_minutes == 90
    assert len(suggestion.do_now) == 2
    assert suggestion.do_now[0].id == 2  # Medium Task (45 min)
    assert suggestion.do_now[1].id == 3  # Small Task (30 min)
    
    assert len(suggestion.move_to_tomorrow) == 1
    assert suggestion.move_to_tomorrow[0].id == 1  # Big Task (120 min)

def test_edge_cases_no_tasks_all_completed_zero_capacity():
    today = "2026-08-21"
    
    # 1. Empty task list
    s1 = generate_replan_suggestion([], "21:00", today, "23:00")
    assert len(s1.do_now) == 0
    assert len(s1.move_to_tomorrow) == 0
    assert "All clear" in s1.summary

    # 2. All tasks completed
    t_done = create_dummy_task(1, "Done Task", completed=True)
    s2 = generate_replan_suggestion([t_done], "21:00", today, "23:00")
    assert len(s2.do_now) == 0
    assert len(s2.move_to_tomorrow) == 0

    # 3. Zero available capacity
    t_pending = create_dummy_task(2, "Pending Task", completed=False)
    s3 = generate_replan_suggestion([t_pending], "23:30", today, "23:00")
    assert s3.available_minutes == 0
    assert len(s3.do_now) == 0
    assert len(s3.move_to_tomorrow) == 1

def test_legacy_task_default_duration():
    today = "2026-08-21"
    legacy_task = create_dummy_task(1, "Legacy", duration=None) # missing duration
    suggestion = generate_replan_suggestion([legacy_task], "21:00", today, "22:00")
    assert suggestion.do_now[0].estimated_duration_minutes == 30
