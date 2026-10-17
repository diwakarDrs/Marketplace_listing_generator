"""Shared fixtures: in-memory SQLite DB, TestClient, fake AI service."""

import os

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["SECRET_KEY"] = "3f9a1c7e5b2d4086a1f3c9e7d5b30214a6c8e0f2b4d6819a3c5e7f9b1d3a5c70"
os.environ["OPENAI_API_KEY"] = ""
os.environ["GOOGLE_CLIENT_ID"] = ""
os.environ["GOOGLE_CLIENT_SECRET"] = ""
os.environ["FREE_MONTHLY_GENERATIONS"] = "20"

import json  # noqa: E402
from collections.abc import Generator  # noqa: E402
from typing import Any  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.engine import Engine  # noqa: E402
from sqlalchemy.orm import Session, sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

import app.models  # noqa: E402, F401  (register all tables)
from app.auth import rate_limit as auth_rate_limit  # noqa: E402
from app.database import Base, get_db  # noqa: E402
from app.exceptions import AIServiceError  # noqa: E402
from app.main import app  # noqa: E402
from app.routers import listings as listings_router  # noqa: E402
from app.services.ai_service import AIService, GeneratedListing, get_ai_service  # noqa: E402

PASSWORD = "password123"


class FakeAI(AIService):
    """Never touches the network. Returns a valid listing unless told otherwise."""

    def __init__(self) -> None:
        super().__init__(client=object(), model="fake-model")
        self.calls: list[dict[str, Any]] = []
        self.fail = False
        self.result: GeneratedListing | None = None

    async def generate_listing(self, **kwargs: Any) -> GeneratedListing:  # type: ignore[override]
        self.calls.append(kwargs)
        if self.fail:
            raise AIServiceError("AI service request failed")
        if self.result is not None:
            return self.result
        n = int(kwargs["limits"]["bullet_count"])
        return GeneratedListing(
            title=f"Great {kwargs['product']['name']}",
            bullets=[f"Bullet {i}" for i in range(1, n + 1)],
            description="A fine description.",
            keywords=["alpha", "beta"],
            model="fake-model",
        )


@pytest.fixture
def engine() -> Generator[Engine, None, None]:
    eng = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(bind=eng)
    yield eng
    Base.metadata.drop_all(bind=eng)
    eng.dispose()


@pytest.fixture
def db(engine: Engine) -> Generator[Session, None, None]:
    maker = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = maker()
    yield session
    session.close()


@pytest.fixture
def fake_ai() -> FakeAI:
    return FakeAI()


@pytest.fixture(autouse=True)
def _reset_rate_limit() -> None:
    listings_router._hits.clear()
    auth_rate_limit.reset()


@pytest.fixture
def client(engine: Engine, fake_ai: FakeAI) -> Generator[TestClient, None, None]:
    maker = sessionmaker(bind=engine, autocommit=False, autoflush=False)

    def _get_db() -> Generator[Session, None, None]:
        s = maker()
        try:
            yield s
        finally:
            s.close()

    app.dependency_overrides[get_db] = _get_db
    app.dependency_overrides[get_ai_service] = lambda: fake_ai
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def register_and_login(client: TestClient, email: str) -> dict[str, str]:
    r = client.post("/auth/register", json={"email": email, "password": PASSWORD})
    assert r.status_code == 201, r.text
    r = client.post("/auth/login", data={"username": email, "password": PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture
def user_a_tokens(client: TestClient) -> dict[str, str]:
    return register_and_login(client, "a@example.com")


@pytest.fixture
def user_b_tokens(client: TestClient) -> dict[str, str]:
    return register_and_login(client, "b@example.com")


@pytest.fixture
def auth_a(user_a_tokens: dict[str, str]) -> dict[str, str]:
    return {"Authorization": f"Bearer {user_a_tokens['access_token']}"}


@pytest.fixture
def auth_b(user_b_tokens: dict[str, str]) -> dict[str, str]:
    return {"Authorization": f"Bearer {user_b_tokens['access_token']}"}


@pytest.fixture
def product_a(client: TestClient, auth_a: dict[str, str]) -> dict[str, Any]:
    r = client.post(
        "/api/products",
        json={
            "name": "Steel Bottle",
            "brand": "Acme",
            "category": "Kitchen",
            "key_features": ["Leakproof", "1L"],
            "price": 499.5,
        },
        headers=auth_a,
    )
    assert r.status_code == 201, r.text
    return r.json()


def fenced(obj: dict[str, Any]) -> str:
    return "```json\n" + json.dumps(obj) + "\n```"
