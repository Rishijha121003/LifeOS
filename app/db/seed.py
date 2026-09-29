from datetime import date, timedelta, time
from app.db.session import SessionLocal
from app.models.task import Task, PriorityEnum
from app.models.goal import Goal, GoalMilestone
from app.models.habit import Habit, HabitLog
from app.models.resource import Resource

def seed_resources_if_empty():
    db = SessionLocal()
    try:
        if db.query(Resource).count() == 0:
            sample_resources = [
                Resource(
                    title="FastAPI Documentation",
                    description="Interactive tutorial, dependency injection, and Pydantic validation.",
                    url="https://fastapi.tiangolo.com/",
                    category="Backend",
                    order_index=1
                ),
                Resource(
                    title="NeetCode 150 Algorithms",
                    description="Categorized DSA practice with video explanations & patterns.",
                    url="https://neetcode.io/practice",
                    category="DSA",
                    order_index=2
                ),
                Resource(
                    title="ByteByteGo System Design",
                    description="Visual architecture cheatsheets and scaling patterns.",
                    url="https://bytebytego.com/",
                    category="System Design",
                    order_index=3
                ),
            ]
            db.add_all(sample_resources)
            db.commit()
            print("Successfully seeded resources sample data!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding resources: {e}")
    finally:
        db.close()

def seed_data_if_empty():
    seed_resources_if_empty()
    db = SessionLocal()
    try:
        task_count = db.query(Task).count()
        if task_count > 0:
            print(f"Database already contains {task_count} tasks. Skipping seeding.")
            return

        today = date.today()
        yesterday = today - timedelta(days=1)
        tomorrow = today + timedelta(days=1)

        # 1. Create Goals & Milestones
        backend_goal = Goal(
            title="Become a Backend Developer",
            description="Master modern backend engineering, scalable APIs, and system architecture.",
            category="Career",
            target_date=date(2026, 12, 31),
            status="active"
        )
        db.add(backend_goal)
        db.flush()

        milestones_1 = [
            ("Python Advanced Concurrency", True),
            ("FastAPI & Async Frameworks", True),
            ("SQLAlchemy ORM & Alembic", True),
            ("PostgreSQL Indexing & Optimization", True),
            ("REST API & Schema Validation", True),
            ("JWT Auth & Security", False),
            ("Docker & AWS Cloud Deployment", False),
        ]
        for idx, (m_title, completed) in enumerate(milestones_1):
            db.add(GoalMilestone(goal_id=backend_goal.id, title=m_title, completed=completed, order_index=idx))

        placement_goal = Goal(
            title="Crack Campus Placement 2027",
            description="Secure top tier SDE offer through rigorous DSA and System Design preparation.",
            category="Career",
            target_date=date(2027, 3, 31),
            status="active"
        )
        db.add(placement_goal)
        db.flush()

        milestones_2 = [
            ("Arrays, Trees & Graphs Mastery", True),
            ("Dynamic Programming & Greedy", True),
            ("Low-Level System Design (LLD)", False),
            ("High-Level Architecture (HLD)", False),
            ("Mock Interviews & CS Fundamentals", False),
        ]
        for idx, (m_title, completed) in enumerate(milestones_2):
            db.add(GoalMilestone(goal_id=placement_goal.id, title=m_title, completed=completed, order_index=idx))

        projects_goal = Goal(
            title="Build 3 Real Projects",
            description="Ship 3 production-grade applications with modern UI and robust architecture.",
            category="Projects",
            target_date=date(2027, 1, 31),
            status="active"
        )
        db.add(projects_goal)
        db.flush()

        milestones_3 = [
            ("LifeOS Productivity Platform", True),
            ("Distributed Event-Driven Commerce", False),
            ("AI Workflow Agent Engine", False),
        ]
        for idx, (m_title, completed) in enumerate(milestones_3):
            db.add(GoalMilestone(goal_id=projects_goal.id, title=m_title, completed=completed, order_index=idx))

        fitness_goal = Goal(
            title="Improve Fitness",
            description="Build physical stamina and maintain healthy routine alongside coding.",
            category="Health",
            target_date=date(2027, 12, 31),
            status="active"
        )
        db.add(fitness_goal)
        db.flush()

        milestones_4 = [
            ("5-Day Consistency for 60 Days", True),
            ("10K Steps Daily Routine", True),
            ("Nutrition & Protein Tracking", False),
            ("10K Marathon Run", False),
        ]
        for idx, (m_title, completed) in enumerate(milestones_4):
            db.add(GoalMilestone(goal_id=fitness_goal.id, title=m_title, completed=completed, order_index=idx))

        # 2. Create Tasks
        tasks_data = [
            # Today's Completed Schedule
            Task(
                title="Morning Routine",
                description="Hydration, meditation, and plan overview",
                due_date=today,
                due_time=time(6, 0),
                estimated_duration_minutes=30,
                priority=PriorityEnum.LOW,
                completed=True,
                goal_id=fitness_goal.id
            ),
            Task(
                title="DSA Practice",
                description="Solve 2 LeetCode Medium Graph problems",
                due_date=today,
                due_time=time(7, 0),
                estimated_duration_minutes=90,
                priority=PriorityEnum.HIGH,
                completed=True,
                goal_id=placement_goal.id
            ),
            # Today's Focus Task
            Task(
                title="FastAPI Project",
                description="Build CRUD endpoints with SQLAlchemy",
                due_date=today,
                due_time=time(9, 0),
                estimated_duration_minutes=120,
                priority=PriorityEnum.HIGH,
                completed=False,
                goal_id=backend_goal.id
            ),
            # Today's Upcoming Schedule
            Task(
                title="College Assignment",
                description="Complete Computer Networks lab report",
                due_date=today,
                due_time=time(14, 0),
                estimated_duration_minutes=90,
                priority=PriorityEnum.MEDIUM,
                completed=False
            ),
            Task(
                title="Workout",
                description="Upper body push day & core",
                due_date=today,
                due_time=time(16, 0),
                estimated_duration_minutes=60,
                priority=PriorityEnum.MEDIUM,
                completed=False,
                goal_id=fitness_goal.id
            ),
            Task(
                title="Read 12 Pages (Clean Code)",
                description="Chapter 4: Comments & Meaningful Names",
                due_date=today,
                due_time=time(18, 0),
                estimated_duration_minutes=60,
                priority=PriorityEnum.LOW,
                completed=False
            ),
            Task(
                title="Revision",
                description="Review daily notes and formulas",
                due_date=today,
                due_time=time(20, 0),
                estimated_duration_minutes=60,
                priority=PriorityEnum.HIGH,
                completed=False
            ),
            # Overdue item
            Task(
                title="Submit DBMS Assignment",
                description="Relational calculus queries and schema normalization",
                due_date=yesterday,
                due_time=time(17, 0),
                estimated_duration_minutes=45,
                priority=PriorityEnum.HIGH,
                completed=False,
                rescheduled_count=1
            ),
            # Tomorrow items
            Task(
                title="FastAPI Authentication",
                description="Implement JWT tokens and OAuth2 password bearer",
                due_date=tomorrow,
                due_time=time(9, 0),
                estimated_duration_minutes=90,
                priority=PriorityEnum.HIGH,
                completed=False,
                goal_id=backend_goal.id
            ),
            Task(
                title="Gym Workout",
                description="Leg day workout session",
                due_date=tomorrow,
                due_time=time(17, 0),
                estimated_duration_minutes=60,
                priority=PriorityEnum.MEDIUM,
                completed=False,
                goal_id=fitness_goal.id
            )
        ]
        db.add_all(tasks_data)

        # 3. Create Habits
        habits = [
            Habit(title="Morning Routine & Hydration", description="Start day with 500ml water and 5min stretch", frequency_type="daily", target_days_per_week=7, priority="high"),
            Habit(title="1hr DSA Practice", description="Daily algorithmic problem solving", frequency_type="daily", target_days_per_week=7, priority="high"),
            Habit(title="Deep Work Focus Session", description="At least 2 blocks of 90-minute distraction-free work", frequency_type="daily", target_days_per_week=6, priority="high"),
            Habit(title="Read Technical Book", description="15 pages of system design or Clean Code", frequency_type="daily", target_days_per_week=5, priority="medium"),
            Habit(title="Evening Reflection", description="Review completed tasks and prepare tomorrow's plan", frequency_type="daily", target_days_per_week=7, priority="medium"),
        ]
        db.add_all(habits)
        db.flush()

        # Add some historical habit logs for past 5 days
        for h in habits:
            for day_offset in range(5):
                log_d = today - timedelta(days=day_offset)
                db.add(HabitLog(habit_id=h.id, completed_date=log_d))

        db.commit()
        print("Successfully seeded realistic LifeOS sample data!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data_if_empty()
