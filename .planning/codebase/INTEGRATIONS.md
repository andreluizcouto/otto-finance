# External Integrations
_Last updated: 2026-04-08_

## Summary
FinCoach AI integrates with Supabase (database + authentication), Make.com (AI classification orchestration via webhook), and OpenAI (transaction classification via Make.com scenarios). The React frontend communicates with a local FastAPI backend at `http://localhost:8000`; that backend owns all external service calls. Z-API (WhatsApp) is planned per the project spec but not yet wired into backend code.

---

## Backend API (Internal)

**FastAPI server:**
- Base URL: `http://localhost:8000` (hardcoded in `src/shared/lib/api.ts`)
- CORS: allows any `localhost` / `127.0.0.1` port (`allow_origin_regex` in `backend/main.py`)
- Auth: Bearer token passed in `Authorization` header; optional `X-Refresh-Token` header
- Entry: `main.py` → `from backend.main import app`

**Endpoints defined:**
| Method | Path | Module |
|--------|------|--------|
| POST | `/api/auth/signup` | `backend/modules/auth/router.py` |
| POST | `/api/auth/login` | `backend/modules/auth/router.py` |
| POST | `/api/auth/logout` | `backend/modules/auth/router.py` |
| GET | `/api/auth/me` | `backend/modules/auth/router.py` |
| GET | `/api/transactions` | `backend/modules/transactions/router.py` |
| POST | `/api/transactions/classify` | `backend/modules/transactions/router.py` |
| PATCH | `/api/transactions/{id}/category` | `backend/modules/transactions/router.py` |
| GET | `/api/dashboard` | `backend/modules/dashboard/router.py` |
| GET/POST/PUT/DELETE | `/api/categories` | `backend/modules/categories/router.py` |
| GET | `/health` | `backend/main.py` |

---

## Supabase

**Purpose:** PostgreSQL database + Auth (JWT-based)

**SDK:** `supabase-py` >=2.28.3 (Python)

**Client initialization:** `backend/core.py` → `create_client(SUPABASE_URL, SUPABASE_ANON_KEY)`

**Auth flow:**
- Backend calls `client.auth.sign_in_with_password()` in `backend/modules/auth/services.py`
- JWT returned to frontend, stored in `localStorage` under key `fincoach_access_token` (`src/shared/lib/auth.ts`)
- Frontend passes token as `Authorization: Bearer <token>` on every request to FastAPI
- FastAPI creates an authenticated Supabase client per request via `client.auth.set_session()` or `client.postgrest.auth()` (`backend/core.py`)

**Database schema** (`supabase/schema.sql`):
| Table | Key columns | RLS |
|-------|-------------|-----|
| `categories` | `id`, `name`, `slug`, `emoji`, `color_hex`, `user_id`, `is_default` | Enabled — default rows visible to all, custom rows per-user |
| `transactions` | `id`, `user_id`, `amount`, `date`, `description`, `merchant_name`, `category_id`, `confidence_score`, `payment_method`, `is_recurring`, `manually_reviewed` | Enabled — strict per-user isolation |
| `budgets` | `id`, `user_id`, `category_id`, `monthly_limit`, `is_active` | Enabled — strict per-user |
| `goals` | `id`, `user_id`, `name`, `target_amount`, `current_amount`, `deadline`, `status` | Enabled — strict per-user |

**Seed data:** `supabase/seed_categories.sql` (default categories)

**Required env vars:**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

---

## Make.com (AI Classification Webhook)

**Purpose:** Orchestrates OpenAI transaction classification. FastAPI backend POSTs unclassified transactions to Make.com; Make.com calls OpenAI, writes results back to Supabase, and returns a count.

**Integration point:** `backend/modules/transactions/services.py` → `trigger_classification()`

**Call pattern:**
```python
httpx.post(MAKE_WEBHOOK_URL, json=payload, timeout=60.0)
```

**Payload structure sent to Make.com:**
```json
{
  "user_id": "<uuid>",
  "transactions": [{"id", "description", "merchant_name", "amount"}],
  "categories": [{"id", "name", "slug"}]
}
```

**Expected response:**
```json
{"classified_count": <int>}
```

**Required env var:**
- `MAKE_WEBHOOK_URL`

**OpenAI JSON schema** (defined in backend for Make.com to use, `backend/modules/transactions/services.py`):
- Model guidance: `gpt-4o-mini` for classification
- Structured Output schema: returns `category_slug` (enum of 10 categories) + `confidence` (0.0–1.0 float)
- Confidence mapped to `high` (>=0.8) / `medium` (>=0.5) / `low` (<0.5) before storing

---

## OpenAI

**Purpose:** AI-powered transaction classification

**SDK:** `openai` >=2.30.0 (in `requirements.txt`)

**Access pattern:** Called by Make.com scenario (not directly from Python code at runtime). The OpenAI JSON schema and confidence mapping logic is defined in `backend/modules/transactions/services.py` as reference for Make.com scenario configuration.

**No OpenAI API key env var** is loaded in `backend/core.py` — key is configured inside Make.com.

---

## Z-API (WhatsApp)

**Purpose:** Proactive financial coaching messages via WhatsApp

**Status:** Planned (in project spec / CLAUDE.md) — no code found in `backend/` or `src/` that calls Z-API endpoints.

**Expected integration point when implemented:**
- REST endpoint: `https://api.z-api.io/instances/{INSTANCE_ID}/token/{TOKEN}/send-text`
- Triggered by scheduled Make.com scenarios

---

## Authentication & Identity

**Provider:** Supabase Auth

**Frontend token storage:** `localStorage` key `fincoach_access_token` (`src/shared/lib/auth.ts`)

**Frontend auth helpers:**
- `getToken()`, `setToken()`, `clearToken()`, `isAuthenticated()` in `src/shared/lib/auth.ts`

**No third-party OAuth providers** detected in current codebase.

---

## Data Storage

**Database:** Supabase (PostgreSQL) — remote hosted

**File storage:** Not used (no Supabase Storage or S3 references found)

**Caching:** None detected

**Local state:** `localStorage` for auth token + onboarding state (based on prior commits)

---

## Monitoring & Observability

**Error tracking:** None detected (no Sentry, Datadog, etc.)

**Logging:** `console.error` pattern in frontend (`src/shared/lib/api.ts`); standard Python exceptions in backend — no structured logging library

---

## CI/CD & Deployment

**Frontend hosting target:** Not configured — no deployment config detected (`vercel.json`, `netlify.toml`, etc.)

**Backend hosting target:** Not configured — no Dockerfile, Procfile, or cloud config found

**Streamlit Cloud:** Referenced in CLAUDE.md as deployment target for Streamlit era; not applicable to current React frontend

---

## Gaps / Unknowns

- `MAKE_WEBHOOK_URL` value unknown — must be configured in Make.com and added to `.env`
- Z-API credentials (`INSTANCE_ID`, `TOKEN`) not yet present in codebase
- No OpenAI API key management in Python code — entirely delegated to Make.com; if direct Python calls are ever needed, `OPENAI_API_KEY` must be added to `backend/core.py`
- Frontend API base URL is hardcoded as `http://localhost:8000` in `src/shared/lib/api.ts` — production URL strategy not defined
- No HTTPS/TLS configuration for the FastAPI server — local dev only at present
- Supabase Realtime (websocket subscriptions) not used — all reads are polling via REST
