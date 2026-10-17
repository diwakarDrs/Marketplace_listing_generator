"""Seller profile endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.seller import (
    SellerProfileCreate,
    SellerProfileList,
    SellerProfileRead,
    SellerProfileUpdate,
)
from app.services import seller_service

router = APIRouter()

DbSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.get("", response_model=SellerProfileList)
@router.get("/", response_model=SellerProfileList, include_in_schema=False)
def list_sellers(
    db: DbSession,
    current_user: CurrentUser,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> SellerProfileList:
    items, total = seller_service.list_sellers(db, current_user.id, page, page_size)
    return SellerProfileList(
        items=[SellerProfileRead.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=SellerProfileRead, status_code=status.HTTP_201_CREATED)
@router.post(
    "/",
    response_model=SellerProfileRead,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
def create_seller(
    payload: SellerProfileCreate,
    db: DbSession,
    current_user: CurrentUser,
) -> SellerProfileRead:
    seller = seller_service.create_seller(db, current_user.id, payload)
    return SellerProfileRead.model_validate(seller)


@router.get("/{seller_id}", response_model=SellerProfileRead)
def get_seller(
    seller_id: int,
    db: DbSession,
    current_user: CurrentUser,
) -> SellerProfileRead:
    return SellerProfileRead.model_validate(
        seller_service.get_seller(db, current_user.id, seller_id)
    )


@router.put("/{seller_id}", response_model=SellerProfileRead)
def update_seller(
    seller_id: int,
    payload: SellerProfileUpdate,
    db: DbSession,
    current_user: CurrentUser,
) -> SellerProfileRead:
    seller = seller_service.update_seller(db, current_user.id, seller_id, payload)
    return SellerProfileRead.model_validate(seller)


@router.delete("/{seller_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_seller(
    seller_id: int,
    db: DbSession,
    current_user: CurrentUser,
) -> Response:
    seller_service.delete_seller(db, current_user.id, seller_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
