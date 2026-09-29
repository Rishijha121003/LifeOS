from datetime import date, time, datetime
from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.task import Task, PriorityEnum
from app.models.setting import Setting
from app.schemas.planning import ReplanSuggestion, TaskRecommendation

def _parse_time_to_minutes(t_input: Optional[object]) -> int:
    """Helper to convert time object or string ('HH:MM' or 'HH:MM:SS') into minutes past midnight."""
    if t_input is None:
        return 0
    if isinstance(t_input, time):
        return t_input.hour * 60 + t_input.minute
    if isinstance(t_input, str):
        parts = t_input.strip().split(":")
        if len(parts) >= 2:
            return int(parts[0]) * 60 + int(parts[1])
    return 0

def _parse_date_to_str(d_input: Optional[object]) -> str:
    """Helper to format date object or string into 'YYYY-MM-DD'."""
    if d_input is None:
        return ""
    if isinstance(d_input, date):
        return d_input.isoformat()
    return str(d_input).split("T")[0]

def get_day_end_time_setting(db: Session) -> str:
    """Retrieves day_end_time from settings table. Defaults to '23:00' if missing or error occurs."""
    try:
        stmt = select(Setting).where(Setting.key == "day_end_time")
        setting = db.scalars(stmt).first()
        if setting and setting.value and setting.value.strip():
            return setting.value.strip()
    except Exception as e:
        print("Warning: Unable to read day_end_time setting from database, using fallback '23:00':", e)
    return "23:00"

def calculate_available_minutes(current_time_str: str, day_end_time_str: str = "23:00") -> int:
    """
    Calculates remaining available minutes today:
    available_minutes = max(0, day_end_minutes - current_time_minutes)
    """
    curr_mins = _parse_time_to_minutes(current_time_str)
    end_mins = _parse_time_to_minutes(day_end_time_str)
    return max(0, end_mins - curr_mins)

def calculate_recovery_capacity(
    tasks: List[Task],
    candidate_task_id: int,
    current_time_str: str,
    today_date_str: str,
    day_end_time_str: str = "23:00"
) -> dict:
    """
    Calculates accurate recovery capacity for a specific candidate task:
    1. Time remaining in the day: max(0, day_end_minutes - current_time_minutes)
    2. Time occupied by other scheduled tasks: sum durations of OTHER incomplete tasks scheduled for today
       - Completed tasks do NOT consume recovery capacity.
       - Candidate task is explicitly EXCLUDED (not double-counted).
    3. Free usable recovery time: max(0, time_remaining - occupied_time)
    4. Evaluates whether the candidate task realistically fits today.
    """
    curr_mins = _parse_time_to_minutes(current_time_str)
    end_mins = _parse_time_to_minutes(day_end_time_str)
    time_remaining = max(0, end_mins - curr_mins)

    # Find candidate task
    candidate = next((t for t in tasks if t.id == candidate_task_id), None)
    candidate_duration = candidate.estimated_duration_minutes if candidate and getattr(candidate, 'estimated_duration_minutes', None) is not None else 30

    # Calculate occupied time by other incomplete tasks scheduled for today
    other_today_tasks = [
        t for t in tasks
        if t.id != candidate_task_id
        and not t.completed
        and (_parse_date_to_str(t.due_date) == today_date_str or t.due_date is None)
    ]

    occupied_minutes = sum(
        t.estimated_duration_minutes if getattr(t, 'estimated_duration_minutes', None) is not None else 30
        for t in other_today_tasks
    )

    free_recovery_minutes = max(0, time_remaining - occupied_minutes)
    fits_today = candidate_duration <= free_recovery_minutes and free_recovery_minutes > 0

    # Deadline conflict: task is due today or overdue and cannot fit completely today
    candidate_due_str = _parse_date_to_str(candidate.due_date) if candidate else ""
    is_due_today_or_overdue = bool(candidate_due_str and candidate_due_str <= today_date_str)
    has_deadline_conflict = is_due_today_or_overdue and not fits_today

    # Valid split only when today has genuine free time (> 0), candidate duration > free, and at least 15m can be completed today
    can_split = free_recovery_minutes > 0 and candidate_duration > free_recovery_minutes and free_recovery_minutes >= 15
    split_today_minutes = free_recovery_minutes if can_split else 0
    split_tomorrow_minutes = (candidate_duration - free_recovery_minutes) if can_split else 0

    # Overtime calculation: separate from normal capacity
    overtime_required_minutes = max(0, candidate_duration - free_recovery_minutes) if not fits_today else 0

    return {
        "time_remaining_minutes": time_remaining,
        "occupied_minutes": occupied_minutes,
        "free_recovery_minutes": free_recovery_minutes,
        "candidate_duration_minutes": candidate_duration,
        "fits_today": fits_today,
        "recommended_target": "today" if fits_today else "tomorrow",
        "has_deadline_conflict": has_deadline_conflict,
        "can_split": can_split,
        "split_today_minutes": split_today_minutes,
        "split_tomorrow_minutes": split_tomorrow_minutes,
        "overtime_required_minutes": overtime_required_minutes,
    }

def find_next_available_slot(
    tasks: List[Task],
    target_date_str: str,
    duration_minutes: int,
    earliest_start_hour: int = 7,
    latest_end_hour: int = 22
) -> Tuple[str, str]:
    """
    Finds the first non-overlapping available time window on target_date_str that can accommodate duration_minutes.
    Returns (start_time_str, end_time_str) in 'HH:MM' format.
    """
    day_tasks = [
        t for t in tasks
        if not t.completed and _parse_date_to_str(t.due_date) == target_date_str and t.due_time is not None
    ]
    occupied = []
    for t in day_tasks:
        start = _parse_time_to_minutes(t.due_time)
        dur = t.estimated_duration_minutes if getattr(t, 'estimated_duration_minutes', None) is not None else 30
        occupied.append((start, start + dur))
    
    occupied.sort(key=lambda x: x[0])
    
    curr = earliest_start_hour * 60
    end_limit = latest_end_hour * 60
    
    for (start, end) in occupied:
        if curr + duration_minutes <= start:
            break
        if curr < end:
            curr = end
            
    if curr + duration_minutes <= end_limit:
        slot_start_h, slot_start_m = curr // 60, curr % 60
        end_m_total = curr + duration_minutes
        slot_end_h, slot_end_m = end_m_total // 60, end_m_total % 60
        return f"{slot_start_h:02d}:{slot_start_m:02d}", f"{slot_end_h:02d}:{slot_end_m:02d}"
        
    end_m_total = earliest_start_hour * 60 + duration_minutes
    return f"{earliest_start_hour:02d}:00", f"{end_m_total // 60:02d}:{end_m_total % 60:02d}"

def calculate_task_score(task: Task, current_time_str: str, today_date_str: str) -> float:
    """
    Calculates deterministic task score (S = PriorityScore + OverdueBonus + DueTimeUrgency):
    - Priority: HIGH = 300, MEDIUM = 200, LOW = 100
    - OverdueBonus: +150 if due_date < today or (due_date == today and current_time > due_time)
    - DueTimeUrgency: 0..100 if upcoming due_time today: max(0, 100 - (due_time_mins - curr_mins) / 15)
    """
    if task.priority == PriorityEnum.HIGH:
        priority_score = 300.0
    elif task.priority == PriorityEnum.MEDIUM:
        priority_score = 200.0
    else:
        priority_score = 100.0

    curr_mins = _parse_time_to_minutes(current_time_str)
    task_date_str = _parse_date_to_str(task.due_date)

    is_overdue = False
    due_time_urgency = 0.0

    if task_date_str and task_date_str < today_date_str:
        is_overdue = True
    elif task_date_str == today_date_str or not task_date_str:
        if task.due_time is not None:
            task_due_mins = _parse_time_to_minutes(task.due_time)
            if curr_mins > task_due_mins:
                is_overdue = True
            else:
                diff_mins = task_due_mins - curr_mins
                due_time_urgency = max(0.0, 100.0 - (diff_mins / 15.0))

    overdue_bonus = 150.0 if is_overdue else 0.0

    return priority_score + overdue_bonus + due_time_urgency

def rank_tasks(tasks: List[Task], current_time_str: str, today_date_str: str) -> List[Tuple[Task, float]]:
    """
    Ranks tasks deterministically by:
    1. Score descending
    2. Earlier due_time first (tasks with due_time precede tasks without)
    3. Shorter estimated duration first
    4. Task ID ascending
    """
    scored_items: List[Tuple[Task, float]] = []
    for task in tasks:
        score = calculate_task_score(task, current_time_str, today_date_str)
        scored_items.append((task, score))

    def sort_key(item: Tuple[Task, float]):
        task, score = item
        if task.due_time is not None:
            due_time_key = (0, _parse_time_to_minutes(task.due_time))
        else:
            due_time_key = (1, 9999)
        
        duration = task.estimated_duration_minutes if getattr(task, 'estimated_duration_minutes', None) is not None else 30
        return (-score, due_time_key, duration, task.id)

    scored_items.sort(key=sort_key)
    return scored_items

def generate_replan_suggestion(
    tasks: List[Task],
    current_time_str: str,
    today_date_str: str,
    day_end_time_str: str = "23:00"
) -> ReplanSuggestion:
    """
    Executes greedy capacity allocation for today's incomplete tasks:
    - Calculates available capacity
    - Ranks tasks deterministically
    - Fits tasks into remaining capacity. If an oversized task does not fit,
      places it in move_to_tomorrow and CONTINUES evaluating remaining tasks.
    """
    available_minutes = calculate_available_minutes(current_time_str, day_end_time_str)

    uncompleted = [
        t for t in tasks 
        if not t.completed and (
            t.due_date is None or _parse_date_to_str(t.due_date) <= today_date_str
        )
    ]

    ranked = rank_tasks(uncompleted, current_time_str, today_date_str)

    remaining_capacity = available_minutes
    do_now: List[TaskRecommendation] = []
    move_to_tomorrow: List[TaskRecommendation] = []

    for task, score in ranked:
        duration = task.estimated_duration_minutes if getattr(task, 'estimated_duration_minutes', None) is not None else 30
        
        if duration <= remaining_capacity:
            reason = f"{duration} min task fits within remaining {remaining_capacity} min window tonight."
            do_now.append(
                TaskRecommendation(
                    id=task.id,
                    title=task.title,
                    priority=task.priority,
                    estimated_duration_minutes=duration,
                    due_time=task.due_time,
                    reason=reason,
                    score=round(score, 1)
                )
            )
            remaining_capacity -= duration
        else:
            reason = f"Exceeds remaining available capacity ({duration} min needed, {remaining_capacity} min left)."
            move_to_tomorrow.append(
                TaskRecommendation(
                    id=task.id,
                    title=task.title,
                    priority=task.priority,
                    estimated_duration_minutes=duration,
                    due_time=task.due_time,
                    reason=reason,
                    score=round(score, 1)
                )
            )

    fit_count = len(do_now)
    move_count = len(move_to_tomorrow)
    if not uncompleted:
        summary = "All clear! No uncompleted tasks scheduled for today."
    elif available_minutes == 0:
        summary = f"0 minutes remaining tonight. All {move_count} task(s) recommended for tomorrow."
    else:
        summary = (
            f"You have {available_minutes} minutes available tonight. "
            f"{fit_count} task(s) fit into your schedule tonight; {move_count} recommended for tomorrow."
        )

    return ReplanSuggestion(
        current_time=current_time_str,
        day_end_time=day_end_time_str,
        available_minutes=available_minutes,
        summary=summary,
        do_now=do_now,
        move_to_tomorrow=move_to_tomorrow
    )

def get_day_start_time_setting(db: Session) -> str:
    """Retrieves day_start_time from settings table. Defaults to '07:00' if missing or error occurs."""
    try:
        stmt = select(Setting).where(Setting.key == "day_start_time")
        setting = db.scalars(stmt).first()
        if setting and setting.value and setting.value.strip():
            return setting.value.strip()
    except Exception as e:
        print("Warning: Unable to read day_start_time setting from database, using fallback '07:00':", e)
    return "07:00"

def apply_replan_plan(db: Session, reschedule_task_ids: List[int], target_date: date) -> int:
    """
    Transactionally reschedules specified tasks to target_date:
    - Deduplicates task IDs
    - Verifies ALL requested tasks exist in database
    - Preserves title, description, priority, duration
    - Sets rescheduled_from_date = task.due_date
    - Updates due_date = target_date
    - Increments rescheduled_count
    - Performs atomic update (rolls back on any missing/invalid task)
    """
    unique_ids = list(dict.fromkeys(reschedule_task_ids))

    stmt = select(Task).where(Task.id.in_(unique_ids))
    tasks = list(db.scalars(stmt).all())
    found_ids = {t.id for t in tasks}

    missing_ids = [tid for tid in unique_ids if tid not in found_ids]
    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cannot apply plan: Tasks with IDs {missing_ids} do not exist."
        )

    try:
        for task in tasks:
            if task.due_date != target_date:
                task.rescheduled_from_date = task.due_date
                task.due_date = target_date
                task.rescheduled_count = (task.rescheduled_count or 0) + 1
        db.commit()
        return len(tasks)
    except Exception as err:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database transaction error while applying plan: {str(err)}"
        )

# ==================== Routine Planner Core Logic ====================

def _mins_to_time_str(m: int) -> str:
    h = (m // 60) % 24
    mins = m % 60
    return f"{h:02d}:{mins:02d}"

def generate_routine_plan_proposal(
    tasks: List[Task],
    target_date: date,
    day_start_time_str: str = "07:00",
    day_end_time_str: str = "22:00",
    fixed_commitments: Optional[List[dict]] = None
) -> dict:
    """
    Generates a realistic proposed daily plan without mutating the database:
    1. Understand available time between day_start and day_end.
    2. Accounts for fixed commitments (College, Class, Meeting, etc.) as unavailable blocks.
    3. Respects breaks (15-30m break after >= 90m continuous focus).
    4. Prioritizes candidate tasks by deadline urgency, priority, and duration.
    5. Fits tasks deterministically into available gaps without overlapping.
    6. Identifies overloaded day conditions and lists unscheduled tasks with deadline alerts.
    """
    if fixed_commitments is None:
        fixed_commitments = []

    date_str = target_date.isoformat()
    start_day_m = _parse_time_to_minutes(day_start_time_str)
    end_day_m = _parse_time_to_minutes(day_end_time_str)

    if end_day_m <= start_day_m:
        total_day_m = 0
    else:
        total_day_m = end_day_m - start_day_m

    # Process fixed commitments
    parsed_commitments: List[dict] = []
    for c in fixed_commitments:
        c_title = c.get("title", "Commitment") if isinstance(c, dict) else getattr(c, "title", "Commitment")
        c_start_raw = c.get("start_time", "00:00") if isinstance(c, dict) else getattr(c, "start_time", "00:00")
        c_end_raw = c.get("end_time", "00:00") if isinstance(c, dict) else getattr(c, "end_time", "00:00")
        c_id = c.get("id") if isinstance(c, dict) else getattr(c, "id", None)
        
        c_start = _parse_time_to_minutes(c_start_raw)
        c_end = _parse_time_to_minutes(c_end_raw)
        
        # Clip to day range
        clipped_start = max(start_day_m, c_start)
        clipped_end = min(end_day_m, c_end)
        
        if clipped_end > clipped_start:
            parsed_commitments.append({
                "id": c_id or f"commit-{c_start_raw}",
                "title": c_title,
                "start_m": clipped_start,
                "end_m": clipped_end,
                "start_time": _mins_to_time_str(clipped_start),
                "end_time": _mins_to_time_str(clipped_end),
                "duration": clipped_end - clipped_start
            })

    # Sort commitments by start time
    parsed_commitments.sort(key=lambda x: x["start_m"])
    commitments_minutes = sum(c["duration"] for c in parsed_commitments)
    available_capacity_minutes = max(0, total_day_m - commitments_minutes)

    # Build free gaps between day_start and day_end
    free_gaps: List[Tuple[int, int]] = []
    current_ptr = start_day_m

    for c in parsed_commitments:
        if c["start_m"] > current_ptr:
            free_gaps.append((current_ptr, c["start_m"]))
        current_ptr = max(current_ptr, c["end_m"])

    if current_ptr < end_day_m:
        free_gaps.append((current_ptr, end_day_m))

    # Separate tasks with duration and tasks without duration
    tasks_with_duration = [
        t for t in tasks
        if getattr(t, 'estimated_duration_minutes', None) is not None and t.estimated_duration_minutes > 0
    ]
    tasks_without_duration = [
        t for t in tasks
        if getattr(t, 'estimated_duration_minutes', None) is None or t.estimated_duration_minutes <= 0
    ]

    # Rank selected tasks with duration deterministically
    ranked_tuples = rank_tasks(tasks_with_duration, day_start_time_str, date_str)
    candidate_tasks = [t for t, _score in ranked_tuples]

    scheduled_timeline_items: List[dict] = []
    unscheduled_items: List[dict] = []
    breaks_minutes = 0

    # Add tasks without duration directly to unscheduled items
    for task in tasks_without_duration:
        task_due_str = _parse_date_to_str(task.due_date) if task.due_date else ""
        unscheduled_items.append({
            "task_id": task.id,
            "title": task.title,
            "estimated_duration_minutes": 0,
            "priority": task.priority,
            "deadline": task_due_str or None,
            "reason": "Set an estimated duration before this task can be planned.",
            "is_deadline_risk": False,
        })

    # Placement in free gaps
    for gap_start, gap_end in free_gaps:
        curr = gap_start
        continuous_work = 0

        while curr < gap_end and candidate_tasks:
            # Check if break is needed after >= 90 mins continuous focus
            if continuous_work >= 90:
                remaining_gap = gap_end - curr
                break_duration = 30 if remaining_gap >= 45 else (15 if remaining_gap >= 15 else 0)
                if break_duration > 0:
                    break_start_str = _mins_to_time_str(curr)
                    break_end_str = _mins_to_time_str(curr + break_duration)
                    scheduled_timeline_items.append({
                        "id": f"break-{curr}",
                        "item_type": "break",
                        "title": "Break",
                        "start_time": break_start_str,
                        "end_time": break_end_str,
                        "duration_minutes": break_duration,
                    })
                    curr += break_duration
                    breaks_minutes += break_duration
                    continuous_work = 0
                    continue

            # Find next task that fits in gap
            space_left = gap_end - curr
            fitting_idx = -1
            for idx, task in enumerate(candidate_tasks):
                task_dur = task.estimated_duration_minutes
                if task_dur <= space_left:
                    fitting_idx = idx
                    break

            if fitting_idx != -1:
                task = candidate_tasks.pop(fitting_idx)
                task_dur = task.estimated_duration_minutes
                t_start_str = _mins_to_time_str(curr)
                t_end_str = _mins_to_time_str(curr + task_dur)
                
                # Goal & milestone title helpers
                goal_title = task.goal.title if getattr(task, 'goal', None) else None
                milestone_title = task.milestone.title if getattr(task, 'milestone', None) else None
                deadline_str = _parse_date_to_str(task.due_date) if task.due_date else None

                scheduled_timeline_items.append({
                    "id": f"task-{task.id}",
                    "item_type": "task",
                    "title": task.title,
                    "start_time": t_start_str,
                    "end_time": t_end_str,
                    "duration_minutes": task_dur,
                    "task_id": task.id,
                    "priority": task.priority,
                    "goal_title": goal_title,
                    "milestone_title": milestone_title,
                    "deadline": deadline_str,
                    "is_deadline_risk": False,
                })

                curr += task_dur
                continuous_work += task_dur
            else:
                # No remaining task fits in the remaining space of this gap
                break

    # Add remaining candidate tasks as unscheduled
    for task in candidate_tasks:
        task_dur = task.estimated_duration_minutes
        task_due_str = _parse_date_to_str(task.due_date) if task.due_date else ""
        is_deadline_risk = bool(task_due_str and task_due_str <= date_str)
        
        if is_deadline_risk:
            if task_dur > available_capacity_minutes:
                reason = f"Deadline Risk: Due today, but task duration ({task_dur}m) exceeds usable planning time ({available_capacity_minutes}m)."
            else:
                reason = f"Deadline Risk: Due today, but the remaining schedule has no suitable slot ({task_dur}m required)."
        else:
            if task_dur > available_capacity_minutes:
                reason = f"Unscheduled: Task duration ({task_dur}m) exceeds usable planning time ({available_capacity_minutes}m)."
            else:
                reason = f"Unscheduled: The remaining schedule has no suitable slot ({task_dur}m required)."

        unscheduled_items.append({
            "task_id": task.id,
            "title": task.title,
            "estimated_duration_minutes": task_dur,
            "priority": task.priority,
            "deadline": task_due_str or None,
            "reason": reason,
            "is_deadline_risk": is_deadline_risk,
        })

    # Add commitments to timeline
    for c in parsed_commitments:
        scheduled_timeline_items.append({
            "id": c["id"],
            "item_type": "commitment",
            "title": c["title"],
            "start_time": c["start_time"],
            "end_time": c["end_time"],
            "duration_minutes": c["duration"],
        })

    # Sort entire timeline chronologically by start_time
    scheduled_timeline_items.sort(key=lambda item: _parse_time_to_minutes(item["start_time"]))

    # Calculate workload totals (only tasks with valid durations contribute)
    selected_workload_minutes = sum(
        t.estimated_duration_minutes for t in tasks_with_duration
    )
    scheduled_workload_minutes = sum(
        item["duration_minutes"] for item in scheduled_timeline_items if item["item_type"] == "task"
    )
    unscheduled_workload_minutes = sum(
        u["estimated_duration_minutes"] for u in unscheduled_items
    )

    is_overloaded = selected_workload_minutes > available_capacity_minutes or len(candidate_tasks) > 0
    overload_minutes = max(0, selected_workload_minutes - available_capacity_minutes)

    if is_overloaded and overload_minutes > 0:
        capacity_status = "overloaded"
        overload_h = overload_minutes // 60
        overload_m = overload_minutes % 60
        time_part = f"{overload_h}h {overload_m}m" if overload_h > 0 else f"{overload_m}m"
        summary = f"Your plan is overloaded. {time_part} of work does not fit today."
    elif len(candidate_tasks) > 0:
        capacity_status = "overloaded"
        summary = f"{len(candidate_tasks)} task(s) do not fit within the available time slots."
    elif len(tasks_without_duration) > 0 and len(scheduled_timeline_items) == 0:
        capacity_status = "enough"
        summary = f"{len(tasks_without_duration)} task(s) missing duration cannot be planned."
    elif scheduled_workload_minutes >= available_capacity_minutes * 0.85 and available_capacity_minutes > 0:
        capacity_status = "tight"
        summary = f"Schedule is tight ({scheduled_workload_minutes}m scheduled of {available_capacity_minutes}m capacity)."
    else:
        capacity_status = "enough"
        buffer_mins = max(0, available_capacity_minutes - scheduled_workload_minutes - breaks_minutes)
        summary = f"Realistic plan generated with {len([i for i in scheduled_timeline_items if i['item_type'] == 'task'])} task(s) and {buffer_mins}m buffer."

    return {
        "date": date_str,
        "day_start_time": day_start_time_str,
        "day_end_time": day_end_time_str,
        "total_day_minutes": total_day_m,
        "commitments_minutes": commitments_minutes,
        "breaks_minutes": breaks_minutes,
        "available_capacity_minutes": available_capacity_minutes,
        "selected_workload_minutes": selected_workload_minutes,
        "scheduled_workload_minutes": scheduled_workload_minutes,
        "unscheduled_workload_minutes": unscheduled_workload_minutes,
        "is_overloaded": is_overloaded,
        "overload_minutes": overload_minutes,
        "capacity_status": capacity_status,
        "summary": summary,
        "timeline": scheduled_timeline_items,
        "unscheduled_tasks": unscheduled_items,
    }

def apply_routine_plan(db: Session, plan_items: list, unscheduled_dispositions: Optional[list] = None) -> int:
    """
    Transactionally applies approved routine plan scheduling and unscheduled task dispositions:
    - Sets due_date, due_time, and tracks rescheduled_count
    - Applies dispositions (move_tomorrow, move_date, backlog, overtime)
    - Preserves all other task fields (goal, milestone, priority, duration, etc.)
    - Performs atomic update with rollback on failure
    """
    all_task_ids = [item.task_id if hasattr(item, 'task_id') else item['task_id'] for item in plan_items]
    if unscheduled_dispositions:
        for disp in unscheduled_dispositions:
            t_id = disp.task_id if hasattr(disp, 'task_id') else disp['task_id']
            if t_id not in all_task_ids:
                all_task_ids.append(t_id)

    if not all_task_ids:
        return 0

    stmt = select(Task).where(Task.id.in_(all_task_ids))
    tasks = {t.id: t for t in db.scalars(stmt).all()}

    missing_ids = [tid for tid in all_task_ids if tid not in tasks]
    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cannot apply plan: Tasks with IDs {missing_ids} do not exist."
        )

    try:
        updated_count = 0
        for item in plan_items:
            t_id = item.task_id if hasattr(item, 'task_id') else item['task_id']
            t_date = item.due_date if hasattr(item, 'due_date') else item['due_date']
            t_time_raw = item.due_time if hasattr(item, 'due_time') else item['due_time']

            task = tasks[t_id]
            if isinstance(t_date, str):
                t_date = date.fromisoformat(t_date)

            if task.due_date != t_date:
                task.rescheduled_from_date = task.due_date
                task.rescheduled_count = (task.rescheduled_count or 0) + 1
                task.due_date = t_date

            if isinstance(t_time_raw, str):
                parts = t_time_raw.split(":")
                task.due_time = time(hour=int(parts[0]), minute=int(parts[1]))
            elif isinstance(t_time_raw, time):
                task.due_time = t_time_raw

            updated_count += 1

        if unscheduled_dispositions:
            for disp in unscheduled_dispositions:
                t_id = disp.task_id if hasattr(disp, 'task_id') else disp['task_id']
                action = disp.action if hasattr(disp, 'action') else disp['action']
                target_date = disp.target_date if hasattr(disp, 'target_date') else (disp.get('target_date') if isinstance(disp, dict) else None)
                target_time = disp.target_time if hasattr(disp, 'target_time') else (disp.get('target_time') if isinstance(disp, dict) else None)

                task = tasks[t_id]
                if action in ("move_tomorrow", "move_date") and target_date:
                    if isinstance(target_date, str):
                        target_date = date.fromisoformat(target_date)
                    if task.due_date != target_date:
                        task.rescheduled_from_date = task.due_date
                        task.rescheduled_count = (task.rescheduled_count or 0) + 1
                        task.due_date = target_date
                    task.due_time = None
                    updated_count += 1
                elif action == "backlog":
                    task.due_date = None
                    task.due_time = None
                    updated_count += 1
                elif action == "overtime":
                    if target_date:
                        if isinstance(target_date, str):
                            target_date = date.fromisoformat(target_date)
                        task.due_date = target_date
                    if target_time:
                        parts = target_time.split(":")
                        task.due_time = time(hour=int(parts[0]), minute=int(parts[1]))
                    updated_count += 1

        db.commit()
        return updated_count
    except HTTPException:
        raise
    except Exception as err:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database transaction error while applying routine plan: {str(err)}"
        )


