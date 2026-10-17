from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.auth.jwt import create_access_token, create_refresh_token, hash_password, verify_password
from app.models.user import User
from tests.conftest import PASSWORD


def test_register_ok_and_duplicate(client: TestClient) -> None:
    r = client.post(
        "/auth/register",
        json={"email": "X@Example.com", "password": PASSWORD, "full_name": "X"},
    )
    assert r.status_code == 201
    assert r.json()["email"] == "x@example.com"
    assert "password" not in r.text
    dup = client.post("/auth/register", json={"email": "x@example.com", "password": PASSWORD})
    assert dup.status_code == 409
    assert dup.json()["error"]["code"] == "conflict"


def test_register_short_password_and_bad_email(client: TestClient) -> None:
    short = client.post("/auth/register", json={"email": "a@b.com", "password": "short"})
    assert short.status_code == 422
    bad = client.post("/auth/register", json={"email": "nope", "password": PASSWORD})
    assert bad.status_code == 422


def test_login_success_and_failures(client: TestClient) -> None:
    client.post("/auth/register", json={"email": "u@example.com", "password": PASSWORD})
    ok = client.post("/auth/login", data={"username": "u@example.com", "password": PASSWORD})
    assert ok.status_code == 200
    assert ok.json()["token_type"] == "bearer"
    bad = client.post("/auth/login", data={"username": "u@example.com", "password": "wrongpass1"})
    assert bad.status_code == 401
    assert bad.headers["www-authenticate"] == "Bearer"
    unknown = client.post("/auth/login", data={"username": "z@example.com", "password": PASSWORD})
    assert unknown.status_code == 401


def test_me(client: TestClient, auth_a: dict[str, str]) -> None:
    r = client.get("/auth/me", headers=auth_a)
    assert r.status_code == 200
    assert r.json()["email"] == "a@example.com"
    assert client.get("/auth/me").status_code == 401
    assert client.get("/auth/me", headers={"Authorization": "Bearer junk"}).status_code == 401


def test_refresh_token_cannot_be_used_as_access(
    client: TestClient, user_a_tokens: dict[str, str]
) -> None:
    h = {"Authorization": f"Bearer {user_a_tokens['refresh_token']}"}
    assert client.get("/auth/me", headers=h).status_code == 401


def test_refresh_rotation_and_reuse_revokes_all(
    client: TestClient, user_a_tokens: dict[str, str]
) -> None:
    old = user_a_tokens["refresh_token"]
    r = client.post("/auth/refresh", json={"refresh_token": old})
    assert r.status_code == 200
    new = r.json()["refresh_token"]
    assert new != old
    reuse = client.post("/auth/refresh", json={"refresh_token": old})
    assert reuse.status_code == 401
    after = client.post("/auth/refresh", json={"refresh_token": new})
    assert after.status_code == 401


def test_refresh_invalid_tokens(client: TestClient, user_a_tokens: dict[str, str]) -> None:
    assert client.post("/auth/refresh", json={"refresh_token": "garbage"}).status_code == 401
    r = client.post("/auth/refresh", json={"refresh_token": user_a_tokens["access_token"]})
    assert r.status_code == 401
    tok, _ = create_refresh_token(1)
    assert client.post("/auth/refresh", json={"refresh_token": tok}).status_code == 401


def test_logout_single_token(
    client: TestClient, user_a_tokens: dict[str, str], auth_a: dict[str, str]
) -> None:
    rt = user_a_tokens["refresh_token"]
    r = client.post("/auth/logout", json={"refresh_token": rt}, headers=auth_a)
    assert r.status_code == 200
    assert client.post("/auth/refresh", json={"refresh_token": rt}).status_code == 401


def test_logout_all_and_foreign_token(
    client: TestClient,
    user_a_tokens: dict[str, str],
    auth_a: dict[str, str],
    user_b_tokens: dict[str, str],
) -> None:
    client.post(
        "/auth/logout", json={"refresh_token": user_b_tokens["refresh_token"]}, headers=auth_a
    )
    still = client.post("/auth/refresh", json={"refresh_token": user_b_tokens["refresh_token"]})
    assert still.status_code == 200
    assert client.post("/auth/logout", json={}, headers=auth_a).status_code == 200
    gone = client.post("/auth/refresh", json={"refresh_token": user_a_tokens["refresh_token"]})
    assert gone.status_code == 401
    assert client.post("/auth/logout", json={}).status_code == 401


def test_inactive_user(
    client: TestClient,
    db: Session,
    user_a_tokens: dict[str, str],
    auth_a: dict[str, str],
) -> None:
    user = db.query(User).filter_by(email="a@example.com").one()
    user.is_active = False
    db.commit()
    assert client.get("/auth/me", headers=auth_a).status_code == 401
    login = client.post("/auth/login", data={"username": "a@example.com", "password": PASSWORD})
    assert login.status_code == 401
    ref = client.post("/auth/refresh", json={"refresh_token": user_a_tokens["refresh_token"]})
    assert ref.status_code == 401


def test_token_for_deleted_user(client: TestClient) -> None:
    h = {"Authorization": f"Bearer {create_access_token(9999)}"}
    assert client.get("/auth/me", headers=h).status_code == 401


def test_google_unconfigured(client: TestClient) -> None:
    r = client.get("/auth/google", follow_redirects=False)
    assert r.status_code == 503
    assert r.json()["error"]["code"] == "oauth_not_configured"
    r = client.get("/auth/google/callback?code=x&state=y", follow_redirects=False)
    assert r.status_code == 503


def test_password_helpers() -> None:
    h = hash_password("secret123")
    assert h != "secret123"
    assert verify_password("secret123", h)
    assert not verify_password("other", h)
    assert not verify_password("x", None)
    assert not verify_password("x", "not-a-hash")


def test_health(client: TestClient) -> None:
    assert client.get("/health").json() == {"status": "ok"}
