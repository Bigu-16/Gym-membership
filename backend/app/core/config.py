from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Gym Management Backend"
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"
    debug: bool = True
    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 60 * 24
    redis_host: str = "redis"
    redis_port: int = 6379
    redis_db: int = 0
    redis_url_override: str | None = Field(default=None, validation_alias="REDIS_URL")
    login_rate_limit_enabled: bool = True
    login_rate_limit_attempts: int = Field(default=5, ge=1)
    login_rate_limit_window_seconds: int = Field(default=60, ge=1)
    postgres_user: str = "postgres"
    postgres_password: str = "postgres"
    postgres_db: str = "gym_membership"
    postgres_host: str = "db"
    postgres_port: int = 5432
    database_url_override: str | None = Field(default=None, validation_alias="DATABASE_URL")
    frontend_origin: str = "https://gym-membership-beta.vercel.app"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,https://gym-membership-beta.vercel.app"

    # --- Messaging / notifications ---
    # When true (the default), unconfigured channels log the payload and report a
    # synthetic success ("dev-stub") so flows are fully testable without credentials.
    # Set to false in production so only configured channels are dispatched.
    messaging_dev_mode: bool = True
    notification_max_attempts: int = 3

    # WhatsApp (Meta Cloud API)
    whatsapp_phone_number_id: str = ""
    whatsapp_access_token: str = ""
    whatsapp_api_version: str = "v21.0"

    # Telegram Bot API
    telegram_bot_token: str = ""

    # Email (SMTP)
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_from_name: str = "Gym Membership"
    smtp_use_tls: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    @property
    def database_url(self) -> str:
        if self.database_url_override:
            return normalize_database_url(self.database_url_override)

        local_url = (
            "postgresql+asyncpg://"
            f"{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )
        return normalize_database_url(local_url)

    @property
    def cors_origin_list(self) -> list[str]:
        configured = [self.frontend_origin, *self.cors_origins.split(",")]
        normalized: list[str] = []
        for origin in configured:
            value = origin.strip().rstrip("/")
            if value and value not in normalized:
                normalized.append(value)
        return normalized

    @property
    def redis_url(self) -> str:
        if self.redis_url_override:
            return self.redis_url_override
        return f"redis://{self.redis_host}:{self.redis_port}/{self.redis_db}"

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"

    @property
    def allows_development_endpoints(self) -> bool:
        return self.app_env.lower() in {"development", "dev", "test", "testing", "local"}


def normalize_database_url(url: str) -> str:
    normalized = url.strip()
    if normalized.startswith("postgres://"):
        normalized = "postgresql://" + normalized.removeprefix("postgres://")
    if normalized.startswith("postgresql://"):
        normalized = "postgresql+asyncpg://" + normalized.removeprefix("postgresql://")

    parts = urlsplit(normalized)
    query = dict(parse_qsl(parts.query, keep_blank_values=True))
    sslmode = query.pop("sslmode", None)
    query.pop("channel_binding", None)
    if sslmode and "ssl" not in query:
        query["ssl"] = "require" if sslmode == "require" else sslmode
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


settings = Settings()
