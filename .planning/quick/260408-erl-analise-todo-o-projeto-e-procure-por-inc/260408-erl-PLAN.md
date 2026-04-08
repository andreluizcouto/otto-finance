# Quick Task 260408-erl: Fix React Page Inconsistencies

**Created:** 2026-04-08
**Status:** Ready for execution

## Goal

Audit and fix inconsistencies across all React pages in the FinCoach AI project. Focus on functional issues, UX consistency, dead code, and code quality patterns.

## Plan 01: Fix Critical & High Inconsistencies

### Task 1: Fix error handling consistency across pages

**Files:** `src/features/dashboard/pages/Dashboard.tsx`, `src/features/transactions/pages/Transactions.tsx`, `src/features/transactions/pages/Categories.tsx`, `src/features/settings/pages/Settings.tsx`
**Action:**
- Dashboard.tsx: Replace `.catch(console.error)` with `.catch(err => toast.error('Erro ao carregar dashboard'))` + add `import { toast } from "sonner"`
- Transactions.tsx: Replace `.catch(console.error)` with `.catch(err => toast.error('Erro ao carregar transações'))` + add `import { toast } from "sonner"`
- Categories.tsx: `loadCategories` uses `.catch(console.error)` — change to `.catch(err => toast.error('Erro ao carregar categorias'))` (toast already imported)
- Settings.tsx: Replace `.catch(console.error)` with `.catch(err => toast.error('Erro ao carregar perfil'))` (add `import { toast } from "sonner"`)
**Verify:** All data-fetching pages show user-visible error feedback on API failure
**Done:** No `.catch(console.error)` patterns remain in page files

### Task 2: Fix API base URL and add apiDelete helper

**Files:** `src/shared/lib/api.ts`
**Action:**
- Change `const BASE_URL = 'http://localhost:8000'` to `const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'`
- Add `apiDelete` export: `export const apiDelete = (path: string): Promise<any> => apiFetch(path, { method: 'DELETE' });`
- Update Categories.tsx to use `apiDelete` instead of raw `apiFetch(url, { method: 'DELETE' })`
**Verify:** Build succeeds, API calls still work
**Done:** No hardcoded BASE_URL, no raw DELETE calls in pages

### Task 3: Fix Categories modal using shared components + delete dead Sidebar.tsx

**Files:** `src/features/transactions/pages/Categories.tsx`, `src/shared/components/layout/Sidebar.tsx`
**Action:**
- Replace raw `<input>` elements in Categories modal with shared `Input` component (already imported as `Button` but not `Input`)
- Replace raw `<button>` elements in modal footer with shared `Button` component
- Delete `src/shared/components/layout/Sidebar.tsx` (dead file, replaced by Navbar)
**Verify:** Categories modal renders with consistent styling, build succeeds without Sidebar
**Done:** No raw `<input>`/`<button>` in Categories when shared components exist

### Task 4: Fix Dashboard activePeriod init + unused imports

**Files:** `src/features/dashboard/pages/Dashboard.tsx`, `src/features/transactions/pages/Transactions.tsx`
**Action:**
- Dashboard.tsx line 18: `activePeriod` is initialized as `'Este mes'` but this should come from `PERIOD_API` map. Change to `PERIOD_API['Este Mês']` for consistency (both resolve to same string but one is explicit)
- Dashboard.tsx line 252-254: Remove inline `LineChartIcon` SVG, replace with `import { TrendingUp } from "lucide-react"` (already available)
- Dashboard.tsx: Remove unused `ArrowDown` import (not used in Dashboard, it IS used in Transactions)
  - Wait — Dashboard does NOT import ArrowDown. Let me verify. Actually the explore agent said it does. Let me just verify during execution.
**Verify:** Period selector works, chart icon renders
**Done:** No custom inline SVG icons, no unused imports
