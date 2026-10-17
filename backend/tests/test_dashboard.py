from typing import Any

from fastapi.testclient import TestClient


def gen(client: TestClient, h: dict[str, str], pid: int, mp: str, lang: str) -> None:
    r = client.post(
        "/api/listings/generate",
        json={"product_id": pid, "marketplace": mp, "language": lang},
        headers=h,
    )
    assert r.status_code == 201, r.text


def test_empty_stats(client: TestClient, auth_a: dict[str, str]) -> None:
    s = client.get("/api/dashboard/stats", headers=auth_a).json()
    assert s["total_sellers"] == 0 and s["total_products"] == 0 and s["total_listings"] == 0
    assert s["listings_by_marketplace"] == {} and s["recent_listings"] == []


def test_stats_and_isolation(
    client: TestClient,
    auth_a: dict[str, str],
    auth_b: dict[str, str],
    product_a: dict[str, Any],
) -> None:
    client.post("/api/sellers", json={"name": "S"}, headers=auth_a)
    pid = product_a["id"]
    for i in range(7):
        gen(client, auth_a, pid, "amazon" if i < 4 else "meesho", "en")
    s = client.get("/api/dashboard/stats", headers=auth_a).json()
    assert s["total_sellers"] == 1 and s["total_products"] == 1 and s["total_listings"] == 7
    assert s["listings_by_marketplace"] == {"amazon": 4, "meesho": 3}
    assert s["listings_by_language"] == {"en": 7}
    assert len(s["recent_listings"]) == 5
    ids = [r["id"] for r in s["recent_listings"]]
    assert ids == sorted(ids, reverse=True)
    assert s["recent_listings"][0]["marketplace"] == "meesho"
    other = client.get("/api/dashboard/stats", headers=auth_b).json()
    assert other["total_listings"] == 0 and other["total_products"] == 0


def test_usage(client: TestClient, auth_a: dict[str, str], product_a: dict[str, Any]) -> None:
    u = client.get("/api/usage", headers=auth_a).json()
    assert u["generations_used"] == 0 and u["generations_limit"] == 20
    assert len(u["period"]) == 7
    gen(client, auth_a, product_a["id"], "amazon", "en")
    assert client.get("/api/usage", headers=auth_a).json()["generations_used"] == 1


def test_requires_auth(client: TestClient) -> None:
    assert client.get("/api/dashboard/stats").status_code == 401
    assert client.get("/api/usage").status_code == 401
