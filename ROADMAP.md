# LifeOS — Roadmap

## V0.1 — Foundation & 2D Dark UI (COMPLETED & FROZEN)
- Tasks CRUD (Create, Retrieve, Update, Complete, Reopen, Delete)
- Today, Upcoming, Completed views
- Priority & Due dates
- Dashboard statistics & 1:1 data consistency
- 100% Pytest unit tests & TypeScript build passing

## V0.2 — Smart Daily Planning Engine (COMPLETED & FROZEN)
- Deterministic replanning engine (`PLANNING.md`)
- Task duration estimation (`estimated_duration_minutes`)
- Available time calculation & missed-task detection
- User-approved carry-forward to tomorrow (`[Apply Plan]`)
- RESTful endpoints (`GET /planning/suggest`, `POST /planning/apply`)
- Embedded 2D `SmartPlanWidget.tsx` & `ApplyPlanModal.tsx`
- 28/28 Pytest tests passing & 0 TypeScript errors

## V0.3 — Personal Productivity Intelligence (PLANNING PHASE)
- **Habit Tracking & Streaks**: Habit definitions, completion logging, current/best streak calculations, daily habit checklist.
- **Goals & Milestones**: Goal breakdown into milestones, linking tasks to goals, automated goal progress tracking.
- **Guided Daily Review**: End-of-day reflection workflow, productivity rating (1-5 stars), reflection notes, historical review archive.
- **Deterministic Analytics**: 7-day/30-day task completion rates, workload vs. capacity analysis, repeat postponement insights.
- **Timeline / Visual Schedule**: Chronological hourly workload calendar and multi-day timeline.
- **Smart Planning V0.3 Enhancements**: Overload alerts and repeated postponement warning flags in `SmartPlanWidget`.

## V0.4 — Dynamic Contextual Replanning
- Real-time schedule adaptation based on calendar events, energy levels, and time-block tracking.

## V0.5 — AI Personal Assistant
- Natural language query interaction and conversational schedule explanations over deterministic planning engine.

## V1.0 — Stable Personal Product
- Polished, single-user, privacy-first personal daily operating system.
