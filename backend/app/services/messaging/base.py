from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass

from app.core.config import settings
from app.models.enums import NotificationChannel

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class RenderedMessage:
    """A channel-agnostic message body. Adapters format it as their medium requires."""

    subject: str
    text: str

    def to_payload(self) -> dict[str, str]:
        return {"subject": self.subject, "text": self.text}

    @classmethod
    def from_payload(cls, payload: dict) -> "RenderedMessage":
        return cls(subject=payload.get("subject", ""), text=payload.get("text", ""))


@dataclass(frozen=True)
class DeliveryResult:
    success: bool
    provider: str
    provider_message_id: str | None = None
    error: str | None = None


class ChannelAdapter(ABC):
    """Base class for outbound message channels.

    Concrete adapters implement ``_send``; the public ``send`` wraps it with the
    dev-stub fallback so an unconfigured channel is safe (and testable) rather than
    a hard failure.
    """

    channel: NotificationChannel

    @property
    @abstractmethod
    def is_configured(self) -> bool:
        """True when the adapter has the credentials it needs to send for real."""

    @abstractmethod
    async def _send(self, recipient: str, message: RenderedMessage) -> DeliveryResult:
        """Perform the real send. Only called when ``is_configured`` is true."""

    async def send(self, recipient: str, message: RenderedMessage) -> DeliveryResult:
        if not recipient:
            return DeliveryResult(success=False, provider=self.channel.value, error="Missing recipient")

        if not self.is_configured:
            if settings.messaging_dev_mode:
                logger.info(
                    "[dev-stub:%s] -> %s | %s | %s",
                    self.channel.value,
                    recipient,
                    message.subject,
                    message.text,
                )
                return DeliveryResult(success=True, provider="dev-stub")
            return DeliveryResult(
                success=False,
                provider=self.channel.value,
                error=f"{self.channel.value} channel is not configured",
            )

        try:
            return await self._send(recipient, message)
        except Exception as exc:  # noqa: BLE001 - surfaced to the job's error_message
            logger.exception("Send failed on channel=%s recipient=%s", self.channel.value, recipient)
            return DeliveryResult(success=False, provider=self.channel.value, error=str(exc))
