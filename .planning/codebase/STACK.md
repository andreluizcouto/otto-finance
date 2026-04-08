# Technology Stack
_Last updated: 2026-04-08_

## Summary
FinCoach AI uses a split architecture: a React 18 + TypeScript frontend (bundled with Vite) and a Python FastAPI backend. The frontend uses Tailwind CSS v4 with shadcn/ui (Radix UI primitives) as the component system. The Python backend connects to Supabase and delegates AI classification to Make.com via webhook.

---

## Languages

**Primary (Frontend):**
- TypeScript — all frontend source in `src/`
- TSX — React component files throughout `src/`

**Primary (Backend):**
- Python 3.11.x (runtime target per CLAUDE.md; system currently on 3.12.10)
- Located in `backend/`

---

## Runtime

**Frontend:**
- Node.js v24.14.0 (detected on current machine)
- No `.nvmrc` or `.node-version` pin in repo

**Backend:**
- Python 3.11.x (project target); 3.12.10 on current machine
- No `.python-version` pin in repo

**Package Manager:**
- npm (lockfile: `package-lock.json`, lockfileVersion 3)
- pip / uv for Python (`requirements.txt`)

---

## Frameworks

**Frontend Core:**
- React 18.3.1 — declared as `peerDependency` in `package.json`
- React DOM 18.3.1 — paired with React

**Routing:**
- react-router 7.13.0 — `createBrowserRouter` used in `src/app/routes.tsx`

**Styling:**
- Tailwind CSS 4.1.12 — loaded via `@tailwindcss/vite` plugin, not postcss config
- CSS entry point: `src/shared/styles/index.css` → imports `fonts.css`, `tailwind.css`, `theme.css`

**UI Component System:**
- shadcn/ui pattern — Radix UI primitives wrapped with `class-variance-authority` + `tailwind-merge`
- Component library lives at `src/shared/components/ui/`
- Full Radix primitive suite: accordion, alert-dialog, avatar, checkbox, dialog, dropdown-menu, popover, select, tabs, tooltip, etc.

**Charting:**
- Recharts 2.15.2 — wrapped in a custom `ChartContainer` at `src/shared/components/ui/chart.tsx`

**Animation:**
- motion 12.23.24 (Framer Motion successor)
- tw-animate-css 1.3.8

**Form Handling:**
- react-hook-form 7.55.0

**Backend Framework:**
- FastAPI >=0.116.1 — REST API at `backend/main.py`
- Uvicorn >=0.35.0 — ASGI server
- Pydantic >=2.12.5 — request/response schemas in each module's `schemas.py`

---

## Key Frontend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@radix-ui/*` | various 1.x–2.x | Headless UI primitives for all shadcn/ui components |
| `lucide-react` | 0.487.0 | Icon set used throughout UI |
| `recharts` | 2.15.2 | Charts (wrapped in `src/shared/components/ui/chart.tsx`) |
| `date-fns` | 3.6.0 | Date formatting and manipulation |
| `react-day-picker` | 8.10.1 | Calendar/date-picker component |
| `class-variance-authority` | 0.7.1 | Variant-based className building for components |
| `clsx` | 2.1.1 | Conditional className joining |
| `tailwind-merge` | 3.2.0 | Merge Tailwind classes without conflicts |
| `sonner` | 2.0.3 | Toast notifications (used in `src/app/App.tsx`) |
| `next-themes` | 0.4.6 | Dark/light theme support |
| `cmdk` | 1.1.1 | Command palette component |
| `vaul` | 1.1.2 | Drawer component |
| `canvas-confetti` | 1.9.4 | Celebration animations |
| `react-dnd` + `react-dnd-html5-backend` | 16.0.1 | Drag-and-drop |
| `embla-carousel-react` | 8.6.0 | Carousel component |
| `react-resizable-panels` | 2.1.7 | Resizable panel layouts |
| `@mui/material` + `@mui/icons-material` | 7.3.5 | MUI present as dependency (co-exists with shadcn/ui) |
| `@emotion/react` + `@emotion/styled` | 11.14.0/11.14.1 | MUI's CSS-in-JS engine |
| `motion` | 12.23.24 | Animation library |

## Key Python Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `fastapi` | >=0.116.1 | REST API framework |
| `uvicorn` | >=0.35.0 | ASGI server |
| `supabase` | >=2.28.3 | Supabase client (DB + Auth) |
| `openai` | >=2.30.0 | OpenAI v2 SDK (used in Make.com scenario, schema defined in `backend/modules/transactions/services.py`) |
| `pydantic` | >=2.12.5 | Schemas and validation |
| `httpx` | >=0.28.1 | HTTP client for Make.com webhook calls |
| `python-dotenv` | >=1.2.2 | Load `.env` in local dev |
| `pandas` | >=3.0.2 | Data manipulation |
| `plotly` | >=6.6.0 | Charts (legacy/seeding tooling) |
| `Faker` | >=40.12.0 | Seed data generation (pt_BR locale) |
| `streamlit` | >=1.56.0 | Present in requirements.txt but frontend has migrated to React |

---

## Build & Dev Tools

**Frontend:**
- Vite 6.3.5 — dev server and bundler (`vite.config.ts`)
- `@vitejs/plugin-react` 4.7.0 — React Fast Refresh + JSX transform
- `@tailwindcss/vite` 4.1.12 — Tailwind v4 via Vite plugin (no postcss setup needed)
- Path alias `@` → `./src` configured in `vite.config.ts`
- Output: `dist/` directory

**Backend:**
- pytest — test runner configured in `pyproject.toml` (`testpaths = ["tests"]`)
- uv (recommended per CLAUDE.md, not pinned)

---

## Configuration

**Environment (backend):**
- `.env` file present at project root (never read, existence confirmed)
- Required vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- Optional: `MAKE_WEBHOOK_URL`
- Loaded via `python-dotenv` in `backend/core.py`

**Build:**
- `vite.config.ts` — frontend build config
- `postcss.config.mjs` — PostCSS present but empty (Tailwind handled by Vite plugin)
- `pyproject.toml` — pytest configuration only

---

## Gaps / Unknowns

- No TypeScript `tsconfig.json` found in root — may be inlined or relying on Vite defaults
- Node version not pinned (no `.nvmrc`) — risk of drift across machines
- Python version not pinned (no `.python-version`) — target is 3.11.x but 3.12.10 running locally
- MUI (7.3.5) and shadcn/ui both present — unclear if MUI is actively used or a leftover dependency from a previous migration phase
- `streamlit` still in `requirements.txt` despite frontend migration to React — may be safe to remove
- No `pnpm-lock.yaml` despite `"pnpm"` override block in `package.json` — npm lockfile is being used instead
