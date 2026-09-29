import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./lifeos.db")

try:
    connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
    engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
    # Ping connection to verify database server availability
    with engine.connect() as conn:
        pass
except Exception as err:
    print(f"Warning: Primary DATABASE_URL unreachable. Falling back to local SQLite database: {err}")
    DATABASE_URL = "sqlite:///./lifeos.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """
    Dependency that provides a SQLAlchemy database session for API requests.
    Closes the session automatically after request completion.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
