"""Brute-force limits, timing equalisation, refresh atomicity and misc hardening."""

from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import update
from sqlalchemy.orm import Session

from app.auth import rate_limit
from app.exceptions import RateLimitedError
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.services import auth_service
from tests.conftest import PASSWORD


def test_login_rate_limited_per_email(client: TestClient) -> None:
    client.post("/auth/register", json={"email": "r@example.com", "password": PASSWORD})
    for _ in range(10):
        r = client.post(
            "/auth/login", data={"username": "r@example.com", "password": "wrong-pass1"}
        )
        assert r.status_code == 401
    r = client.post("/auth/login", data={"username": "R@example.com", "password": PASSWORD})
    assert r.status_code == 429
    assert r.json()["error"]["code"] == "rate_limited"
    assert int(r.headers["retry-after"]) >= 1


def test_login_rate_limited_per_ip(client: TestClient) -> None:
    for i in range(10):
        client.post("/auth/login", data={"username": f"x{i}@example.com", "password": "pw"})
    r = client.post("/auth/login", data={"username": "fresh@example.com", "password": "pw"})
    assert r.status_code == 429


def test_register_and_refresh_rate_limited(client: TestClient) -> None:
    for i in range(10):
        client.post("/auth/register", json={"email": f"m{i}@example.com", "password": PASSWORD})
    r = client.post("/auth/register", json={"email": "late@example.com", "password": PASSWORD})
    assert r.status_code == 429
    for _ in range(30):
        client.post("/auth/refresh", json={"refresh_token": "garbage"})
    assert client.post("/auth/refresh", json={"refresh_token": "g"}).status_code == 429


def test_rate_limit_window_expires_and_sweeps(monkeypatch: pytest.MonkeyPatch) -> None:
    clock = [1000.0]
    monkeypatch.setattr(rate_limit.time, "monotonic", lambda: clock[0])
    for _ in range(3):
        rate_limit.hit("k", 3, 60)
    with pytest.raises(RateLimitedError):
        rate_limit.hit("k", 3, 60)
    clock[0] += 61
    rate_limit.hit("k", 3, 60)
    clock[0] += 61
    monkeypatch.setattr(rate_limit, "_calls", rate_limit._SWEEP_EVERY - 1)
    rate_limit.hit("other", 3, 60)
    assert "k" not in rate_limit._hits


def test_unknown_email_login_runs_dummy_bcrypt(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    calls: list[str] = []
    real = auth_service.verify_password

    def spy(password: str, hashed: str | None) -> bool:
        calls.append(password)
        return real(password, hashed)

    monkeypatch.setattr(auth_service, "verify_password", spy)
    r = client.post("/auth/login", data={"username": "ghost@example.com", "password": PASSWORD})
    assert r.status_code == 401
    assert calls == [PASSWORD]


def test_password_over_72_bytes_rejected(client: TestClient) -> None:
    r = client.post("/auth/register", json={"email": "l@example.com", "password": "é" * 40})
    assert r.status_code == 422
    r = client.post("/auth/register", json={"email": "l@example.com", "password": "a" * 72})
    assert r.status_code == 201


def test_expired_refresh_tokens_pruned(client: TestClient, db: Session) -> None:
    client.post("/auth/register", json={"email": "pr@example.com", "password": PASSWORD})
    user = db.query(User).filter_by(email="pr@example.com").one()
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash="old",
            expires_at=datetime.now(UTC) - timedelta(days=1),
        )
    )
    db.commit()
    client.post("/auth/login", data={"username": "pr@example.com", "password": PASSWORD})
    assert db.query(RefreshToken).filter_by(token_hash="old").count() == 0


def test_concurrent_refresh_claim_loses(
    client: TestClient, user_a_tokens: dict[str, str], monkeypatch: pytest.MonkeyPatch
) -> None:
    """Another request revokes the token between our read and our UPDATE."""
    real = auth_service._find_token

    def racy(db: Session, token: str) -> RefreshToken | None:
        stored = real(db, token)
        if stored is not None:
            db.execute(
                update(RefreshToken).where(RefreshToken.id == stored.id).values(revoked=True)
            )
            db.commit()
            stored.revoked = False  # our stale view still says unrevoked
        return stored

    monkeypatch.setattr(auth_service, "_find_token", racy)
    r = client.post("/auth/refresh", json={"refresh_token": user_a_tokens["refresh_token"]})
    assert r.status_code == 401


def test_docs_disabled_outside_debug(client: TestClient) -> None:
    for path in ("/docs", "/redoc", "/openapi.json"):
        assert client.get(path).status_code == 404


def test_cors_no_credentials(client: TestClient) -> None:
    r = client.options(
        "/auth/login",
        headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "POST"},
    )
    assert "access-control-allow-credentials" not in r.headers
    assert r.headers["access-control-allow-origin"] == "http://localhost:3000"
    bad = client.options(
        "/auth/login",
        headers={"Origin": "http://evil.example", "Access-Control-Request-Method": "POST"},
    )
    assert "access-control-allow-origin" not in bad.headers


def test_product_attribute_length_limits(client: TestClient, auth_a: dict[str, str]) -> None:
    base = {"name": "P"}
    long_key = client.post(
        "/api/products", json={**base, "attributes": {"k" * 101: "v"}}, headers=auth_a
    )
    assert long_key.status_code == 422
    long_val = client.post(
        "/api/products", json={**base, "attributes": {"k": "v" * 501}}, headers=auth_a
    )
    assert long_val.status_code == 422
    ok = client.post(
        "/api/products", json={**base, "attributes": {"k" * 100: "v" * 500}}, headers=auth_a
    )
    assert ok.status_code == 201
