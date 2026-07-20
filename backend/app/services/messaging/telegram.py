from __future__ import annotations

import httpx

from app.core.config import settings
from app.models.enums import NotificationChannel
from app.services.messaging.base import ChannelAdapter, DeliveryResult, RenderedMessage


class TelegramAdapter(ChannelAdapter):
    """Telegram Bot API adapter (sendMessage).

    ``recipient`` is the member's telegram chat id. The member must have started a
    chat with the bot first for delivery to succeed.
    """

    channel = NotificationChannel.telegram

    @property
    def is_configured(self) -> bool:
        return bool(settings.telegram_bot_token)

    async def _send(self, recipient: str, message: RenderedMessage) -> DeliveryResult:
        url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage"
        text = message.text
        if message.subject:
            text = f"*{message.subject}*\n\n{message.text}"

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                url,
                json={"chat_id": recipient, "text": text, "parse_mode": "Markdown"},
            )

        data: dict = {}
        try:
            data = response.json()
        except ValueError:
            pass

        if response.status_code >= 400 or not data.get("ok", False):
            detail = data.get("description") or response.text[:300]
            return DeliveryResult(success=False, provider="telegram", error=f"HTTP {response.status_code}: {detail}")

        message_id = None
        result = data.get("result")
        if isinstance(result, dict):
            message_id = str(result.get("message_id")) if result.get("message_id") is not None else None
        return DeliveryResult(success=True, provider="telegram", provider_message_id=message_id)
