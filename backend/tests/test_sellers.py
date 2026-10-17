from typing import Any

from fastapi.testclient import TestClient

PAYLOAD: dict[str, Any] = {
    "name": "My Shop",
    "brand_name": "Acme",
    "brand_voice": "friendly",
    "default_marketplace": "amazon",
    "default_language": "en",
}


def test_crud(client: TestClient, auth_a: dict[str, str]) -> None:
    r = client.post("/api/sellers", json=PAYLOAD, headers=auth_a)
    assert r.status_code == 201
    sid = r.json()["id"]
    assert client.get(f"/api/sellers/{sid}", headers=auth_a).json()["name"] == "My Shop"
    lst = client.get("/api/sellers", headers=auth_a).json()
    assert lst["total"] == 1 and lst["page"] == 1
    upd = client.put(f"/api/sellers/{sid}", json={**PAYLOAD, "name": "Renamed"}, headers=auth_a)
    assert upd.status_code == 200 and upd.json()["name"] == "Renamed"
    assert client.delete(f"/api/sellers/{sid}", headers=auth_a).status_code == 204
    assert client.get(f"/api/sellers/{sid}", headers=auth_a).status_code == 404


def test_validation(client: TestClient, auth_a: dict[str, str]) -> None:
    for bad in (
        {**PAYLOAD, "name": "   "},
        {**PAYLOAD, "default_marketplace": "ebay"},
        {**PAYLOAD, "default_language": "xx"},
        {**PAYLOAD, "name": ""},
    ):
        assert client.post("/api/sellers", json=bad, headers=auth_a).status_code == 422


def test_pagination_caps(client: TestClient, auth_a: dict[str, str]) -> None:
    for i in range(3):
        client.post("/api/sellers/", json={**PAYLOAD, "name": f"S{i}"}, headers=auth_a)
    r = client.get("/api/sellers?page_size=2&page=2", headers=auth_a).json()
    assert r["total"] == 3 and len(r["items"]) == 1
    assert client.get("/api/sellers?page_size=101", headers=auth_a).status_code == 422
    assert client.get("/api/sellers?page=0", headers=auth_a).status_code == 422


def test_ownership_isolation(
    client: TestClient, auth_a: dict[str, str], auth_b: dict[str, str]
) -> None:
    sid = client.post("/api/sellers", json=PAYLOAD, headers=auth_a).json()["id"]
    assert client.get(f"/api/sellers/{sid}", headers=auth_b).status_code == 404
    assert client.put(f"/api/sellers/{sid}", json=PAYLOAD, headers=auth_b).status_code == 404
    assert client.delete(f"/api/sellers/{sid}", headers=auth_b).status_code == 404
    assert client.get("/api/sellers", headers=auth_b).json()["total"] == 0


def test_requires_auth(client: TestClient) -> None:
    assert client.get("/api/sellers").status_code == 401
