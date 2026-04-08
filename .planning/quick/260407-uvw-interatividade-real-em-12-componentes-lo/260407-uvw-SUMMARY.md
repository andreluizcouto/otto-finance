---
phase: quick
plan: 260407-uvw
subsystem: frontend
tags: [react, interactivity, auth, onboarding, navigation, toast]
depends_on: [260407-u4y]
tech_stack:
  added: [sonner toast]
  patterns: [handleSocialLogin double-click guard, isDeleting per-item map, localStorage onboarding persistence, activeSection nav state]
key_files:
  created: []
  modified:
    - src/lib/api.ts
    - src/app/App.tsx
    - src/app/components/layout/Sidebar.tsx
    - src/app/pages/Login.tsx
    - src/app/pages/Welcome.tsx
    - src/app/pages/Dashboard.tsx
    - src/app/pages/Categories.tsx
    - src/app/pages/Goals.tsx
    - src/app/pages/Settings.tsx
    - src/app/pages/Onboarding1.tsx
    - src/app/pages/Onboarding2.tsx
    - src/app/pages/Onboarding3.tsx
decisions:
  - Sidebar logout fires-and-ignores API error to guarantee clearToken+navigate always runs
  - socialLoading string state (not boolean) to support per-provider loading text without extra state
  - isDeleting Record<string,boolean> enables per-item optimistic disable without blocking other items
  - originalProfile snapshot taken in useEffect after load so Cancelar restores server state not initial empty
  - onboarding_complete key merges step1 data at finish time to keep step1 localStorage decoupled
metrics:
  duration_seconds: 900
  completed_date: "2026-04-07"
  tasks_completed: 3
  files_modified: 12
---

# Quick Task 260407-uvw: Interatividade real em 12 componentes React

**One-liner:** Wired real handlers across 12 React components — logout with JWT clearance, social login toasts, Dashboard navigation, Categories apiFetch port fix, Goals local state removal, Settings cancel/avatar/darkmode, and Onboarding localStorage persistence.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Auth flow — Sidebar logout + Login/Welcome social buttons | 4062f2f | Sidebar.tsx, Login.tsx, Welcome.tsx, App.tsx, api.ts |
| 2 | Dashboard navigation + Categories port fix + Goals interactivity | 83afc08 | Dashboard.tsx, Categories.tsx, Goals.tsx |
| 3 | Settings interactivity + Onboarding localStorage persistence | 231d882 | Settings.tsx, Onboarding1.tsx, Onboarding2.tsx, Onboarding3.tsx |

## What Was Built

**Task 1 — Auth flow:**
- `App.tsx`: global `<Toaster position="top-right" richColors />` wired inside RouterProvider fragment
- `Sidebar.tsx`: `handleLogout` calls `POST /api/auth/logout`, ignores errors, calls `clearToken()`, navigates `/login`; `isLoggingOut` state disables button with "Saindo..." text
- `Login.tsx`: `handleSocialLogin(provider)` with double-click guard via `socialLoading` string state; "Esqueceu a senha?" replaced with toast button
- `Welcome.tsx`: same `handleSocialLogin` pattern, both social buttons disabled during loading

**Task 2 — Navigation & fixes:**
- `Dashboard.tsx`: `useNavigate` wired to "Ver todas" → `/transactions`; `QuickActionButtons` wired with navigate/toast; "Ver recomendação" toast; `QuickActionButton` accepts `onClick` prop
- `Categories.tsx`: `handleDelete` replaced — removed raw `fetch(localhost:8001)`, now uses `apiFetch('/api/categories/:id', {method:'DELETE'})` with `isDeleting[id]` per-item state; `toast.error` on failure; removed `getToken` import
- `Goals.tsx`: `const [goals, setGoals]` setter; "Ignorar" removes card from local state; "Aceitar Sugestão"/"Nova Meta"/"Criar objetivo" all toast "em breve"; removed fake `setTimeout`/`aiInsightsLoading`

**Task 3 — Settings & Onboarding:**
- `Settings.tsx`: `activeSection` state drives nav lateral `active` prop; `originalProfile` snapshot allows "Cancelar" to restore; `avatarInputRef` hidden file input for upload; dark mode toggle reflects/toggles `darkMode` state with `document.documentElement.classList.toggle`
- `Onboarding1.tsx`: `handleNext` persists `{selectedGoal, frequency, aiEnabled}` to `localStorage.onboarding_step1`; `isSubmitting` guard prevents double-submit
- `Onboarding2.tsx`: `handleNext` persists `onboarding_step=2`; BankCard `onClick` toasts; "Adicionar nova conexão" toasts
- `Onboarding3.tsx`: `alertEssentials`/`alertLeisure` toggle states with visual reflect; "Aceitar Meta" toasts; `handleFinish` merges step1 + budgets + alerts into `onboarding_complete` key

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed api.ts BASE_URL port 8001 → 8000**
- **Found during:** Task 1 setup
- **Issue:** `api.ts` had `BASE_URL = 'http://localhost:8001'` but the constraint specifies port 8000
- **Fix:** Changed to `http://localhost:8000`
- **Files modified:** `src/lib/api.ts`
- **Commit:** 4062f2f

**2. [Rule 3 - Blocking] Copied untracked frontend files to worktree**
- **Found during:** Task 1 setup
- **Issue:** Files referenced in plan (App.tsx, Sidebar.tsx, Welcome.tsx, Onboarding1-3.tsx, routes.tsx, UI components) existed in main project as untracked files but not in worktree
- **Fix:** Copied all untracked frontend files to worktree; symlinked node_modules
- **Files modified:** 68 files added in commit 4062f2f

## Known Stubs

None — all handlers fire real API calls (logout, delete) or toast "em breve" for features not yet implemented in backend.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes introduced.

## Self-Check: PASSED

- Sidebar.tsx: FOUND
- App.tsx: FOUND
- Onboarding3.tsx: FOUND
- Commit 4062f2f: FOUND
- Commit 83afc08: FOUND
- Commit 231d882: FOUND
