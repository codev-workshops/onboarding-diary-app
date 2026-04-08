"""Shared test fixtures for backend tests.

Uses the Docker PostgreSQL with a separate test database.
Each test gets isolated sessions to avoid asyncpg concurrent operation errors.
"""

import uuid

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.auth.utils import create_access_token, hash_password
from app.database import Base, get_db
from app.main import app
from app.models.user import User

TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/test_onboarding_diary"

_engine = None
_session_factory = None


async def _get_engine():
    """Lazily create the test engine and set up the database."""
    global _engine
    if _engine is None:
        admin_engine = create_async_engine(
            "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres",
            isolation_level="AUTOCOMMIT",
        )
        async with admin_engine.connect() as conn:
            result = await conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname='test_onboarding_diary'")
            )
            if not result.scalar():
                await conn.execute(text("CREATE DATABASE test_onboarding_diary"))
        await admin_engine.dispose()

        _engine = create_async_engine(TEST_DATABASE_URL, echo=False, poolclass=NullPool)
        async with _engine.begin() as conn:
            await conn.execute(text('CREATE EXTENSION IF NOT EXISTS "pgcrypto"'))
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)

    return _engine


async def _get_session_factory():
    """Lazily create the session factory."""
    global _session_factory
    if _session_factory is None:
        engine = await _get_engine()
        _session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    return _session_factory


@pytest.fixture(autouse=True)
async def _clean_tables():
    """Truncate all tables before each test for isolation."""
    factory = await _get_session_factory()
    async with factory() as session:
        for table in reversed(Base.metadata.sorted_tables):
            await session.execute(text(f"TRUNCATE TABLE {table.name} CASCADE"))
        await session.commit()
    yield


@pytest.fixture
async def client():
    """HTTP test client with database dependency override."""
    factory = await _get_session_factory()

    async def override_get_db():
        async with factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
async def recruit_user():
    """Create a recruit user in the test database."""
    factory = await _get_session_factory()
    async with factory() as session:
        user = User(
            id=uuid.uuid4(),
            email=f"recruit-{uuid.uuid4().hex[:8]}@test.com",
            password_hash=hash_password("Test1234!"),
            full_name="Test Recruit",
            role="recruit",
            department="Engineering",
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user


@pytest.fixture
async def manager_user():
    """Create a manager user in the test database."""
    factory = await _get_session_factory()
    async with factory() as session:
        user = User(
            id=uuid.uuid4(),
            email=f"manager-{uuid.uuid4().hex[:8]}@test.com",
            password_hash=hash_password("Test1234!"),
            full_name="Test Manager",
            role="manager",
            department="Engineering",
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user


@pytest.fixture
def recruit_token(recruit_user: User) -> str:
    """JWT token for the recruit user."""
    return create_access_token(data={"sub": str(recruit_user.id)})


@pytest.fixture
def manager_token(manager_user: User) -> str:
    """JWT token for the manager user."""
    return create_access_token(data={"sub": str(manager_user.id)})


def auth_header(token: str) -> dict[str, str]:
    """Build an Authorization header."""
    return {"Authorization": f"Bearer {token}"}
