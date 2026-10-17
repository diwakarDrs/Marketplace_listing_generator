"""Monthly generation quota tracking."""

import logging
from datetime import UTC, datetime

from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.exceptions import QuotaExceededError
from app.models.usage_record import UsageRecord

logger = logging.getLogger(__name__)


def current_period() -> str:
    return datetime.now(UTC).strftime("%Y-%m")


def get_or_create_usage(db: Session, user_id: int) -> UsageRecord:
    period = current_period()
    stmt = select(UsageRecord).where(UsageRecord.user_id == user_id, UsageRecord.period == period)
    record = db.execute(stmt).scalar_one_or_none()
    if record is not None:
        return record
    record = UsageRecord(
        user_id=user_id,
        period=period,
        generations_used=0,
        generations_limit=get_settings().FREE_MONTHLY_GENERATIONS,
    )
    db.add(record)
    try:
        db.commit()
    except IntegrityError:  # concurrent creation: unique (user_id, period)
        db.rollback()
        record = db.execute(stmt).scalar_one()
    else:
        db.refresh(record)
    return record


def get_usage_info(db: Session, user_id: int) -> dict[str, int | str]:
    r = get_or_create_usage(db, user_id)
    return {
        "period": r.period,
        "generations_used": r.generations_used,
        "generations_limit": r.generations_limit,
    }


def reserve_generation(db: Session, user_id: int) -> str:
    """Atomically reserve one generation BEFORE the AI call.

    Commits, which also releases the DB transaction/connection so nothing is
    held across the AI await. Raises QuotaExceededError if exhausted. Returns the period; callers
    must `refund_generation` if the generation does not complete.
    """
    r = get_or_create_usage(db, user_id)
    period = r.period
    result = db.execute(
        update(UsageRecord)
        .where(
            UsageRecord.id == r.id,
            UsageRecord.generations_used < UsageRecord.generations_limit,
        )
        .values(generations_used=UsageRecord.generations_used + 1)
    )
    if result.rowcount != 1:
        db.rollback()
        raise QuotaExceededError("Monthly generation limit reached")
    db.commit()
    return period  # pass to refund_generation so a month rollover refunds the right row


def refund_generation(db: Session, user_id: int, period: str | None = None) -> None:
    """Give back a reserved generation (failed AI call costs nothing)."""
    try:
        db.rollback()  # discard any half-finished work first
        db.execute(
            update(UsageRecord)
            .where(
                UsageRecord.user_id == user_id,
                UsageRecord.period == (period or current_period()),
                UsageRecord.generations_used > 0,
            )
            .values(generations_used=UsageRecord.generations_used - 1)
        )
        db.commit()
    except Exception:  # never mask the original failure
        db.rollback()
        logger.exception("Failed to refund generation for user %s", user_id)
