from __future__ import annotations

from email.message import EmailMessage

import aiosmtplib

from app.core.config import settings
from app.models.enums import NotificationChannel
from app.services.messaging.base import ChannelAdapter, DeliveryResult, RenderedMessage


class EmailAdapter(ChannelAdapter):
    """SMTP email adapter. ``recipient`` is the member's email address."""

    channel = NotificationChannel.email

    @property
    def is_configured(self) -> bool:
        return bool(settings.smtp_host and settings.smtp_from_email)

    async def _send(self, recipient: str, message: RenderedMessage) -> DeliveryResult:
        email = EmailMessage()
        email["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
        email["To"] = recipient
        email["Subject"] = message.subject or "Notification"
        email.set_content(message.text)

        result = await aiosmtplib.send(
            email,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user or None,
            password=settings.smtp_password or None,
            start_tls=settings.smtp_use_tls,
        )
        # aiosmtplib.send returns (errors_dict, message_str)
        response_text = result[1] if isinstance(result, tuple) and len(result) > 1 else None
        return DeliveryResult(success=True, provider="email", provider_message_id=response_text)
