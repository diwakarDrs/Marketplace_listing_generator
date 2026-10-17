import pytest
from pydantic import ValidationError

from app.config import Settings

GOOD = "3f9a1c7e5b2d4086a1f3c9e7d5b30214a6c8e0f2b4d6819a3c5e7f9b1d3a5c70"


def make(**kw: object) -> Settings:
    values: dict[str, object] = {"SECRET_KEY": GOOD, **kw}
    return Settings(_env_file=None, DATABASE_URL="sqlite://", **values)  # type: ignore[arg-type]


def test_valid_settings() -> None:
    s = make()
    assert s.ALGORITHM == "HS256"
    assert s.FRONTEND_URL == "http://localhost:3000"


@pytest.mark.parametrize(
    "key",
    [
        "short",
        "your-secret-key" + "x" * 30,
        "changeme" + "0" * 40,
        "ci-only-secret-" + "a" * 40,
    ],
)
def test_bad_secret_key(key: str) -> None:
    with pytest.raises(ValidationError):
        make(SECRET_KEY=key)


@pytest.mark.parametrize("alg", ["none", "RS256", "hs256"])
def test_bad_algorithm(alg: str) -> None:
    with pytest.raises(ValidationError):
        make(ALGORITHM=alg)


def test_cors_wildcard_rejected_and_csv_parsed() -> None:
    with pytest.raises(ValidationError):
        make(CORS_ORIGINS="*")
    with pytest.raises(ValidationError):
        make(CORS_ORIGINS='["*"]')
    assert make(CORS_ORIGINS="http://a.com, http://b.com").CORS_ORIGINS == [
        "http://a.com",
        "http://b.com",
    ]


def test_cors_origins_accepts_comma_separated_env(monkeypatch):
    from app.config import Settings

    monkeypatch.setenv("CORS_ORIGINS", "http://a.test, http://b.test")
    assert Settings().CORS_ORIGINS == ["http://a.test", "http://b.test"]


def test_cors_origins_accepts_json_env(monkeypatch):
    from app.config import Settings

    monkeypatch.setenv("CORS_ORIGINS", '["http://a.test"]')
    assert Settings().CORS_ORIGINS == ["http://a.test"]
