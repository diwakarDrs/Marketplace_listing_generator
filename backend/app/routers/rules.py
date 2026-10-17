"""Marketplace rules and supported languages."""

from fastapi import APIRouter

from app.schemas.listing import (
    LanguageOut,
    MarketplaceOut,
    MarketplaceRulesOut,
    MarketplacesResponse,
)
from app.services.marketplace_rules import LANGUAGES, MARKETPLACE_RULES

router = APIRouter()


@router.get("", response_model=MarketplacesResponse)
async def get_marketplaces() -> MarketplacesResponse:
    return MarketplacesResponse(
        marketplaces=[
            MarketplaceOut(
                id=r.id,  # type: ignore[arg-type]
                name=r.name,
                rules=MarketplaceRulesOut(
                    title_max_length=r.title_max_length,
                    bullet_count=r.bullet_count,
                    bullet_max_length=r.bullet_max_length,
                    description_max_length=r.description_max_length,
                    keyword_max_length=r.keyword_max_length,
                ),
            )
            for r in MARKETPLACE_RULES.values()
        ],
        languages=[LanguageOut(code=c, name=n) for c, n in LANGUAGES.items()],
    )
