from decimal import Decimal


from app.models import Member, MembershipPlan
from app.models.enums import Gender, NotificationChannel
from app.services.messaging.base import RenderedMessage
from app.services.messaging.registry import channels_for_member, get_adapter, recipient_for
from app.services.messaging.templates import (
    build_announcement_message,
    build_enrollment_message,
)


def make_member(**overrides) -> Member:
    defaults = dict(
        id=1,
        name="Jane Doe",
        phone="+971500000000",
        email="jane@example.com",
        telegram_chat_id="99887766",
        age=28,
        gender=Gender.female,
        messaging_opt_in=True,
    )
    defaults.update(overrides)
    return Member(**defaults)


def make_plan(**overrides) -> MembershipPlan:
    defaults = dict(
        name="Gold",
        program="Adults",
        duration_label="Three Months",
        duration_months=3,
        duration_days=90,
        classes_per_week=3,
        price=Decimal("450.00"),
        currency="AED",
        included_items=["Sauna", "Locker"],
    )
    defaults.update(overrides)
    return MembershipPlan(**defaults)


def test_enrollment_message_includes_member_data_and_plan():
    member = make_member(medical_issues="Asthma", parent_phone="+971511111111")
    plan = make_plan()
    msg = build_enrollment_message(member, plan)

    assert "Jane Doe" in msg.text
    assert "+971500000000" in msg.text
    assert "28" in msg.text
    assert "Asthma" in msg.text
    assert "jane@example.com" in msg.text
    # Payment plan block
    assert "Gold" in msg.text
    assert "450.00 AED" in msg.text
    assert "Sauna" in msg.text
    assert msg.subject


def test_enrollment_message_without_plan_states_unassigned():
    msg = build_enrollment_message(make_member(), None)
    assert "not assigned" in msg.text.lower()


def test_channels_for_member_returns_all_with_identities_in_dev_mode():
    member = make_member()
    pairs = channels_for_member(member)
    channels = {c for c, _ in pairs}
    assert channels == {
        NotificationChannel.whatsapp,
        NotificationChannel.telegram,
        NotificationChannel.email,
    }


def test_channels_for_member_skips_missing_identities():
    member = make_member(email=None, telegram_chat_id=None)
    pairs = channels_for_member(member)
    assert {c for c, _ in pairs} == {NotificationChannel.whatsapp}


def test_channels_for_member_respects_opt_out():
    member = make_member(messaging_opt_in=False)
    assert channels_for_member(member) == []


def test_channels_for_member_honors_requested_subset():
    member = make_member()
    pairs = channels_for_member(member, [NotificationChannel.email])
    assert [c for c, _ in pairs] == [NotificationChannel.email]


def test_recipient_resolution_per_channel():
    member = make_member()
    assert recipient_for(member, NotificationChannel.whatsapp) == member.phone
    assert recipient_for(member, NotificationChannel.telegram) == member.telegram_chat_id
    assert recipient_for(member, NotificationChannel.email) == member.email


async def test_adapter_dev_stub_success_when_unconfigured(monkeypatch):
    from app.core import config

    monkeypatch.setattr(config.settings, "messaging_dev_mode", True)
    adapter = get_adapter(NotificationChannel.telegram)
    result = await adapter.send("123", RenderedMessage("s", "hello"))
    assert result.success is True
    assert result.provider == "dev-stub"


async def test_adapter_fails_when_unconfigured_and_not_dev_mode(monkeypatch):
    from app.core import config

    monkeypatch.setattr(config.settings, "messaging_dev_mode", False)
    adapter = get_adapter(NotificationChannel.email)
    result = await adapter.send("a@b.com", RenderedMessage("s", "hello"))
    assert result.success is False
    assert "not configured" in (result.error or "")


async def test_adapter_missing_recipient_fails():
    adapter = get_adapter(NotificationChannel.whatsapp)
    result = await adapter.send("", RenderedMessage("s", "t"))
    assert result.success is False


def test_announcement_message_passthrough():
    msg = build_announcement_message("Holiday", "Closed on Friday")
    assert msg.subject == "Holiday"
    assert msg.text == "Closed on Friday"
