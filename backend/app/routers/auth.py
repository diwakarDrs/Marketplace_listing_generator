"""Auth router: register, login, refresh, logout, me, Google OAuth."""

from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.auth import oauth
from app.auth.rate_limit import limit_auth
from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.auth import (
    LogoutRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services import auth_service

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(request: Request, payload: RegisterRequest, db: Session = Depends(get_db)) -> User:
    limit_auth(request, "register", payload.email)
    return auth_service.register_user(db, payload.email, payload.password, payload.full_name)


@router.post("/login", response_model=TokenResponse)
def login(
    request: Request,
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> TokenResponse:
    limit_auth(request, "login", form.username)
    user = auth_service.authenticate_user(db, form.username, form.password)
    return auth_service.issue_tokens(db, user)


@router.post("/refresh", response_model=TokenResponse)
def refresh(
    request: Request, payload: RefreshRequest, db: Session = Depends(get_db)
) -> TokenResponse:
    limit_auth(request, "refresh", factor=3)
    return auth_service.rotate_refresh_token(db, payload.refresh_token)


@router.post("/logout", response_model=MessageResponse)
def logout(
    payload: LogoutRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> MessageResponse:
    auth_service.revoke_refresh_token(db, payload.refresh_token, user)
    return MessageResponse(message="Logged out")


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)) -> User:
    return user


@router.get("/google")
def google_login(request: Request) -> RedirectResponse:
    return oauth.build_google_redirect(request)


@router.get("/google/callback", name="google_callback")
async def google_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: Session = Depends(get_db),
) -> RedirectResponse:
    return await oauth.handle_google_callback(request, db, code, state, error)
