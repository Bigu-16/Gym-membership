from datetime import date

import pytest
from pydantic import ValidationError

from app.core.config import settings
from app.core.rate_limit import login_rate_limiter
from app.models import Enrollment, Member, ScheduleTemplate, Session
from app.models.enums import ScheduleType
from app.schemas.auth import BootstrapAdminRequest, UserCreateRequest
from app.schemas.member import FamilyCreate, MemberCreate, MemberUpdate


@pytest.mark.asyncio
async def test_schedule_template_can_be_updated(client):
    created = await client.post(
        "/api/v1/schedule/templates",
        json={"title": "Yoga", "type": "group", "days": ["Monday"], "time": "10:00", "capacity": 10},
    )

    response = await client.patch(
        f"/api/v1/schedule/templates/{created.json()['id']}",
        json={
            "title": "Advanced Yoga",
            "days": ["Tuesday", "Thursday"],
            "time": "4:00 PM - 5:00 PM",
            "capacity": 16,
        },
    )

    assert response.status_code == 200
    assert response.json()["title"] == "Advanced Yoga"
    assert response.json()["days"] == ["Tuesday", "Thursday"]
    assert response.json()["time"] == "4:00 PM - 5:00 PM"
    assert response.json()["capacity"] == 16


@pytest.mark.asyncio
async def test_membership_plan_supports_partial_patch(client):
    created = await client.post(
        "/api/v1/plans/",
        json={
            "name": "Editable Karate Package",
            "program": "Karate",
            "duration_label": "One Month",
            "duration_months": 1,
            "classes_per_week": 3,
            "price": 350,
            "currency": "AED",
            "duration_days": 30,
        },
    )

    response = await client.patch(
        f"/api/v1/plans/{created.json()['id']}",
        json={"price": 375, "included_items": ["Free uniform"]},
    )

    assert response.status_code == 200
    assert response.json()["price"] == "375.00"
    assert response.json()["included_items"] == ["Free uniform"]


@pytest.mark.asyncio
async def test_deleting_template_preserves_history_and_detaches_references(client, session_factory):
    async with session_factory() as db:
        template = ScheduleTemplate(title="Boxing", type=ScheduleType.group, days=["Friday"], time="18:00", capacity=8)
        member = Member(name="Jane Doe", phone="555-0100", age=22)
        db.add_all([template, member])
        await db.flush()
        session = Session(
            template_id=template.id,
            date=date.today(),
            trainer_name="John Doe",
            checklist_data={"items": []},
        )
        enrollment = Enrollment(member_id=member.id, template_id=template.id)
        db.add_all([session, enrollment])
        await db.commit()
        template_id = template.id
        session_id = session.id
        enrollment_id = enrollment.id

    response = await client.delete(f"/api/v1/schedule/templates/{template_id}")

    assert response.status_code == 204
    async with session_factory() as db:
        assert await db.get(ScheduleTemplate, template_id) is None
        assert (await db.get(Session, session_id)).template_id is None
        assert (await db.get(Enrollment, enrollment_id)).template_id is None


@pytest.mark.asyncio
async def test_session_checklist_can_be_persisted(client, session_factory):
    async with session_factory() as db:
        session = Session(
            date=date.today(),
            trainer_name="Jane Doe",
            checklist_data={"items": []},
        )
        db.add(session)
        await db.commit()
        session_id = session.id

    checklist = [
        {"id": 1, "text": "<b>Set up mats</b><script>alert(1)</script>", "checked": True},
        {"id": 2, "text": "Lock storage", "checked": False},
    ]
    response = await client.patch(
        f"/api/v1/schedule/sessions/{session_id}",
        json={"checklist_data": checklist},
    )

    assert response.status_code == 200
    assert response.json()["checklist_data"] == [
        {"id": 1, "text": "Set up mats", "checked": True},
        checklist[1],
    ]


def test_names_are_restricted_and_html_is_removed_before_validation():
    member = MemberCreate(name="<b>Mary-Jane O'Neil</b>", phone="+971500000123", age=25, medical_issues="<p>Asthma</p>")
    update = MemberUpdate(medical_issues="<script>alert(1)</script><b>None</b>")
    user = UserCreateRequest(full_name="<i>Jane Doe</i>", email="jane@example.com", password="Str0ngPassword")
    bootstrap = BootstrapAdminRequest(full_name="Admin User", email="admin@example.com", password="Str0ngPassword")

    assert member.name == "Mary-Jane O'Neil"
    assert member.medical_issues == "Asthma"
    assert update.medical_issues == "None"
    assert user.full_name == "Jane Doe"
    assert bootstrap.full_name == "Admin User"

    with pytest.raises(ValidationError):
        MemberCreate(name="<img src=x onerror=alert(1)>", phone="+971500000124", age=25)
    with pytest.raises(ValidationError):
        UserCreateRequest(full_name="Jane123", email="jane2@example.com", password="Str0ngPassword")


def test_family_trainees_need_no_phone_and_little_kids_are_allowed():
    base = {"parent": {"name": "Sara Example", "phone": "+971500000100"}}
    valid = FamilyCreate(**base, members=[{"name": "Lina Example", "age": 3}])
    assert valid.members[0].age == 3
    assert valid.members[0].phone is None

    with pytest.raises(ValidationError):
        FamilyCreate(**base, members=[{"name": "Too Young", "age": 1}])


def test_arabic_names_and_emirates_id_are_accepted():
    member = MemberCreate(name="موزة المحرمي", phone="+971500000200", age=30, emirates_id="784198712345671")
    assert member.name == "موزة المحرمي"
    assert member.emirates_id == "784-1987-1234567-1"

    with pytest.raises(ValidationError):
        MemberCreate(name="Bad Id", phone="+971500000201", age=30, emirates_id="12345")


def test_independent_members_need_a_phone():
    with pytest.raises(ValidationError, match="phone is required"):
        MemberCreate(name="No Phone", age=30)


@pytest.mark.asyncio
async def test_production_bootstrap_and_nondevelopment_seed_are_hidden(client, monkeypatch):
    monkeypatch.setattr(settings, "app_env", "production")

    bootstrap = await client.post(
        "/api/v1/auth/bootstrap-admin",
        json={"full_name": "New Admin", "email": "new@example.com", "password": "Str0ngPassword"},
    )
    seed = await client.post("/api/v1/tasks/seed-demo-data")

    assert bootstrap.status_code == 404
    assert seed.status_code == 404


@pytest.mark.asyncio
async def test_login_is_rate_limited_by_ip(client, monkeypatch):
    monkeypatch.setattr(settings, "login_rate_limit_attempts", 2)
    monkeypatch.setattr(settings, "login_rate_limit_window_seconds", 60)
    await login_rate_limiter.reset()

    payload = {"username": "missing@example.com", "password": "wrong"}
    assert (await client.post("/api/v1/auth/login", data=payload)).status_code == 401
    assert (await client.post("/api/v1/auth/login", data=payload)).status_code == 401
    limited = await client.post("/api/v1/auth/login", data=payload)

    assert limited.status_code == 429
    assert int(limited.headers["retry-after"]) >= 1
    await login_rate_limiter.reset()
