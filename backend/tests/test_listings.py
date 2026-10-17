from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.engine import Engine

from app.config import get_settings
from app.routers import listings as listings_router
from app.services.ai_service import GeneratedListing
from tests.conftest import FakeAI


def gen(
    client: TestClient, h: dict[str, str], pid: int, mp: str = "amazon", lang: str = "en"
) -> Any:
    return client.post(
        "/api/listings/generate",
        json={"product_id": pid, "marketplace": mp, "language": lang},
        headers=h,
    )


def test_generate(
    client: TestClient, auth_a: dict[str, str], product_a: dict[str, Any], fake_ai: FakeAI
) -> None:
    r = gen(client, auth_a, product_a["id"])
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["title"] == "Great Steel Bottle"
    assert len(body["bullets"]) == 5
    assert body["status"] == "draft" and body["marketplace"] == "amazon"
    assert body["model_used"] == "fake-model"
    assert fake_ai.calls[0]["product"]["name"] == "Steel Bottle"
    usage = client.get("/api/usage", headers=auth_a).json()
    assert usage["generations_used"] == 1


def test_generate_validation(
    client: TestClient, auth_a: dict[str, str], product_a: dict[str, Any]
) -> None:
    assert gen(client, auth_a, product_a["id"], mp="ebay").status_code == 422
    assert gen(client, auth_a, product_a["id"], lang="xx").status_code == 422
    assert gen(client, auth_a, 9999).status_code == 404


def test_cross_user_404(
    client: TestClient,
    auth_a: dict[str, str],
    auth_b: dict[str, str],
    product_a: dict[str, Any],
) -> None:
    assert gen(client, auth_b, product_a["id"]).status_code == 404
    lid = gen(client, auth_a, product_a["id"]).json()["id"]
    assert client.get(f"/api/listings/{lid}", headers=auth_b).status_code == 404
    r = client.put(f"/api/listings/{lid}", json={"title": "x"}, headers=auth_b)
    assert r.status_code == 404
    assert client.delete(f"/api/listings/{lid}", headers=auth_b).status_code == 404
    assert client.post(f"/api/listings/{lid}/regenerate", headers=auth_b).status_code == 404
    assert client.get(f"/api/listings/{lid}/export", headers=auth_b).status_code == 404
    assert client.get("/api/listings", headers=auth_b).json()["total"] == 0


def test_quota_exhaustion(
    client: TestClient,
    auth_a: dict[str, str],
    product_a: dict[str, Any],
    monkeypatch: pytest.MonkeyPatch,
    fake_ai: FakeAI,
) -> None:
    monkeypatch.setattr(get_settings(), "FREE_MONTHLY_GENERATIONS", 2)
    assert gen(client, auth_a, product_a["id"]).status_code == 201
    assert gen(client, auth_a, product_a["id"]).status_code == 201
    r = gen(client, auth_a, product_a["id"])
    assert r.status_code == 429
    assert r.json()["error"]["code"] == "quota_exceeded"
    assert len(fake_ai.calls) == 2  # AI not called once exhausted
    lid = client.get("/api/listings", headers=auth_a).json()["items"][0]["id"]
    assert client.post(f"/api/listings/{lid}/regenerate", headers=auth_a).status_code == 429


def test_failed_ai_does_not_consume_quota(
    client: TestClient, auth_a: dict[str, str], product_a: dict[str, Any], fake_ai: FakeAI
) -> None:
    fake_ai.fail = True
    r = gen(client, auth_a, product_a["id"])
    assert r.status_code == 502
    assert r.json()["error"]["code"] == "ai_service_error"
    assert client.get("/api/usage", headers=auth_a).json()["generations_used"] == 0
    assert client.get("/api/listings", headers=auth_a).json()["total"] == 0


def test_warnings_are_returned(
    client: TestClient, auth_a: dict[str, str], product_a: dict[str, Any], fake_ai: FakeAI
) -> None:
    fake_ai.result = GeneratedListing("T" * 300, ["b"] * 5, "d", ["k"], "fake-model")
    r = gen(client, auth_a, product_a["id"]).json()
    assert any(w["field"] == "title" for w in r["validation_warnings"])


def test_regenerate(
    client: TestClient, auth_a: dict[str, str], product_a: dict[str, Any], fake_ai: FakeAI
) -> None:
    lid = gen(client, auth_a, product_a["id"]).json()["id"]
    client.put(f"/api/listings/{lid}", json={"status": "final"}, headers=auth_a)
    fake_ai.result = GeneratedListing("New title", ["x"] * 5, "new d", ["k"], "fake-model")
    r = client.post(
        f"/api/listings/{lid}/regenerate", json={"instructions": "be punchy"}, headers=auth_a
    )
    assert r.status_code == 200
    assert r.json()["title"] == "New title" and r.json()["status"] == "draft"
    assert fake_ai.calls[-1]["instructions"] == "be punchy"
    # no body is allowed too
    assert client.post(f"/api/listings/{lid}/regenerate", headers=auth_a).status_code == 200
    too_long = {"instructions": "x" * 1001}
    assert (
        client.post(f"/api/listings/{lid}/regenerate", json=too_long, headers=auth_a).status_code
        == 422
    )
    assert client.get("/api/usage", headers=auth_a).json()["generations_used"] == 3


def test_edit_revalidates(
    client: TestClient, auth_a: dict[str, str], product_a: dict[str, Any]
) -> None:
    lid = gen(client, auth_a, product_a["id"]).json()["id"]
    assert client.get(f"/api/listings/{lid}", headers=auth_a).json()["validation_warnings"] == []
    r = client.put(
        f"/api/listings/{lid}",
        json={"title": "Best seller ™ bottle", "bullets": ["only one"]},
        headers=auth_a,
    )
    assert r.status_code == 200
    fields = {w["field"] for w in r.json()["validation_warnings"]}
    assert {"title", "bullets"} <= fields
    assert r.json()["bullets"] == ["only one"]
    fixed = client.put(
        f"/api/listings/{lid}",
        json={"title": "Clean title", "bullets": ["a", "b", "c", "d", "e"], "status": "final"},
        headers=auth_a,
    )
    assert fixed.json()["validation_warnings"] == []
    assert fixed.json()["status"] == "final"
    assert client.put(f"/api/listings/{lid}", json={"title": ""}, headers=auth_a).status_code == 422
    assert (
        client.put(f"/api/listings/{lid}", json={"status": "bogus"}, headers=auth_a).status_code
        == 422
    )


def test_list_filter_and_delete(
    client: TestClient, auth_a: dict[str, str], product_a: dict[str, Any]
) -> None:
    gen(client, auth_a, product_a["id"], "amazon", "en")
    gen(client, auth_a, product_a["id"], "meesho", "en")
    base = "/api/listings"
    assert client.get(f"{base}?marketplace=meesho", headers=auth_a).json()["total"] == 1
    assert client.get(f"{base}?language=en", headers=auth_a).json()["total"] == 2
    assert client.get(f"{base}?product_id={product_a['id']}", headers=auth_a).json()["total"] == 2
    assert client.get(f"{base}?marketplace=ebay", headers=auth_a).status_code == 422
    assert client.get(f"{base}?page_size=101", headers=auth_a).status_code == 422
    page = client.get(f"{base}?page_size=1&page=2", headers=auth_a).json()
    assert page["total"] == 2 and len(page["items"]) == 1
    lid = page["items"][0]["id"]
    assert client.delete(f"{base}/{lid}", headers=auth_a).status_code == 204
    assert client.get(f"{base}/{lid}", headers=auth_a).status_code == 404


def test_export_text(client: TestClient, auth_a: dict[str, str], product_a: dict[str, Any]) -> None:
    lid = gen(client, auth_a, product_a["id"]).json()["id"]
    r = client.get(f"/api/listings/{lid}/export", headers=auth_a)
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/plain")
    assert f"listing-{lid}.txt" in r.headers["content-disposition"]
    assert "TITLE\nGreat Steel Bottle" in r.text and "- Bullet 1" in r.text
    assert "KEYWORDS\nalpha, beta" in r.text


def test_export_csv_neutralises_formulas(
    client: TestClient, auth_a: dict[str, str], product_a: dict[str, Any], fake_ai: FakeAI
) -> None:
    lid = gen(client, auth_a, product_a["id"]).json()["id"]
    client.put(
        f"/api/listings/{lid}",
        json={
            "title": '=HYPERLINK("http://evil")',
            "bullets": ["+1", "-2", "@x", "ok", "fine"],
            "description": "\tTab",
            "keywords": ["=a", "b"],
        },
        headers=auth_a,
    )
    r = client.get(f"/api/listings/{lid}/export?format=csv", headers=auth_a)
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/csv")
    assert ".csv" in r.headers["content-disposition"]
    import csv
    import io

    rows = list(csv.reader(io.StringIO(r.text.lstrip("﻿"))))
    header, data = rows
    assert header[:3] == ["marketplace", "language", "title"]
    cells = data[2:]
    assert cells[0].startswith("'=")
    assert cells[1:4] == ["'+1", "'-2", "'@x"]
    assert cells[6].startswith("'\t")
    assert cells[7] == "'=a, b"
    assert data[0] == "amazon"
    assert client.get(f"/api/listings/{lid}/export?format=pdf", headers=auth_a).status_code == 422


def test_rate_limit(client: TestClient, auth_a: dict[str, str], product_a: dict[str, Any]) -> None:
    for _ in range(listings_router.RATE_LIMIT_MAX):
        assert gen(client, auth_a, product_a["id"]).status_code == 201
    r = gen(client, auth_a, product_a["id"])
    assert r.status_code == 429
    assert r.json()["error"]["code"] == "rate_limited"


def test_rate_limit_window_expires(
    client: TestClient,
    auth_a: dict[str, str],
    product_a: dict[str, Any],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    for _ in range(listings_router.RATE_LIMIT_MAX):
        gen(client, auth_a, product_a["id"])
    monkeypatch.setattr(listings_router, "RATE_LIMIT_WINDOW_SECONDS", -1.0)
    assert gen(client, auth_a, product_a["id"]).status_code == 201


def test_requires_auth(client: TestClient) -> None:
    assert client.get("/api/listings").status_code == 401
    assert client.post("/api/listings/generate", json={}).status_code == 401


def test_ai_unavailable_is_503_and_refunds(
    client: TestClient, auth_a: dict[str, str], product_a: dict[str, Any], fake_ai: FakeAI
) -> None:
    from app.exceptions import AIServiceError
    from app.services.ai_service import AIUnavailableError

    async def boom(**_: Any) -> Any:
        raise AIUnavailableError("AI service is temporarily unavailable")

    fake_ai.generate_listing = boom  # type: ignore[method-assign]
    r = gen(client, auth_a, product_a["id"])
    assert r.status_code == 503 and r.json()["error"]["code"] == "ai_unavailable"
    assert issubclass(AIUnavailableError, AIServiceError)
    assert client.get("/api/usage", headers=auth_a).json()["generations_used"] == 0


def test_failed_regenerate_refunds_quota(
    client: TestClient, auth_a: dict[str, str], product_a: dict[str, Any], fake_ai: FakeAI
) -> None:
    lid = gen(client, auth_a, product_a["id"]).json()["id"]
    fake_ai.fail = True
    assert client.post(f"/api/listings/{lid}/regenerate", headers=auth_a).status_code == 502
    assert client.get("/api/usage", headers=auth_a).json()["generations_used"] == 1


def test_quota_reserved_before_ai_call(
    client: TestClient,
    auth_a: dict[str, str],
    product_a: dict[str, Any],
    fake_ai: FakeAI,
    engine: Engine,
) -> None:
    seen: list[int] = []
    original = fake_ai.generate_listing

    async def spy(**kwargs: Any) -> Any:
        with engine.connect() as conn:  # separate connection: only committed data is visible
            used = conn.execute(text("select generations_used from usage_records")).scalar_one()
        seen.append(used)
        return await original(**kwargs)

    fake_ai.generate_listing = spy  # type: ignore[method-assign]
    assert gen(client, auth_a, product_a["id"]).status_code == 201
    assert seen == [1]  # already reserved while the AI call was in flight


def test_new_usage_record_uses_setting(
    client: TestClient, auth_a: dict[str, str], monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(get_settings(), "FREE_MONTHLY_GENERATIONS", 7)
    assert client.get("/api/usage", headers=auth_a).json()["generations_limit"] == 7


def test_update_caps_item_lengths(
    client: TestClient, auth_a: dict[str, str], product_a: dict[str, Any], fake_ai: FakeAI
) -> None:
    lid = gen(client, auth_a, product_a["id"]).json()["id"]
    r = client.put(f"/api/listings/{lid}", json={"bullets": ["x" * 1001]}, headers=auth_a)
    assert r.status_code == 422
    r = client.put(f"/api/listings/{lid}", json={"keywords": ["x" * 201]}, headers=auth_a)
    assert r.status_code == 422
    r = client.put(f"/api/listings/{lid}", json={"keywords": ["x" * 200]}, headers=auth_a)
    assert r.status_code == 200


def test_csv_neutralises_leading_whitespace_formulas() -> None:
    from app.services.listing_service import _csv_safe

    assert _csv_safe(" =cmd()") == "' =cmd()"
    assert _csv_safe("\n+1") == "'\n+1"
    assert _csv_safe("  @x") == "'  @x"
    assert _csv_safe("normal text") == "normal text"
    assert _csv_safe("a=b") == "a=b"
    assert _csv_safe("") == ""


def test_rate_limiter_evicts_idle_users(monkeypatch: pytest.MonkeyPatch) -> None:
    from collections import deque

    listings_router._hits.clear()
    for uid in range(100):
        listings_router._hits[uid] = deque([1.0])
    monkeypatch.setattr(listings_router, "_last_sweep", 0.0)
    with listings_router._hits_lock:
        listings_router._evict_idle(1000.0)
    assert len(listings_router._hits) == 0
