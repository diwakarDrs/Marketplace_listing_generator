"""Shared FastAPI dependencies."""

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.auth.jwt import ACCESS, get_user_id_from_token
from app.database import get_db
from app.exceptions import AuthError
from app.models.user import User

bearer_scheme = HTTPBearer(auto_error=False)

__all__ = ["get_db", "get_current_user"]


# Plain `def` on purpose (deviation from CLAUDE.md's async preference): the SQLAlchemy Session
# is synchronous, so FastAPI runs these in its threadpool instead of blocking the event loop.
def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Decode the bearer access token and return the active User."""
    if credentials is None:
        raise AuthError("Not authenticated")
    user_id = get_user_id_from_token(credentials.credentials, ACCESS)
    user = db.get(User, user_id)
    if user is None:
        raise AuthError("User not found")
    if not user.is_active:
        raise AuthError("Account is inactive")
    return user
