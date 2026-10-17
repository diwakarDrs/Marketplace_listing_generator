"""Listing CRUD, generation orchestration and export."""

import csv
import io
import logging
import re
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.exceptions import NotFoundError
from app.models.listing import Listing, ListingStatus, Marketplace
from app.models.product import Product
from app.schemas.listing import ListingUpdateInput
from app.services import usage_service
from app.services.ai_service import AIService
from app.services.marketplace_rules import fit_keywords, get_rules, validate_listing

logger = logging.getLogger(__name__)


def _get_owned_product(db: Session, user_id: int, product_id: int) -> Product:
    product = db.execute(
        select(Product).where(Product.id == product_id, Product.user_id == user_id)
    ).scalar_one_or_none()
    if product is None:
        raise NotFoundError("Product not found")
    return product


def get_listing(db: Session, user_id: int, listing_id: int) -> Listing:
    listing = db.execute(
        select(Listing).where(Listing.id == listing_id, Listing.user_id == user_id)
    ).scalar_one_or_none()
    if listing is None:
        raise NotFoundError("Listing not found")
    return listing


def list_listings(
    db: Session,
    user_id: int,
    *,
    product_id: int | None,
    marketplace: str | None,
    language: str | None,
    page: int,
    page_size: int,
) -> tuple[list[Listing], int]:
    conds = [Listing.user_id == user_id]
    if product_id is not None:
        conds.append(Listing.product_id == product_id)
    if marketplace is not None:
        conds.append(Listing.marketplace == Marketplace(marketplace))
    if language is not None:
        conds.append(Listing.language == language)
    total = db.execute(select(func.count()).select_from(Listing).where(*conds)).scalar_one()
    items = (
        db.execute(
            select(Listing)
            .where(*conds)
            .order_by(Listing.created_at.desc(), Listing.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        .scalars()
        .all()
    )
    return list(items), total


def _product_payload(product: Product) -> dict[str, Any]:
    return {
        "name": product.name,
        "category": product.category,
        "brand": product.brand,
        "key_features": product.key_features or [],
        "price": float(product.price) if product.price is not None else None,
        "target_audience": product.target_audience,
        "attributes": product.attributes or {},
    }


def _build_ai_inputs(
    product: Product, marketplace: str, language: str, instructions: str | None
) -> dict[str, Any]:
    """Snapshot everything the AI call needs into plain data, so the DB session
    is not touched (and no connection is held) while we await the AI."""
    rules = get_rules(marketplace)
    seller = None
    if product.seller_profile is not None:
        sp = product.seller_profile
        seller = {"brand_name": sp.brand_name, "brand_voice": sp.brand_voice}
    limits = {
        "title_max_length": rules.title_max_length,
        "bullet_count": rules.bullet_count,
        "bullet_max_length": rules.bullet_max_length,
        "description_max_length": rules.description_max_length,
        "keyword_max_length": rules.keyword_max_length,
        "max_keywords": rules.max_keywords,
    }
    if rules.keywords_total_max_bytes:
        limits["keywords_total_max_bytes"] = rules.keywords_total_max_bytes
    return {
        "product": _product_payload(product),
        "marketplace_name": rules.name,
        "language": language,
        "limits": limits,
        "seller": seller,
        "instructions": instructions,
    }


async def generate_listing(
    db: Session,
    ai: AIService,
    user_id: int,
    product_id: int,
    marketplace: str,
    language: str,
) -> Listing:
    product = _get_owned_product(db, user_id, product_id)
    inputs = _build_ai_inputs(product, marketplace, language, None)
    # Reserve atomically (commits => releases the connection), refund on failure.
    period = usage_service.reserve_generation(db, user_id)
    try:
        gen = await ai.generate_listing(**inputs)
        keywords = fit_keywords(marketplace, gen.keywords)
        warnings = validate_listing(marketplace, gen.title, gen.bullets, gen.description, keywords)
        listing = Listing(
            user_id=user_id,
            product_id=product_id,
            marketplace=Marketplace(marketplace),
            language=language,
            title=gen.title,
            bullets=gen.bullets,
            description=gen.description,
            keywords=keywords,
            validation_warnings=warnings,
            model_used=gen.model,
            status=ListingStatus.draft,
        )
        db.add(listing)
        db.commit()
        db.refresh(listing)
    except BaseException:
        usage_service.refund_generation(db, user_id, period)
        raise
    return listing


async def regenerate_listing(
    db: Session, ai: AIService, user_id: int, listing_id: int, instructions: str | None
) -> Listing:
    listing = get_listing(db, user_id, listing_id)
    product = _get_owned_product(db, user_id, listing.product_id)
    marketplace = listing.marketplace.value
    inputs = _build_ai_inputs(product, marketplace, listing.language, instructions)
    period = usage_service.reserve_generation(db, user_id)
    try:
        gen = await ai.generate_listing(**inputs)
        keywords = fit_keywords(marketplace, gen.keywords)
        warnings = validate_listing(marketplace, gen.title, gen.bullets, gen.description, keywords)
        listing = get_listing(db, user_id, listing_id)  # fresh: may have changed/deleted
        listing.title = gen.title
        listing.bullets = gen.bullets
        listing.description = gen.description
        listing.keywords = keywords
        listing.validation_warnings = warnings
        listing.model_used = gen.model
        listing.status = ListingStatus.draft
        db.commit()
        db.refresh(listing)
    except BaseException:
        usage_service.refund_generation(db, user_id, period)
        raise
    return listing


def update_listing(db: Session, user_id: int, listing_id: int, data: ListingUpdateInput) -> Listing:
    listing = get_listing(db, user_id, listing_id)
    fields = data.model_dump(exclude_unset=True)
    for key in ("title", "bullets", "description", "keywords"):
        if key in fields and fields[key] is not None:
            setattr(listing, key, fields[key])
    if fields.get("status") is not None:
        listing.status = ListingStatus(fields["status"])
    listing.validation_warnings = validate_listing(
        listing.marketplace.value,
        listing.title or "",
        list(listing.bullets or []),
        listing.description or "",
        list(listing.keywords or []),
    )
    db.commit()
    db.refresh(listing)
    return listing


def delete_listing(db: Session, user_id: int, listing_id: int) -> None:
    listing = get_listing(db, user_id, listing_id)
    db.delete(listing)
    db.commit()


def export_listing(listing: Listing, fmt: str) -> tuple[str, str, str]:
    """Return (content, media_type, filename)."""
    bullets = list(listing.bullets or [])
    keywords = list(listing.keywords or [])
    name = f"listing-{listing.id}"
    if fmt == "csv":
        buf = io.StringIO()
        w = csv.writer(buf)
        w.writerow(
            ["marketplace", "language", "title"]
            + [f"bullet_{i}" for i in range(1, len(bullets) + 1)]
            + ["description", "keywords"]
        )
        w.writerow(
            [listing.marketplace.value, listing.language, _csv_safe(listing.title)]
            + [_csv_safe(b) for b in bullets]
            + [_csv_safe(listing.description or ""), _csv_safe(", ".join(keywords))]
        )
        return "﻿" + buf.getvalue(), "text/csv", f"{name}.csv"
    lines = [
        f"TITLE\n{listing.title}",
        "BULLET POINTS\n" + "\n".join(f"- {b}" for b in bullets),
        f"DESCRIPTION\n{listing.description or ''}",
        "KEYWORDS\n" + ", ".join(keywords),
    ]
    return "\n\n".join(lines) + "\n", "text/plain", f"{name}.txt"


_FORMULA_START = re.compile(r"^[\s\x00-\x1f]*[=+\-@]")


def _csv_safe(value: str) -> str:
    """Neutralise spreadsheet formula injection (also after leading whitespace/newlines)."""
    if value[:1] in ("\t", "\r", "\n") or _FORMULA_START.match(value):
        return "'" + value
    return value
