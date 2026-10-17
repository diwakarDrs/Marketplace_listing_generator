"""Per-marketplace listing rules and validation.

NOTE: All numeric limits and banned terms below are best-effort, UNVERIFIED and
frequently CATEGORY-SPECIFIC values. They MUST be checked against each
marketplace's current seller documentation before being treated as policy.
Every check here is a SOFT warning/hint; validation never blocks a listing.

Length counting: `text_length` counts user-perceived characters approximately
(combining marks, joiners and Indic conjunct consonants do not add to the
count). It avoids a heavy grapheme-segmentation dependency; it is not a full
Unicode UAX #29 implementation.
"""

import re
import unicodedata
from dataclasses import dataclass, field

LANGUAGES: dict[str, str] = {
    "en": "English",
    "hi": "Hindi",
    "ta": "Tamil",
    "te": "Telugu",
    "kn": "Kannada",
    "ml": "Malayalam",
    "bn": "Bengali",
    "mr": "Marathi",
    "gu": "Gujarati",
}


def text_length(text: str) -> int:
    """Approximate grapheme-cluster count (code points minus marks/joiners/conjuncts)."""
    count = 0
    after_virama = False
    for ch in text:
        if unicodedata.category(ch).startswith("M") or ch in "\u200c\u200d\ufe0f":
            after_virama = unicodedata.combining(ch) == 9  # virama joins the next consonant
            continue
        if after_virama and unicodedata.category(ch).startswith("L"):
            after_virama = False
            continue
        after_virama = False
        count += 1
    return count


@dataclass(frozen=True)
class MarketplaceRuleSet:
    id: str
    name: str
    title_max_length: int
    bullet_count: int
    bullet_max_length: int
    description_max_length: int
    keyword_max_length: int  # per keyword / phrase
    keywords_total_max_length: int  # all keywords joined by a space
    max_keywords: int
    banned_chars: str = ""
    banned_phrases: tuple[str, ...] = field(default_factory=tuple)
    # Amazon.in "search terms" are limited by UTF-8 BYTES (unverified, ~200) in total.
    keywords_total_max_bytes: int = 0
    # Soft upper bound used only for a stronger warning (Flipkart description).
    description_hard_max_length: int = 0


_PROMO = (
    "best seller",
    "free shipping",
    "100% guarantee",
    "guaranteed",
    "no.1",
    "#1",
    "lowest price",
    "sale",
    "discount",
)

MARKETPLACE_RULES: dict[str, MarketplaceRuleSet] = {
    "amazon": MarketplaceRuleSet(
        "amazon",
        "Amazon",
        200,
        5,
        500,
        2000,
        50,
        250,
        25,
        banned_chars="™®©$?_{}^¬¦",
        banned_phrases=_PROMO,
        # Search terms: ~200 BYTES total (unverified, category-specific); the
        # per-keyword and count limits above are only soft hints.
        keywords_total_max_bytes=200,
    ),
    "flipkart": MarketplaceRuleSet(
        "flipkart",
        "Flipkart",
        100,  # soft: titles beyond ~100 chars are often truncated (unverified)
        5,
        250,
        3000,
        50,
        500,
        30,
        banned_chars="™®©{}^",
        banned_phrases=_PROMO,
        # Flipkart has no separate keywords field; keywords are still generated
        # (useful for the description / reuse) but are not submitted separately.
        description_hard_max_length=10000,
    ),
    "meesho": MarketplaceRuleSet(
        "meesho",
        "Meesho",
        100,
        5,
        200,
        1500,
        40,
        400,
        20,
        banned_chars="™®©{}^",
        banned_phrases=_PROMO,
    ),
    "shopify": MarketplaceRuleSet(
        "shopify",
        "Shopify",
        255,
        5,
        300,
        5000,
        50,
        500,
        30,
        banned_chars="{}^",
        banned_phrases=("free shipping", "100% guarantee"),
    ),
}


def get_rules(marketplace: str) -> MarketplaceRuleSet:
    return MARKETPLACE_RULES[marketplace]


def fit_keywords(marketplace: str, keywords: list[str]) -> list[str]:
    """Drop trailing (least important) keywords until the byte budget is met.

    Only applies to marketplaces with a total search-terms byte limit. The AI is told the
    limit but cannot count bytes reliably, so the budget is enforced here.
    """
    budget = get_rules(marketplace).keywords_total_max_bytes
    if not budget:
        return keywords
    kept = list(keywords)
    while len(kept) > 1 and len(" ".join(kept).encode("utf-8")) > budget:
        kept.pop()
    return kept


def validate_listing(
    marketplace: str,
    title: str,
    bullets: list[str],
    description: str,
    keywords: list[str],
) -> list[dict[str, str]]:
    """Return a list of {field, message} warnings (ValidationWarning shape)."""
    r = get_rules(marketplace)
    warnings: list[dict[str, str]] = []

    def warn(f: str, m: str) -> None:
        warnings.append({"field": f, "message": m})

    if not title.strip():
        warn("title", "Title is empty")
    title_len = text_length(title)
    if title_len > r.title_max_length:
        warn("title", f"Title is {title_len} characters; {r.name} limit is {r.title_max_length}")

    if len(bullets) != r.bullet_count:
        warn("bullets", f"Expected {r.bullet_count} bullets, found {len(bullets)}")
    for i, b in enumerate(bullets, 1):
        b_len = text_length(b)
        if b_len > r.bullet_max_length:
            warn(
                f"bullets[{i}]",
                f"Bullet {i} is {b_len} characters; limit is {r.bullet_max_length}",
            )

    desc_len = text_length(description)
    if r.description_hard_max_length and desc_len > r.description_hard_max_length:
        warn(
            "description",
            f"Description is {desc_len} characters; hard limit is {r.description_hard_max_length}",
        )
    elif desc_len > r.description_max_length:
        warn(
            "description",
            f"Description is {desc_len} characters; recommended limit is "
            f"{r.description_max_length}",
        )

    if len(keywords) > r.max_keywords:
        warn("keywords", f"{len(keywords)} keywords; recommended maximum is {r.max_keywords}")
    for k in keywords:
        if text_length(k) > r.keyword_max_length:
            warn("keywords", f"Keyword '{k[:30]}' exceeds {r.keyword_max_length} characters")
    joined = " ".join(keywords)
    if r.keywords_total_max_bytes:
        size = len(joined.encode("utf-8"))
        if size > r.keywords_total_max_bytes:
            warn(
                "keywords",
                f"Keywords total {size} bytes; {r.name} search terms are limited to about "
                f"{r.keywords_total_max_bytes} bytes (non-Latin scripts use 3 bytes per character)",
            )
    elif text_length(joined) > r.keywords_total_max_length:
        warn("keywords", f"Keywords total exceeds {r.keywords_total_max_length} characters")

    texts = [("title", title), ("description", description)]
    texts += [(f"bullets[{i}]", b) for i, b in enumerate(bullets, 1)]
    for fname, text in texts:
        bad = sorted({c for c in text if c in r.banned_chars})
        if bad:
            warn(fname, f"Contains characters not allowed on {r.name}: {' '.join(bad)}")
        low = text.lower()
        for p in r.banned_phrases:
            if re.search(rf"(?<!\w){re.escape(p)}(?!\w)", low):
                warn(fname, f"Contains discouraged phrase '{p}'")
    return warnings
