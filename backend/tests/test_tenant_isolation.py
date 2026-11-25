"""Two gym tenants: neither can read, change or attach anything to the other's data."""

from decimal import Decimal

import pytest_asyncio
from sqlalchemy import select

from app.core.tenancy import TenantError, all_tenants, bind_tenant
from app.models import AppUser, Club, Family, Member, MembershipPlan, Payment
from app.models.enums import ClubKind, UserRole
from tests.test_taekwondo import act_as

GYM_ID = 1


@pytest_asyncio.fixture
async def second_gym(client, session_factory, admin_user):
    """Gym #1 (the existing gym) has a member, a family and a package; gym #2 has its own admin."""
    async with session_factory() as db:
        other = Club(name="Other Gym", kind=ClubKind.gym, timezone="Asia/Dubai", currency="AED")
        db.add(other)
        await db.flush()
        other_admin = AppUser(full_name="Other Admin", email="admin@other.test", password_hash="x", role=UserRole.admin, club_id=other.id)
        plan = MembershipPlan(name="Karate One Month", program="Karate", price=Decimal("350"), club_id=GYM_ID)
        family = Family(parent_name="Sara Example", parent_phone="+971500000100", club_id=GYM_ID)
        db.add_all([other_admin, plan, family])
        await db.flush()
        member = Member(name="Lina Example", age=8, family_id=family.id, parent_phone=family.parent_phone, plan_id=plan.id, club_id=GYM_ID)
        db.add(member)
        await db.commit()
        for row in (other, other_admin, plan, family, member):
            await db.refresh(row)
    return {"other": other, "other_admin": other_admin, "plan": plan, "family": family, "member": member, "gym_admin": admin_user}


async def test_gym_data_is_invisible_to_another_gym(client, second_gym):
    act_as(second_gym["other_admin"])
    member_id, plan_id = second_gym["member"].id, second_gym["plan"].id
    assert (await client.get("/api/v1/members/")).json() == []
    assert (await client.get("/api/v1/members/families")).json() == []
    assert (await client.get("/api/v1/plans/")).json() == []
    assert (await client.get(f"/api/v1/members/{member_id}")).status_code == 404
    assert (await client.put(f"/api/v1/members/{member_id}", json={"name": "Taken Over"})).status_code == 404
    assert (await client.delete(f"/api/v1/members/{member_id}")).status_code == 404
    assert (await client.get(f"/api/v1/plans/{plan_id}")).status_code in (404, 405)
    assert (await client.get("/api/v1/dashboard/stats")).json()["total_members"] == 0

    act_as(second_gym["gym_admin"])
    assert [m["name"] for m in (await client.get("/api/v1/members/")).json()] == ["Lina Example"]


async def test_nothing_can_be_attached_to_another_gyms_records(client, second_gym):
    act_as(second_gym["other_admin"])
    # A payment for gym #1's member, made from gym #2.
    paid = await client.post("/api/v1/payments/", json={"member_id": second_gym["member"].id, "amount": "100"})
    assert paid.status_code == 404
    # A new member put into gym #1's family or package.
    joined = await client.post("/api/v1/members/", json={"name": "Intruder Example", "phone": "+971501112233", "age": 20, "family_id": second_gym["family"].id})
    assert joined.status_code == 404
    with_plan = await client.post("/api/v1/members/", json={"name": "Intruder Example", "phone": "+971501112234", "age": 20, "plan_id": second_gym["plan"].id})
    assert with_plan.status_code == 404


async def test_same_parent_phone_and_package_name_are_fine_in_two_gyms(client, second_gym):
    act_as(second_gym["other_admin"])
    family = await client.post("/api/v1/members/families", json={
        "parent": {"name": "Sara Example", "phone": "+971500000100"},
        "members": [{"name": "Other Child", "age": 7}],
    })
    assert family.status_code == 201, family.text
    assert family.json()["members"][0]["name"] == "Other Child"
    plan = await client.post("/api/v1/plans/", json={"name": "Karate One Month", "program": "Karate", "price": "300"})
    assert plan.status_code == 201, plan.text

    act_as(second_gym["gym_admin"])
    [gym_family] = (await client.get("/api/v1/members/families")).json()
    assert [m["name"] for m in gym_family["members"]] == ["Lina Example"]


async def test_sessions_fail_closed(session_factory, second_gym):
    # A session that was never told its tenant sees nothing.
    async with session_factory() as db:
        db.sync_session.info.clear()
        assert (await db.scalars(select(Member))).all() == []
    # A session bound to gym #2 cannot write a row for gym #1.
    async with session_factory() as db:
        bind_tenant(db, second_gym["other"].id)
        db.add(Payment(member_id=second_gym["member"].id, amount=Decimal("1"), paid_on=second_gym["member"].created_at.date(), club_id=GYM_ID))
        try:
            await db.flush()
            raise AssertionError("cross-tenant write was allowed")
        except TenantError:
            await db.rollback()
    # A system job sees all tenants but cannot bind two.
    async with session_factory() as db:
        all_tenants(db)
        assert len((await db.scalars(select(Club))).all()) >= 2
        bind_tenant(db, GYM_ID)
        try:
            bind_tenant(db, second_gym["other"].id)
            raise AssertionError("a session switched tenants")
        except TenantError:
            pass
