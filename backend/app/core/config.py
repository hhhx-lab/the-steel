from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "铁子后端"
    app_env: str = "local"
    debug: bool = False
    frontend_cors_origins: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173"
    )
    database_url: str = "sqlite:///./tiezi.db"
    ai_provider: str = "openai"
    openai_api_key: str | None = None
    openai_model: str = "gpt-4.1-mini"
    ai_request_timeout_seconds: int = Field(default=30, ge=1, le=120)
    ai_test_mode: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.frontend_cors_origins.split(",")
            if origin.strip()
        ]

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")

    @property
    def is_postgres(self) -> bool:
        return self.database_url.startswith(("postgresql://", "postgresql+psycopg://"))

    def require_real_ai_config(self) -> None:
        if self.ai_test_mode:
            return
        if self.ai_provider != "openai":
            raise RuntimeError(f"Unsupported AI_PROVIDER: {self.ai_provider}")
        if not self.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is required when AI_TEST_MODE=false")


@lru_cache
def get_settings() -> Settings:
    return Settings()
