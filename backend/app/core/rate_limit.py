import asyncio
import logging
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status
from redis.asyncio import Redis
from redis.exceptions import RedisError

from app.core.config import settings

logger = logging.getLogger(__name__)


class LoginRateLimiter:
    def __init__(self) -> None:
        self._redis: Redis | None = None
        self._attempts: dict[str, deque[float]] = defaultdict(deque)
        self._lock = asyncio.Lock()

    @staticmethod
    def client_ip(request: Request) -> str:
        # Uvicorn's trusted proxy handling resolves Request.client before this point.
        return request.client.host if request.client else "unknown"

    async def check(self, request: Request) -> None:
        if not settings.login_rate_limit_enabled:
            return

        client_ip = self.client_ip(request)
        retry_after = await self._record(client_ip)
        if retry_after is not None:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many login attempts. Try again later.",
                headers={"Retry-After": str(retry_after)},
            )

    async def _record(self, client_ip: str) -> int | None:
        if settings.app_env.lower() not in {"development", "dev", "test", "testing", "local"}:
            try:
                return await self._record_redis(client_ip)
            except RedisError:
                logger.exception("Redis login rate limiter unavailable; using process-local fallback")
        return await self._record_memory(client_ip)

    async def _record_redis(self, client_ip: str) -> int | None:
        if self._redis is None:
            self._redis = Redis.from_url(settings.redis_url, decode_responses=True)
        key = f"rate-limit:login:{client_ip}"
        async with self._redis.pipeline(transaction=True) as pipeline:
            pipeline.incr(key)
            pipeline.expire(key, settings.login_rate_limit_window_seconds, nx=True)
            pipeline.ttl(key)
            count, _, ttl = await pipeline.execute()
        if int(count) > settings.login_rate_limit_attempts:
            return max(1, int(ttl))
        return None

    async def _record_memory(self, client_ip: str) -> int | None:
        now = time.monotonic()
        cutoff = now - settings.login_rate_limit_window_seconds
        async with self._lock:
            attempts = self._attempts[client_ip]
            while attempts and attempts[0] <= cutoff:
                attempts.popleft()
            attempts.append(now)
            if len(attempts) > settings.login_rate_limit_attempts:
                return max(1, int(settings.login_rate_limit_window_seconds - (now - attempts[0])))
        return None

    async def reset(self) -> None:
        async with self._lock:
            self._attempts.clear()


login_rate_limiter = LoginRateLimiter()
