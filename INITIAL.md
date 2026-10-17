# INITIAL.md - Define Your Product

> Fill this out, then run `/generate-prp INITIAL.md`

---

## PRODUCT

**Name:** Marketplace Listing Generator 

**Description:** What it does: The seller enters a product name and a few key details. The tool uses AI to write a ready-to-paste listing: an SEO-friendly title, five bullet points, a product description and search keywords, formatted to each marketplace’s rules. It can also produce the listing in Hindi, Tamil and other Indian languages.

Who it’s for: Small and new sellers on Amazon, Flipkart, Meesho and Shopify who list many products, don’t have a copywriter, and lose sales because their listings are poorly written or don’t show up in search. It also suits resellers, small D2C brands, and agencies that manage catalogs for multiple sellers.

**Type:** SaaS

---

## TECH STACK

| Layer | Choice |
|-------|--------|
| Backend | FastAPI + Python |
| Frontend | React + TypeScript + Vite |
| Database | PostgreSQL |
| Auth | JWT + Google OAuth |
| UI | Chakra UI / Tailwind |
| Payments | None / Stripe / Dodo |

---

## MODULES

### Module 1: Authentication (Built-in)

**Models:** User, RefreshToken

**Endpoints:**
- POST /auth/register, /auth/login, /auth/refresh
- GET /auth/me, /auth/google

**Pages:** /login, /register, /profile

---

### Module 2: [Your Core Module]

**Description:** [What does this module do?]

**Models:**
```
[ModelName]:
  - id, user_id (FK)
  - [field]: [type]
  - created_at, updated_at
```

**Endpoints:**
```
GET    /api/[resource]      - List all
POST   /api/[resource]      - Create
GET    /api/[resource]/{id} - Get one
PUT    /api/[resource]/{id} - Update
DELETE /api/[resource]/{id} - Delete
```

**Pages:**
```
/[resource]           - List
/[resource]/new       - Create
/[resource]/{id}      - Detail
/[resource]/{id}/edit - Edit
```

---

### Module 3: [Another Module]

[Same structure as above]

---

### Module 4: Dashboard (Optional)

**Pages:** /dashboard, /settings

---

## MVP SCOPE

Must Have:
- [x] User registration/login
- [ ] [Core feature 1]
- [ ] [Core feature 2]

---

## ACCEPTANCE CRITERIA

- [ ] Users can register and login
- [ ] Users can CRUD their [resources]
- [ ] 80%+ test coverage
- [ ] Docker builds successfully

---

## RUN

```bash
/generate-prp INITIAL.md
/execute-prp PRPs/[name]-prp.md
```
