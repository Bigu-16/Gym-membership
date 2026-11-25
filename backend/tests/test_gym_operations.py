from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.timeutils import add_months, gym_today
from app.db import get_db_session
from app.main import app
from app.models import CheckIn, Member, MembershipPlan, Payment, ScheduleTemplate
from app.models.enums import ScheduleType

pytestmark = pytest.mark.asyncio


async def make_plan(session_factory, months: int = 1, price: str = "350.00") -> int:
    async with session_factory() as db:
        plan = MembershipPlan(
            name=f"Karate {months}m test",
            program="Karate",
            duration_label=f"{months} Month",
            duration_months=months,
            classes_per_week=3,
            price=Decimal(price),
            duration_days=30 * months,
        )
        db.add(plan)
        await db.commit()
        return plan.id


async def test_business_profile_requires_login(session_factory):
    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db_session] = override_get_db
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as anonymous:
            assert (await anonymous.get("/api/v1/business")).status_code == 401
            assert (await anonymous.patch("/api/v1/business", json={"accountDetails": []})).status_code == 401
    finally:
        app.dependency_overrides.clear()


async def test_member_expiry_comes_from_package_and_payment_is_recorded(client, session_factory):
    plan_id = await make_plan(session_factory, months=3, price="900.00")

    response = await client.post(
        "/api/v1/members/",
        json={
            "name": "Omar Siddiqui",
            "phone": "+971504440004",
            "age": 29,
            "plan_id": plan_id,
            "payment": {"amount": "900", "method": "card"},
            "terms_accepted": True,
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["expiry_date"] == add_months(gym_today(), 3).isoformat()
    assert body["terms_accepted_at"] is not None
    payments = (await client.get(f"/api/v1/payments/?member_id={body['id']}")).json()
    assert [(p["amount"], p["method"], p["kind"]) for p in payments] == [("900.00", "card", "new")]


async def test_returning_parent_adds_children_to_existing_family(client):
    parent = {"name": "Sara Example", "phone": "+971501110001"}
    first = await client.post("/api/v1/members/families", json={"parent": parent, "members": [{"name": "Lina Example", "age": 3}]})
    second = await client.post("/api/v1/members/families", json={"parent": parent, "members": [{"name": "Zaid Example", "age": 8}]})

    assert first.status_code == 201 and second.status_code == 201
    assert first.json()["id"] == second.json()["id"]
    assert second.json()["members"][0]["phone"] is None
    families = (await client.get("/api/v1/members/families")).json()
    assert len(families) == 1 and len(families[0]["members"]) == 2


async def test_renew_extends_from_current_expiry_and_records_payment(client, session_factory):
    plan_id = await make_plan(session_factory, months=1)
    expiry = gym_today() + timedelta(days=10)
    async with session_factory() as db:
        member = Member(name="Rashid Al Ketbi", phone="+971502220002", age=11, plan_id=plan_id, expiry_date=expiry, is_frozen=True)
        db.add(member)
        await db.commit()
        member_id = member.id

    response = await client.post(
        f"/api/v1/members/{member_id}/renew",
        json={"start_from": "expiry", "payment": {"amount": "350", "method": "cash"}},
    )

    assert response.status_code == 200
    assert response.json()["expiry_date"] == add_months(expiry, 1).isoformat()
    assert response.json()["is_frozen"] is False
    async with session_factory() as db:
        payment = await db.scalar(Payment.__table__.select().where(Payment.member_id == member_id))
        assert payment is not None


async def test_check_in_rules(client, session_factory):
    today = gym_today()
    async with session_factory() as db:
        active = Member(name="Active Member", phone="+971500000001", age=20, expiry_date=today + timedelta(days=5))
        expired = Member(name="Expired Member", phone="+971500000002", age=20, expiry_date=today - timedelta(days=1))
        frozen = Member(name="Frozen Member", phone="+971500000003", age=20, expiry_date=today + timedelta(days=5), is_frozen=True)
        db.add_all([active, expired, frozen])
        await db.commit()
        ids = active.id, expired.id, frozen.id

    assert (await client.post("/api/v1/check-ins/", json={"member_id": ids[0]})).status_code == 201
    assert (await client.post("/api/v1/check-ins/", json={"member_id": ids[0]})).status_code == 409
    expired_response = await client.post("/api/v1/check-ins/", json={"member_id": ids[1]})
    assert expired_response.status_code == 409 and "expired" in expired_response.json()["detail"]
    assert (await client.post("/api/v1/check-ins/", json={"member_id": ids[2]})).status_code == 409
    assert (await client.post("/api/v1/check-ins/", json={"member_id": ids[1], "override": True})).status_code == 201

    open_visit = (await client.get(f"/api/v1/check-ins/?member_id={ids[0]}&open_only=true")).json()[0]
    too_early = await client.patch(
        f"/api/v1/check-ins/{open_visit['id']}/check-out",
        json={"check_out_time": "2000-01-01T00:00:00Z"},
    )
    assert too_early.status_code == 422


async def test_starting_a_class_twice_reuses_the_same_session(client, session_factory):
    async with session_factory() as db:
        template = ScheduleTemplate(title="Kids Taekwondo", type=ScheduleType.group, days=["Monday"], time="16:00 - 17:00", capacity=15)
        db.add(template)
        await db.commit()
        template_id = template.id

    payload = {"template_id": template_id, "date": "2026-10-19", "start_time": "16:00", "end_time": "17:00", "trainer_name": "Coach Nasser", "status": "in_progress"}
    first = await client.post("/api/v1/schedule/sessions", json=payload)
    second = await client.post("/api/v1/schedule/sessions", json={**payload, "status": "completed"})

    assert first.json()["id"] == second.json()["id"]
    assert second.json()["status"] == "completed"
    assert len((await client.get("/api/v1/schedule/sessions")).json()) == 1


async def test_official_catalog_endpoints_are_idempotent(client):
    first = (await client.post("/api/v1/schedule/templates/sync-official")).json()
    second = (await client.post("/api/v1/schedule/templates/sync-official")).json()
    assert first == {"created": 11, "total": 11}
    templates = (await client.get("/api/v1/schedule/templates")).json()
    # Class sizes and coaches are not printed on the form, so none are invented.
    assert all(t["capacity"] is None and t["trainer_name"] is None for t in templates)
    assert second == {"created": 0, "total": 11}

    packages = (await client.post("/api/v1/plans/sync-official")).json()
    assert packages["created"] == 23
    assert (await client.post("/api/v1/plans/sync-official")).json()["created"] == 0


async def test_analytics_summary_uses_real_payments_and_members(client, session_factory):
    plan_id = await make_plan(session_factory, months=1)
    today = gym_today()
    async with session_factory() as db:
        member = Member(name="Layla Haddad", phone="+971503330003", age=9, plan_id=plan_id, expiry_date=today + timedelta(days=3))
        db.add(member)
        await db.flush()
        db.add(Payment(member_id=member.id, plan_id=plan_id, amount=Decimal("350"), paid_on=today))
        db.add(CheckIn(member_id=member.id, check_in_time=datetime.now(UTC) - timedelta(minutes=5)))
        await db.commit()

    summary = (await client.get("/api/v1/analytics/summary")).json()

    assert summary["revenue_this_month"] == 350.0
    assert summary["revenue_by_program"] == [{"label": "Karate", "value": 350.0}]
    assert summary["totals"]["active"] == 1
    assert summary["totals"]["expiring_7_days"] == 1
    assert summary["age_groups"] == [{"label": "Kids (7–12)", "value": 1.0}]
    assert summary["check_ins_last_30_days"] == 1


async def test_dashboard_counts_todays_timetable_classes(client, session_factory):
    weekday = gym_today().strftime("%A")
    async with session_factory() as db:
        db.add(ScheduleTemplate(title="Kids Karate", type=ScheduleType.group, days=[weekday], time="17:00 - 18:00", capacity=15))
        tomorrow = (gym_today() + timedelta(days=1)).strftime("%A")
        db.add(ScheduleTemplate(title="Other Day", type=ScheduleType.group, days=[tomorrow], time="17:00", capacity=15))
        await db.commit()

    stats = (await client.get("/api/v1/dashboard/stats")).json()
    assert stats["today_sessions"] == 1
