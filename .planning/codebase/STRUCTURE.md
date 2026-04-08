# Codebase Structure
_Last updated: 2026-04-08_

## Summary

The project has two independent codebases co-located in one repo: a React/Vite frontend under `src/` and a Python/FastAPI backend under `backend/`. They share no code — the frontend talks to the backend over HTTP. The frontend follows a feature-sliced structure; the backend uses a module-per-domain structure.

## Directory Layout

```
projetofinanceiro/
├── src/                        # React SPA (Vite + TypeScript)
│   ├── app/                    # App shell: entry component, router config
│   ├── features/               # Feature slices (one dir per domain)
│   │   ├── auth/pages/         # Welcome.tsx, Login.tsx
│   │   ├── dashboard/pages/    # Dashboard.tsx
│   │   ├── goals/pages/        # Goals.tsx
│   │   ├── onboarding/pages/   # Onboarding1/2/3.tsx
│   │   ├── settings/pages/     # Settings.tsx
│   │   └── transactions/pages/ # Transactions.tsx, TransactionDetail.tsx, Categories.tsx
│   └── shared/                 # Reusable code across features
│       ├── components/
│       │   ├── figma/          # ImageWithFallback.tsx (Figma-generated helper)
│       │   ├── layout/         # MainLayout, AuthLayout, Sidebar
│       │   └── ui/             # Custom primitive components + shadcn/radix wrappers
│       ├── lib/                # api.ts, auth.ts (fetch wrapper, token helpers)
│       └── styles/             # theme.css, index.css, fonts.css, tailwind.css
├── backend/                    # FastAPI Python backend
│   ├── main.py                 # FastAPI app: router registration, CORS middleware
│   ├── core.py                 # Settings, Supabase client factory, auth dependencies
│   └── modules/                # Domain modules
│       ├── auth/               # router.py, schemas.py, services.py
│       ├── categories/         # router.py, schemas.py, services.py
│       ├── dashboard/          # router.py, services.py
│       ├── transactions/       # router.py, schemas.py, services.py
│       └── shared/             # utils.py (format_brl, shared helpers)
├── main.py                     # Root entry: re-exports backend.main.app for uvicorn
├── index.html                  # Vite HTML template (mounts #root)
├── vite.config.ts              # Vite config: React plugin, Tailwind, @ alias
├── package.json                # Frontend deps (React 18, react-router 7, recharts, radix-ui...)
├── pyproject.toml              # Python project config
├── requirements.txt            # Python deps (fastapi, supabase-py, pandas, httpx...)
├── dist/                       # Vite build output (committed or gitignored)
├── supabase/                   # Supabase local config / migrations (if any)
├── tests/                      # Python tests (pytest)
├── guidelines/                 # Project guidelines docs
└── .planning/                  # GSD workflow planning artifacts
    ├── codebase/               # This directory — codebase analysis docs
    ├── phases/                 # Phase plans (01-foundation, 02-data-dashboard, etc.)
    └── quick/                  # Quick task plans
```

## Key Files

**Frontend Entry Points:**
- `index.html` — Vite HTML shell, loads `src/main.tsx`
- `src/main.tsx` — `createRoot().render(<App />)`, imports global CSS
- `src/app/App.tsx` — `<RouterProvider router={router} />` + `<Toaster />`
- `src/app/routes.tsx` — All route definitions, two layout groups (AuthLayout / MainLayout)

**Backend Entry Points:**
- `main.py` — `from backend.main import app` — uvicorn target
- `backend/main.py` — FastAPI app, router registration, CORS
- `backend/core.py` — Shared dependencies: `get_current_user`, `get_current_client`, `Settings`

**Shared Frontend Utilities:**
- `src/shared/lib/api.ts` — `apiFetch`, `apiGet`, `apiPost`, `apiPut` (all calls to `http://localhost:8000`)
- `src/shared/lib/auth.ts` — `getToken`, `setToken`, `clearToken`, `isAuthenticated` (localStorage)
- `src/shared/components/ui/index.tsx` — Custom `Button`, `Card`, `Input`, `Badge` + `cn()` utility

**Styling:**
- `src/shared/styles/theme.css` — CSS custom properties, glassmorphism utilities (`.glass-card`, `.glass-panel`), scrollbar
- `src/shared/styles/index.css` — Global reset / base imports
- `src/shared/styles/tailwind.css` — Tailwind base import

## Feature Slice Structure

Each feature under `src/features/` follows this pattern:
```
src/features/{domain}/
└── pages/
    └── {PageName}.tsx     # Self-contained page component
```

Pages are self-contained: they own their local state (`useState`), data fetching (`useEffect` + `apiGet`/`apiPost`), and render their own layout sections. No shared hooks or services layer on the frontend yet.

## Backend Module Structure

Each module under `backend/modules/{domain}/` follows this pattern:
```
backend/modules/{domain}/
├── __init__.py        # exports router
├── router.py          # APIRouter with prefix, FastAPI route handlers
├── schemas.py         # Pydantic request/response models (where applicable)
└── services.py        # Business logic, Supabase queries
```

The router depends on `backend/core.py` for auth (`get_current_user`, `get_current_client`). Services receive the authenticated `supabase.Client` as a parameter — no global state.

## Naming Conventions

**Frontend files:**
- Page components: `PascalCase.tsx` (e.g., `Dashboard.tsx`, `TransactionDetail.tsx`)
- Shared components: `PascalCase.tsx` (e.g., `Sidebar.tsx`, `ImageWithFallback.tsx`)
- Utilities/libs: `camelCase.ts` (e.g., `api.ts`, `auth.ts`)
- Style files: `kebab-case.css` (e.g., `theme.css`, `index.css`)

**Backend files:**
- All snake_case: `router.py`, `services.py`, `schemas.py`, `core.py`

**Frontend path alias:**
- `@/` maps to `src/` (configured in `vite.config.ts`)
- Use `@/shared/...`, `@/features/...`, `@/app/...` for all imports

## Where to Add New Code

**New feature page (e.g., Reports):**
1. Create `src/features/reports/pages/Reports.tsx`
2. Import and add route in `src/app/routes.tsx` under `MainLayout` children
3. Add nav item in `src/shared/components/layout/Sidebar.tsx` `navItems` array

**New API endpoint:**
1. Add service function to `backend/modules/{domain}/services.py`
2. Add Pydantic schema to `backend/modules/{domain}/schemas.py` (if new request body)
3. Add route handler to `backend/modules/{domain}/router.py`
4. Router is already registered in `backend/main.py` — no changes needed if using existing module

**New domain module (e.g., goals backend):**
1. Create `backend/modules/goals/__init__.py`, `router.py`, `services.py`, `schemas.py`
2. Import and register router in `backend/main.py`: `app.include_router(goals_router)`

**New shared UI primitive:**
- Add to `src/shared/components/ui/index.tsx` (exported directly) or create new file in `src/shared/components/ui/` and export from `index.tsx`

**New shared utility:**
- Add to `src/shared/lib/` as a new `.ts` file

## Special Directories

**`dist/`:**
- Purpose: Vite production build output
- Generated: Yes
- Should be gitignored for most projects

**`.planning/`:**
- Purpose: GSD workflow artifacts — phase plans, quick task plans, codebase analysis
- Generated: By GSD commands
- Committed: Yes

**`tests/`:**
- Purpose: Python pytest tests for the backend
- Has `legacy/` subdirectory suggesting tests were migrated alongside the backend refactor

**`node_modules/`:**
- Generated: Yes (npm install)
- Not committed

**`.claude/worktrees/`:**
- Purpose: Isolated git worktrees used by agent sub-tasks during GSD execution
- Generated: By GSD agent tooling

## Gaps / Unknowns

- No `tsconfig.json` found in root — TypeScript compilation config may be absent or handled entirely by Vite's esbuild (no type-checking at build time)
- `supabase/` directory exists but contents not inspected — may contain local config or migration files
- `guidelines/` directory exists but contents not inspected
- `src/features/goals/pages/Goals.tsx` not inspected — goals feature backend API endpoints are not visible in backend modules (goals module absent from `backend/modules/`)
- `src/features/transactions/pages/TransactionDetail.tsx` and `src/features/onboarding/` pages not inspected in detail
- No `.env` or `.env.example` checked for required variable names (see `backend/core.py` for `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `MAKE_WEBHOOK_URL`)
