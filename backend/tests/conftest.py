from collections.abc import AsyncIterator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import insert
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

import app.core.database as database_module
import app.tasks.notifications as notifications_module
from app.api.deps import get_current_admin_user, get_current_user
from app.core.database import Base
from app.db import get_db_session
from app.main import app
from app.core.tenancy import ALL_TENANTS_KEY, DEFAULT_TENANT_KEY
from app.models import AppUser, Club
from app.models.enums import ClubKind, UserRole

GYM_ID = 1


@pytest_asyncio.fixture
async def engine():
    engine = create_async_engine(
        "sqlite+aiosqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Tenant #1: the existing gym (N & T Center). Old gym tests run inside it.
        await conn.execute(insert(Club).values(id=GYM_ID, name="N & T Center", kind=ClubKind.gym, timezone="Asia/Dubai", currency="AED"))
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def session_factory(engine, monkeypatch):
    # Test sessions act like system sessions: they see every tenant and stamp new rows with
    # the gym tenant. Requests still bind their own tenant (bind_tenant clears these flags).
    factory = async_sessionmaker(
        bind=engine, class_=AsyncSession, expire_on_commit=False,
        info={ALL_TENANTS_KEY: True, DEFAULT_TENANT_KEY: GYM_ID},
    )
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
            club_id=GYM_ID,
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
