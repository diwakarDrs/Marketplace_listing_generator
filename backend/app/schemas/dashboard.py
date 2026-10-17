"""Dashboard and usage schemas (match frontend DashboardStats / UsageInfo)."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ValidationWarningOut(BaseModel):
    field: str
    message: str


class RecentListing(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    product_id: int
    marketplace: str
    language: str
    title: str
    bullets: list[str] = Field(default_factory=list)
    description: str = ""
    keywords: list[str] = Field(default_factory=list)
    validation_warnings: list[ValidationWarningOut] = Field(default_factory=list)
    model_used: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime


class DashboardStats(BaseModel):
    total_sellers: int
    total_products: int
    total_listings: int
    listings_by_marketplace: dict[str, int]
    listings_by_language: dict[str, int]
    recent_listings: list[RecentListing]


class UsageInfoOut(BaseModel):
    period: str
    generations_used: int
    generations_limit: int
