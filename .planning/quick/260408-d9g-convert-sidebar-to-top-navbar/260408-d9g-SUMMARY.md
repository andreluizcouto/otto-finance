---
phase: quick-260408-d9g
plan: "01"
subsystem: layout
tags: [navbar, layout, navigation, ui]
dependency_graph:
  requires: []
  provides: [top-navbar, updated-main-layout]
  affects: [all-authenticated-pages]
tech_stack:
  added: []
  patterns: [glassmorphic-navbar, fixed-top-bar, avatar-dropdown, active-navlink-indicator]
key_files:
  created:
    - src/shared/components/layout/Navbar.tsx
  modified:
    - src/shared/components/layout/index.tsx
decisions:
  - Navbar fixed positioning with pt-[60px] on main (not padding on outer flex-col) to allow proper scroll behavior
  - Avatar dropdown closed via mousedown outside-click to avoid capturing inner clicks
  - Active indicator as absolute child span (bottom-0) inside relative NavLink h-full container
metrics:
  duration: "~2 minutes"
  completed: "2026-04-08"
  tasks_completed: 2
  files_changed: 2
---

# Phase quick-260408-d9g Plan 01: Convert Sidebar to Top Navbar Summary

**One-liner:** Fixed top glassmorphic navbar (logo left, text-only nav center, bell+avatar dropdown right) replacing the left sidebar — MainLayout updated to flex-col with pt-[60px].

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create Navbar.tsx | 311c337 | src/shared/components/layout/Navbar.tsx (new) |
| 2 | Update MainLayout in index.tsx | c8b98e1 | src/shared/components/layout/index.tsx |

## What Was Built

### Navbar.tsx (new)
- `<nav>` fixed top-0 left-0 right-0 z-50, h-[60px], `bg-[rgba(10,15,28,0.92)]` + `backdrop-blur-md` + bottom border
- **Left:** FinCoach.AI logo (purple gradient square + text with glow shadow)
- **Center:** 4 text-only NavLinks (Dashboard, Transações, Categorias, Metas) with active state: white text + `h-[2px] bg-[#aa68ff]` absolute span at bottom of link
- **Right:** `Bell` icon + avatar circle ("A") + `ChevronDown` toggling a dropdown
- Dropdown: `Configurações` (NavLink to /settings) + `Sair` button (calls apiFetch logout, clearToken, navigate)
- Outside-click closes dropdown via `mousedown` event listener with ref + cleanup

### index.tsx (updated)
- `Sidebar` import replaced with `Navbar`
- Outer div: `flex flex-col h-screen` (was `flex h-screen`)
- `<main>`: removed `ml-64`, added `pt-[60px]`
- `AuthLayout` unchanged

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all nav items route to real pages.

## Verification

- `npm run build` (vite): 2249 modules transformed, 0 errors
- No reference to `Sidebar` remains in index.tsx
- `pt-[60px]` on main ensures content starts below the fixed 60px navbar

## Self-Check

- [x] src/shared/components/layout/Navbar.tsx exists
- [x] src/shared/components/layout/index.tsx imports Navbar, not Sidebar
- [x] Commit 311c337 exists
- [x] Commit c8b98e1 exists

## Self-Check: PASSED
