from datetime import date, timedelta
from decimal import Decimal

import pytest
from fastapi import HTTPException

from app.core.timeutils import add_months, gym_today
from app.models import Family, Member, MembershipPlan
from app.services.freezes import freeze_member, paused_days, release_due_freezes, unfreeze_member

D = date(2026, 10, 1)


def member(expiry_days_from_d: int) -> Member:
    return Member(name="Lina Example", age=7, expiry_date=D + timedelta(days=expiry_days_from_d), is_frozen=False)


def test_days_left_are_paused_and_given_back_on_resume():
    m = member(12)  # 12 days left on 1 Oct
    freeze_member(m, until=D + timedelta(days=30), today=D)
    assert m.is_frozen and m.frozen_since == D and paused_days(m) == 12

    restored = unfreeze_member(m, resume_on=D + timedelta(days=30))

    assert restored == 12
    assert m.expiry_date == D + timedelta(days=42)  # resumes 31 Oct with the same 12 days
    assert not m.is_frozen and m.frozen_since is None and m.freeze_until is None


def test_unfreezing_early_counts_from_the_real_resume_day():
    m = member(10)
    freeze_member(m, until=None, today=D)
    unfreeze_member(m, resume_on=D + timedelta(days=4))
    assert m.expiry_date == D + timedelta(days=14)


def test_a_membership_that_had_already_run_out_gains_nothing():
    m = member(-3)
    freeze_member(m, until=None, today=D)
    assert unfreeze_member(m, resume_on=D + timedelta(days=20)) == 0
    assert m.expiry_date == D - timedelta(days=3)


def test_freeze_end_must_be_in_the_future():
    with pytest.raises(HTTPException):
        freeze_member(member(5), until=D, today=D)


async def test_freezes_resume_on_their_end_date_even_if_the_job_runs_late(db_session):
    m = member(12)
    freeze_member(m, until=D + timedelta(days=30), today=D)
    still = member(12)
    still.name = "Zaid Example"
    freeze_member(still, until=None, today=D)
    db_session.add_all([m, still])
    await db_session.commit()

    assert await release_due_freezes(db_session, today=D + timedelta(days=29)) == 0
    assert await release_due_freezes(db_session, today=D + timedelta(days=33)) == 1  # job ran 3 days late
    await db_session.commit()

    assert m.expiry_date == D + timedelta(days=42)  # counted from the planned resume day, not the late run
    assert still.is_frozen  # open-ended freezes wait for staff


async def test_freeze_and_unfreeze_through_the_api(client, session_factory):
    today = gym_today()
    async with session_factory() as db:
        m = Member(name="Omar Example", phone="+971504440004", age=30, expiry_date=today + timedelta(days=20))
        db.add(m)
        await db.commit()
        member_id = m.id

    bad = await client.patch(f"/api/v1/members/{member_id}/freeze", json={"is_frozen": True, "until": today.isoformat()})
    assert bad.status_code == 400

    frozen = await client.patch(
        f"/api/v1/members/{member_id}/freeze", json={"is_frozen": True, "until": (today + timedelta(days=14)).isoformat()}
    )
    assert frozen.status_code == 200
    assert frozen.json()["frozen_since"] == today.isoformat()
    assert frozen.json()["freeze_until"] == (today + timedelta(days=14)).isoformat()

    blocked = await client.post("/api/v1/check-ins/", json={"member_id": member_id})
    assert blocked.status_code == 409 and "frozen until" in blocked.json()["detail"]

    # A plain profile edit cannot silently clear the freeze or lose the paused days.
    edited = await client.put(f"/api/v1/members/{member_id}", json={"medical_issues": "None"})
    assert edited.json()["is_frozen"] is True

    resumed = await client.patch(f"/api/v1/members/{member_id}/freeze", json={"is_frozen": False})
    assert resumed.json()["is_frozen"] is False
    assert resumed.json()["expiry_date"] == (today + timedelta(days=20)).isoformat()  # unfrozen same day: same 20 days


async def test_renewing_a_frozen_member_keeps_the_paused_days(client, session_factory):
    today = gym_today()
    async with session_factory() as db:
        plan = MembershipPlan(name="Karate One Month - 3 Classes", program="Karate", price=Decimal("350"), duration_months=1, duration_days=30)
        db.add(plan)
        await db.flush()
        m = Member(
            name="Rashid Example", phone="+971502220002", age=11, plan_id=plan.id,
            expiry_date=today - timedelta(days=5), is_frozen=True,
            frozen_since=today - timedelta(days=15),  # had 10 days left when frozen
        )
        db.add(m)
        await db.commit()
        member_id = m.id

    renewed = await client.post(f"/api/v1/members/{member_id}/renew", json={"start_from": "expiry"})

    assert renewed.status_code == 200
    assert renewed.json()["is_frozen"] is False
    # 10 paused days resume today, then the new month is added on top.
    assert renewed.json()["expiry_date"] == add_months(today + timedelta(days=10), 1).isoformat()


async def test_family_freeze_keeps_each_childs_days(client, session_factory):
    today = gym_today()
    async with session_factory() as db:
        family = Family(parent_name="Sara Example", parent_phone="+971500000100")
        db.add(family)
        await db.flush()
        a = Member(name="Lina Example", age=3, family_id=family.id, expiry_date=today + timedelta(days=5))
        b = Member(name="Zaid Example", age=8, family_id=family.id, expiry_date=today + timedelta(days=40))
        db.add_all([a, b])
        await db.commit()
        family_id = family.id

    frozen = await client.patch(f"/api/v1/members/families/{family_id}/freeze", json={"is_frozen": True})
    assert all(m["is_frozen"] and m["frozen_since"] == today.isoformat() for m in frozen.json()["members"])

    resumed = await client.patch(f"/api/v1/members/families/{family_id}/freeze", json={"is_frozen": False})
    expiries = {m["name"]: m["expiry_date"] for m in resumed.json()["members"]}
    assert expiries == {
        "Lina Example": (today + timedelta(days=5)).isoformat(),
        "Zaid Example": (today + timedelta(days=40)).isoformat(),
    }


async def test_daily_job_resumes_ended_freezes(client, session_factory, monkeypatch):
    from app.core import config

    monkeypatch.setattr(config.settings, "cron_secret", "cron-secret-for-freeze-test")
    today = gym_today()
    async with session_factory() as db:
        db.add(Member(
            name="Back Example", phone="+971501112233", age=25, is_frozen=True,
            expiry_date=today + timedelta(days=1), frozen_since=today - timedelta(days=30), freeze_until=today,
        ))
        await db.commit()

    result = (await client.post("/api/v1/tasks/daily-reminders", headers={"X-Cron-Secret": "cron-secret-for-freeze-test"})).json()

    assert result["freezes_resumed"] == 1
    members = (await client.get("/api/v1/members/")).json()
    assert members[0]["is_frozen"] is False
    assert members[0]["expiry_date"] == (today + timedelta(days=31)).isoformat()
