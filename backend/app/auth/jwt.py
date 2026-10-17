"""JWT token helpers and bcrypt password hashing."""

import hashlib
import logging
import secrets
from datetime import UTC, datetime, timedelta

import bcrypt
import jwt

from app.config import get_settings
from app.exceptions import AuthError

logger = logging.getLogger(__name__)

ACCESS = "access"
REFRESH = "refresh"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str | None) -> bool:
    if not hashed:
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8")[:72], hashed.encode("utf-8"))
    except ValueError:
        return False


def hash_token(token: str) -> str:
    """Deterministic SHA-256 digest used to store refresh tokens."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _encode(payload: dict[str, object]) -> str:
    settings = get_settings()
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(user_id: int) -> str:
    settings = get_settings()
    now = datetime.now(UTC)
    return _encode(
        {
            "sub": str(user_id),
            "type": ACCESS,
            "iat": now,
            "exp": now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        }
    )


def create_refresh_token(user_id: int) -> tuple[str, datetime]:
    """Return (token, expires_at). Includes a random jti so each token is unique."""
    settings = get_settings()
    now = datetime.now(UTC)
    expires = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    token = _encode(
        {
            "sub": str(user_id),
            "type": REFRESH,
            "jti": secrets.token_urlsafe(16),
            "iat": now,
            "exp": expires,
        }
    )
    return token, expires


def decode_token(token: str, expected_type: str) -> dict[str, object]:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except jwt.ExpiredSignatureError as exc:
        raise AuthError("Token has expired") from exc
    except jwt.PyJWTError as exc:
        raise AuthError("Invalid token") from exc
    if payload.get("type") != expected_type:
        raise AuthError("Invalid token type")
    return payload


def get_user_id_from_token(token: str, expected_type: str) -> int:
    payload = decode_token(token, expected_type)
    try:
        return int(str(payload["sub"]))
    except (KeyError, ValueError) as exc:
        raise AuthError("Invalid token") from exc
