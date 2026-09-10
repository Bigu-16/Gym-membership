from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import select

from app.models import Member, MembershipPlan, NotificationJob


async def _seed_members(session_factory):
    async with session_factory() as s:
        plan = MembershipPlan(
            name="Kids Plan",
            program="Kids",
            duration_label="One Month",
            duration_months=1,
            duration_days=30,
            price=Decimal("200.00"),
            currency="AED",
            included_items=[],
        )
        s.add(plan)
        await s.commit()
        await s.refresh(plan)

        today = date.today()
        members = [
            Member(name="Opted A", phone="+97150000001", email="a@x.com", age=20,
                   messaging_opt_in=True, plan_id=plan.id, expiry_date=today + timedelta(days=10)),
            Member(name="Opted B", phone="+97150000002", email="b@x.com", age=22,
                   messaging_opt_in=True, plan_id=plan.id, expiry_date=today - timedelta(days=5)),
            Member(name="Opted Out", phone="+97150000003", email="c@x.com", age=30,
                   messaging_opt_in=False, plan_id=plan.id),
        ]
        s.add_all(members)
        await s.commit()
        return plan


async def test_create_announcement_fans_out_to_opted_in_members(client, session_factory):
    await _seed_members(session_factory)

    resp = await client.post(
        "/api/v1/notifications/announcements",
        json={
            "subject": "Gym closed Friday",
            "body": "We are closed this Friday for maintenance.",
            "channels": ["whatsapp", "email"],
        },
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()
    # Two opted-in members, the third opted out.
    assert data["recipient_count"] == 2
    # 2 members x 2 channels (both have phone + email).
    assert data["job_count"] == 4
    assert data["status"] == "sent"

    async with session_factory() as s:
        jobs = (await s.scalars(select(NotificationJob))).all()
        assert len(jobs) == 4
        assert {j.channel.value for j in jobs} == {"whatsapp", "email"}


async def test_announcement_expired_filter(client, session_factory):
    await _seed_members(session_factory)

    resp = await client.post(
        "/api/v1/notifications/announcements",
        json={
            "subject": "Renew now",
            "body": "Your membership expired.",
            "channels": ["whatsapp"],
            "filters": {"expired": True},
        },
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()
    # Only the opted-in member with a past expiry date qualifies.
    assert data["recipient_count"] == 1
    assert data["job_count"] == 1


async def test_announcement_requires_a_channel(client, session_factory):
    resp = await client.post(
        "/api/v1/notifications/announcements",
        json={"subject": "Hi", "body": "Body", "channels": []},
    )
    assert resp.status_code == 422


async def test_notification_analytics_endpoint(client, session_factory):
    await _seed_members(session_factory)
    # Create an announcement so jobs exist to aggregate.
    await client.post(
        "/api/v1/notifications/announcements",
        json={"subject": "S", "body": "B", "channels": ["whatsapp", "email"]},
    )

    resp = await client.get("/api/v1/analytics/notifications")
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["total"] == 4
    assert data["pending"] == 4
    assert data["by_channel"] == {"whatsapp": 2, "email": 2}
    assert data["by_type"] == {"announcement": 4}
    assert data["delivery_rate"] == 0.0


async def test_channels_status_endpoint(client):
    resp = await client.get("/api/v1/notifications/channels")
    assert resp.status_code == 200
    data = resp.json()
    channels = {row["channel"]: row for row in data}
    assert set(channels) == {"whatsapp", "telegram", "email"}
    # Dev mode default => available even though unconfigured.
    assert channels["whatsapp"]["available"] is True
    assert channels["whatsapp"]["configured"] is False


async def test_list_announcements(client, session_factory):
    await _seed_members(session_factory)
    await client.post(
        "/api/v1/notifications/announcements",
        json={"subject": "First", "body": "B", "channels": ["email"]},
    )
    resp = await client.get("/api/v1/notifications/announcements")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 1
    assert items[0]["subject"] == "First"
