"""Product model."""

from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.listing import Listing
    from app.models.seller_profile import SellerProfile
    from app.models.user import User


class Product(Base, TimestampMixin):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    seller_profile_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("seller_profiles.id", ondelete="SET NULL"), nullable=True, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    category: Mapped[str | None] = mapped_column(String(150), nullable=True, index=True)
    brand: Mapped[str | None] = mapped_column(String(150), nullable=True)
    key_features: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    target_audience: Mapped[str | None] = mapped_column(String(255), nullable=True)
    attributes: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)

    user: Mapped[User] = relationship(back_populates="products")
    seller_profile: Mapped[SellerProfile | None] = relationship(back_populates="products")
    listings: Mapped[list[Listing]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )
