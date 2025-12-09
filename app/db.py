from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator

from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = "sqlite:///./torah_layout.db"

engine = create_engine(
    DATABASE_URL,
    echo=False,  # set True while debugging SQL
    connect_args={"check_same_thread": False},  # needed for SQLite + FastAPI
)


def init_db() -> None:
    """
    Create tables if they don't exist.
    Call this once at startup.
    """
    from . import models  # ensure models are imported

    SQLModel.metadata.create_all(engine)


@contextmanager
def get_session() -> Iterator[Session]:
    session = Session(engine)
    try:
        yield session
    finally:
        session.close()
