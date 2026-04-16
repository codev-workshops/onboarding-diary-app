"""Shared test fixtures for backend tests."""

import uuid
from datetime import date

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import ARRAY, UUID as PG_UUID
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.ext.compiler import compiles

from app.auth.jwt import create_access_token
from app.auth.password import hash_password
from app.database import Base, get_db
from app.main import app
from app.models.note import Note
from app.models.user import User


# --- SQLite compatibility for PostgreSQL-specific types ---

@compiles(PG_UUID, "sqlite")
def compile_uuid_sqlite(element, compiler, **kw):
    """Compile PostgreSQL UUID as VARCHAR(36) for SQLite."""
    return "VARCHAR(36)"


@compiles(ARRAY, "sqlite")
def compile_array_sqlite(element, compiler, **kw):
    """Compile PostgreSQL ARRAY as JSON (TEXT) for SQLite."""
    return "TEXT"


# Monkey-patch the Note.tags column to use JSON type for SQLite compatibility.
# PostgreSQL ARRAY stores lists natively; SQLite needs JSON serialization.
_orig_tags_type = Note.__table__.c.tags.type
Note.__table__.c.tags.type = JSON()


# Use in-memory SQLite for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
async def setup_database():
    """Create all tables before each test and drop them after."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db_session():
    """Provide a database session for direct DB operations in tests."""
    async with TestSessionLocal() as session:
        yield session


@pytest.fixture
async def client():
    """Provide an async HTTP client for testing the API."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def recruit_user(db_session: AsyncSession):
    """Create a recruit user and return (user, token)."""
    user = User(
        id=uuid.uuid4(),
        email="recruit@test.com",
        password_hash=hash_password("TestP@ss1"),
        full_name="Test Recruit",
        role="recruit",
        department="Engineering",
        start_date=date(2024, 1, 15),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    token = create_access_token(user.id, user.role)
    return user, token


@pytest.fixture
async def manager_user(db_session: AsyncSession):
    """Create a manager user and return (user, token)."""
    user = User(
        id=uuid.uuid4(),
        email="manager@test.com",
        password_hash=hash_password("TestP@ss1"),
        full_name="Test Manager",
        role="manager",
        department="Engineering",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    token = create_access_token(user.id, user.role)
    return user, token


@pytest.fixture
async def admin_user(db_session: AsyncSession):
    """Create an admin user and return (user, token)."""
    user = User(
        id=uuid.uuid4(),
        email="admin@test.com",
        password_hash=hash_password("TestP@ss1"),
        full_name="Test Admin",
        role="admin",
        department="IT",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    token = create_access_token(user.id, user.role)
    return user, token


def auth_header(token: str) -> dict:
    """Helper to create auth headers."""
    return {"Authorization": f"Bearer {token}"}
