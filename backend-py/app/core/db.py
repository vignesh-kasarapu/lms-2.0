from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.core.config import settings

engine = create_engine(settings.sqlalchemy_database_uri, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    """Shared declarative base for every SQLAlchemy model (app/models/*)."""


def get_db():
    """FastAPI dependency — one Session per request, always closed after."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
