"""Application settings loaded from environment variables."""

import json
from functools import lru_cache
from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

MIN_SECRET_KEY_LENGTH = 32
ALLOWED_ALGORITHMS = frozenset({"HS256", "HS384", "HS512"})
_PLACEHOLDER_SECRETS = ("your-secret-key", "changeme", "change-me", "ci-only-secret")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "Marketplace Listing Generator"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    # Public callback URL registered with Google; falls back to url_for when empty.
    GOOGLE_REDIRECT_URI: str = ""

    OPENAI_API_KEY: str = ""
    AI_MODEL: str = "gpt-4o-mini"
    FREE_MONTHLY_GENERATIONS: int = 20

    FRONTEND_URL: str = "http://localhost:3000"
    # NoDecode: let _split_origins accept comma-separated env values (JSON lists still work).
    CORS_ORIGINS: Annotated[list[str], NoDecode] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    # Brute-force protection (per client IP and per account email, sliding window).
    AUTH_RATE_LIMIT_ATTEMPTS: int = 10
    AUTH_RATE_LIMIT_WINDOW_SECONDS: int = 300

    @field_validator("SECRET_KEY")
    @classmethod
    def _check_secret_key(cls, v: str) -> str:
        if len(v) < MIN_SECRET_KEY_LENGTH:
            raise ValueError(
                f"SECRET_KEY must be at least {MIN_SECRET_KEY_LENGTH} characters "
                "(generate one with: openssl rand -hex 32)"
            )
        lowered = v.lower()
        if any(p in lowered for p in _PLACEHOLDER_SECRETS):
            raise ValueError("SECRET_KEY looks like a placeholder; generate a random value")
        return v

    @field_validator("ALGORITHM")
    @classmethod
    def _check_algorithm(cls, v: str) -> str:
        if v not in ALLOWED_ALGORITHMS:
            raise ValueError(f"ALGORITHM must be one of {sorted(ALLOWED_ALGORITHMS)}")
        return v

    @field_validator("CORS_ORIGINS")
    @classmethod
    def _check_origins(cls, v: list[str]) -> list[str]:
        if any(o.strip() == "*" for o in v):
            raise ValueError("CORS_ORIGINS must list explicit origins, not '*'")
        return v

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _split_origins(cls, v: object) -> object:
        if isinstance(v, str):
            text = v.strip()
            if text.startswith("["):
                return json.loads(text)
            return [o.strip() for o in text.split(",") if o.strip()]
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
