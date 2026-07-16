"""Engine/session plumbing. Dialect-agnostic on purpose — Postgres in
production (via docker-compose), SQLite in tests/CI so the test suite never
needs a running database server."""

from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import StaticPool


class Base(DeclarativeBase):
    pass


def create_engine_from_url(database_url: str) -> Engine:
    if not database_url.startswith("sqlite"):
        return create_engine(database_url, pool_pre_ping=True)

    kwargs = {"connect_args": {"check_same_thread": False}}
    if ":memory:" in database_url:
        # A single shared connection so every request sees the same in-memory
        # database — the default pool would hand out a fresh, empty DB per connection.
        kwargs["poolclass"] = StaticPool
    return create_engine(database_url, **kwargs)


def make_session_factory(engine: Engine) -> sessionmaker[Session]:
    return sessionmaker(bind=engine, autoflush=False, autocommit=False)
