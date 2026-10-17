"""Monthly usage/quota record."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class UsageRecord(Base, TimestampMixin):
    __tablename__ = "usage_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    period: Mapped[str] = mapped_column(String(7), nullable=False)  # YYYY-MM
    generations_used: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    generations_limit: Mapped[int] = mapped_column(Integer, nullable=False, default=50)

    user: Mapped[User] = relationship(back_populates="usage_records")

    __table_args__ = (UniqueConstraint("user_id", "period", name="uq_usage_user_period"),)
