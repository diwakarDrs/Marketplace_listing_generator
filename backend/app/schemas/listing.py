"""Pydantic schemas for the listing module (mirror frontend/src/types/index.ts)."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationInfo, field_validator

from app.services.marketplace_rules import LANGUAGES

MarketplaceId = Literal["amazon", "flipkart", "meesho", "shopify"]
ListingStatusId = Literal["draft", "final"]
MAX_BULLET_LENGTH = 1000
MAX_KEYWORD_LENGTH = 200


class ValidationWarning(BaseModel):
    field: str
    message: str


class ListingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    product_id: int
    marketplace: MarketplaceId
    language: str
    title: str
    bullets: list[str]
    description: str
    keywords: list[str]
    validation_warnings: list[ValidationWarning]
    model_used: str | None = None
    status: ListingStatusId
    created_at: datetime
    updated_at: datetime

    @field_validator("description", mode="before")
    @classmethod
    def _none_to_empty(cls, v: object) -> object:
        return "" if v is None else v

    @field_validator("marketplace", "status", mode="before")
    @classmethod
    def _enum_value(cls, v: object) -> object:
        return getattr(v, "value", v)

    @field_validator("bullets", "keywords", "validation_warnings", mode="before")
    @classmethod
    def _none_to_list(cls, v: object) -> object:
        return [] if v is None else v


class ListingPage(BaseModel):
    items: list[ListingOut]
    total: int
    page: int
    page_size: int


class GenerateListingRequest(BaseModel):
    product_id: int
    marketplace: MarketplaceId
    language: str = Field(default="en", min_length=2, max_length=10)

    @field_validator("language")
    @classmethod
    def _supported_language(cls, v: str) -> str:
        if v not in LANGUAGES:
            raise ValueError(f"Unsupported language '{v}'")
        return v


class RegenerateListingRequest(BaseModel):
    instructions: str | None = Field(default=None, max_length=1000)


class ListingUpdateInput(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=500)
    bullets: list[str] | None = Field(default=None, max_length=20)
    description: str | None = Field(default=None, max_length=20000)
    keywords: list[str] | None = Field(default=None, max_length=100)
    status: ListingStatusId | None = None

    @field_validator("bullets", "keywords")
    @classmethod
    def _cap_item_length(cls, v: list[str] | None, info: ValidationInfo) -> list[str] | None:
        limit = MAX_BULLET_LENGTH if info.field_name == "bullets" else MAX_KEYWORD_LENGTH
        if v is not None and any(len(item) > limit for item in v):
            raise ValueError(f"Each item must be at most {limit} characters")
        return v


class MarketplaceRulesOut(BaseModel):
    title_max_length: int
    bullet_count: int
    bullet_max_length: int
    description_max_length: int
    keyword_max_length: int


class MarketplaceOut(BaseModel):
    id: MarketplaceId
    name: str
    rules: MarketplaceRulesOut


class LanguageOut(BaseModel):
    code: str
    name: str


class MarketplacesResponse(BaseModel):
    marketplaces: list[MarketplaceOut]
    languages: list[LanguageOut]
