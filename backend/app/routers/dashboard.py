"""Dashboard and usage routes."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.dashboard import DashboardStats, UsageInfoOut
from app.services import dashboard_service
from app.services.usage_service import get_usage_info

router = APIRouter()

DbSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.get("/dashboard/stats", response_model=DashboardStats)
def dashboard_stats(db: DbSession, current_user: CurrentUser) -> dict:
    return dashboard_service.get_dashboard_stats(db, current_user.id)


@router.get("/usage", response_model=UsageInfoOut)
def usage(db: DbSession, current_user: CurrentUser) -> dict:
    return get_usage_info(db, current_user.id)
