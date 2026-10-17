"""products router."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.product import ProductCreate, ProductPage, ProductRead, ProductUpdate
from app.services import product_service

router = APIRouter()
DbDep = Annotated[Session, Depends(get_db)]
UserDep = Annotated[User, Depends(get_current_user)]


@router.get("", response_model=ProductPage)
@router.get("/", response_model=ProductPage, include_in_schema=False)
def list_products(
    db: DbDep,
    user: UserDep,
    seller_id: int | None = None,
    search: str | None = Query(default=None, max_length=100),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=product_service.MAX_PAGE_SIZE),
) -> ProductPage:
    items, total = product_service.list_products(db, user.id, seller_id, search, page, page_size)
    return ProductPage(
        items=[ProductRead.model_validate(p) for p in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
@router.post(
    "/", response_model=ProductRead, status_code=status.HTTP_201_CREATED, include_in_schema=False
)
def create_product(
    payload: ProductCreate,
    db: DbDep,
    user: UserDep,
) -> ProductRead:
    return ProductRead.model_validate(product_service.create_product(db, user.id, payload))


@router.get("/{product_id}", response_model=ProductRead)
def get_product(
    product_id: int,
    db: DbDep,
    user: UserDep,
) -> ProductRead:
    return ProductRead.model_validate(product_service.get_product(db, user.id, product_id))


@router.put("/{product_id}", response_model=ProductRead)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: DbDep,
    user: UserDep,
) -> ProductRead:
    return ProductRead.model_validate(
        product_service.update_product(db, user.id, product_id, payload)
    )


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: DbDep,
    user: UserDep,
) -> Response:
    product_service.delete_product(db, user.id, product_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
