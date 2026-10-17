"""User model."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.listing import Listing
    from app.models.product import Product
    from app.models.refresh_token import RefreshToken
    from app.models.seller_profile import SellerProfile
    from app.models.usage_record import UsageRecord


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    # null for OAuth users
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    full_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    oauth_provider: Mapped[str | None] = mapped_column(String(50), nullable=True)

    refresh_tokens: Mapped[list[RefreshToken]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    seller_profiles: Mapped[list[SellerProfile]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    products: Mapped[list[Product]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    listings: Mapped[list[Listing]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    usage_records: Mapped[list[UsageRecord]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
