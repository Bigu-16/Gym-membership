from datetime import date, timedelta
from decimal import Decimal

import pytest
from sqlalchemy import select

from app.core import config
from app.models import Family, Member, MembershipPlan, NotificationJob
from app.models.enums import NotificationChannel
from app.services.messaging.base import DeliveryResult, RenderedMessage
from app.services.reminders import members_missing_email, queue_expiry_reminders

TODAY = date(2026, 10, 16)


@pytest.fixture(autouse=True)
def email_only(monkeypatch):
    """Only email is available, as on a server with SMTP set up and no WhatsApp."""
    from app.services.messaging import registry

    monkeypatch.setattr(config.settings, "expiry_reminder_days", "5,3")
    monkeypatch.setattr(registry, "channel_available", lambda channel: channel is NotificationChannel.email)
    import app.services.reminders as reminders

    monkeypatch.setattr(reminders, "channel_available", lambda channel: channel is NotificationChannel.email)


async def add_member(db, name, days_left, **extra):
    member = Member(
        name=name,
        phone=extra.pop("phone", None),
        age=extra.pop("age", 30),
        expiry_date=TODAY + timedelta(days=days_left),
        messaging_opt_in=extra.pop("opt_in", True),
        **extra,
    )
    db.add(member)
    await db.commit()
    return member


async def email_jobs(db):
    return (await db.scalars(select(NotificationJob).where(NotificationJob.channel == NotificationChannel.email).order_by(NotificationJob.id))).all()


async def run(db, today):
    result = await queue_expiry_reminders(db, today)
    await db.commit()
    return result


async def test_reminders_go_out_at_5_and_3_days_and_only_once(db_session):
    plan = MembershipPlan(name="Karate One Month - 3 Classes", program="Karate", price=Decimal("350"), duration_months=1, duration_days=30)
    db_session.add(plan)
    await db_session.flush()
    await add_member(db_session, "Omar Example", 5, email="omar@example.com", phone="+971504440004", plan_id=plan.id)

    assert (await run(db_session, TODAY))["emails_queued"] == 1  # 5 days left
    assert (await run(db_session, TODAY))["emails_queued"] == 0  # same day again: nothing
    assert (await run(db_session, TODAY + timedelta(days=1)))["emails_queued"] == 0  # 4 days left: already reminded
    assert (await run(db_session, TODAY + timedelta(days=2)))["emails_queued"] == 1  # 3 days left
    assert (await run(db_session, TODAY + timedelta(days=4)))["emails_queued"] == 0  # 1 day left: done

    first, second = await email_jobs(db_session)
    assert first.recipient == "omar@example.com"
    assert "in 5 days" in first.payload["subject"]
    assert "Karate One Month - 3 Classes ends in 5 days" in first.payload["text"]
    assert "<table" in first.payload["html"]
    assert [e["stage"] for e in second.payload["reminder_for"]] == [3]


async def test_a_missed_day_is_caught_up_once(db_session):
    await add_member(db_session, "Late Example", 2, email="late@example.com", phone="+971504440005")
    assert (await run(db_session, TODAY))["emails_queued"] == 1  # first run already inside the 3-day window
    assert (await run(db_session, TODAY + timedelta(days=1)))["emails_queued"] == 0
    [job] = await email_jobs(db_session)
    assert job.payload["reminder_for"][0]["stage"] == 3


async def test_parents_get_one_email_for_all_their_children(db_session):
    family = Family(parent_name="Sara Example", parent_phone="+971500000100", parent_email="Sara@Example.com")
    db_session.add(family)
    await db_session.flush()
    await add_member(db_session, "Lina Example", 5, age=3, family_id=family.id, parent_phone=family.parent_phone)
    await add_member(db_session, "Zaid Example", 3, age=8, family_id=family.id, parent_phone=family.parent_phone)

    result = await run(db_session, TODAY)

    assert result["members_due"] == 2 and result["emails_queued"] == 1
    [job] = await email_jobs(db_session)
    assert job.recipient == "sara@example.com"
    assert job.payload["text"].startswith("Dear Sara Example,")
    assert "Lina Example" in job.payload["text"] and "Zaid Example" in job.payload["text"]
    assert job.payload["subject"] == "Membership renewal reminder for 2 trainees"


async def test_frozen_opted_out_expired_and_unreachable_members(db_session):
    await add_member(db_session, "Frozen Example", 3, email="f@example.com", is_frozen=True)
    await add_member(db_session, "Quiet Example", 3, email="q@example.com", opt_in=False)
    await add_member(db_session, "Past Example", -1, email="p@example.com")
    await add_member(db_session, "Noemail Example", 3, phone="+971504440009")

    result = await run(db_session, TODAY)

    assert result == {"members_due": 1, "emails_queued": 0, "other_messages_queued": 0, "members_without_contact": 1}
    assert await members_missing_email(db_session) == 1


async def test_daily_endpoint_requires_scheduler_secret(client, monkeypatch):
    monkeypatch.setattr(config.settings, "cron_secret", "s3cret-value-for-tests")

    assert (await client.post("/api/v1/tasks/daily-reminders", headers={"X-Cron-Secret": "wrong"})).status_code == 401
    ok = await client.post("/api/v1/tasks/daily-reminders", headers={"X-Cron-Secret": "s3cret-value-for-tests"})
    assert ok.status_code == 200
    assert ok.json()["emails_queued"] == 0

    monkeypatch.setattr(config.settings, "cron_secret", "")
    assert (await client.post("/api/v1/tasks/daily-reminders", headers={"X-Cron-Secret": ""})).status_code == 401


async def test_test_email_button(client, monkeypatch):
    from app.services.messaging.email import EmailAdapter

    monkeypatch.setattr(config.settings, "smtp_host", "")
    assert (await client.post("/api/v1/notifications/test-email", json={"to": "desk@example.com"})).status_code == 400

    sent = []

    async def fake_send(self, recipient, message):
        sent.append((recipient, message))
        return DeliveryResult(success=True, provider="email")

    monkeypatch.setattr(config.settings, "smtp_host", "smtp.example.com")
    monkeypatch.setattr(config.settings, "smtp_from_email", "desk@example.com")
    monkeypatch.setattr(EmailAdapter, "_send", fake_send)
    response = await client.post("/api/v1/notifications/test-email", json={"to": "owner@example.com"})
    assert response.status_code == 200
    assert sent[0][0] == "owner@example.com"

    settings_view = (await client.get("/api/v1/notifications/reminder-settings")).json()
    assert settings_view["reminder_days"] == [5, 3]
    assert settings_view["email_configured"] is True


async def test_email_adapter_sends_html_and_uses_implicit_tls_on_465(monkeypatch):
    import app.services.messaging.email as email_module

    captured = {}

    async def fake_smtp_send(message, **kwargs):
        captured["message"] = message
        captured.update(kwargs)
        return ({}, "250 OK")

    monkeypatch.setattr(email_module.aiosmtplib, "send", fake_smtp_send)
    monkeypatch.setattr(config.settings, "smtp_host", "smtp.example.com")
    monkeypatch.setattr(config.settings, "smtp_from_email", "desk@example.com")
    monkeypatch.setattr(config.settings, "smtp_port", 465)

    result = await email_module.EmailAdapter().send("p@example.com", RenderedMessage("Hi", "plain", "<p>rich</p>"))

    assert result.success
    assert captured["use_tls"] is True and captured["start_tls"] is False
    assert captured["message"].get_body(("html",)).get_content().strip() == "<p>rich</p>"
