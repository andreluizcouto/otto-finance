# Architecture
_Last updated: 2026-04-08_

## Summary

FinCoach AI is a decoupled full-stack application: a React 18 SPA (built with Vite) communicates with a Python FastAPI backend over REST. The backend authenticates users via Supabase Auth, reads/writes data to Supabase (PostgreSQL), and delegates AI classification to Make.com webhooks. The frontend has no direct Supabase access — all data flows through the FastAPI layer.

## Overall Pattern

**Client-Server SPA with delegated AI backend**

```
React SPA (Vite)
    │  HTTP REST (Bearer JWT)
    ▼
FastAPI (backend/main.py → port 8000)
    ├── Supabase Auth  (sign in / sign up / token validation)
    ├── Supabase DB    (read/write via supabase-py)
    └── Make.com webhook (AI classification trigger)
```

## Layers

**Frontend — React SPA**
- Purpose: Renders all UI, handles routing, manages local auth token
- Location: `src/`
- Entry point: `src/main.tsx` → mounts `<App />` into `#root`
- Router: `src/app/routes.tsx` (React Router v7, `createBrowserRouter`)
- State: Local `useState`/`useEffect` per page — no global state manager (no Redux, no Zustand, no Context)
- API calls: All via `src/shared/lib/api.ts` (`apiFetch`, `apiGet`, `apiPost`, `apiPut`) pointing at `http://localhost:8000`
- Auth token: Stored in `localStorage` under key `fincoach_access_token` — managed by `src/shared/lib/auth.ts`

**Backend — FastAPI**
- Purpose: REST API, authentication gateway, Supabase query layer, Make.com trigger
- Entry point: `main.py` (re-exports `backend.main.app`); run via `uvicorn main:app`
- Main app file: `backend/main.py` — registers routers, adds CORS middleware (allows any `localhost:*` origin)
- Shared config/deps: `backend/core.py` — `Settings`, Supabase client factory, `HTTPBearer` dependency, `get_current_user`, `get_current_client`
- Modules: `backend/modules/{auth,categories,dashboard,transactions}/`

**Database — Supabase (PostgreSQL)**
- All reads/writes go through `supabase-py` client created in `backend/core.py`
- Key tables: `transactions`, `categories`
- RLS: Policies are expected on Supabase side; the backend uses authenticated Supabase clients (token injected via `client.postgrest.auth(access_token)`)
- No ORM, no migrations in this repo — schema managed via Supabase Dashboard

## Routing Architecture

Two layout groups defined in `src/app/routes.tsx`:

**AuthLayout** (`src/shared/components/layout/index.tsx`):
- Wraps: `/` (Welcome), `/login`, `/onboarding/1`, `/onboarding/2`, `/onboarding/3`
- Full-screen centered layout, no sidebar
- No auth guard — public routes

**MainLayout** (`src/shared/components/layout/index.tsx`):
- Wraps: `/dashboard`, `/transactions`, `/transactions/:id`, `/categories`, `/goals`, `/settings`
- Includes fixed sidebar (`Sidebar` component)
- Auth guard: checks `isAuthenticated()` on mount; redirects to `/login` if no token

## Authentication Flow

1. User submits credentials on `Login.tsx`
2. `apiPost('/api/auth/login', { email, password })` → FastAPI `POST /api/auth/login`
3. FastAPI calls `supabase.auth.sign_in_with_password()`
4. On success, returns `{ session: { access_token, refresh_token } }`
5. Frontend calls `setToken(data.session.access_token)` → stored in `localStorage`
6. All subsequent API calls send `Authorization: Bearer <token>` header
7. FastAPI uses `HTTPBearer` dependency → `get_current_user()` validates token via `supabase.auth.get_user(token)`
8. Logout: `POST /api/auth/logout` + `clearToken()` + navigate to `/login`

## Data Flow — Dashboard

```
Dashboard.tsx
  → apiGet('/api/dashboard?period=Este mes')
      → FastAPI GET /api/dashboard
          → get_current_user() validates JWT
          → get_current_client() creates authenticated Supabase client
          → dashboard/services.py: load_dashboard_data() (2 Supabase queries)
          → compute_kpis(), _serialize_trend_data(), _serialize_category_totals(),
            _serialize_recent_transactions(), _serialize_comparison()
          → returns JSON: { kpis, trend, category_totals, recent_transactions, comparison }
  → setData(response) → renders chart (Recharts AreaChart) + KPI cards
```

## Data Flow — AI Classification

```
Transactions page (classify button)
  → apiPost('/api/transactions/classify', {})
      → FastAPI POST /api/transactions/classify
          → get_unclassified_transactions() from Supabase
          → build_classification_payload() (merchant name normalization)
          → httpx.post(MAKE_WEBHOOK_URL, json=payload, timeout=60s)
              → Make.com scenario: calls OpenAI → writes results back to Supabase
          → returns { success, classified_count }
```

## API Endpoints

| Method | Path | Module | Purpose |
|--------|------|--------|---------|
| POST | `/api/auth/signup` | auth | Create account |
| POST | `/api/auth/login` | auth | Sign in, returns JWT |
| POST | `/api/auth/logout` | auth | Sign out |
| GET | `/api/auth/me` | auth | Current user info |
| GET | `/api/dashboard?period=` | dashboard | Dashboard KPIs + trend + categories |
| GET | `/api/transactions?limit=` | transactions | List user transactions |
| POST | `/api/transactions/classify` | transactions | Trigger Make.com AI classification |
| PATCH | `/api/transactions/{id}/category` | transactions | Manually correct a category |
| GET | `/api/categories` | categories | List all categories |
| POST | `/api/categories` | categories | Create custom category |
| PATCH | `/api/categories/{id}` | categories | Rename category |
| DELETE | `/api/categories/{id}` | categories | Delete custom category |
| GET | `/health` | — | Health check |

## Error Handling

**Frontend:** `apiFetch` throws `Error(message)` on non-2xx. Pages catch with `.catch(console.error)` or `try/catch` with local `error` state. Toast notifications via `sonner` for user-facing errors.

**Backend:** Services return `{ success: bool, error: str | None }` dicts. Routers translate `success=False` into HTTP 4xx/5xx `HTTPException`. Unhandled exceptions in data routes become `500 Internal Server Error`.

## Cross-Cutting Concerns

**Auth guard:** `MainLayout` checks `isAuthenticated()` (token presence) client-side. No server-side session — token validity is only verified on API calls.

**CORS:** Backend allows all `localhost:*` origins. Production CORS policy not yet configured.

**AI Classification:** Delegated entirely to Make.com. Backend only triggers the webhook and returns a count. Make.com writes classification results directly to Supabase.

**Charting:** Recharts `AreaChart` used in Dashboard. No other chart library integration in current pages.

## Gaps / Unknowns

- No refresh token rotation on the frontend — if `access_token` expires, the user gets a 401 but the SPA may not auto-redirect
- `PUT /api/users/me` is referenced in `Settings.tsx` comment but not implemented — profile save is simulated with a timeout
- Goals page (`Goals.tsx`) state management and API endpoints are not confirmed — not yet inspected
- Make.com scenario internals (OpenAI prompt, Supabase write-back logic) are external and not in this repo
- No `tsconfig.json` found — TypeScript config may be missing or bundled into Vite config
- Supabase schema (tables, RLS policies, indexes) not in this repo — managed externally via Supabase Dashboard
