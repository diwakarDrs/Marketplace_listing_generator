"""Authentication business logic."""

import logging
from datetime import UTC, datetime
from typing import cast

from sqlalchemy import CursorResult, delete, select, update
from sqlalchemy.orm import Session

from app.auth.jwt import (
    REFRESH,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.exceptions import AuthError, ConflictError
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.auth import TokenResponse

logger = logging.getLogger(__name__)

_dummy_hash: str | None = None


def _equalise_timing(password: str) -> None:
    """Run a bcrypt check against a throwaway hash so unknown emails cost the same."""
    global _dummy_hash
    if _dummy_hash is None:
        _dummy_hash = hash_password("timing-equaliser")
    verify_password(password, _dummy_hash)


def get_user_by_email(db: Session, email: str) -> User | None:
    # Emails are always stored lowercased (register/OAuth), so compare directly.
    return db.execute(select(User).where(User.email == email.strip().lower())).scalar_one_or_none()


def issue_tokens(db: Session, user: User) -> TokenResponse:
    access = create_access_token(user.id)
    refresh, expires = create_refresh_token(user.id)
    # Opportunistic cleanup of this user's expired tokens (revoked-but-live ones are kept
    # for reuse detection).
    db.execute(
        delete(RefreshToken)
        .where(RefreshToken.user_id == user.id, RefreshToken.expires_at < datetime.now(UTC))
        .execution_options(synchronize_session=False)
    )
    db.add(RefreshToken(user_id=user.id, token_hash=hash_token(refresh), expires_at=expires))
    db.commit()
    return TokenResponse(access_token=access, refresh_token=refresh)


def register_user(db: Session, email: str, password: str, full_name: str | None) -> User:
    # Account enumeration via this 409 is an accepted trade-off (rate limited at the router).
    if get_user_by_email(db, email):
        raise ConflictError("Email already registered")
    user = User(
        email=email.strip().lower(),
        hashed_password=hash_password(password),
        full_name=full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info("User registered id=%s", user.id)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = get_user_by_email(db, email)
    if user is None:
        _equalise_timing(password)
        raise AuthError("Incorrect email or password")
    if not verify_password(password, user.hashed_password):
        raise AuthError("Incorrect email or password")
    if not user.is_active:
        raise AuthError("Account is inactive")
    return user


def _aware(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=UTC)


def _find_token(db: Session, token: str) -> RefreshToken | None:
    return db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == hash_token(token))
    ).scalar_one_or_none()


def revoke_all_for_user(db: Session, user_id: int) -> None:
    db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == user_id, RefreshToken.revoked.is_(False))
        .values(revoked=True)
    )
    db.commit()


def rotate_refresh_token(db: Session, token: str) -> TokenResponse:
    decode_token(token, REFRESH)
    stored = _find_token(db, token)
    if stored is None:
        raise AuthError("Invalid refresh token")
    if stored.revoked:
        # Reuse of a rotated token: revoke every session for this user.
        logger.warning("Refresh token reuse detected user_id=%s", stored.user_id)
        revoke_all_for_user(db, stored.user_id)
        raise AuthError("Refresh token revoked")
    if _aware(stored.expires_at) < datetime.now(UTC):
        raise AuthError("Refresh token expired")
    user = db.get(User, stored.user_id)
    if user is None or not user.is_active:
        raise AuthError("User not found or inactive")
    # Atomic claim: only one concurrent request can flip revoked false -> true.
    claimed = cast(
        CursorResult[tuple[()]],
        db.execute(
            update(RefreshToken)
            .where(RefreshToken.token_hash == stored.token_hash, RefreshToken.revoked.is_(False))
            .values(revoked=True)
        ),
    )
    if claimed.rowcount != 1:
        db.rollback()
        logger.warning("Concurrent refresh token reuse user_id=%s", stored.user_id)
        revoke_all_for_user(db, stored.user_id)
        raise AuthError("Refresh token revoked")
    return issue_tokens(db, user)


def revoke_refresh_token(db: Session, token: str | None, user: User) -> None:
    """Revoke one refresh token; if none given, revoke all of the user's."""
    if token:
        stored = _find_token(db, token)
        if stored is not None and stored.user_id == user.id:
            stored.revoked = True
            db.commit()
    else:
        revoke_all_for_user(db, user.id)


def get_or_create_oauth_user(db: Session, email: str, full_name: str | None, provider: str) -> User:
    user = get_user_by_email(db, email)
    if user is None:
        user = User(
            email=email.strip().lower(),
            hashed_password=None,
            full_name=full_name,
            is_verified=True,
            oauth_provider=provider,
        )
        db.add(user)
    else:
        if not user.is_active:
            raise AuthError("Account is inactive")
        if not user.is_verified and user.hashed_password:
            # Pre-hijack defence: a never-verified password account may have been created
            # by someone who doesn't own the mailbox. Drop their password and sessions.
            user.hashed_password = None
            revoke_all_for_user(db, user.id)
            logger.warning("Cleared unverified password on OAuth link user_id=%s", user.id)
        user.is_verified = True
        if not user.oauth_provider:
            user.oauth_provider = provider
        if not user.full_name and full_name:
            user.full_name = full_name
    db.commit()
    db.refresh(user)
    return user
