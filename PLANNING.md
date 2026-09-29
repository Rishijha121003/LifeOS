[ignoring loop detection]
# LifeOS V0.2 — Smart Daily Planning Technical Specification (Finalized)

## 1. Product Overview & Behavior

LifeOS V0.2 evolves LifeOS from a passive task list into an active **Smart Daily Planner**. 

### Core Goal
Answer the fundamental user question in 2 seconds:
> *"Given the current time, today's remaining tasks, their priorities, and the time available tonight, what should I realistically do now vs. reschedule for tomorrow?"*

### Key Operating Principles
1. **Deterministic & Explainable**: No black-box AI models or hallucinations. Planning runs on a clear, predictable algorithm.
2. **User Approval First**: LifeOS **NEVER** reschedules, moves, or alters task dates automatically. Every replanning suggestion requires explicit user approval (`[Apply Plan]`).
3. **Seamless V0.1 Backward Compatibility**: All V0.1 task features, API routes, and database records remain 100% functional. Missing fields receive sensible defaults.

---

## 2. Configurable Day-End Time & Task Duration

### 2.1 Default & Editable Task Duration
- **Default Value**: `30 minutes` when not specified by the user.
- **Editability**: Fully editable during task creation or task editing.
- **V0.1 Fallback**: Any existing V0.1 task without an `estimated_duration_minutes` value is treated as `30 minutes` by the planning engine.

### 2.2 Configurable Day-End Cutoff (`day_end_time`)
- **Default Value**: `"23:00"` (11:00 PM local time).
- **Configuration Storage**: Stored as a simple user setting key `day_end_time` in a lightweight `settings` table or passed via client parameter (`?day_end_time=23:00`).
- **No Complex Settings System**: Uses a simple key-value configuration model (`key="day_end_time"`, `value="23:00"`).

---

## 3. Exact Deterministic Planning Algorithm

The planning engine processes tasks using a 4-step deterministic greedy capacity allocation model.

### Step 1: Available Time Calculation
Let $T_{\text{current}}$ be local time (e.g. `"21:00"` = 1260 mins from midnight).  
Let $T_{\text{end}}$ be configured `day_end_time` (e.g. `"23:00"` = 1380 mins from midnight).

$$\text{available\_minutes} = \max\left(0, \text{minutes}(T_{\text{end}}) - \text{minutes}(T_{\text{current}})\right)$$

*Example*: At 9:00 PM with 11:00 PM cutoff $\rightarrow$ **120 Available Minutes**.

### Step 2: Task Scoring Formula
For each uncompleted task $T_i$ belonging to today or earlier (`due_date <= today`):

$$S(T_i) = P(T_i) + O(T_i) + U(T_i)$$

Where:
1. **Priority Score $P(T_i)$**:
   - `high` $\rightarrow$ `300`
   - `medium` $\rightarrow$ `200`
   - `low` $\rightarrow$ `100`

2. **Overdue / Missed Bonus $O(T_i)$**:
   - If task has `due_time` and $T_{\text{current}} > T_i.\text{due\_time}$: `+150`
   - If $T_i.\text{due\_date} < \text{today}$: `+150`
   - Otherwise: `0`

3. **Due Time Urgency $U(T_i)$**:
   - If task has upcoming `due_time` today:
     $$U(T_i) = \max\left(0, 100 - \frac{\text{minutes}(T_i.\text{due\_time}) - \text{minutes}(T_{\text{current}})}{15}\right)$$
   - If task has no `due_time`: `0`

### Step 3: Deterministic Sorting & Tie-Breaking Rules
All tasks are sorted in descending order according to the following strict hierarchy:

1. **Primary Sort**: Score $S(T_i)$ (descending)
2. **First Tie-Breaker**: Earlier `due_time` first (tasks with `due_time` precede tasks without `due_time`)
3. **Second Tie-Breaker**: Shortest `estimated_duration_minutes` first (shorter tasks preferred on equal score)
4. **Third Tie-Breaker**: Task ID `id` (ascending; guarantees 100% deterministic ordering)

### Step 4: Greedy Capacity Allocation Strategy
Initialize `remaining_capacity = available_minutes`.  
Iterate through the sorted tasks array:

For each task $T_i$ with duration $D_i = T_i.\text{estimated\_duration\_minutes}$:

- **If $D_i \le \text{remaining\_capacity}$**:
  - Place $T_i$ into `do_now` list.
  - Update remaining capacity: $\text{remaining\_capacity} \leftarrow \text{remaining\_capacity} - D_i$.
  - Assign Rationale: `"$D_i$ min task fits within remaining $\text{available\_minutes}$ min window tonight."`

- **Else ($D_i > \text{remaining\_capacity}$)**:
  - Place $T_i$ into `move_to_tomorrow` list.
  - Assign Rationale: `"Exceeds remaining available time ($D_i$ min needed, $\text{remaining\_capacity}$ min left)."`.

---

## 4. Database Schema Changes

We add 3 optional columns to the `tasks` table and 1 key-value settings table:

```sql
-- 1. Tasks table updates
ALTER TABLE tasks ADD COLUMN estimated_duration_minutes INTEGER DEFAULT 30;
ALTER TABLE tasks ADD COLUMN rescheduled_from_date DATE NULL;
ALTER TABLE tasks ADD COLUMN rescheduled_count INTEGER DEFAULT 0;

-- 2. Minimal Settings table
CREATE TABLE settings (
    key VARCHAR(50) PRIMARY KEY,
    value VARCHAR(255) NOT NULL
);

INSERT INTO settings (key, value) VALUES ('day_end_time', '23:00');
```

---

## 5. API Design Contract

Module: `app/api/v1/endpoints/planning.py`

### 5.1 `GET /api/v1/planning/suggest`
Generates a smart replanning recommendation without modifying database records.

- **Query Parameters**: `day_end_time` (optional, defaults to database setting or `"23:00"`)
- **Response**:
```json
{
  "current_time": "21:00",
  "day_end_time": "23:00",
  "available_minutes": 120,
  "summary": "120 mins remaining. 2 tasks recommended for tonight, 1 recommended for tomorrow.",
  "do_now": [
    {
      "id": 1,
      "title": "DSA Practice",
      "priority": "high",
      "estimated_duration_minutes": 45,
      "due_time": "18:00",
      "reason": "Overdue high-priority task fitting available time."
    }
  ],
  "move_to_tomorrow": [
    {
      "id": 4,
      "title": "System Architecture Review",
      "priority": "low",
      "estimated_duration_minutes": 90,
      "reason": "Exceeds remaining available time (90 min needed, 75 min left)."
    }
  ]
}
```

### 5.2 `POST /api/v1/planning/apply`
Executes user-approved task rescheduling.

- **Request Body**:
```json
{
  "reschedule_task_ids": [4],
  "target_date": "2026-08-22"
}
```
- **Response**: `{"status": "success", "updated_count": 1}`

---

## 6. UI Component Layout

A clean 2D widget (`SmartPlanWidget.tsx`) embedded directly at the top of `DashboardView.tsx`:

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ ⚡ Smart Daily Plan                                                             │
│ Current Time: 9:00 PM  •  Available: ~120 mins remaining                       │
│                                                                                │
│ 🎯 DO TONIGHT (45 mins)                                                        │
│   ○ DSA Practice                    [HIGH]   45 min   (Overdue 6:00 PM)        │
│                                                                                │
│ 📅 RECOMMENDED FOR TOMORROW                                                    │
│   ○ System Architecture Review     [LOW]    90 min                            │
│                                                                                │
│  [ Apply Recommended Plan ]     [ Custom Edit ]     [ Dismiss ]                │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Edge Case Handling Matrix

| Scenario | System Behavior |
|---|---|
| **No tasks today** | Widget displays: *"All clear! No pending tasks for today."* |
| **All tasks completed** | Widget displays: *"Great job! 100% of today's tasks are completed."* |
| **Task missing duration** | Defaults to `30 min` duration. |
| **Overdue tasks** | Highlighted with overdue badge; receives `+150` bonus score. |
| **Repeatedly postponed task** | If `rescheduled_count >= 3`, displays indicator: *"Postponed 3 times."* |
| **Midnight rollover** | Detects local date rollover dynamically via system clock. |

---

## 8. Test Strategy & Test Cases

Backend test suite (`tests/test_planning.py`):
1. `test_calculate_available_minutes`: Validates time math for various `current_time` and `day_end_time` values.
2. `test_scoring_and_sorting`: Verifies priority, overdue bonus, due time urgency, and tie-breaker sorting.
3. `test_greedy_allocation_fits_capacity`: Verifies tasks exceeding capacity are pushed to `move_to_tomorrow`.
4. `test_apply_planning`: Verifies `POST /api/v1/planning/apply` updates task due dates and increments `rescheduled_count`.

---

## 9. Phased Implementation Order (When Command Given)

- [ ] **Phase 1: Database Migration**: Alembic script for `estimated_duration_minutes`, `rescheduled_from_date`, `rescheduled_count`, `settings`.
- [ ] **Phase 2: Planning Service**: `app/services/planning_service.py` with deterministic ranking & greedy allocation.
- [ ] **Phase 3: REST API Endpoints**: `app/api/v1/endpoints/planning.py` (`GET /suggest`, `POST /apply`).
- [ ] **Phase 4: Frontend Service & Types**: Update `src/types/task.ts` and `src/api/tasks.ts`.
- [ ] **Phase 5: UI Integration**: Build `SmartPlanWidget.tsx` and integrate into `DashboardView.tsx`.
- [ ] **Phase 6: QA & Test Suite**: Run `pytest` & `npm run build`.

---

**STATUS: SPECIFICATION FINALIZED. NO APPLICATION CODE WRITTEN.**
