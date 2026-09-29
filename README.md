# LifeOS — V0.1 Release

LifeOS is a personal productivity operating system designed for daily focus and task management.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Vanilla CSS Design System (#0B0E14 dark theme)
- **Backend**: FastAPI, SQLAlchemy 2.0, Pydantic v2
- **Database**: PostgreSQL (Production Target) with automatic SQLite local dev fallback
- **Migrations**: Alembic

---

## 🚀 Quickstart Guide

### 1. Backend Server (FastAPI)
```bash
# Activate virtual environment
source venv/bin/activate

# Start API server on http://localhost:8000
PYTHONPATH=. uvicorn app.main:app --reload --port 8000
```
- Interactive API Docs: `http://localhost:8000/docs`

### 2. Frontend Application (React + Vite)
```bash
cd frontend

# Run development server on http://localhost:3000
npm run dev -- --port 3000
```

---

## 🧪 Verification & Testing

```bash
# Backend Pytest Unit Tests
source venv/bin/activate && PYTHONPATH=. pytest -v

# Frontend TypeScript & Production Build
cd frontend
npx tsc --noEmit && npm run build
```

---

## 🎯 V0.1 Product Scope
- Clean 2D Dark Productivity Dashboard
- Task Management: Create, Retrieve, Update, Complete, Reopen, Delete
- View Filters: Today, Upcoming (Tomorrow / Later), Completed
- Compact Metrics: Total Tasks, Completed, Remaining, Progress %
