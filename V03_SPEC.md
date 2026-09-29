# LifeOS V0.3 — Personal Productivity Intelligence
## Product Specification & Technical Architecture

---

## 1. Product Vision

LifeOS V0.3 evolves the system from a task manager (**V0.1**) and daily replanning engine (**V0.2**) into a unified **Personal Productivity Intelligence System**.

While V0.1 answers *"What tasks do I have?"* and V0.2 answers *"What can I realistically finish tonight?"*, V0.3 answers:

> *"How effectively am I spending my time, building core habits, and progressing toward my long-term goals—and what adjustments will make me consistently productive?"*

LifeOS V0.3 integrates **Tasks**, **Habits**, **Goals & Milestones**, **End-of-Day Reviews**, and **Productivity Analytics** into a clean, privacy-first, 2D dark workstation.

---

## 2. Problems V0.3 Solves

1. **Isolation of Tasks from Long-Term Goals**: Users complete daily tasks without visibility into whether those tasks move the needle on key goals.
2. **Lack of Habit Consistency**: Daily task lists fail to track recurring behaviors (e.g., DSA practice, exercise, reading) that require streak and frequency tracking.
3. **Unconscious Postponement & Overcommitment**: Users repeatedly push tasks without realizing systemic underestimation or unrealistic daily planning.
4. **Missing Closure & Reflection**: Days end without a structured review of completed work, leading to productivity anxiety and lack of historical awareness.
5. **Shallow Data & No Real Insights**: Productivity tools show vanity metrics or AI hallucinations instead of actionable, deterministic patterns derived from actual user data.

---

## 3. Feature List

### 3.1 Habit Tracking (`/habits`)
- **Habit Definitions**: Title, description, frequency (daily or X days/week), priority, target color/badge.
- **Habit Log & Streaks**: Mark completed per day; real-time calculation of `current_streak`, `best_streak`, and 30-day completion history heatmaps.
- **Today Integration**: Habits due today appear in the Today & Dashboard workstations alongside tasks.

### 3.2 Goals & Milestones (`/goals`)
- **Goal Hierarchy**: Title, description, target date, category (e.g., Career, Health, Learning), status (`active`, `completed`, `archived`).
- **Milestones**: Breakdown of goals into ordered milestone checkpoints.
- **Task Alignment**: Direct linking of tasks to goals (`task.goal_id`).
- **Goal Progress Engine**: Progress calculated via weighted completion of milestones and linked tasks.

### 3.3 End-of-Day Guided Review (`/review`)
- **Evening Review Workflow**: Triggered manually or suggested after `day_end_time`.
- **Structured Summary**: Automatic aggregation of tasks completed, habits logged, and tasks rescheduled today.
- **Reflection Inputs**: 1–5 productivity score rating, short reflection notes (*"What went well"*, *"What was missed"*).
- **Historical Journal**: Archival timeline of past daily reviews.

### 3.4 Deterministic Productivity Analytics (`/analytics`)
- **Completion Rates**: Daily, 7-day, and 30-day task completion rates.
- **Workload vs. Capacity**: Estimated vs. actual completed workload minutes per day.
- **Postponement Insights**: Tracking repeat rescheduling patterns (e.g., *"You postponed High Priority tasks 4 times this week"*).
- **Habit Consistency**: Streak health scores and habit completion percentage grids.
- **Priority Distribution**: Breakdown of completed vs. pending tasks by priority.

### 3.5 Timeline / Visual Calendar (`/timeline`)
- **Chronological Workload View**: Visual hourly schedule for tasks with `due_time` + `estimated_duration_minutes`.
- **Multi-Day Timeline**: View upcoming week's tasks and habits in a clean horizontal or vertical calendar grid.

### 3.6 Smart Planning V0.3 Enhancements
- **Overload Warnings**: Identifies days where total estimated duration exceeds available waking hours.
- **Postponement Flags**: Highlights tasks rescheduled $>3$ times inside `SmartPlanWidget` with advisory notes.
- **Deterministic Rationale**: Enhanced human-readable explanations in `GET /planning/suggest`.

### 3.7 Personalization & Settings (`/settings`)
- Editable `day_end_time` (default `"23:00"`).
- Editable `default_task_duration` (default `30` min).
- Toggle preferences for habits and daily review prompts.

### 3.8 Global Search & Advanced Filtering
- Search bar in topbar for instant title/description filtering across tasks, habits, and goals.
- Multi-dimensional filters: priority, completion state, goal alignment, due date ranges.

---

## 4. Feature Prioritization Matrix

| Feature | Priority Tier | Rationale |
|---|---|---|
| **Habit Tracking & Streaks** | **MUST HAVE** | Core pillar of personal productivity intelligence; fits existing database model cleanly. |
| **Goals & Milestones + Task Linking** | **MUST HAVE** | Links daily execution to high-level objectives; high user value. |
| **Daily Review Workflow** | **MUST HAVE** | Provides closure, historical tracking, and structured reflection. |
| **Productivity Analytics & Insights** | **MUST HAVE** | Solves the V0.3 intelligence mandate using deterministic queries. |
| **Timeline / Visual Schedule** | **SHOULD HAVE** | Greatly improves workload visibility and due-time planning. |
| **Smart Planning V0.3 Overload Alerts** | **SHOULD HAVE** | Iterates on V0.2 engine without breaking backend algorithm. |
| **Settings & Personalization UI** | **SHOULD HAVE** | Exposes `day_end_time` and default duration in UI. |
| **Global Search & Filter** | **NICE TO HAVE** | Quality-of-life UX improvement for large task lists. |
| **Export / Data Backup (JSON)** | **NICE TO HAVE** | Privacy-friendly backup of user productivity data. |
| *LLM / AI Prompt Integrations* | **POSTPONED** | Violates deterministic core principle; adds external API latency and cost. |
| *Google/Outlook Calendar 2-Way Sync* | **POSTPONED** | Requires OAuth2 token management, webhooks, and cloud infrastructure. |
| *Social / Team Collaboration* | **POSTPONED** | Out of scope; LifeOS is strictly a personal workstation. |

---

## 5. User Flows

### Flow 1: Daily Execution & Habit Logging
1. User opens LifeOS Dashboard.
2. `SmartPlanWidget` displays recommended plan for tonight.
3. User checks off completed tasks and logs daily habits (e.g. *"DSA Practice — Completed"*).
4. Streak counter increments automatically (`Streak: 5 days 🔥`).

### Flow 2: End-of-Day Review
1. At 10:00 PM, user clicks **Start Daily Review** on the dashboard.
2. Screen presents summary of today's completed tasks (4/5) and habits (2/2).
3. User selects a 4/5 star rating and types a brief reflection (*"Finished FastAPI integration, need to start DSA earlier tomorrow"*).
4. User clicks **Complete Review** $\rightarrow$ review is saved, and Smart Plan prompts carry-over for remaining uncompleted tasks.

### Flow 3: Goal & Milestone Tracking
1. User navigates to **Goals** view.
2. Creates goal: *"Master System Design"* with target date 3 months out.
3. Adds milestones: *"Read Designing Data-Intensive Applications"*, *"Build Distributed Cache"*.
4. Creates a new task in Today View and links it to *"Master System Design"*.
5. Marking task complete automatically advances goal progress bar.

---

## 6. Database Changes (PostgreSQL / SQLite)

V0.3 introduces 4 new tables and adds foreign key relationships to `tasks`.

```sql
-- 1. Habits Table
CREATE TABLE habits (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    frequency_type VARCHAR(20) NOT NULL DEFAULT 'daily', -- 'daily', 'weekly'
    target_days_per_week INTEGER DEFAULT 7,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Habit Logs Table
CREATE TABLE habit_logs (
    id SERIAL PRIMARY KEY,
    habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    completed_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_habit_date UNIQUE (habit_id, completed_date)
);

-- 3. Goals Table
CREATE TABLE goals (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    category VARCHAR(50) DEFAULT 'General',
    target_date DATE NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'completed', 'archived'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Goal Milestones Table
CREATE TABLE goal_milestones (
    id SERIAL PRIMARY KEY,
    goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    due_date DATE NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Daily Reviews Table
CREATE TABLE daily_reviews (
    id SERIAL PRIMARY KEY,
    review_date DATE NOT NULL UNIQUE,
    productivity_rating INTEGER CHECK (productivity_rating BETWEEN 1 AND 5),
    notes TEXT NULL,
    completed_tasks_count INTEGER DEFAULT 0,
    rescheduled_tasks_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Link Tasks to Goals
ALTER TABLE tasks ADD COLUMN goal_id INTEGER NULL REFERENCES goals(id) ON DELETE SET NULL;
```

---

## 7. API Changes (REST Contracts)

### New Endpoints

#### Habits API (`/api/v1/habits`)
- `GET /api/v1/habits/` — List all active habits with current streak data.
- `POST /api/v1/habits/` — Create new habit.
- `PATCH /api/v1/habits/{id}` — Update habit definition.
- `POST /api/v1/habits/{id}/log` — Toggle completion log for a specific date (`YYYY-MM-DD`).
- `DELETE /api/v1/habits/{id}` — Delete or archive habit.

#### Goals API (`/api/v1/goals`)
- `GET /api/v1/goals/` — List goals with calculated progress percentage and milestones.
- `POST /api/v1/goals/` — Create a goal.
- `POST /api/v1/goals/{id}/milestones` — Add milestone to goal.
- `PATCH /api/v1/goals/milestones/{milestone_id}` — Toggle milestone completion.

#### Daily Review API (`/api/v1/reviews`)
- `GET /api/v1/reviews/` — List past daily reviews.
- `GET /api/v1/reviews/today` — Get today's review status & auto-aggregated stats.
- `POST /api/v1/reviews/` — Submit daily review.

#### Analytics API (`/api/v1/analytics`)
- `GET /api/v1/analytics/summary` — Returns weekly completion rates, habit consistency, priority breakdown, and postponement insights.

---

## 8. Frontend Architecture Changes

Expand navigation tabs in `Sidebar.tsx` and `MobileNav.tsx`:
- `Dashboard` (`/`)
- `Today` (`/today`)
- `Upcoming` (`/upcoming`)
- `Habits` (`/habits`) — *New*
- `Goals` (`/goals`) — *New*
- `Timeline` (`/timeline`) — *New*
- `Analytics` (`/analytics`) — *New*
- `Completed` (`/completed`)
- `Settings` (`/settings`) — *Enhanced*

New Component Directory Layout:
```
frontend/src/
├── components/
│   ├── habits/         # HabitCard, HabitGrid, HabitModal
│   ├── goals/          # GoalCard, MilestoneList, AddGoalModal
│   ├── review/         # DailyReviewModal, ReviewSummary
│   ├── analytics/      # MetricCard, CompletionChart, InsightBanner
│   └── timeline/        # TimelineView, TimeBlockCard
├── pages/
│   ├── HabitsView.tsx
│   ├── GoalsView.tsx
│   ├── AnalyticsView.tsx
│   ├── TimelineView.tsx
│   └── ReviewView.tsx
```

---

## 9. UI/UX Changes & Design System

- Maintain strict adherence to V0.1/V0.2 2D dark productivity UI:
  - Base background: `#0B0E14`
  - Surfaces: `#111827`, `#151B2B`
  - Accent colors: Indigo (`#6366F1`), Violet (`#8B5CF6`), Emerald (`#10B981`), Amber (`#F59E0B`)
- **No 3D, glassmorphism excess, or heavy animations.**
- Card components feature subtle 1px borders (`rgba(255, 255, 255, 0.08)`) and high typography contrast.

---

## 10. Analytics & Data Requirements

All insights are calculated deterministically from local PostgreSQL/SQLite data. Zero external telemetry or fake numbers.

### Deterministic Insight Rules:
1. **Completion Rate**: $\frac{\text{Completed Tasks}}{\text{Total Tasks Scheduled}} \times 100$ over 7-day rolling window.
2. **Postponement Insight**: Triggered when a task has `rescheduled_count >= 3`.
3. **Workload Variance**: Compares sum of `estimated_duration_minutes` against daily capacity.

---

## 11. Privacy Considerations

- **100% Local / Self-Hosted Data**: All data resides in the user's PostgreSQL database.
- **Zero Third-Party Tracking**: No telemetry, analytics scripts, or cloud AI services.
- **Data Portability**: Full JSON export/import supported in Settings.

---

## 12. Edge Cases

- **Habit Logging Across Timezones**: Habit logs use explicit ISO date strings (`YYYY-MM-DD`) based on local client timezone.
- **Goal Progress with 0 Tasks/Milestones**: Displays `0%` progress cleanly without division-by-zero errors.
- **Unfinished Daily Reviews**: Review modal preserves scratchpad state in local storage if closed prematurely.

---

## 13. Testing Strategy

- **Backend**: Pytest unit tests for Habit streak calculations, Goal progress math, and Analytics aggregations. Target: 45+ backend tests passing.
- **Frontend**: `npx tsc --noEmit` and production Vite build validation.

---

## 14. Migration Strategy

- Use **Alembic** migration script `v0_3_habits_goals_analytics.py`.
- Ensure all foreign keys use `NULL` or default values so existing V0.1/V0.2 database records upgrade seamlessly.

---

## 15. Implementation Phases (Execution Order)

1. **Phase 1: Database Schemas & Alembic Migration** (Habits, Goals, Milestones, Daily Reviews).
2. **Phase 2: Backend Services & REST APIs** (Habit service, Goal service, Review service, Analytics service).
3. **Phase 3: Habit & Goal Frontend Workstations** (`HabitsView`, `GoalsView`, task linking).
4. **Phase 4: Daily Review & Timeline Workstations** (`DailyReviewModal`, `TimelineView`).
5. **Phase 5: Productivity Analytics & Insights Dashboard** (`AnalyticsView`).
6. **Phase 6: Integration, QA & Documentation Finalization**.

---

## 16. V0.3 Definition of Done

1. Database schema migrated cleanly via Alembic.
2. Habits, Goals, Daily Review, and Analytics views fully functional in frontend.
3. Tasks can be linked to Goals with dynamic progress tracking.
4. Smart Planning V0.3 includes overload alerts and repeat postponement warnings.
5. All backend tests pass (`pytest`).
6. Frontend type check (`npx tsc --noEmit`) and build (`npm run build`) pass with 0 errors.

---

## 17. Explicit Non-Goals for V0.3

- **NO AI/LLM Integration**: No OpenAI/Anthropic API calls or prompt engineering.
- **NO Calendar Sync**: No Google/Outlook OAuth integrations.
- **NO Multi-User / Cloud Collaboration**: Strictly single-user personal system.
- **NO Financial / Expense Tracking**: Deferred to future specialized modules.
