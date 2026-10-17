"""Google OAuth (authorization code flow) using authlib's OAuth2 client.

The CSRF state is a short-lived signed JWT carrying a nonce; the same nonce is
set in an HttpOnly SameSite=Lax cookie so the callback is bound to the browser
that started the flow (login-CSRF protection). No session middleware needed.
"""

import hmac
import logging
import secrets
from datetime import UTC, datetime, timedelta
from urllib.parse import urlencode

import jwt
from authlib.integrations.httpx_client import AsyncOAuth2Client
from fastapi import Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.config import get_settings
from app.exceptions import AppError, AuthError
from app.schemas.auth import TokenResponse
from app.services import auth_service

logger = logging.getLogger(__name__)

AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"
SCOPE = "openid email profile"
STATE_TTL_MINUTES = 10


class OAuthNotConfiguredError(AppError):
    status_code = 503
    code = "oauth_not_configured"


NONCE_COOKIE = "oauth_nonce"
NONCE_COOKIE_PATH = "/auth/google"


def _frontend_url() -> str:
    return get_settings().FRONTEND_URL.rstrip("/")


def _redirect_uri(request: Request) -> str:
    configured = get_settings().GOOGLE_REDIRECT_URI
    return configured or str(request.url_for("google_callback"))


def _require_config() -> tuple[str, str]:
    s = get_settings()
    if not s.GOOGLE_CLIENT_ID or not s.GOOGLE_CLIENT_SECRET:
        raise OAuthNotConfiguredError("Google OAuth is not configured")
    return s.GOOGLE_CLIENT_ID, s.GOOGLE_CLIENT_SECRET


def _make_state(nonce: str) -> str:
    s = get_settings()
    return jwt.encode(
        {
            "nonce": nonce,
            "type": "oauth_state",
            "exp": datetime.now(UTC) + timedelta(minutes=STATE_TTL_MINUTES),
        },
        s.SECRET_KEY,
        algorithm=s.ALGORITHM,
    )


def _check_state(state: str, cookie_nonce: str | None) -> None:
    s = get_settings()
    try:
        payload = jwt.decode(state, s.SECRET_KEY, algorithms=[s.ALGORITHM])
    except jwt.PyJWTError as exc:
        raise AuthError("Invalid OAuth state") from exc
    if payload.get("type") != "oauth_state":
        raise AuthError("Invalid OAuth state")
    nonce = payload.get("nonce")
    if (
        not cookie_nonce
        or not isinstance(nonce, str)
        or not hmac.compare_digest(nonce.encode(), cookie_nonce.encode())
    ):
        raise AuthError("Invalid OAuth state")


def build_google_redirect(request: Request) -> RedirectResponse:
    client_id, _ = _require_config()
    nonce = secrets.token_urlsafe(16)
    params = {
        "client_id": client_id,
        "redirect_uri": _redirect_uri(request),
        "response_type": "code",
        "scope": SCOPE,
        "state": _make_state(nonce),
        "access_type": "online",
        "prompt": "select_account",
    }
    response = RedirectResponse(f"{AUTHORIZE_URL}?{urlencode(params)}")
    response.set_cookie(
        NONCE_COOKIE,
        nonce,
        max_age=STATE_TTL_MINUTES * 60,
        path=NONCE_COOKIE_PATH,
        httponly=True,
        samesite="lax",
        secure=_frontend_url().startswith("https://"),
    )
    return response


def _login_oauth_user(db: Session, email: str, name: str | None) -> TokenResponse:
    user = auth_service.get_or_create_oauth_user(db, email, name, "google")
    return auth_service.issue_tokens(db, user)


def _error_redirect(reason: str) -> RedirectResponse:
    return RedirectResponse(f"{_frontend_url()}/login?{urlencode({'error': reason})}")


async def handle_google_callback(
    request: Request, db: Session, code: str | None, state: str | None, error: str | None
) -> RedirectResponse:
    response = await _process_callback(request, db, code, state, error)
    response.delete_cookie(NONCE_COOKIE, path=NONCE_COOKIE_PATH)  # single use
    return response


async def _process_callback(
    request: Request, db: Session, code: str | None, state: str | None, error: str | None
) -> RedirectResponse:
    client_id, client_secret = _require_config()
    if error or not code or not state:
        return _error_redirect("oauth_denied")
    try:
        _check_state(state, request.cookies.get(NONCE_COOKIE))
    except AuthError:
        return _error_redirect("oauth_state")
    try:
        async with AsyncOAuth2Client(
            client_id=client_id, client_secret=client_secret, redirect_uri=_redirect_uri(request)
        ) as client:
            await client.fetch_token(TOKEN_URL, code=code, grant_type="authorization_code")
            resp = await client.get(USERINFO_URL)
            resp.raise_for_status()
            info = resp.json()
    except Exception:  # provider/network failure; details not logged (may contain secrets)
        logger.warning("Google OAuth exchange failed")
        return _error_redirect("oauth_failed")

    email = info.get("email")
    if not email or not info.get("email_verified", False):
        return _error_redirect("oauth_email")
    try:
        tokens = await run_in_threadpool(_login_oauth_user, db, email, info.get("name"))
    except AuthError:
        return _error_redirect("inactive")
    fragment = urlencode(
        {
            "access_token": tokens.access_token,
            "refresh_token": tokens.refresh_token,
            "token_type": tokens.token_type,
        }
    )
    # Fragment keeps tokens out of server logs and Referer headers.
    return RedirectResponse(f"{_frontend_url()}/login#{fragment}")
