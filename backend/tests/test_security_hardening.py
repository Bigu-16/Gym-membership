from collections.abc import AsyncIterator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from pydantic import ValidationError

from app.core.config import Settings
from app.core.rate_limit import client_error_rate_limiter, login_rate_limiter, password_change_rate_limiter
from app.core.security import hash_password
from app.db import get_db_session
from app.main import app
from app.models import AppUser
from app.models.enums import UserRole
from app.schemas.auth import UserCreateRequest
from app.schemas.member import FamilyCreate, MemberCreate
from app.schemas.membership_plan import MembershipPlanCreate


PASSWORD = "Desk2026Secure"


@pytest_asyncio.fixture
async def real_client(session_factory) -> AsyncIterator[AsyncClient]:
    """A client that goes through real login and token checks (no auth overrides)."""

    async def override_get_db():
        async with session_factory() as session:
            yield session

    async with session_factory() as db:
        db.add_all([
            AppUser(full_name="Desk Admin", email="admin@nt.test", password_hash=hash_password(PASSWORD), role=UserRole.admin),
            AppUser(full_name="Desk Staff", email="staff@nt.test", password_hash=hash_password(PASSWORD), role=UserRole.staff),
        ])
        await db.commit()

    for limiter in (login_rate_limiter, password_change_rate_limiter, client_error_rate_limiter):
        await limiter.reset()
    app.dependency_overrides[get_db_session] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()


async def login(client: AsyncClient, email: str, password: str = PASSWORD) -> dict[str, str]:
    response = await client.post("/api/v1/auth/login", data={"username": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


async def test_changing_password_signs_out_other_logins(real_client):
    desk = await login(real_client, "staff@nt.test")
    phone = await login(real_client, "staff@nt.test")

    wrong = await real_client.post("/api/v1/auth/change-password", headers=desk, json={"current_password": "nope", "new_password": "NewDesk2026Pass"})
    assert wrong.status_code == 400

    changed = await real_client.post(
        "/api/v1/auth/change-password", headers=desk, json={"current_password": PASSWORD, "new_password": "NewDesk2026Pass"}
    )
    assert changed.status_code == 200
    fresh = {"Authorization": f"Bearer {changed.json()['access_token']}"}

    assert (await real_client.get("/api/v1/auth/me", headers=phone)).status_code == 401
    assert (await real_client.get("/api/v1/auth/me", headers=desk)).status_code == 401
    assert (await real_client.get("/api/v1/auth/me", headers=fresh)).status_code == 200


async def test_sign_out_everywhere_and_deactivation_revoke_tokens(real_client):
    admin = await login(real_client, "admin@nt.test")
    staff = await login(real_client, "staff@nt.test")

    staff_id = (await real_client.get("/api/v1/auth/me", headers=staff)).json()["id"]
    assert (await real_client.patch(f"/api/v1/users/{staff_id}", headers=admin, json={"is_active": False})).status_code == 200
    assert (await real_client.get("/api/v1/auth/me", headers=staff)).status_code == 401

    assert (await real_client.post("/api/v1/auth/logout-all", headers=admin)).status_code == 204
    assert (await real_client.get("/api/v1/auth/me", headers=admin)).status_code == 401


async def test_admin_password_reset_revokes_and_is_logged(real_client):
    admin = await login(real_client, "admin@nt.test")
    staff = await login(real_client, "staff@nt.test")
    staff_id = (await real_client.get("/api/v1/auth/me", headers=staff)).json()["id"]

    weak = await real_client.patch(f"/api/v1/users/{staff_id}/password", headers=admin, json={"password": "short"})
    assert weak.status_code == 422
    reset = await real_client.patch(f"/api/v1/users/{staff_id}/password", headers=admin, json={"password": "Reset2026Desk"})
    assert reset.status_code == 200
    assert (await real_client.get("/api/v1/auth/me", headers=staff)).status_code == 401

    log = (await real_client.get("/api/v1/audit-logs/", headers=admin)).json()
    assert log[0]["action"] == "password_reset"
    assert log[0]["actor_email"] == "admin@nt.test"
    # Staff cannot read the activity log.
    staff_again = await login(real_client, "staff@nt.test", "Reset2026Desk")
    assert (await real_client.get("/api/v1/audit-logs/", headers=staff_again)).status_code == 403


async def test_member_changes_are_recorded_in_the_activity_log(real_client):
    admin = await login(real_client, "admin@nt.test")
    created = await real_client.post(
        "/api/v1/members/", headers=admin, json={"name": "Layla Example", "phone": "+971503330003", "age": 9}
    )
    assert created.status_code == 201
    member_id = created.json()["id"]
    await real_client.patch(f"/api/v1/members/{member_id}/freeze", headers=admin, json={"is_frozen": True})
    await real_client.delete(f"/api/v1/members/{member_id}", headers=admin)

    actions = [row["action"] for row in (await real_client.get("/api/v1/audit-logs/?entity_type=member", headers=admin)).json()]
    assert actions == ["member_deleted", "member_frozen", "member_created"]


async def test_responses_carry_security_headers_and_request_id(real_client):
    response = await real_client.get("/api/v1/health/live")
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Referrer-Policy"] == "no-referrer"
    assert len(response.headers["X-Request-ID"]) >= 8


async def test_web_app_crashes_can_be_reported(real_client, caplog):
    staff = await login(real_client, "staff@nt.test")
    response = await real_client.post(
        "/api/v1/client-errors/", headers=staff, json={"message": "Cannot read properties of null", "page": "schedule"}
    )
    assert response.status_code == 204
    assert "Cannot read properties of null" in caplog.text
    assert (await real_client.post("/api/v1/client-errors/", json={"message": "x"})).status_code == 401


def test_production_refuses_placeholder_secret_and_debug():
    unsafe = Settings(_env_file=None, app_env="production", secret_key="change-me-in-production", debug=True)
    assert len(unsafe.production_problems()) == 2
    safe = Settings(_env_file=None, app_env="production", secret_key="x" * 48, debug=False)
    assert safe.production_problems() == []


def test_password_policy():
    with pytest.raises(ValidationError, match="at least 10"):
        UserCreateRequest(full_name="New Staff", email="new@example.com", password="Ab1")
    with pytest.raises(ValidationError, match="mix upper"):
        UserCreateRequest(full_name="New Staff", email="new@example.com", password="alllowercase1")
    assert UserCreateRequest(full_name="New Staff", email="new@example.com", password="FrontDesk2026").password


def test_email_addresses_are_validated():
    assert MemberCreate(name="Omar Example", phone="+971504440004", age=30, email=" Omar@Example.COM ").email == "omar@example.com"
    assert MemberCreate(name="Omar Example", phone="+971504440004", age=30, email="").email is None
    with pytest.raises(ValidationError, match="email address is not valid"):
        MemberCreate(name="Omar Example", phone="+971504440004", age=30, email="not-an-email")
    with pytest.raises(ValidationError, match="email address is not valid"):
        FamilyCreate(parent={"name": "Sara Example", "phone": "+971500000100", "email": "sara@"}, members=[{"name": "Lina Example", "age": 3}])


def test_package_text_is_cleaned():
    plan = MembershipPlanCreate(name="<b>Karate</b> Special", program="Karate", description="<script>x</script>Promo", included_items=["<i>Free belt</i>", " "])
    assert plan.name == "Karate Special"
    assert plan.description == "Promo"
    assert plan.included_items == ["Free belt"]
