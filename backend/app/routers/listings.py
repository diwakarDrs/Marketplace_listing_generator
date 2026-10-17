"""Listing endpoints (mounted at /api/listings)."""

import logging
import threading
import time
from collections import defaultdict, deque
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.exceptions import AppError
from app.models.user import User
from app.schemas.listing import (
    GenerateListingRequest,
    ListingOut,
    ListingPage,
    ListingUpdateInput,
    MarketplaceId,
    RegenerateListingRequest,
)
from app.services import listing_service
from app.services.ai_service import AIService, get_ai_service

logger = logging.getLogger(__name__)

router = APIRouter()

DbDep = Annotated[Session, Depends(get_db)]
UserDep = Annotated[User, Depends(get_current_user)]
AiDep = Annotated[AIService, Depends(get_ai_service)]

RATE_LIMIT_MAX = 10
RATE_LIMIT_WINDOW_SECONDS = 60.0
_hits: dict[int, deque[float]] = defaultdict(deque)
_hits_lock = threading.Lock()
_last_sweep = 0.0


class RateLimitedError(AppError):
    status_code = 429
    code = "rate_limited"


def generation_rate_limit(user: UserDep) -> None:
    """Simple in-process per-user sliding window limit for AI endpoints."""
    now = time.monotonic()
    with _hits_lock:
        _evict_idle(now)
        q = _hits[user.id]
        while q and now - q[0] > RATE_LIMIT_WINDOW_SECONDS:
            q.popleft()
        if len(q) >= RATE_LIMIT_MAX:
            raise RateLimitedError("Too many generation requests; please wait a moment")
        q.append(now)


def _evict_idle(now: float) -> None:
    """Drop users whose newest hit is outside the window (caller holds the lock).

    Amortised: sweeps at most once per window so the dict cannot grow unbounded.
    """
    global _last_sweep
    if now - _last_sweep < RATE_LIMIT_WINDOW_SECONDS:
        return
    _last_sweep = now
    for uid in [u for u, q in _hits.items() if not q or now - q[-1] > RATE_LIMIT_WINDOW_SECONDS]:
        del _hits[uid]


@router.get("", response_model=ListingPage)
async def list_listings(
    db: DbDep,
    user: UserDep,
    product_id: int | None = None,
    marketplace: MarketplaceId | None = None,
    language: str | None = Query(default=None, max_length=10),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> ListingPage:
    items, total = listing_service.list_listings(
        db,
        user.id,
        product_id=product_id,
        marketplace=marketplace,
        language=language,
        page=page,
        page_size=page_size,
    )
    return ListingPage(
        items=[ListingOut.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post(
    "/generate",
    response_model=ListingOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(generation_rate_limit)],
)
async def generate_listing(
    body: GenerateListingRequest,
    db: DbDep,
    user: UserDep,
    ai: AiDep,
) -> ListingOut:
    listing = await listing_service.generate_listing(
        db, ai, user.id, body.product_id, body.marketplace, body.language
    )
    return ListingOut.model_validate(listing)


@router.get("/{listing_id}", response_model=ListingOut)
async def get_listing(
    listing_id: int,
    db: DbDep,
    user: UserDep,
) -> ListingOut:
    return ListingOut.model_validate(listing_service.get_listing(db, user.id, listing_id))


@router.put("/{listing_id}", response_model=ListingOut)
async def update_listing(
    listing_id: int,
    body: ListingUpdateInput,
    db: DbDep,
    user: UserDep,
) -> ListingOut:
    return ListingOut.model_validate(listing_service.update_listing(db, user.id, listing_id, body))


@router.post(
    "/{listing_id}/regenerate",
    response_model=ListingOut,
    dependencies=[Depends(generation_rate_limit)],
)
async def regenerate_listing(
    listing_id: int,
    db: DbDep,
    user: UserDep,
    ai: AiDep,
    body: RegenerateListingRequest | None = None,
) -> ListingOut:
    instructions = body.instructions if body else None
    listing = await listing_service.regenerate_listing(db, ai, user.id, listing_id, instructions)
    return ListingOut.model_validate(listing)


@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_listing(
    listing_id: int,
    db: DbDep,
    user: UserDep,
) -> Response:
    listing_service.delete_listing(db, user.id, listing_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{listing_id}/export")
async def export_listing(
    listing_id: int,
    db: DbDep,
    user: UserDep,
    format: Literal["text", "csv"] = "text",
) -> Response:
    listing = listing_service.get_listing(db, user.id, listing_id)
    content, media_type, filename = listing_service.export_listing(listing, format)
    return Response(
        content=content,
        media_type=f"{media_type}; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
