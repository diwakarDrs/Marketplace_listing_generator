# ✦ Marketplace Listing Generator

> Turn a product name and a few details into a **ready-to-paste marketplace listing** with AI: an SEO-friendly title, five bullet points, a product description and search keywords, formatted to each marketplace's rules and available in English and eight Indian languages.

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)

---

## Table of contents

1. [The problem it solves](#the-problem-it-solves)
2. [Features](#features)
3. [Tech stack](#tech-stack)
4. [Architecture](#architecture)
5. [Quick start with Docker](#quick-start-with-docker)
6. [Local development without Docker](#local-development-without-docker)
7. [Configuration](#configuration)
8. [Using the app](#using-the-app)
9. [Marketplace rules](#marketplace-rules)
10. [API reference](#api-reference)
11. [Project structure](#project-structure)
12. [Testing and quality gates](#testing-and-quality-gates)
13. [Security notes](#security-notes)
14. [Troubleshooting](#troubleshooting)
15. [Contributing](#contributing)

---

## The problem it solves

Small and new sellers on **Amazon, Flipkart, Meesho and Shopify** list many products and usually have no copywriter. Poorly written listings don't appear in search and lose sales, and every marketplace has its own length and character limits.

The seller enters a product name and a few key details. The app writes a complete listing, checks it against that marketplace's rules and lets the seller edit, copy and export it.

**Who it's for:** small and new sellers, resellers, small D2C brands, and agencies that manage catalogs for several sellers.

---

## Features

| Area | What you get |
|------|--------------|
| **AI generation** | Title, 5 bullet points, description and keywords for a chosen marketplace, written by an OpenAI model |
| **Multi-language** | English, Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi and Gujarati, written in the native script |
| **Marketplace rules** | Per-marketplace length and character limits, banned characters and discouraged promo phrases, shown as warnings next to the listing |
| **Edit and regenerate** | Edit any field by hand with live character counters, or regenerate with new instructions |
| **Copy and export** | Per-field copy buttons, plus a full export as plain text or CSV |
| **Seller profiles** | Brand name, brand voice, default marketplace and language, so agencies can manage several sellers |
| **Product catalog** | Save products (name, category, brand, key features, price, audience, attributes) and reuse them across listings |
| **Usage quota** | Monthly generation limit per user, with a usage meter and a clear error when it is exceeded |
| **Dashboard** | Totals, recent listings, a per-marketplace breakdown and the quota meter |
| **Auth** | Email and password (bcrypt) with JWT access and refresh tokens, plus Google OAuth |
| **Polished UI** | Animated gradients, glass cards, hover effects, page transitions, and a **light and dark theme** with a persisted toggle |

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI, Python 3.11+, SQLAlchemy 2, Alembic, Pydantic v2 |
| Database | PostgreSQL 15 |
| AI | OpenAI API (default model `gpt-4o-mini`, configurable) |
| Auth | JWT (PyJWT), bcrypt, Google OAuth (Authlib) |
| Frontend | React 19, TypeScript, Vite |
| UI | Chakra UI v3, Framer Motion |
| Testing | pytest + coverage (backend), Vitest + Testing Library (frontend) |
| Quality | Ruff, mypy, oxlint, `tsc` |
| DevOps | Docker, Docker Compose, GitHub Actions CI |

---

## Architecture

```
┌──────────────┐   HTTP/JSON    ┌───────────────────┐   SQL    ┌──────────────┐
│  React SPA   │ ─────────────▶ │  FastAPI backend  │ ───────▶ │ PostgreSQL   │
│  (Vite, TS)  │ ◀───────────── │  routers → services│          └──────────────┘
└──────────────┘   JWT bearer   │  → models         │
                                │                   │  HTTPS   ┌──────────────┐
                                │   ai_service  ────┼────────▶ │  OpenAI API  │
                                └───────────────────┘          └──────────────┘
```

The backend follows a layered design:

- **routers/**: thin HTTP layer (validation, auth dependencies, status codes)
- **services/**: business logic (listing generation, quota, marketplace rules, AI calls)
- **models/**: SQLAlchemy tables; **schemas/**: Pydantic request and response types
- **auth/**: JWT, Google OAuth and rate limiting

**Generation flow:** the user picks a product, marketplace and language → the backend checks the monthly quota → `ai_service` builds a prompt that includes the marketplace's limits and the seller's brand voice → the model returns structured JSON → `marketplace_rules` trims keywords to the byte budget and validates every field → the listing and any warnings are saved and returned.

---

## Quick start with Docker

**Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose) and an [OpenAI API key](https://platform.openai.com/api-keys).

```bash
# 1. Clone
git clone <your-repo-url>
cd Marketplace-listing-generator

# 2. Create your environment file
cp .env.example .env
```

Edit `.env` and set at least:

```env
DB_PASSWORD=choose-a-strong-password
SECRET_KEY=<output of: openssl rand -hex 32>
OPENAI_API_KEY=sk-...
```

```bash
# 3. Build and start (database, migrations, backend, frontend)
docker-compose up -d --build
```

| Service | URL |
|---------|-----|
| App (frontend) | http://localhost:3000 |
| API | http://localhost:8000 |
| Interactive API docs | http://localhost:8000/docs |

Database migrations run automatically through the one-shot `migrate` service before the backend starts.

```bash
docker-compose logs -f backend     # follow logs
docker-compose down                # stop (data is kept in a volume)
docker-compose down -v             # stop and delete the database volume
```

For hot-reload development inside Docker:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

---

## Local development without Docker

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt

# Point DATABASE_URL at a running PostgreSQL, then:
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                        # http://localhost:5173
```

The frontend reads the API location from `VITE_API_URL` (default `http://localhost:8000`). When running the Vite dev server, make sure `CORS_ORIGINS` in `.env` includes `http://localhost:5173`.

---

## Configuration

All settings are environment variables. Copy `.env.example` to `.env`. **Never commit `.env`.**

| Variable | Required | Description |
|----------|:--------:|-------------|
| `DB_USER`, `DB_PASSWORD`, `DB_NAME` | ✅ | PostgreSQL credentials used by Docker Compose |
| `DATABASE_URL` | local only | Connection string when running the backend outside Docker |
| `SECRET_KEY` | ✅ | JWT signing key, at least 32 characters (`openssl rand -hex 32`). The app rejects the placeholder value |
| `ALGORITHM` | | JWT algorithm, default `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | | Default `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | | Default `7` |
| `OPENAI_API_KEY` | ✅ for generation | Your OpenAI key |
| `AI_MODEL` | | Default `gpt-4o-mini` |
| `FREE_MONTHLY_GENERATIONS` | | Monthly quota per user, default `20` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | optional | Enable "Sign in with Google" |
| `GOOGLE_REDIRECT_URI` | optional | Exact callback URL registered in Google Cloud Console, e.g. `http://localhost:8000/auth/google/callback` |
| `VITE_API_URL` | | API base URL baked into the frontend build, default `http://localhost:8000` |
| `FRONTEND_URL` | | Where the backend redirects after Google sign-in, default `http://localhost:3000` |
| `CORS_ORIGINS` | | Comma-separated allowed browser origins |
| `FORWARDED_ALLOW_IPS` | | Proxy IPs trusted for `X-Forwarded-*` headers (empty means none) |

### Setting up Google sign-in (optional)

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an **OAuth 2.0 Client ID** (Web application).
2. Add `http://localhost:8000/auth/google/callback` as an authorized redirect URI.
3. Put the client ID, secret and redirect URI in `.env` and restart the backend.

Without these, email and password sign-in still works.

---

## Using the app

1. **Register** at `/register` (or continue with Google).
2. **Add a seller profile** (optional): brand name, brand voice and default marketplace and language.
3. **Add a product** with its name, category, key features, price and audience.
4. Open **Generate**, pick the product, marketplace and language, and generate.
5. Review the listing and its **validation badges**. Edit fields, regenerate with new instructions, copy individual fields, or **export** the whole listing as text or CSV.
6. Track usage and recent work on the **Dashboard**. The quota meter shows how many generations remain this month.

---

## Marketplace rules

Limits are defined in `backend/app/services/marketplace_rules.py` and used both to instruct the AI and to validate the result. Over-limit content is flagged as a warning rather than silently cut, except Amazon search terms, which are trimmed to the byte budget.

| Marketplace | Title | Bullet (each) | Description | Keywords |
|-------------|------:|--------------:|------------:|----------|
| Amazon | 200 | 500 | 2000 | 50 chars each, 250 total, search terms ≈ 200 **bytes** |
| Flipkart | 100 | 250 | 3000 (10,000 hard limit) | 50 each, 500 total |
| Meesho | 100 | 200 | 1500 | 40 each, 400 total |
| Shopify | 255 | 300 | 5000 | 50 each, 500 total |

Banned characters (for example `™ ® ©` on Amazon) and discouraged promotional phrases ("free shipping", "guaranteed", "discount") are also flagged. Length counting is grapheme-aware, so Hindi, Tamil and other Indic scripts are measured as readers see them, not as raw code points.

> Some limits (for example Amazon's search-term byte budget and Flipkart's title length) are marked *unverified* in the source because marketplaces change them. Check the current seller guidelines and adjust the constants if needed.

---

## API reference

Full interactive documentation is at **http://localhost:8000/docs** (Swagger UI). All `/api/*` routes require a `Bearer` access token.

### Auth: `/auth`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create an account |
| POST | `/auth/login` | Get access and refresh tokens |
| POST | `/auth/refresh` | Exchange a refresh token for new tokens |
| POST | `/auth/logout` | Revoke the refresh token |
| GET | `/auth/me` | Current user |
| GET | `/auth/google` | Start Google OAuth |
| GET | `/auth/google/callback` | Google OAuth callback |

### Resources: `/api`

| Method | Path | Description |
|--------|------|-------------|
| GET, POST | `/api/sellers` | List or create seller profiles |
| GET, PUT, DELETE | `/api/sellers/{id}` | Read, update or delete a seller |
| GET, POST | `/api/products` | List (paginated, searchable) or create products |
| GET, PUT, DELETE | `/api/products/{id}` | Read, update or delete a product |
| GET | `/api/listings` | List listings (paginated, filterable) |
| POST | `/api/listings/generate` | Generate a listing (rate limited, counts toward the monthly quota) |
| GET, PUT, DELETE | `/api/listings/{id}` | Read, edit or delete a listing |
| POST | `/api/listings/{id}/regenerate` | Regenerate with new options |
| GET | `/api/listings/{id}/export?format=text\|csv` | Download a listing |
| GET | `/api/marketplaces` | Supported marketplaces, their rules and languages |
| GET | `/api/dashboard/stats` | Dashboard totals and breakdowns |
| GET | `/api/usage` | Current month's quota usage |

Users can only ever read and modify their own data.

---

## Project structure

```
Marketplace-listing-generator/
├── backend/
│   ├── app/
│   │   ├── main.py, config.py, database.py, dependencies.py, exceptions.py
│   │   ├── auth/          # JWT, Google OAuth, rate limiting
│   │   ├── models/        # User, RefreshToken, SellerProfile, Product, Listing, UsageRecord
│   │   ├── schemas/       # Pydantic request/response models
│   │   ├── routers/       # auth, sellers, products, listings, rules, dashboard
│   │   └── services/      # ai_service, listing_service, marketplace_rules, usage_service, ...
│   ├── alembic/           # database migrations
│   ├── tests/             # pytest suite (AI calls mocked)
│   ├── Dockerfile
│   └── requirements*.txt
├── frontend/
│   ├── src/
│   │   ├── pages/         # Dashboard, Generate, Listings, Products, Sellers, Auth, Settings
│   │   ├── components/    # auth, dashboard, layout, listings, products, sellers, ui
│   │   ├── context/       # AuthContext, ColorModeContext
│   │   ├── hooks/, services/, types/, lib/
│   │   ├── theme.ts       # Chakra theme, animations, light/dark tokens
│   │   └── __tests__/
│   ├── Dockerfile, nginx.conf
│   └── package.json
├── docker-compose.yml     # production-style stack
├── docker-compose.dev.yml # hot-reload overrides
├── .github/workflows/     # CI pipeline
├── INITIAL.md, PRPs/      # product definition and implementation blueprint
├── skills/, agents/, .claude/   # AI-assisted development workflow files
└── .env.example
```

---

## Testing and quality gates

### Backend

```bash
cd backend
ruff check .            # lint
ruff format --check .   # formatting
mypy app                # type checking
pytest --cov=app        # tests with coverage (OpenAI calls are mocked)
```

Current status: **145 tests passing, about 99% coverage**. CI fails below 80%.

### Frontend

```bash
cd frontend
npm run lint            # oxlint
npm run type-check      # tsc
npm test                # Vitest
```

Current status: **43 tests passing**.

### Continuous integration

`.github/workflows/ci.yml` runs on pushes and pull requests to `main`. Backend job: migrations, Ruff (lint and format), mypy, pytest with an 80% coverage gate and `pip-audit`. Frontend job: `npm ci`, lint, type-check, tests, build and `npm audit`. A final step builds both Docker images.

---

## Security notes

- Passwords are hashed with **bcrypt**; plain passwords are never stored.
- Secrets come from environment variables only. `.env` is git-ignored, and the app refuses to start with the placeholder `SECRET_KEY`.
- Access tokens are short-lived; refresh tokens are stored server-side and revoked on logout.
- Auth and generation endpoints are rate limited.
- Every query is scoped to the authenticated user.
- In `docker-compose.yml` the database has no published port and the API binds to `127.0.0.1` only. For production, put TLS and a reverse proxy in front.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `SECRET_KEY must be set in .env` when starting Compose | Create `.env` from `.env.example` and set `SECRET_KEY` and `DB_PASSWORD` |
| Generation fails with an AI error | Check that `OPENAI_API_KEY` is valid and has credit |
| "Quota exceeded" error | Raise `FREE_MONTHLY_GENERATIONS` in `.env`, or wait for next month |
| Browser shows CORS errors | Add your frontend origin (for example `http://localhost:5173`) to `CORS_ORIGINS` and restart the backend |
| Google sign-in redirects to an error page | The redirect URI in `.env` must exactly match the one registered in Google Cloud Console |
| UI looks unchanged after a rebuild | Hard-refresh the browser (Ctrl+Shift+R) |
| Docker build is slow or killed | Close other applications; the frontend build needs a few GB of memory |

---

## Contributing

1. Fork the repo and create a feature branch.
2. Make your changes with tests; keep Ruff, mypy, oxlint and `tsc` clean.
3. Run the quality gates above.
4. Open a pull request describing the change.

Conventions: type hints on all Python functions, no `print()` (use `logging`), no `any` in TypeScript, no hard-coded secrets.

---

## License

No license has been chosen yet. Add a `LICENSE` file (for example MIT) before publishing if you want others to be able to reuse the code.

---

<p align="center">Built with FastAPI, React and a lot of gradients ✦</p>
