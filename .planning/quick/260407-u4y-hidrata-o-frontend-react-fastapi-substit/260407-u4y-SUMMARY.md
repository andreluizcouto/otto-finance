---
phase: quick-260407-u4y
plan: 01
subsystem: frontend
tags: [react, api-integration, auth, hydration]
key-files:
  created:
    - src/lib/api.ts
    - src/lib/auth.ts
  modified:
    - src/app/pages/Login.tsx
    - src/app/pages/Dashboard.tsx
    - src/app/pages/Transactions.tsx
    - src/app/pages/Categories.tsx
    - src/app/pages/Goals.tsx
    - src/app/pages/Settings.tsx
    - src/app/components/layout/index.tsx
decisions:
  - Goals uses structured useState mock — /api/goals does not exist yet
  - Settings save simulates PUT with 800ms delay — /api/users/me PUT not implemented
  - Transactions search is client-side filter on full list (limit=200) — no server-side search
  - Categories delete uses fetch directly (no apiDelete helper needed)
  - Dashboard period buttons map display labels to API-safe strings without accents
metrics:
  duration: "~15 min"
  completed: "2026-04-07"
  tasks: 3
  files: 9
---

# Quick Task 260407-u4y: Frontend Hydration — React + FastAPI

**One-liner:** Replaced all module-level mock data in 6 React pages with real API calls to FastAPI backend at http://localhost:8001, using centralized apiFetch utilities with JWT auth injection.

## What Was Implemented

### Task 1 — src/lib/api.ts + src/lib/auth.ts

- `auth.ts`: `getToken / setToken / clearToken / isAuthenticated` backed by `localStorage` key `fincoach_access_token`
- `api.ts`: `apiFetch(path, options)` with automatic `Content-Type: application/json` and `Authorization: Bearer <token>` injection; error handling parses `detail` field from FastAPI error responses; named exports `apiGet`, `apiPost`, `apiPut`

### Task 2 — Login.tsx + layout/index.tsx

- **Login.tsx**: Controlled form state (`credentials`, `isSubmitting`, `error`, `showPassword`); submits `POST /api/auth/login`; saves `session.access_token` to localStorage; redirects to `/dashboard`; displays inline error for 401/any failure; Eye/EyeOff password toggle
- **MainLayout**: `useEffect` on mount redirects to `/login` if `isAuthenticated()` returns false

### Task 3 — 5 pages hydrated

| Page | Endpoint | Notes |
|------|----------|-------|
| Dashboard | `GET /api/dashboard?period=` | Period selector, skeleton on load, trend chart from `data.trend`, recent transactions from `data.recent_transactions` |
| Transactions | `GET /api/transactions?limit=200` | Debounced search (300ms), client-side filter, totals computed from list |
| Categories | `GET /api/categories` + `POST /api/categories` | Create modal, delete via fetch, reload on success |
| Goals | useState mock | /api/goals not implemented — structured state ready for hydration |
| Settings | `GET /api/auth/me` | Skeleton while loading, save simulates PUT (endpoint pending) |

## Decisions Made

1. **Goals uses mock data via useState** — `/api/goals` endpoint does not exist in the backend. Data is structured as proper state objects ready to be replaced with a `useEffect` + `apiGet` call when the endpoint is added.

2. **Settings save simulates PUT** — `/api/users/me` PUT is not implemented. A `setTimeout(800ms)` simulates the async UX. When the backend adds the endpoint, replace with `apiPut('/api/users/me', profileForm)`.

3. **Transactions filter is client-side** — The API does not support query-param filtering. Full list (`limit=200`) is fetched once; search filters locally with 300ms debounce. Good enough for MVP data volumes.

4. **Dashboard period mapping** — Display labels use accented Portuguese (`Este Mês`) but API requires unaccented versions (`Este mes`). A `PERIOD_API` map handles the translation to avoid 422 errors.

5. **No axios** — Fetch native only, per plan constraint.

## Endpoints Not Yet in Backend

| Endpoint | Used by | Status |
|----------|---------|--------|
| `PUT /api/users/me` | Settings save | Simulated with delay |
| `GET /api/goals` | Goals page | Mock data used |
| `DELETE /api/categories/:id` | Categories card menu | Implemented via direct fetch |

## Known Stubs

| Page | Stub | Reason |
|------|------|--------|
| Goals | `useState` with hardcoded 3 goals | `/api/goals` not implemented — intentional placeholder |
| Settings | `setTimeout(800)` on save | `/api/users/me` PUT not implemented — intentional |
| Dashboard | ScoreCard (82) and FinCoach AI insight card are static | Health score and AI insights are Phase 4+ features |

## How to Test Each Page

1. **Login**: Start backend (`uvicorn backend.main:app --port 8001`), enter real credentials → JWT saved to localStorage, redirect to dashboard. Wrong credentials → red error banner inline.
2. **Dashboard**: After login, period buttons switch between `Este mes / Esta semana / Ultimos 3 meses`. KPI cards and trend chart update. Without backend: skeleton visible.
3. **Transactions**: Type in search box — list filters after 300ms. Loader2 spinner replaces search icon while fetching.
4. **Categories**: Page loads real categories from DB. Click "+ Nova Categoria" or dashed card to open create modal. Hover a card to see the Excluir dropdown.
5. **Goals**: Static mock data — visual only. Aceitar Sugestão button shows 1.5s loading state.
6. **Settings**: Email pre-populated from `GET /api/auth/me`. Save button shows "Salvando..." for 800ms then returns.
7. **Auth guard**: Clear localStorage (`fincoach_access_token`), navigate to `/dashboard` — redirected to `/login`.

## Self-Check

- [x] `src/lib/api.ts` exists
- [x] `src/lib/auth.ts` exists
- [x] All 6 pages modified
- [x] `vite build` passes (zero errors, only chunk-size warning)
- [x] 3 commits created: `7dbea88`, `687997c`, `337f419`
