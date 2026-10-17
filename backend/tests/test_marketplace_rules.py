import pytest
from fastapi.testclient import TestClient

from app.services.marketplace_rules import (
    MARKETPLACE_RULES,
    fit_keywords,
    get_rules,
    text_length,
    validate_listing,
)

MARKETPLACES = sorted(MARKETPLACE_RULES)


def ok_listing(mp: str) -> tuple[str, list[str], str, list[str]]:
    r = get_rules(mp)
    return "Nice title", ["bullet"] * r.bullet_count, "Description", ["kw1", "kw2"]


@pytest.mark.parametrize("mp", MARKETPLACES)
def test_valid_listing_has_no_warnings(mp: str) -> None:
    assert validate_listing(mp, *ok_listing(mp)) == []


@pytest.mark.parametrize("mp", MARKETPLACES)
def test_title_too_long_and_empty(mp: str) -> None:
    r = get_rules(mp)
    _, b, d, k = ok_listing(mp)
    w = validate_listing(mp, "x" * (r.title_max_length + 1), b, d, k)
    assert [x["field"] for x in w] == ["title"]
    assert str(r.title_max_length) in w[0]["message"]
    w = validate_listing(mp, "  ", b, d, k)
    assert w[0]["message"] == "Title is empty"


@pytest.mark.parametrize("mp", MARKETPLACES)
def test_bullets(mp: str) -> None:
    r = get_rules(mp)
    t, _, d, k = ok_listing(mp)
    w = validate_listing(mp, t, ["b"] * (r.bullet_count - 1), d, k)
    assert w[0]["field"] == "bullets"
    long = ["b"] * (r.bullet_count - 1) + ["x" * (r.bullet_max_length + 1)]
    w = validate_listing(mp, t, long, d, k)
    assert [x["field"] for x in w] == [f"bullets[{r.bullet_count}]"]


@pytest.mark.parametrize("mp", MARKETPLACES)
def test_description_and_keywords(mp: str) -> None:
    r = get_rules(mp)
    t, b, _, k = ok_listing(mp)
    w = validate_listing(mp, t, b, "d" * (r.description_max_length + 1), k)
    assert w[0]["field"] == "description"
    many = [f"k{i}" for i in range(r.max_keywords + 1)]
    w = validate_listing(mp, t, b, "d", many)
    assert any("recommended maximum" in x["message"] for x in w)
    w = validate_listing(mp, t, b, "d", ["k" * (r.keyword_max_length + 1)])
    assert any("exceeds" in x["message"] for x in w)
    wide = ["k" * r.keyword_max_length] * (r.keywords_total_max_length // r.keyword_max_length + 1)
    w = validate_listing(mp, t, b, "d", wide)
    assert any("total" in x["message"] for x in w)


def test_banned_chars_and_phrases_vary_by_marketplace() -> None:
    args = ("Best Seller bottle ™", ["ok"] * 5, "FREE SHIPPING today", ["k"])
    amazon = validate_listing("amazon", *args)
    shopify = validate_listing("shopify", *args)
    assert any("not allowed" in w["message"] and w["field"] == "title" for w in amazon)
    assert any("best seller" in w["message"] for w in amazon)
    assert any("free shipping" in w["message"] for w in amazon)
    assert not any("not allowed" in w["message"] for w in shopify)
    assert not any("best seller" in w["message"] for w in shopify)
    assert any("free shipping" in w["message"] for w in shopify)


def test_amazon_specific_chars_in_bullet() -> None:
    w = validate_listing("amazon", "t", ["cost $5?"] + ["b"] * 4, "d", [])
    assert any(x["field"] == "bullets[1]" and "$" in x["message"] for x in w)


def test_unknown_marketplace_raises() -> None:
    with pytest.raises(KeyError):
        get_rules("ebay")


def test_marketplaces_endpoint_is_public(client: TestClient) -> None:
    r = client.get("/api/marketplaces")
    assert r.status_code == 200
    data = r.json()
    assert {m["id"] for m in data["marketplaces"]} == set(MARKETPLACES)
    amazon = next(m for m in data["marketplaces"] if m["id"] == "amazon")
    assert amazon["rules"]["title_max_length"] == 200
    assert {"code": "en", "name": "English"} in data["languages"]


def test_text_length_is_grapheme_aware() -> None:
    assert text_length("abc") == 3
    assert text_length("é") == 1  # combining accent
    assert text_length("क्ष") == 1  # Devanagari conjunct (ksha)
    assert text_length("हिन्दी") == 2  # hi + ndi (conjunct)
    assert text_length("क‍") == 1


def test_amazon_search_terms_are_byte_limited() -> None:
    t, b, d, _ = ok_listing("amazon")
    ascii_kw = ["a" * 50] * 4  # 203 bytes joined
    w = validate_listing("amazon", t, b, d, ascii_kw)
    assert any("bytes" in x["message"] for x in w)
    # 25 Hindi characters = 75 bytes each; two keywords exceed 200 bytes but not 250 chars
    hindi = ["क" * 40, "ख" * 40]
    w = validate_listing("amazon", t, b, d, hindi)
    assert any("bytes" in x["message"] for x in w)
    assert not any("bytes" in x["message"] for x in validate_listing("amazon", t, b, d, ["a" * 50]))


def test_flipkart_soft_title_and_description_limits() -> None:
    _, b, _, k = ok_listing("flipkart")
    assert any(x["field"] == "title" for x in validate_listing("flipkart", "x" * 101, b, "d", k))
    w = validate_listing("flipkart", "t", b, "d" * 3001, k)
    assert any("recommended" in x["message"] for x in w)
    w = validate_listing("flipkart", "t", b, "d" * 10001, k)
    assert any("hard limit" in x["message"] for x in w)


@pytest.mark.parametrize("phrase", ["guaranteed", "sale", "free shipping", "discount"])
def test_new_discouraged_phrases(phrase: str) -> None:
    w = validate_listing("amazon", f"Great {phrase.upper()} item", ["b"] * 5, "d", [])
    assert any(phrase in x["message"] for x in w)


def test_phrases_match_whole_words_only() -> None:
    w = validate_listing("amazon", "Wholesale pack", ["b"] * 5, "d", [])
    assert not any("discouraged" in x["message"] for x in w)


def test_fit_keywords_trims_to_byte_budget() -> None:
    kws = ["water bottle", "steel bottle", "gym bottle", "insulated flask", "a" * 150, "tail"]
    fitted = fit_keywords("amazon", kws)
    assert fitted == kws[: len(fitted)]  # only trailing keywords are dropped
    assert 1 <= len(fitted) < len(kws)
    assert len(" ".join(fitted).encode("utf-8")) <= 200
    warnings = validate_listing("amazon", "t", [], "d", fitted)
    assert not any("bytes" in w["message"] for w in warnings)


def test_fit_keywords_noop_when_within_budget_or_no_byte_limit() -> None:
    short = ["a", "b"]
    assert fit_keywords("amazon", short) == short
    long_kws = ["k" * 50] * 6
    assert fit_keywords("shopify", long_kws) == long_kws  # no byte budget configured
    assert fit_keywords("amazon", ["क" * 100]) == ["क" * 100]  # never drops the last keyword
