# Concerns & Technical Debt
_Last updated: 2026-04-08_

## Summary

The project is mid-migration from a flat `src/app/` component structure to a feature-based `src/features/` + `src/shared/` architecture. The git working tree contains ~80 deleted files that are tracked at their old paths but now live at new paths — none of these deletions have been committed, leaving git in a dirty state. The React frontend is functionally connected to a live FastAPI backend, but several pages use hardcoded mock data or `toast.info("em breve")` stubs instead of real API calls.

---

## Critical Issues

### 1. Git state is broken — ~80 unstaged deletions
- Git tracks files at old paths (`src/app/components/ui/`, `src/app/pages/`, `src/app/components/layout/`, `src/lib/`, `src/styles/`) that no longer exist on disk.
- The files were physically moved to new paths (`src/shared/components/ui/`, `src/features/*/pages/`, `src/shared/lib/`, `src/shared/styles/`) without a `git mv`, so git sees them as deleted + untracked.
- The entire working tree is unstaged. Running `git status` produces ~80 D-entries. A `git checkout .` would delete the new files.
- **Risk:** Any collaborator cloning and checking out would lose the migrated files.

### 2. `main.py` root entry point is a broken proxy
- `main.py` contains only `from backend.main import app` — it exists solely to proxy the FastAPI app.
- `backend/main.py` imports from `backend.modules.*` which exists on disk, but the old `backend/api/`, `backend/core/`, `backend/schemas/`, and `backend/services/` directories referenced by tracked-but-deleted git entries no longer exist. This causes confusion when reading git status.
- The actual server starts correctly only if `uvicorn backend.main:app` is used (not `uvicorn main:app`), because `main.py` imports `app` at module load time which is fine, but the proxy pattern adds unnecessary indirection.

### 3. `PUT /api/users/me` endpoint does not exist
- `src/features/settings/pages/Settings.tsx:35` has a comment: `// PUT /api/users/me does not exist yet — simulate with delay for UX`
- The save button fakes a 800ms delay and shows a success toast without persisting anything.
- **Impact:** Profile name/phone changes made in Settings are silently lost.

### 4. Token stored in `localStorage` — no expiry handling
- `src/shared/lib/auth.ts` stores the JWT access token in `localStorage` with no expiry check and no refresh logic.
- If the token expires, all API calls return 401 but the user is never redirected to login — the UI just shows empty data (errors are swallowed via `.catch(console.error)`).
- `src/shared/lib/api.ts` does not handle 401 responses by clearing the token or redirecting.

---

## Technical Debt

### 5. Silent error swallowing in data fetching
- Four pages swallow API errors with `.catch(console.error)` and show no user-facing error state:
  - `src/features/dashboard/pages/Dashboard.tsx:26`
  - `src/features/settings/pages/Settings.tsx:28`
  - `src/features/transactions/pages/Categories.tsx:17`
  - `src/features/transactions/pages/Transactions.tsx:33`
- When the backend is down or returns an error, these pages show blank/empty state with no feedback.

### 6. Hardcoded mock data in Goals page
- `src/features/goals/pages/Goals.tsx` initializes state with 3 hardcoded goals (Reserva de Emergência, Investimento Tesouro, Trocar de Carro).
- There is no `/api/goals` backend route. Goals are not persisted in Supabase.
- The "Nova Meta" and "Aplicar sugestão" buttons fire `toast.info("em breve")` stubs.

### 7. Dashboard health score and AI insight card are fully static
- The "Score de Saúde" SVG circle in `src/features/dashboard/pages/Dashboard.tsx` is hardcoded to score 82 with hardcoded copy.
- The "FinCoach AI / Oportunidade de Economia" card shows a hardcoded R$89,90 saving with hardcoded copy. The "Ver recomendação →" button fires `toast.info("Insights personalizados em breve")`.
- Neither calls the backend or OpenAI.

### 8. Dashboard `activePeriod` state mismatch
- `activePeriod` initializes to `'Este mes'` (line 18) but the period selector sets it via `PERIOD_API` map which maps `'Este Mês'` → `'Este mes'` — note the accent difference (`Mês` vs `mes`).
- The initial state never matches a key in `PERIOD_API`, so the first button (`Este Mês`) will not appear highlighted on first render.

### 9. Duplicate `input.tsx` components — two different implementations
- `src/shared/components/ui/input.tsx` is the standard shadcn/Radix Input.
- `src/shared/components/ui/index.tsx` re-exports a custom inline `Input` component with an `icon` prop that wraps a different implementation.
- `Login.tsx` uses the `icon`-prop version. Other components may use the standard version. This creates inconsistency.

### 10. Untyped API responses throughout (`any`)
- `src/features/dashboard/pages/Dashboard.tsx`: `const [data, setData] = useState<any>(null)` and `tx: any`.
- `src/features/transactions/pages/Categories.tsx`: `useState<any[]>([])`.
- `src/shared/lib/api.ts`: all functions return `Promise<any>`.
- No shared TypeScript types/interfaces exist for API response shapes.

### 11. `peerDependencies` for React are marked optional in `package.json`
- `react` and `react-dom` are listed under `peerDependencies` with `"optional": true`, which is unusual for an application (vs a library).
- This is likely a leftover from the Figma/Make template origin (`"name": "@figma/my-make-file"`). React is always required here.

### 12. Mixed UI component origins — MUI + Radix + custom
- `package.json` includes both `@mui/material 7.3.5` and the full `@radix-ui/*` suite.
- Current pages only import from `@/shared/components/ui` (Radix-based shadcn). MUI appears unused in the current frontend code.
- MUI adds ~500KB to the bundle unnecessarily.

---

## Migration State

### Completed
- All page components moved from `src/app/pages/` to `src/features/{domain}/pages/`
- All shared UI components moved from `src/app/components/ui/` to `src/shared/components/ui/`
- Layout components moved from `src/app/components/layout/` to `src/shared/components/layout/`
- API client and auth utilities moved from `src/lib/` to `src/shared/lib/`
- Styles moved from `src/styles/` to `src/shared/styles/`
- `src/app/App.tsx` and `src/app/routes.tsx` updated to import from new paths
- Backend restructured from flat `backend/api/` + `backend/services/` to `backend/modules/{domain}/` pattern
- `backend/core.py` replaces the deleted `backend/core/config.py` and `backend/api/deps.py`

### Pending (not committed)
- `git add -A && git commit` — the migration exists only on disk, not in git history
- The ~80 deleted file paths remain as unstaged changes; git history does not reflect the new structure

### Backend endpoints present
- `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/dashboard?period=`
- `GET /api/transactions`, `POST /api/transactions`, `GET /api/transactions/{id}`, `PUT /api/transactions/{id}`
- `GET /api/categories`, `POST /api/categories`, `PUT /api/categories/{id}`, `DELETE /api/categories/{id}`

### Backend endpoints missing
- `PUT /api/users/me` — referenced in Settings but not implemented
- `GET /api/goals`, `POST /api/goals`, `PUT /api/goals/{id}`, `DELETE /api/goals/{id}` — Goals page is fully mocked
- Any WhatsApp/Make.com webhook endpoints

---

## Gaps / Unknowns

- **No TypeScript compiler config** — no `tsconfig.json` found at root. Type-checking relies entirely on Vite's esbuild (which strips types without checking). Type errors are silent at build time.
- **No ESLint config** — no `.eslintrc*` or `eslint.config.*` found. Code quality is not enforced.
- **No route guards / auth protection** — `src/app/routes.tsx` has no `ProtectedRoute` wrapper. Any user can navigate to `/dashboard` without a valid token; the page will just show empty data when API calls fail.
- **`refactor_imports.py`** exists at root — likely a migration helper script. It is unclear if it has been run, partially run, or is still needed.
- **`tests/legacy/`** directory contains 4 test files (`test_charts.py`, `test_generator.py`, `test_settings.py`, `test_transactions.py`) that appear to be from the old Streamlit era. Their import targets likely no longer exist.
- **No `.env` file** — backend will fail to start if `SUPABASE_URL` and `SUPABASE_ANON_KEY` are not set; `backend/core.py` raises `ValueError` on missing vars. It is unknown if a `.env` is present locally.
- **`supabase/` directory** contains `schema.sql` and `seed_categories.sql` — unknown if the Supabase project has been seeded/migrated with these.
- **`backend/modules/shared/utils.py`** exists but its contents and usage are not confirmed across all modules.
