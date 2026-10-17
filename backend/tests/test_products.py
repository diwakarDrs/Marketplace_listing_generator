from typing import Any

from fastapi.testclient import TestClient


def mk(client: TestClient, h: dict[str, str], **kw: Any) -> dict[str, Any]:
    body = {"name": "P", **kw}
    r = client.post("/api/products", json=body, headers=h)
    assert r.status_code == 201, r.text
    return r.json()


def test_crud(client: TestClient, auth_a: dict[str, str]) -> None:
    p = mk(
        client,
        auth_a,
        name="  Lamp  ",
        price=10.5,
        key_features=[" a ", "", "b"],
        attributes={"color": "red"},
    )
    assert p["name"] == "Lamp" and p["key_features"] == ["a", "b"] and p["price"] == 10.5
    pid = p["id"]
    assert client.get(f"/api/products/{pid}", headers=auth_a).status_code == 200
    u = client.put(f"/api/products/{pid}", json={"name": "Lamp2", "brand": "B"}, headers=auth_a)
    assert u.status_code == 200 and u.json()["name"] == "Lamp2" and u.json()["price"] is None
    assert client.delete(f"/api/products/{pid}", headers=auth_a).status_code == 204
    assert client.get(f"/api/products/{pid}", headers=auth_a).status_code == 404


def test_validation(client: TestClient, auth_a: dict[str, str]) -> None:
    bad: list[dict[str, Any]] = [
        {"name": ""},
        {"name": "   "},
        {"name": "x", "price": -1},
        {"name": "x", "key_features": ["f"] * 21},
        {"name": "x", "key_features": ["f" * 501]},
        {"name": "x", "attributes": {str(i): "v" for i in range(51)}},
        {"name": "x" * 256},
    ]
    for b in bad:
        assert client.post("/api/products", json=b, headers=auth_a).status_code == 422, b


def test_search_filter_pagination(client: TestClient, auth_a: dict[str, str]) -> None:
    s = client.post("/api/sellers", json={"name": "S"}, headers=auth_a).json()["id"]
    mk(client, auth_a, name="Red Shirt", brand="Zara", seller_profile_id=s)
    mk(client, auth_a, name="Blue Jeans", category="Pants")
    mk(client, auth_a, name="100% Cotton_Tee")

    def g(q: str) -> dict[str, Any]:
        return client.get(f"/api/products{q}", headers=auth_a).json()

    def names(r: dict[str, Any]) -> list[str]:
        return sorted(i["name"] for i in r["items"])

    assert names(g("?search=shirt")) == ["Red Shirt"]
    assert names(g("?search=zara")) == ["Red Shirt"]
    assert names(g("?search=pants")) == ["Blue Jeans"]
    assert names(g("?search=100%25")) == ["100% Cotton_Tee"]
    assert g("?search=%25")["total"] == 1  # LIKE wildcard escaped
    assert names(g(f"?seller_id={s}")) == ["Red Shirt"]
    page = g("?page_size=2&page=2")
    assert page["total"] == 3 and len(page["items"]) == 1
    assert client.get("/api/products?page_size=101", headers=auth_a).status_code == 422
    assert client.get("/api/products?page_size=0", headers=auth_a).status_code == 422
    assert client.get("/api/products?search=" + "x" * 101, headers=auth_a).status_code == 422
    assert g("?search=%20%20")["total"] == 3


def test_isolation(client: TestClient, auth_a: dict[str, str], auth_b: dict[str, str]) -> None:
    pid = mk(client, auth_a)["id"]
    assert client.get(f"/api/products/{pid}", headers=auth_b).status_code == 404
    assert client.put(f"/api/products/{pid}", json={"name": "h"}, headers=auth_b).status_code == 404
    assert client.delete(f"/api/products/{pid}", headers=auth_b).status_code == 404
    assert client.get("/api/products", headers=auth_b).json()["total"] == 0


def test_foreign_seller_profile_rejected(
    client: TestClient, auth_a: dict[str, str], auth_b: dict[str, str]
) -> None:
    sid = client.post("/api/sellers", json={"name": "S"}, headers=auth_a).json()["id"]
    r = client.post("/api/products", json={"name": "x", "seller_profile_id": sid}, headers=auth_b)
    assert r.status_code == 422
    pid = mk(client, auth_b)["id"]
    r = client.put(
        f"/api/products/{pid}", json={"name": "x", "seller_profile_id": sid}, headers=auth_b
    )
    assert r.status_code == 422


def test_requires_auth(client: TestClient) -> None:
    assert client.get("/api/products").status_code == 401
