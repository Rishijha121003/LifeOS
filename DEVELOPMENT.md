# LifeOS — Development Rules & Workflow (V0.1)

## 1. Development Philosophy

LifeOS is a **learning-first project**.

- The developer must understand the codebase being added.
- AI coding tools accelerate implementation, but must **never** replace core understanding.
- Do not blindly generate boilerplate without inspecting structure.

## 2. Phased Build Order

### Phase 1: Backend & Database Foundation
1. Project structure initialization (`app/`, `tests/`)
2. Database connection & SQLAlchemy setup (`app/db/`)
3. Task database model (`app/models/task.py`)
4. Pydantic schemas (`app/schemas/task.py`)
5. Service / CRUD layer (`app/services/task_service.py`)
6. REST API routes (`app/api/v1/endpoints/tasks.py`)
7. Automated test suite (`pytest` for CRUD, filtering, & error states)

### Phase 2: Frontend Setup & Design System
8. Frontend setup & CSS design tokens (`--bg-primary`, `--accent-gradient`, `--surface-glass`)
9. Base UI components (Buttons, Inputs, Badges, Checkboxes, Toasts)

### Phase 3: Public Landing Page & Auth UX
10. Glassmorphic Navigation Header & Hero section
11. 3D Isometric LifeOS Workspace showcase component
12. Split-screen Authentication / Login view

### Phase 4: Internal Bento Dashboard & Task Views
13. Sidebar / Mobile bottom navigation layout
14. Bento Dashboard (Greeting, Focus Task List, Progress metrics)
15. Today, Upcoming, and Completed views
16. Quick Add inline bar + Full Add Task modal/drawer

### Phase 5: Testing, Polish & Definition of Done
17. Responsive layout verification (Desktop, Laptop, Tablet, Mobile)
18. End-to-end integration testing & manual QA

## 3. Working Rule

Before writing code:
- Inspect existing code and dependencies.
- Identify the smallest required change.

After writing code:
- Run tests and check logs.
- Verify user experience manually.
- Avoid accumulating untested changes.

## 4. Definition of Done

A feature is done ONLY when it:
- Works cleanly end-to-end.
- Is fully tested.
- Respects design tokens and accessibility guidelines.
- Does not break existing functionality.
