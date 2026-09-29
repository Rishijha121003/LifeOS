import pytest
from datetime import date, time, timedelta
from app.models.task import Task, PriorityEnum
from app.models.goal import Goal, GoalMilestone
from app.models.setting import Setting
from app.services.planning_service import (
    generate_routine_plan_proposal,
    apply_routine_plan,
    get_day_start_time_setting,
    get_day_end_time_setting,
)
from app.schemas.planning import AcceptRoutinePlanItem

def test_available_capacity_and_commitments_calculation(db_session):
    """Test capacity calculation with day bounds and fixed commitments."""
    today = date.today()
    
    # 1. 07:00 to 11:00 -> 4h = 240m available
    proposal_4h = generate_routine_plan_proposal(
        tasks=[],
        target_date=today,
        day_start_time_str="07:00",
        day_end_time_str="11:00",
        fixed_commitments=[]
    )
    assert proposal_4h["total_day_minutes"] == 240
    assert proposal_4h["commitments_minutes"] == 0
    assert proposal_4h["available_capacity_minutes"] == 240

    # 2. 07:00 to 11:00 + 45m selected => 3h 15m (195m) remaining
    t_45m = Task(id=101, title="Single 45m Task", priority=PriorityEnum.HIGH, estimated_duration_minutes=45)
    proposal_45m = generate_routine_plan_proposal(
        tasks=[t_45m],
        target_date=today,
        day_start_time_str="07:00",
        day_end_time_str="11:00",
        fixed_commitments=[]
    )
    assert proposal_45m["available_capacity_minutes"] == 240
    assert proposal_45m["selected_workload_minutes"] == 45
    remaining_45m = proposal_45m["available_capacity_minutes"] - proposal_45m["selected_workload_minutes"]
    assert remaining_45m == 195  # 3h 15m
    assert len(proposal_45m["timeline"]) == 1
    assert proposal_45m["timeline"][0]["start_time"] == "07:00"
    assert proposal_45m["timeline"][0]["end_time"] == "07:45"

    # 3. 07:00 to 23:00 -> 16h = 960m available
    proposal_16h = generate_routine_plan_proposal(
        tasks=[],
        target_date=today,
        day_start_time_str="07:00",
        day_end_time_str="23:00",
        fixed_commitments=[]
    )
    assert proposal_16h["total_day_minutes"] == 960
    assert proposal_16h["commitments_minutes"] == 0
    assert proposal_16h["available_capacity_minutes"] == 960

    # 4. 09:00 to 17:00 -> 8h = 480m available
    proposal_8h = generate_routine_plan_proposal(
        tasks=[],
        target_date=today,
        day_start_time_str="09:00",
        day_end_time_str="17:00",
        fixed_commitments=[]
    )
    assert proposal_8h["total_day_minutes"] == 480
    assert proposal_8h["commitments_minutes"] == 0
    assert proposal_8h["available_capacity_minutes"] == 480

    # 5. Fixed commitments reduce usable capacity correctly
    # 07:00 to 11:00 (240m) with 1h meeting 09:00-10:00 (60m) => 180m available (3h)
    commitments = [
        {"title": "Morning Sync", "start_time": "09:00", "end_time": "10:00"}
    ]
    proposal_commitments = generate_routine_plan_proposal(
        tasks=[],
        target_date=today,
        day_start_time_str="07:00",
        day_end_time_str="11:00",
        fixed_commitments=commitments
    )
    assert proposal_commitments["total_day_minutes"] == 240
    assert proposal_commitments["commitments_minutes"] == 60
    assert proposal_commitments["available_capacity_minutes"] == 180

    # 6. Timeline and capacity use the same day bounds
    # 07:00-11:00: tasks cannot start before 07:00 or end after 11:00
    t_a = Task(id=1, title="Task A", priority=PriorityEnum.HIGH, estimated_duration_minutes=60)
    t_b = Task(id=2, title="Task B", priority=PriorityEnum.HIGH, estimated_duration_minutes=60)
    proposal_bounds = generate_routine_plan_proposal(
        tasks=[t_a, t_b],
        target_date=today,
        day_start_time_str="07:00",
        day_end_time_str="11:00",
        fixed_commitments=commitments  # 09:00 - 10:00
    )
    # Timeline should place t_a at 07:00-08:00, gap 08:00-09:00 has t_b, 09:00-10:00 is commitment
    assert proposal_bounds["day_start_time"] == "07:00"
    assert proposal_bounds["day_end_time"] == "11:00"
    assert proposal_bounds["available_capacity_minutes"] == 180
    for item in proposal_bounds["timeline"]:
        assert item["start_time"] >= "07:00"
        assert item["end_time"] <= "11:00"



def test_routine_plan_deterministic_placement_and_no_overlap(db_session):
    """Verify tasks do not overlap commitments or each other, and respect priority ordering."""
    today = date.today()

    t1 = Task(id=1, title="DSA Practice", priority=PriorityEnum.HIGH, estimated_duration_minutes=90, due_date=today)
    t2 = Task(id=2, title="FastAPI Project", priority=PriorityEnum.HIGH, estimated_duration_minutes=120, due_date=today + timedelta(days=1))
    t3 = Task(id=3, title="Reading Book", priority=PriorityEnum.LOW, estimated_duration_minutes=60, due_date=None)

    commitments = [
        {"title": "College", "start_time": "09:00", "end_time": "14:00"}
    ]

    proposal = generate_routine_plan_proposal(
        tasks=[t1, t2, t3],
        target_date=today,
        day_start_time_str="07:00",
        day_end_time_str="22:00",
        fixed_commitments=commitments
    )

    timeline = proposal["timeline"]
    assert len(timeline) >= 4  # t1, college, t2, t3 (plus possible breaks)

    # Verify DSA Practice (High priority, due today) is placed in morning slot 07:00 - 08:30
    dsa_item = next(i for i in timeline if i.get("task_id") == 1)
    assert dsa_item["start_time"] == "07:00"
    assert dsa_item["end_time"] == "08:30"
    assert dsa_item["duration_minutes"] == 90

    # Verify College commitment exists 09:00 - 14:00
    college_item = next(i for i in timeline if i["item_type"] == "commitment")
    assert college_item["start_time"] == "09:00"
    assert college_item["end_time"] == "14:00"

    # Verify no item overlaps College
    for item in timeline:
        if item["item_type"] != "commitment":
            assert not (item["start_time"] < "14:00" and item["end_time"] > "09:00")

    # Verify subsequent tasks are placed after College (14:00+)
    fastapi_item = next(i for i in timeline if i.get("task_id") == 2)
    assert fastapi_item["start_time"] >= "14:00"

def test_breaks_inserted_after_long_continuous_focus():
    """Verify breaks are automatically inserted after >= 90 mins continuous focus."""
    today = date.today()

    t1 = Task(id=1, title="Deep Work Block 1", priority=PriorityEnum.HIGH, estimated_duration_minutes=90)
    t2 = Task(id=2, title="Deep Work Block 2", priority=PriorityEnum.MEDIUM, estimated_duration_minutes=60)

    proposal = generate_routine_plan_proposal(
        tasks=[t1, t2],
        target_date=today,
        day_start_time_str="07:00",
        day_end_time_str="12:00",
        fixed_commitments=[]
    )

    timeline = proposal["timeline"]
    # Expect t1 (07:00-08:30), break (08:30-09:00), t2 (09:00-10:00)
    break_items = [i for i in timeline if i["item_type"] == "break"]
    assert len(break_items) >= 1
    assert break_items[0]["start_time"] == "08:30"
    assert break_items[0]["duration_minutes"] == 30

def test_overloaded_day_and_unscheduled_tasks():
    """Verify overloaded capacity is detected and unscheduled tasks are identified."""
    today = date.today()

    # Total duration = 90 + 90 + 60 = 240 min. Available = 180 min (07:00 - 10:00)
    # t1 (90m, High, due today) fits at 07:00-08:30.
    # 30m break is inserted at 08:30-09:00.
    # Remaining slot is 60m (09:00-10:00).
    # t2 (90m) cannot fit in 60m slot -> left unscheduled.
    # t3 (60m) fits in 60m slot.
    t1 = Task(id=1, title="DSA Practice", priority=PriorityEnum.HIGH, estimated_duration_minutes=90, due_date=today)
    t2 = Task(id=2, title="FastAPI Project", priority=PriorityEnum.HIGH, estimated_duration_minutes=90, due_date=today)
    t3 = Task(id=3, title="Reading Book", priority=PriorityEnum.LOW, estimated_duration_minutes=60, due_date=None)

    proposal = generate_routine_plan_proposal(
        tasks=[t1, t2, t3],
        target_date=today,
        day_start_time_str="07:00",
        day_end_time_str="10:00",  # 3 hours = 180m
        fixed_commitments=[]
    )

    assert proposal["is_overloaded"] is True
    assert proposal["overload_minutes"] == 60
    assert proposal["capacity_status"] == "overloaded"
    assert len(proposal["unscheduled_tasks"]) == 1
    assert proposal["unscheduled_tasks"][0]["task_id"] == 2
    assert proposal["unscheduled_tasks"][0]["title"] == "FastAPI Project"
    assert proposal["unscheduled_tasks"][0]["is_deadline_risk"] is True

def test_routine_plan_proposal_is_read_only(client, db_session):
    """Verify /planning/routine/propose does NOT modify the database."""
    today = date.today()
    task = Task(title="Test Readonly Task", priority=PriorityEnum.MEDIUM, estimated_duration_minutes=45, due_date=today)
    db_session.add(task)
    db_session.commit()
    db_session.refresh(task)

    initial_due_time = task.due_time
    initial_rescheduled_count = task.rescheduled_count

    res = client.post(
        "/api/v1/planning/routine/propose",
        json={
            "date": today.isoformat(),
            "day_start_time": "08:00",
            "day_end_time": "18:00",
            "fixed_commitments": [],
            "selected_task_ids": [task.id]
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert len(data["timeline"]) == 1

    db_session.refresh(task)
    assert task.due_time == initial_due_time
    assert task.rescheduled_count == initial_rescheduled_count

def test_accept_routine_plan_persists_schedule_and_preserves_metadata(client, db_session):
    """Verify /planning/routine/accept updates scheduling while preserving goal, milestone, and priority."""
    today = date.today()
    goal = Goal(title="Backend Mastery", target_date=today + timedelta(days=30))
    db_session.add(goal)
    db_session.commit()
    db_session.refresh(goal)

    milestone = GoalMilestone(title="FastAPI Services", goal_id=goal.id, due_date=today + timedelta(days=10))
    db_session.add(milestone)
    db_session.commit()
    db_session.refresh(milestone)

    task = Task(
        title="Implement Endpoints",
        description="Write routing logic",
        priority=PriorityEnum.HIGH,
        estimated_duration_minutes=90,
        goal_id=goal.id,
        milestone_id=milestone.id,
        due_date=None,
        due_time=None,
        completed=False
    )
    db_session.add(task)
    db_session.commit()
    db_session.refresh(task)


    res = client.post(
        "/api/v1/planning/routine/accept",
        json={
            "plan_items": [
                {
                    "task_id": task.id,
                    "due_date": today.isoformat(),
                    "due_time": "09:30"
                }
            ]
        }
    )
    assert res.status_code == 200
    res_data = res.json()
    assert res_data["status"] == "success"
    assert res_data["updated_count"] == 1

    db_session.refresh(task)
    assert task.due_date == today
    assert task.due_time == time(9, 30)
    assert task.goal_id == goal.id
    assert task.milestone_id == milestone.id
    assert task.priority == PriorityEnum.HIGH
    assert task.completed is False
    assert task.estimated_duration_minutes == 90

def test_accept_plan_does_not_duplicate_or_alter_unscheduled_tasks(client, db_session):
    """Verify accepting a plan updates only planned tasks and never duplicates or alters unscheduled tasks."""
    today = date.today()
    
    # Task 1 to be scheduled
    t1 = Task(title="Submit DBMS Assignment", priority=PriorityEnum.HIGH, estimated_duration_minutes=45, due_date=today)
    # Task 2 to be unscheduled (e.g. reading book)
    t2 = Task(title="Read 12 Pages", priority=PriorityEnum.LOW, estimated_duration_minutes=60, due_date=None, due_time=None)
    db_session.add_all([t1, t2])
    db_session.commit()
    db_session.refresh(t1)
    db_session.refresh(t2)

    initial_task_count = db_session.query(Task).count()

    # User accepts plan where only t1 was scheduled at 07:00
    res = client.post(
        "/api/v1/planning/routine/accept",
        json={
            "plan_items": [
                {
                    "task_id": t1.id,
                    "due_date": today.isoformat(),
                    "due_time": "07:00"
                }
            ]
        }
    )
    assert res.status_code == 200

    # Task count must remain identical (NO DUPLICATES)
    final_task_count = db_session.query(Task).count()
    assert final_task_count == initial_task_count

    # Verify t1 was updated with exact scheduled time
    db_session.refresh(t1)
    assert t1.due_time == time(7, 0)
    assert t1.due_date == today

    # Verify t2 (unscheduled task) remained untouched
    db_session.refresh(t2)
    assert t2.due_time is None
    assert t2.due_date is None
    assert t2.completed is False

def test_accepted_schedule_survives_refetch_for_today_and_calendar(client, db_session):
    """Verify accepted schedule is returned identically when refetched from tasks API (survives refresh)."""
    today = date.today()

    t1 = Task(title="Morning Standup", priority=PriorityEnum.HIGH, estimated_duration_minutes=30, due_date=today)
    t2 = Task(title="Deep Work Core", priority=PriorityEnum.HIGH, estimated_duration_minutes=120, due_date=today)
    db_session.add_all([t1, t2])
    db_session.commit()
    db_session.refresh(t1)
    db_session.refresh(t2)

    # Accept schedule: t1 at 08:00, t2 at 09:00
    accept_res = client.post(
        "/api/v1/planning/routine/accept",
        json={
            "plan_items": [
                {"task_id": t1.id, "due_date": today.isoformat(), "due_time": "08:00"},
                {"task_id": t2.id, "due_date": today.isoformat(), "due_time": "09:00"},
            ]
        }
    )
    assert accept_res.status_code == 200

    # Refetch all tasks (simulating page reload or navigation to Today/Calendar)
    tasks_res = client.get("/api/v1/tasks/")
    assert tasks_res.status_code == 200
    fetched_tasks = tasks_res.json()

    fetched_t1 = next(t for t in fetched_tasks if t["id"] == t1.id)
    fetched_t2 = next(t for t in fetched_tasks if t["id"] == t2.id)

    assert fetched_t1["due_time"] == "08:00:00"
    assert fetched_t1["due_date"] == today.isoformat()
    assert fetched_t2["due_time"] == "09:00:00"
    assert fetched_t2["due_date"] == today.isoformat()

def test_accept_plan_atomic_rollback_on_failure(client, db_session):
    """Verify that if an error occurs (e.g. nonexistent task ID), the entire transaction rolls back."""
    today = date.today()
    t1 = Task(title="Valid Task", priority=PriorityEnum.HIGH, estimated_duration_minutes=45, due_date=today, due_time=None)
    db_session.add(t1)
    db_session.commit()
    db_session.refresh(t1)

    # Send a request with a valid task and an invalid task ID (999999)
    res = client.post(
        "/api/v1/planning/routine/accept",
        json={
            "plan_items": [
                {"task_id": t1.id, "due_date": today.isoformat(), "due_time": "10:00"},
                {"task_id": 999999, "due_date": today.isoformat(), "due_time": "11:00"},
            ]
        }
    )
    assert res.status_code == 404 or res.status_code == 400

    # Ensure t1 was NOT partially updated (atomicity)
    db_session.refresh(t1)
    assert t1.due_time is None

def test_accept_plan_applies_unscheduled_dispositions(client, db_session):
    """Verify that dispositions for unscheduled tasks (move to tomorrow, backlog, overtime) are applied atomically."""
    today = date.today()
    tomorrow = today + timedelta(days=1)

    t_scheduled = Task(title="Scheduled Task", priority=PriorityEnum.HIGH, estimated_duration_minutes=45, due_date=today)
    t_tomorrow = Task(title="Move to Tomorrow Task", priority=PriorityEnum.MEDIUM, estimated_duration_minutes=60, due_date=today)
    t_backlog = Task(title="Backlog Task", priority=PriorityEnum.LOW, estimated_duration_minutes=30, due_date=today)

    db_session.add_all([t_scheduled, t_tomorrow, t_backlog])
    db_session.commit()
    db_session.refresh(t_scheduled)
    db_session.refresh(t_tomorrow)
    db_session.refresh(t_backlog)

    res = client.post(
        "/api/v1/planning/routine/accept",
        json={
            "plan_items": [
                {"task_id": t_scheduled.id, "due_date": today.isoformat(), "due_time": "08:00"}
            ],
            "unscheduled_dispositions": [
                {"task_id": t_tomorrow.id, "action": "move_tomorrow", "target_date": tomorrow.isoformat()},
                {"task_id": t_backlog.id, "action": "backlog"}
            ]
        }
    )
    assert res.status_code == 200

    db_session.refresh(t_scheduled)
    db_session.refresh(t_tomorrow)
    db_session.refresh(t_backlog)

    assert t_scheduled.due_time == time(8, 0)
    assert t_scheduled.due_date == today

    assert t_tomorrow.due_date == tomorrow
    assert t_tomorrow.due_time is None
    assert t_tomorrow.rescheduled_count >= 1

    assert t_backlog.due_date is None
    assert t_backlog.due_time is None

def test_task_without_duration_is_not_scheduled_and_not_defaulted_to_30m():
    """Verify that tasks without estimated duration are NOT scheduled and do not contribute 30m to capacity."""
    today = date.today()
    t_valid = Task(id=1, title="DSA Practice", priority=PriorityEnum.HIGH, estimated_duration_minutes=60, due_date=today)
    t_no_duration = Task(id=2, title="Vague Task", priority=PriorityEnum.LOW, estimated_duration_minutes=None, due_date=today)

    proposal = generate_routine_plan_proposal(
        tasks=[t_valid, t_no_duration],
        target_date=today,
        day_start_time_str="08:00",
        day_end_time_str="12:00",
        fixed_commitments=[]
    )

    # Only t_valid should be scheduled in timeline
    task_timeline = [i for i in proposal["timeline"] if i["item_type"] == "task"]
    assert len(task_timeline) == 1
    assert task_timeline[0]["task_id"] == 1
    assert task_timeline[0]["duration_minutes"] == 60

    # Selected workload should only be 60m (t_no_duration must NOT contribute 30m)
    assert proposal["selected_workload_minutes"] == 60

    # t_no_duration must appear in unscheduled_tasks with explicit explanation
    unscheduled = proposal["unscheduled_tasks"]
    assert len(unscheduled) == 1
    assert unscheduled[0]["task_id"] == 2
    assert unscheduled[0]["estimated_duration_minutes"] == 0
    assert "Set an estimated duration before this task can be planned." in unscheduled[0]["reason"]



