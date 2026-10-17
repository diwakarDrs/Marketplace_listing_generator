"""Seller profile schemas."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.services.marketplace_rules import LANGUAGES

MarketplaceId = Literal["amazon", "flipkart", "meesho", "shopify"]
LANGUAGE_CODES: frozenset[str] = frozenset(LANGUAGES)


class SellerProfileCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    brand_name: str | None = Field(default=None, max_length=150)
    brand_voice: str | None = Field(default=None, max_length=2000)
    default_marketplace: MarketplaceId | None = None
    default_language: str | None = Field(default=None, max_length=10)

    @field_validator("name")
    @classmethod
    def _strip_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("name must not be blank")
        return value

    @field_validator("default_language")
    @classmethod
    def _check_language(cls, value: str | None) -> str | None:
        if value is not None and value not in LANGUAGE_CODES:
            raise ValueError(f"default_language must be one of {sorted(LANGUAGE_CODES)}")
        return value


class SellerProfileUpdate(SellerProfileCreate):
    """PUT replaces the profile (frontend sends the full SellerProfileInput)."""


class SellerProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    name: str
    brand_name: str | None
    brand_voice: str | None
    default_marketplace: MarketplaceId | None
    default_language: str | None
    created_at: datetime
    updated_at: datetime


class SellerProfileList(BaseModel):
    items: list[SellerProfileRead]
    total: int
    page: int
    page_size: int
