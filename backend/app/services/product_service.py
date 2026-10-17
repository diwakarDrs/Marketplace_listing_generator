"""Product business logic. Every query is scoped to the owning user."""

import logging

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.exceptions import NotFoundError, ValidationFailure
from app.models.product import Product
from app.models.seller_profile import SellerProfile
from app.schemas.product import ProductCreate, ProductUpdate

logger = logging.getLogger(__name__)

MAX_PAGE_SIZE = 100


def _check_seller_profile(db: Session, user_id: int, seller_profile_id: int | None) -> None:
    if seller_profile_id is None:
        return
    owned = db.scalar(
        select(SellerProfile.id).where(
            SellerProfile.id == seller_profile_id, SellerProfile.user_id == user_id
        )
    )
    if owned is None:
        raise ValidationFailure("seller_profile_id does not belong to the current user")


def list_products(
    db: Session,
    user_id: int,
    seller_id: int | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Product], int]:
    page = max(page, 1)
    page_size = min(max(page_size, 1), MAX_PAGE_SIZE)
    stmt = select(Product).where(Product.user_id == user_id)
    if seller_id is not None:
        stmt = stmt.where(Product.seller_profile_id == seller_id)
    if search and search.strip():
        term = search.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        like = f"%{term}%"
        stmt = stmt.where(
            or_(
                Product.name.ilike(like, escape="\\"),
                Product.brand.ilike(like, escape="\\"),
                Product.category.ilike(like, escape="\\"),
            )
        )
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    items = list(
        db.scalars(
            stmt.order_by(Product.created_at.desc(), Product.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    )
    return items, total


def get_product(db: Session, user_id: int, product_id: int) -> Product:
    product = db.scalar(select(Product).where(Product.id == product_id, Product.user_id == user_id))
    if product is None:
        raise NotFoundError("Product not found")
    return product


def create_product(db: Session, user_id: int, data: ProductCreate) -> Product:
    _check_seller_profile(db, user_id, data.seller_profile_id)
    product = Product(user_id=user_id, **data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    logger.info("Created product %s for user %s", product.id, user_id)
    return product


def update_product(db: Session, user_id: int, product_id: int, data: ProductUpdate) -> Product:
    product = get_product(db, user_id, product_id)
    _check_seller_profile(db, user_id, data.seller_profile_id)
    for field, value in data.model_dump().items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    logger.info("Updated product %s for user %s", product_id, user_id)
    return product


def delete_product(db: Session, user_id: int, product_id: int) -> None:
    product = get_product(db, user_id, product_id)
    db.delete(product)
    db.commit()
    logger.info("Deleted product %s for user %s", product_id, user_id)
