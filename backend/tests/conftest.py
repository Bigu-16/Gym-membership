from collections.abc import AsyncIterator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

import app.core.database as database_module
import app.tasks.notifications as notifications_module
from app.api.deps import get_current_admin_user, get_current_user
from app.core.database import Base
from app.db import get_db_session
from app.main import app
from app.models import AppUser
from app.models.enums import UserRole


@pytest_asyncio.fixture
async def engine():
    engine = create_async_engine(
        "sqlite+aiosqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def session_factory(engine, monkeypatch):
    factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    # Point the app's SessionLocal (used by Celery task helpers) at the test DB too.
    monkeypatch.setattr(database_module, "SessionLocal", factory)
    monkeypatch.setattr(notifications_module, "SessionLocal", factory)
    return factory


@pytest_asyncio.fixture
async def db_session(session_factory) -> AsyncIterator[AsyncSession]:
    async with session_factory() as session:
        yield session


@pytest_asyncio.fixture
async def admin_user(session_factory) -> AppUser:
    async with session_factory() as session:
        user = AppUser(
            full_name="Test Admin",
            email="admin@test.local",
            password_hash="x",
            role=UserRole.admin,
            is_active=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user


@pytest_asyncio.fixture
async def client(session_factory, admin_user) -> AsyncIterator[AsyncClient]:
    async def override_get_db() -> AsyncIterator[AsyncSession]:
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db_session] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: admin_user
    app.dependency_overrides[get_current_admin_user] = lambda: admin_user

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
