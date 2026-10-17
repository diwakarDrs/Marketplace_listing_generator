"""Seller profile model."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.product import Product
    from app.models.user import User


class SellerProfile(Base, TimestampMixin):
    __tablename__ = "seller_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    brand_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    brand_voice: Mapped[str | None] = mapped_column(Text, nullable=True)
    default_marketplace: Mapped[str | None] = mapped_column(String(30), nullable=True)
    default_language: Mapped[str | None] = mapped_column(String(10), nullable=True)

    user: Mapped[User] = relationship(back_populates="seller_profiles")
    products: Mapped[list[Product]] = relationship(back_populates="seller_profile")
