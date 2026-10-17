# PRP: Marketplace Listing Generator

> Implementation blueprint for parallel agent execution

---

## METADATA

| Field | Value |
|-------|-------|
| **Product** | Marketplace Listing Generator |
| **Type** | SaaS |
| **Version** | 1.0 |
| **Created** | 2026-10-15 |
| **Complexity** | Medium |

---

## PRODUCT OVERVIEW

**Description:** A seller enters a product name and a few key details. The AI writes a ready-to-paste listing (SEO title, five bullet points, description, search keywords) formatted to the rules of the chosen marketplace (Amazon, Flipkart, Meesho, Shopify). Listings can be generated in English, Hindi, Tamil and other Indian languages.

**Value Proposition:** Small/new sellers, resellers, D2C brands and catalog agencies get professional, search-optimised listings in seconds without a copywriter, so products rank better and convert more.

**Assumptions made (INITIAL.md Modules 2-3 were unfilled template placeholders):**
- Core modules defined as Sellers (workspaces for agencies), Products, Listings (AI generation) and Dashboard/usage.
- Payments: **None** for MVP. A `UsageRecord` monthly free-tier quota is built in so Stripe/Dodo can be added later.
- UI: **Chakra UI** (CLAUDE.md default; no inline styles).
- AI provider: OpenAI API (`gpt-4o-mini` default, configurable via env). Calls wrapped in a service so the provider is swappable.
- Marketplace rules (max lengths, bullet count, formatting) live in a single config module (`marketplace_rules.py`) and must be verified against current seller-central docs during implementation.

**MVP Scope:**
- [ ] User registration/login (JWT + Google OAuth)
- [ ] Seller profiles (brand name, tone, default marketplace/language) for agencies managing several sellers
- [ ] Product CRUD (name, category, brand, key features, price, audience, attributes)
- [ ] AI listing generation per marketplace: title, 5 bullets, description, keywords
- [ ] Multi-language output (English, Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati)
- [ ] Marketplace rule validation (length/character limits) with per-field copy buttons and full export
- [ ] Edit, regenerate, save and delete listings
- [ ] Monthly usage quota + dashboard

---

## TECH STACK

| Layer | Technology | Skill Reference |
|-------|------------|-----------------|
| Backend | FastAPI + Python 3.11+ | skills/BACKEND.md |
| Frontend | React + TypeScript + Vite | skills/FRONTEND.md |
| Database | PostgreSQL + SQLAlchemy + Alembic | skills/DATABASE.md |
| Auth | JWT + bcrypt + Google OAuth | skills/BACKEND.md |
| UI | Chakra UI | skills/FRONTEND.md |
| AI | OpenAI API (service-wrapped) | skills/BACKEND.md |
| Testing | pytest (AI client mocked) + RTL | skills/TESTING.md |
| Deployment | Docker + GitHub Actions | skills/DEPLOYMENT.md |

---

## DATABASE MODELS

### User
- id, email (unique), hashed_password (nullable for OAuth), full_name, is_active, is_verified, oauth_provider, created_at

### RefreshToken
- id, user_id (FK), token_hash, expires_at, revoked, created_at

### SellerProfile
- id, user_id (FK), name, brand_name, brand_voice (text), default_marketplace, default_language, created_at, updated_at

### Product
- id, user_id (FK), seller_profile_id (FK, nullable), name, category, brand, key_features (JSON list), price (numeric, nullable), target_audience, attributes (JSON: color, size, material...), created_at, updated_at

### Listing
- id, user_id (FK), product_id (FK), marketplace (enum: amazon, flipkart, meesho, shopify), language (code), title, bullets (JSON list of 5), description, keywords (JSON list), validation_warnings (JSON), model_used, status (draft/final), created_at, updated_at

### UsageRecord
- id, user_id (FK), period (YYYY-MM), generations_used, generations_limit; unique (user_id, period)

**Relationships:** User 1-N SellerProfile / Product / Listing / UsageRecord; SellerProfile 1-N Product; Product 1-N Listing.

---

## MODULES

### Module 1: Authentication
**Agents:** DATABASE-AGENT + BACKEND-AGENT + FRONTEND-AGENT

**Backend Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Create account |
| POST | /auth/login | Get tokens |
| POST | /auth/refresh | Refresh token |
| POST | /auth/logout | Revoke refresh token |
| GET | /auth/me | Current user |
| GET | /auth/google | Google OAuth login/callback |

**Frontend Pages:**
| Route | Page | Components |
|-------|------|------------|
| /login | LoginPage | LoginForm, GoogleButton |
| /register | RegisterPage | RegisterForm |
| /profile | ProfilePage | ProfileForm |

---

### Module 2: Seller Profiles
**Agents:** BACKEND-AGENT + FRONTEND-AGENT

**Backend Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/sellers | List all |
| POST | /api/sellers | Create |
| GET | /api/sellers/{id} | Get one |
| PUT | /api/sellers/{id} | Update |
| DELETE | /api/sellers/{id} | Delete |

**Frontend Pages:**
| Route | Page | Components |
|-------|------|------------|
| /sellers | SellersPage | SellerCard, EmptyState |
| /sellers/new | SellerCreatePage | SellerForm |
| /sellers/:id/edit | SellerEditPage | SellerForm |

---

### Module 3: Products
**Agents:** BACKEND-AGENT + FRONTEND-AGENT

**Backend Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/products | List (filter by seller, search, paginate) |
| POST | /api/products | Create |
| GET | /api/products/{id} | Get one |
| PUT | /api/products/{id} | Update |
| DELETE | /api/products/{id} | Delete |

**Frontend Pages:**
| Route | Page | Components |
|-------|------|------------|
| /products | ProductsPage | ProductTable, SearchBar |
| /products/new | ProductCreatePage | ProductForm, FeatureListInput |
| /products/:id | ProductDetailPage | ProductSummary, ListingsList |
| /products/:id/edit | ProductEditPage | ProductForm |

---

### Module 4: Listing Generation (core)
**Agents:** BACKEND-AGENT + FRONTEND-AGENT

**Backend Services:**
- `services/ai_service.py`: OpenAI client wrapper, structured JSON output, retries, timeout, prompt injection-safe prompt templating
- `services/marketplace_rules.py`: per-marketplace limits (title length, bullet count/length, banned characters/phrases, keyword length)
- `services/listing_service.py`: build prompt (product + seller voice + marketplace + language), generate, validate against rules, enforce quota

**Backend Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/marketplaces | Marketplace rules and supported languages |
| POST | /api/listings/generate | Generate listing for product + marketplace + language |
| GET | /api/listings | List (filter by product, marketplace, language) |
| GET | /api/listings/{id} | Get one |
| PUT | /api/listings/{id} | Edit fields manually (re-validates) |
| POST | /api/listings/{id}/regenerate | Regenerate with optional instructions |
| DELETE | /api/listings/{id} | Delete |
| GET | /api/listings/{id}/export | Export as text/CSV (marketplace paste format) |

**Frontend Pages:**
| Route | Page | Components |
|-------|------|------------|
| /generate | GeneratePage | ProductPicker, MarketplaceSelect, LanguageSelect, ListingPreview |
| /listings | ListingsPage | ListingTable, Filters |
| /listings/:id | ListingDetailPage | EditableListing, CopyButton, CharCounter, ValidationBadges, RegenerateDialog |

---

### Module 5: Dashboard and Settings
**Agents:** BACKEND-AGENT + FRONTEND-AGENT

**Backend Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dashboard/stats | Counts of products, listings, by marketplace |
| GET | /api/usage | Current month quota used/limit |

**Frontend Pages:**
| Route | Page | Components |
|-------|------|------------|
| /dashboard | DashboardPage | StatCard, UsageMeter, RecentListings |
| /settings | SettingsPage | DefaultsForm, DangerZone |

---

## PHASE EXECUTION PLAN

**Phase 1: Foundation (4 agents in parallel)**
- DATABASE-AGENT: All 6 models, Alembic migration, database.py
- BACKEND-AGENT: main.py, config.py (incl. OPENAI_API_KEY), logging, router skeleton, /health
- FRONTEND-AGENT: Vite setup, Chakra theme, routing, auth context, API client, TS types
- DEVOPS-AGENT: Dockerfiles, docker-compose (api, web, postgres), CI, .env.example

**Validation Gate 1:** pip install, alembic upgrade head, npm install, docker-compose config

**Phase 2: Modules (backend + frontend parallel per module)**
- Auth: JWT + Google OAuth endpoints + Login/Register/Profile pages
- Sellers: CRUD API + pages
- Products: CRUD API + pages
- Listing Generation: AI service, marketplace rules, endpoints + Generate/Listings/Detail pages (depends on Products)
- Dashboard/Usage: stats + quota endpoints + Dashboard/Settings pages

**Validation Gate 2:** ruff check, mypy, npm lint, npm type-check

**Phase 3: Quality (3 agents in parallel)**
- TEST-AGENT: pytest (mock OpenAI client; test quota, rule validation, ownership isolation) + RTL tests, 80%+ coverage
- REVIEW-AGENT: Security audit (auth, per-user data isolation, prompt injection, rate limiting of generate), performance review
- RESEARCH-AGENT: Verify current Amazon/Flipkart/Meesho/Shopify listing limits and Indian-language output quality

**Final Validation:** Full test suite, docker build, health checks

---

## VALIDATION GATES

| Gate | Commands |
|------|----------|
| 1 | `alembic upgrade head`, `npm install`, `docker-compose config` |
| 2 | `ruff check backend/`, `npm run type-check` |
| 3 | `pytest --cov --cov-fail-under=80`, `npm test` |
| Final | `docker-compose up -d`, `curl localhost:8000/health` |

---

## ACCEPTANCE CRITERIA

- [ ] Users can register, login (including Google) and refresh tokens
- [ ] Users can CRUD sellers and products, and only ever see their own data
- [ ] Generating a listing returns title, 5 bullets, description and keywords that respect the chosen marketplace's limits (or show warnings)
- [ ] Listings can be generated in at least Hindi and Tamil plus English, with non-Latin text rendering correctly
- [ ] Quota is enforced and visible; exceeding it returns a clear error
- [ ] Listings can be edited, regenerated, copied and exported
- [ ] 80%+ test coverage (AI calls mocked)
- [ ] Docker builds successfully

---

## ENVIRONMENT VARIABLES

```env
DATABASE_URL=postgresql://user:password@localhost:5432/listing_generator
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-secret
OPENAI_API_KEY=your-openai-key
AI_MODEL=gpt-4o-mini
FREE_MONTHLY_GENERATIONS=20
VITE_API_URL=http://localhost:8000
```

---

## NEXT STEP

Execute with parallel agents:
/execute-prp PRPs/marketplace-listing-generator-prp.md
