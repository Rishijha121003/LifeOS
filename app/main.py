from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import tasks, planning, habits, goals, reviews, analytics, resources
from app.db.base import Base
from app.db.session import engine

# Ensure DB tables are created on startup
Base.metadata.create_all(bind=engine)

def _ensure_sqlite_schema():
    if "sqlite" in str(engine.url):
        from sqlalchemy import text
        try:
            with engine.begin() as conn:
                task_cols = [c[1] for c in conn.execute(text("PRAGMA table_info(tasks)")).fetchall()]
                if task_cols:
                    if "status" not in task_cols:
                        conn.execute(text("ALTER TABLE tasks ADD COLUMN status VARCHAR(20) DEFAULT 'NOT_STARTED' NOT NULL"))
                    if "actual_duration_minutes" not in task_cols:
                        conn.execute(text("ALTER TABLE tasks ADD COLUMN actual_duration_minutes INTEGER DEFAULT 0 NOT NULL"))
                    if "milestone_id" not in task_cols:
                        conn.execute(text("ALTER TABLE tasks ADD COLUMN milestone_id INTEGER REFERENCES goal_milestones(id) ON DELETE SET NULL"))
                
                gm_cols = [c[1] for c in conn.execute(text("PRAGMA table_info(goal_milestones)")).fetchall()]
                if gm_cols and "status" not in gm_cols:
                    conn.execute(text("ALTER TABLE goal_milestones ADD COLUMN status VARCHAR(20) DEFAULT 'NOT_STARTED' NOT NULL"))
        except Exception as e:
            print("Notice: SQLite schema check:", e)

from app.db.seed import seed_data_if_empty

_ensure_sqlite_schema()
seed_data_if_empty()



app = FastAPI(
    title="LifeOS API",
    description="Personal Operating System — V0.3 Task Management, Planning & Intelligence REST API",
    version="0.3.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for local development and future React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include task management, planning & intelligence endpoints
app.include_router(tasks.router, prefix="/api/v1/tasks", tags=["tasks"])
app.include_router(planning.router, prefix="/api/v1/planning", tags=["planning"])
app.include_router(habits.router, prefix="/api/v1/habits", tags=["habits"])
app.include_router(goals.router, prefix="/api/v1/goals", tags=["goals"])
app.include_router(reviews.router, prefix="/api/v1/reviews", tags=["reviews"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(resources.router, prefix="/api/v1/resources", tags=["resources"])

@app.get("/")
def root():
    return {
        "project": "LifeOS API",
        "version": "0.1.0",
        "status": "online",
        "docs": "/docs"
    }
