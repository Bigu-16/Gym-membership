from __future__ import annotations

from app.core.config import settings
from app.models import Member
from app.models.enums import NotificationChannel
from app.services.messaging.base import ChannelAdapter
from app.services.messaging.email import EmailAdapter
from app.services.messaging.telegram import TelegramAdapter
from app.services.messaging.whatsapp import WhatsAppAdapter

_ADAPTERS: dict[NotificationChannel, ChannelAdapter] = {
    NotificationChannel.whatsapp: WhatsAppAdapter(),
    NotificationChannel.telegram: TelegramAdapter(),
    NotificationChannel.email: EmailAdapter(),
}


def get_adapter(channel: NotificationChannel) -> ChannelAdapter:
    return _ADAPTERS[channel]


def channel_available(channel: NotificationChannel) -> bool:
    """A channel is usable if it is configured, or if dev mode lets it stub-send."""
    return settings.messaging_dev_mode or get_adapter(channel).is_configured


def recipient_for(member: Member, channel: NotificationChannel) -> str | None:
    """The address/identifier a member is reachable at on a given channel, if any."""
    if channel is NotificationChannel.whatsapp:
        return member.phone
    if channel is NotificationChannel.telegram:
        return member.telegram_chat_id
    if channel is NotificationChannel.email:
        return member.email
    return None


def channels_for_member(
    member: Member,
    requested: list[NotificationChannel] | None = None,
) -> list[tuple[NotificationChannel, str]]:
    """Return (channel, recipient) pairs a member should receive on.

    A channel qualifies when: the member is opted in, the channel is available
    (configured or dev mode), it is in ``requested`` (or all channels if None),
    and the member has a recipient identity for it.
    """
    if not member.messaging_opt_in:
        return []

    candidates = requested if requested is not None else list(NotificationChannel)
    pairs: list[tuple[NotificationChannel, str]] = []
    for channel in candidates:
        if not channel_available(channel):
            continue
        recipient = recipient_for(member, channel)
        if recipient:
            pairs.append((channel, recipient))
    return pairs
