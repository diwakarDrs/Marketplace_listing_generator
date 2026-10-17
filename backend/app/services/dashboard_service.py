"""Dashboard statistics service (aggregate queries, scoped to a user)."""

import logging

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.listing import Listing
from app.models.product import Product
from app.models.seller_profile import SellerProfile

logger = logging.getLogger(__name__)

RECENT_LIMIT = 5


def _enum_key(value: object) -> str:
    return str(getattr(value, "value", value))


def get_dashboard_stats(db: Session, user_id: int) -> dict:
    total_sellers = db.scalar(
        select(func.count()).select_from(SellerProfile).where(SellerProfile.user_id == user_id)
    )
    total_products = db.scalar(
        select(func.count()).select_from(Product).where(Product.user_id == user_id)
    )
    by_marketplace = db.execute(
        select(Listing.marketplace, func.count())
        .where(Listing.user_id == user_id)
        .group_by(Listing.marketplace)
    ).all()
    by_language = db.execute(
        select(Listing.language, func.count())
        .where(Listing.user_id == user_id)
        .group_by(Listing.language)
    ).all()
    recent = db.scalars(
        select(Listing)
        .where(Listing.user_id == user_id)
        .order_by(Listing.created_at.desc(), Listing.id.desc())
        .limit(RECENT_LIMIT)
    ).all()

    marketplaces = {_enum_key(k): int(c) for k, c in by_marketplace}
    languages = {_enum_key(k): int(c) for k, c in by_language}
    return {
        "total_sellers": int(total_sellers or 0),
        "total_products": int(total_products or 0),
        "total_listings": sum(marketplaces.values()),
        "listings_by_marketplace": marketplaces,
        "listings_by_language": languages,
        "recent_listings": [
            {
                "id": li.id,
                "user_id": li.user_id,
                "product_id": li.product_id,
                "marketplace": _enum_key(li.marketplace),
                "language": li.language,
                "title": li.title,
                "bullets": li.bullets or [],
                "description": li.description or "",
                "keywords": li.keywords or [],
                "validation_warnings": li.validation_warnings or [],
                "model_used": li.model_used,
                "status": _enum_key(li.status),
                "created_at": li.created_at,
                "updated_at": li.updated_at,
            }
            for li in recent
        ],
    }
