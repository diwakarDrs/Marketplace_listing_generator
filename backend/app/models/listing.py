"""Listing model."""

from __future__ import annotations

import enum
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, Enum, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.product import Product
    from app.models.user import User


class Marketplace(str, enum.Enum):
    amazon = "amazon"
    flipkart = "flipkart"
    meesho = "meesho"
    shopify = "shopify"


class ListingStatus(str, enum.Enum):
    draft = "draft"
    final = "final"


class Listing(Base, TimestampMixin):
    __tablename__ = "listings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    product_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    marketplace: Mapped[Marketplace] = mapped_column(
        Enum(Marketplace, name="marketplace"), nullable=False, index=True
    )
    language: Mapped[str] = mapped_column(String(10), nullable=False, default="en")
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    bullets: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    keywords: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    validation_warnings: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON, nullable=False, default=list
    )
    model_used: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[ListingStatus] = mapped_column(
        Enum(ListingStatus, name="listing_status"),
        nullable=False,
        default=ListingStatus.draft,
        index=True,
    )

    user: Mapped[User] = relationship(back_populates="listings")
    product: Mapped[Product] = relationship(back_populates="listings")

    __table_args__ = (Index("ix_listings_user_marketplace", "user_id", "marketplace"),)
