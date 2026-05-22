from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Gym Membership Backend"
    app_env: str = "development"
    debug: bool = True
    postgres_user: str = "postgres"
    postgres_password: str = "postgres"
    postgres_db: str = "gym_membership"
    postgres_host: str = "db"
    postgres_port: int = 5432

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    @property
    def database_url(self) -> str:
        return (
            "postgresql+asyncpg://"
            f"{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )


settings = Settings()
