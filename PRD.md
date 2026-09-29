# LifeOS — Master Product Requirements Document

## 1. Vision

LifeOS is a personal daily-life management workstation. It eliminates mental friction around deciding what to do, building key habits, tracking long-term goals, and optimizing daily productivity.

---

## 2. Product Evolution Phases

- **V0.1 (Task Management — COMPLETED)**: Reliable, fast 2D dark task management system (CRUD, priorities, due dates/times, Today/Upcoming/Completed views).
- **V0.2 (Smart Daily Planning — COMPLETED)**: Deterministic planning engine (`GET /planning/suggest`, `POST /planning/apply`, `SmartPlanWidget.tsx`, `estimated_duration_minutes`).
- **V0.3 (Personal Productivity Intelligence — PLANNING)**: Unified workstation integrating Habits, Goals & Milestones, Daily Review, and Deterministic Productivity Analytics.
- **V0.4 (Dynamic Replanning — FUTURE)**: Contextual schedule optimization.
- **V0.5 (AI Assistant — FUTURE)**: Conversational assistant over deterministic planning.

---

## 3. Target User

Initial target user: the developer himself, using LifeOS every single day as his primary personal operating system.

---

## 4. V0.3 Feature Scope (Productivity Intelligence)

### Habit Tracking
- Create, edit, archive habits (Daily / X days per week).
- Log completion per date with real-time `current_streak` and `best_streak` tracking.
- Embedded habit checklist in Today View.

### Goals & Milestones
- High-level goal tracking (Title, category, target date, status).
- Ordered goal milestones.
- Task alignment (`task.goal_id`).
- Automated goal progress bar based on linked task and milestone completion.

### Daily Review Workflow
- End-of-day reflection interface.
- Automatic summary of completed tasks, logged habits, and postponed tasks.
- 1–5 star productivity score + reflection notes (*"What went well"*, *"What was missed"*).

### Deterministic Productivity Analytics
- 7-day and 30-day task completion trends.
- Workload vs. capacity analysis.
- Repeat postponement warning flags.
- Habit consistency matrix.

---

## 5. Explicitly Out of Scope for V0.3

- LLM/AI prompt integrations (No third-party API dependencies).
- External Google/Outlook calendar 2-way sync.
- Multi-user collaboration, social feeds, or public leaderboards.
- Complex cloud microservices.

---

## 6. Success Criteria for V0.3

V0.3 is successful when the user can plan tasks, track core habits, link work to long-term goals, and perform a 2-minute end-of-day review daily for 30 consecutive days without leaving LifeOS.
