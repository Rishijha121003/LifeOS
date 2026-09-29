# LifeOS — Architecture (V0.1)

## 1. Architecture Goal

Keep V0.1 simple, modular, testable, and clean, while supporting both the Public Landing Experience and the Internal Application Workstation.

## 2. High-Level Architecture

```
Frontend (Landing Page / Auth / Bento Dashboard Workstation)
    ↓ REST API (HTTP JSON)
FastAPI (App Entry & Routers)
    ↓
Service / Business Logic Layer (CRUD & Filtering & Summary Stats)
    ↓
Data Access / Repository Layer (SQLAlchemy ORM)
    ↓
PostgreSQL Database
```

## 3. Backend Layers

### API / Router Layer (`app/api/`)
- HTTP routes under `/api/v1`
- Request/Response validation boundaries
- Error response handling

### Schema Layer (`app/schemas/`)
- Pydantic models for validation: `TaskCreate`, `TaskUpdate`, `TaskResponse`, `TaskFilterParams`

### Service Layer (`app/services/`)
- Business rules: task CRUD, state toggles (`complete`/`reopen`), filtering (by status, date, priority), statistics calculations.

### Model Layer (`app/models/`)
- SQLAlchemy ORM models (`Task` model with `id`, `title`, `description`, `due_date`, `due_time`, `priority`, `completed`, `created_at`, `updated_at`).

### Database Infrastructure (`app/db/`)
- Engine, SessionLocal, Base, and Alembic migrations.

## 4. Frontend Component Structure

Organized into modular view layers and reusable UI components:

```
src/
├── styles/             # Design Tokens (colors, typography, glass, spacing)
├── components/
│   ├── landing/        # Header, Hero 3D Showcase, Feature Chips, Footer
│   ├── auth/           # Login / Signup Split-Screen Form
│   ├── layout/         # Desktop Sidebar, Mobile TopBar & Bottom Nav
│   ├── dashboard/      # Bento Grid, Greeting Header, Progress Summary Card
│   ├── task/           # Task List, Task Card, Inline Quick Add, Task Modal/Drawer
│   └── ui/             # Reusable Buttons, Inputs, Priority Badges, Toasts, Skeletons
└── views/              # Landing, Login, Dashboard, Today, Upcoming, Completed
```

## 5. Future Extensibility

The architecture retains clean modular boundaries to seamlessly accept future engines:
- `app/services/replanning_service.py` (V0.4 Dynamic Replanning)
- `app/models/expense.py` (V0.2 Personal Finance)
- `app/models/habit.py` (V0.2 Habit Tracker)

## 6. Core Principle

Do not over-engineer. Implement clean modular boundaries without unneeded abstractions.
