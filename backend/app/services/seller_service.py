"""Seller profile business logic. Every query is scoped to the owning user."""

import logging

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.exceptions import NotFoundError
from app.models.seller_profile import SellerProfile
from app.schemas.seller import SellerProfileCreate, SellerProfileUpdate

logger = logging.getLogger(__name__)


def list_sellers(
    db: Session, user_id: int, page: int, page_size: int
) -> tuple[list[SellerProfile], int]:
    base = select(SellerProfile).where(SellerProfile.user_id == user_id)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    items = list(
        db.scalars(
            base.order_by(SellerProfile.created_at.desc(), SellerProfile.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    )
    return items, total


def get_seller(db: Session, user_id: int, seller_id: int) -> SellerProfile:
    seller = db.scalar(
        select(SellerProfile).where(SellerProfile.id == seller_id, SellerProfile.user_id == user_id)
    )
    if seller is None:
        raise NotFoundError("Seller profile not found")
    return seller


def create_seller(db: Session, user_id: int, data: SellerProfileCreate) -> SellerProfile:
    seller = SellerProfile(user_id=user_id, **data.model_dump())
    db.add(seller)
    db.commit()
    db.refresh(seller)
    logger.info("Seller profile %s created for user %s", seller.id, user_id)
    return seller


def update_seller(
    db: Session, user_id: int, seller_id: int, data: SellerProfileUpdate
) -> SellerProfile:
    seller = get_seller(db, user_id, seller_id)
    for field, value in data.model_dump().items():
        setattr(seller, field, value)
    db.commit()
    db.refresh(seller)
    logger.info("Seller profile %s updated", seller_id)
    return seller


def delete_seller(db: Session, user_id: int, seller_id: int) -> None:
    seller = get_seller(db, user_id, seller_id)
    db.delete(seller)
    db.commit()
    logger.info("Seller profile %s deleted", seller_id)
