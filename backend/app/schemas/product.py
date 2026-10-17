"""Product schemas (match frontend Product / ProductInput / PaginatedResponse)."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator

MAX_KEY_FEATURES = 20
MAX_ATTRIBUTES = 50
MAX_ATTR_KEY_LEN = 100
MAX_ATTR_VALUE_LEN = 500


class ProductBase(BaseModel):
    seller_profile_id: int | None = None
    category: str | None = Field(default=None, max_length=150)
    brand: str | None = Field(default=None, max_length=150)
    key_features: list[str] = Field(default_factory=list, max_length=MAX_KEY_FEATURES)
    price: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    target_audience: str | None = Field(default=None, max_length=255)
    attributes: dict[str, str] = Field(default_factory=dict)

    @field_validator("key_features")
    @classmethod
    def _clean_features(cls, v: list[str]) -> list[str]:
        cleaned = [f.strip() for f in v if f and f.strip()]
        if any(len(f) > 500 for f in cleaned):
            raise ValueError("each key feature must be at most 500 characters")
        return cleaned

    @field_validator("attributes")
    @classmethod
    def _limit_attributes(cls, v: dict[str, str]) -> dict[str, str]:
        if len(v) > MAX_ATTRIBUTES:
            raise ValueError(f"at most {MAX_ATTRIBUTES} attributes allowed")
        if any(len(k) > MAX_ATTR_KEY_LEN or len(val) > MAX_ATTR_VALUE_LEN for k, val in v.items()):
            raise ValueError(
                f"attribute keys must be <= {MAX_ATTR_KEY_LEN} and values <= "
                f"{MAX_ATTR_VALUE_LEN} characters"
            )
        return v


class ProductCreate(ProductBase):
    name: str = Field(min_length=1, max_length=255)

    @field_validator("name")
    @classmethod
    def _strip_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("name is required")
        return v


class ProductUpdate(ProductCreate):
    """Full replacement (PUT), same shape as ProductInput."""


class ProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    seller_profile_id: int | None
    name: str
    category: str | None
    brand: str | None
    key_features: list[str]
    price: float | None
    target_audience: str | None
    attributes: dict[str, str]
    created_at: datetime
    updated_at: datetime


class ProductPage(BaseModel):
    items: list[ProductRead]
    total: int
    page: int
    page_size: int
