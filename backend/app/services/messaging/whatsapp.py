from __future__ import annotations

import httpx

from app.core.config import settings
from app.models.enums import NotificationChannel
from app.services.messaging.base import ChannelAdapter, DeliveryResult, RenderedMessage


class WhatsAppAdapter(ChannelAdapter):
    """Meta WhatsApp Cloud API adapter.

    Sends free-form text messages. Note: outside the 24h customer-service window,
    Meta requires pre-approved template messages; that refinement is out of scope
    for this iteration.
    """

    channel = NotificationChannel.whatsapp

    @property
    def is_configured(self) -> bool:
        return bool(settings.whatsapp_phone_number_id and settings.whatsapp_access_token)

    async def _send(self, recipient: str, message: RenderedMessage) -> DeliveryResult:
        url = (
            f"https://graph.facebook.com/{settings.whatsapp_api_version}"
            f"/{settings.whatsapp_phone_number_id}/messages"
        )
        body = message.text
        if message.subject:
            body = f"*{message.subject}*\n\n{message.text}"

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                url,
                headers={"Authorization": f"Bearer {settings.whatsapp_access_token}"},
                json={
                    "messaging_product": "whatsapp",
                    "to": recipient.lstrip("+"),
                    "type": "text",
                    "text": {"body": body},
                },
            )

        if response.status_code >= 400:
            return DeliveryResult(
                success=False,
                provider="whatsapp",
                error=f"HTTP {response.status_code}: {response.text[:300]}",
            )

        data = response.json()
        message_id = None
        messages = data.get("messages")
        if isinstance(messages, list) and messages:
            message_id = messages[0].get("id")
        return DeliveryResult(success=True, provider="whatsapp", provider_message_id=message_id)
