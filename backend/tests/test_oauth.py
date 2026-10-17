"""Google OAuth flow with configured creds and a faked provider (no network)."""

from typing import Any
from urllib.parse import parse_qs, urlparse

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.auth import oauth
from app.config import get_settings
from app.models.user import User


@pytest.fixture
def google_configured(monkeypatch: pytest.MonkeyPatch) -> None:
    s = get_settings()
    monkeypatch.setattr(s, "GOOGLE_CLIENT_ID", "cid")
    monkeypatch.setattr(s, "GOOGLE_CLIENT_SECRET", "csecret")


class _Resp:
    def __init__(self, data: dict[str, Any]) -> None:
        self._d = data

    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict[str, Any]:
        return self._d


def _fake_client(info: dict[str, Any] | Exception) -> type:
    class FakeClient:
        def __init__(self, **_: Any) -> None:
            pass

        async def __aenter__(self) -> "FakeClient":
            return self

        async def __aexit__(self, *_: Any) -> None:
            return None

        async def fetch_token(self, *_: Any, **__: Any) -> dict[str, str]:
            if isinstance(info, Exception):
                raise info
            return {"access_token": "t"}

        async def get(self, _: str) -> _Resp:
            assert not isinstance(info, Exception)
            return _Resp(info)

    return FakeClient


def _start(client: TestClient) -> str:
    """Begin the flow (sets the nonce cookie on the client) and return the state."""
    r = client.get("/auth/google", follow_redirects=False)
    return parse_qs(urlparse(r.headers["location"]).query)["state"][0]


def test_redirect_contains_state(client: TestClient, google_configured: None) -> None:
    r = client.get("/auth/google", follow_redirects=False)
    assert r.status_code in (302, 307)
    q = parse_qs(urlparse(r.headers["location"]).query)
    assert q["client_id"] == ["cid"]
    assert q["state"]
    cookie = r.headers["set-cookie"].lower()
    assert "oauth_nonce=" in cookie and "httponly" in cookie and "samesite=lax" in cookie


def test_redirect_uri_setting(
    client: TestClient, google_configured: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(get_settings(), "GOOGLE_REDIRECT_URI", "https://api.example.com/cb")
    r = client.get("/auth/google", follow_redirects=False)
    q = parse_qs(urlparse(r.headers["location"]).query)
    assert q["redirect_uri"] == ["https://api.example.com/cb"]


def test_callback_requires_matching_cookie_and_is_single_use(
    client: TestClient, google_configured: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    info = {"email": "n@example.com", "email_verified": True}
    monkeypatch.setattr(oauth, "AsyncOAuth2Client", _fake_client(info))
    state = _start(client)
    client.cookies.clear()  # a different browser replaying the state
    r = client.get(f"/auth/google/callback?code=c&state={state}", follow_redirects=False)
    assert "error=oauth_state" in r.headers["location"]
    client.cookies.set("oauth_nonce", "forged", path="/auth/google")
    r = client.get(f"/auth/google/callback?code=c&state={state}", follow_redirects=False)
    assert "error=oauth_state" in r.headers["location"]
    state = _start(client)
    r = client.get(f"/auth/google/callback?code=c&state={state}", follow_redirects=False)
    assert "access_token=" in r.headers["location"]
    r = client.get(f"/auth/google/callback?code=c&state={state}", follow_redirects=False)
    assert "error=oauth_state" in r.headers["location"]


def test_link_clears_unverified_password_and_sessions(
    client: TestClient,
    google_configured: None,
    monkeypatch: pytest.MonkeyPatch,
    db: Session,
) -> None:
    client.post("/auth/register", json={"email": "p@example.com", "password": "password123"})
    old = client.post(
        "/auth/login", data={"username": "p@example.com", "password": "password123"}
    ).json()
    monkeypatch.setattr(
        oauth, "AsyncOAuth2Client", _fake_client({"email": "p@example.com", "email_verified": True})
    )
    client.get(f"/auth/google/callback?code=c&state={_start(client)}", follow_redirects=False)
    db.expire_all()
    assert db.query(User).filter_by(email="p@example.com").one().hashed_password is None
    login = client.post(
        "/auth/login", data={"username": "p@example.com", "password": "password123"}
    )
    assert login.status_code == 401
    ref = client.post("/auth/refresh", json={"refresh_token": old["refresh_token"]})
    assert ref.status_code == 401


def test_callback_denied_and_bad_state(client: TestClient, google_configured: None) -> None:
    r = client.get("/auth/google/callback?error=access_denied", follow_redirects=False)
    assert "error=oauth_denied" in r.headers["location"]
    r = client.get("/auth/google/callback?code=c&state=bogus", follow_redirects=False)
    assert "error=oauth_state" in r.headers["location"]


def test_callback_success_creates_user(
    client: TestClient,
    google_configured: None,
    monkeypatch: pytest.MonkeyPatch,
    db: Session,
) -> None:
    info = {"email": "g@example.com", "email_verified": True, "name": "G"}
    monkeypatch.setattr(oauth, "AsyncOAuth2Client", _fake_client(info))
    state = _start(client)
    r = client.get(f"/auth/google/callback?code=c&state={state}", follow_redirects=False)
    loc = r.headers["location"]
    assert "/login#" in loc and "access_token=" in loc
    assert db.query(User).filter_by(email="g@example.com").one().oauth_provider == "google"


def test_callback_unverified_email_and_failure(
    client: TestClient, google_configured: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    state = _start(client)
    monkeypatch.setattr(
        oauth,
        "AsyncOAuth2Client",
        _fake_client({"email": "g@example.com", "email_verified": False}),
    )
    r = client.get(f"/auth/google/callback?code=c&state={state}", follow_redirects=False)
    assert "error=oauth_email" in r.headers["location"]
    monkeypatch.setattr(oauth, "AsyncOAuth2Client", _fake_client(RuntimeError("boom")))
    state = _start(client)  # nonce cookie is single use
    r = client.get(f"/auth/google/callback?code=c&state={state}", follow_redirects=False)
    assert "error=oauth_failed" in r.headers["location"]


def test_callback_inactive_user(
    client: TestClient,
    google_configured: None,
    monkeypatch: pytest.MonkeyPatch,
    db: Session,
) -> None:
    client.post("/auth/register", json={"email": "i@example.com", "password": "password123"})
    u = db.query(User).filter_by(email="i@example.com").one()
    u.is_active = False
    db.commit()
    monkeypatch.setattr(
        oauth,
        "AsyncOAuth2Client",
        _fake_client({"email": "i@example.com", "email_verified": True}),
    )
    r = client.get(f"/auth/google/callback?code=c&state={_start(client)}", follow_redirects=False)
    assert "error=inactive" in r.headers["location"]


def test_existing_user_linked(
    client: TestClient,
    google_configured: None,
    monkeypatch: pytest.MonkeyPatch,
    db: Session,
) -> None:
    client.post("/auth/register", json={"email": "e@example.com", "password": "password123"})
    monkeypatch.setattr(
        oauth,
        "AsyncOAuth2Client",
        _fake_client({"email": "e@example.com", "email_verified": True, "name": "Eve"}),
    )
    client.get(f"/auth/google/callback?code=c&state={_start(client)}", follow_redirects=False)
    db.expire_all()
    u = db.query(User).filter_by(email="e@example.com").one()
    assert u.is_verified and u.oauth_provider == "google" and u.full_name == "Eve"
