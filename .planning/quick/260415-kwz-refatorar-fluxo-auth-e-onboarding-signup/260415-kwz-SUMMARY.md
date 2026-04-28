---
phase: quick-260415-kwz
status: complete
commit: c9d3085
date: 2026-04-15
---

# Quick Task 260415-kwz — Refatorar fluxo auth + onboarding

## Goal
Fluxo limpo: Signup → Login → (auth protegido) Onboarding 1/2/3 → Dashboard.

## What was done

**Task 1 — Rotas e layouts**
- Criado `ProtectedAuthLayout` em `layout/index.tsx`: verifica auth, redireciona para `/login` se não autenticado, sem Navbar
- `routes.tsx`: onboarding movido para `ProtectedAuthLayout`, `/signup` adicionado ao `AuthLayout`
- `Welcome.tsx`: "Secure Access" → `/signup` (era `/onboarding/1`)
- `Login.tsx`: "Request Access" → `/signup` (era `/onboarding/1`)
- `Signup.tsx` criado: chama `POST /api/auth/signup`, on success redireciona para `/onboarding/1`

**Task 2 — Onboarding estático**
- `Onboarding1.tsx`: removido `localStorage.setItem('onboarding_step1', ...)` e estado `isSubmitting`
- `Onboarding2.tsx`: removido `localStorage.setItem('onboarding_step', '2')`
- `Onboarding3.tsx`: removido `localStorage.getItem('onboarding_step1')` e `localStorage.setItem('onboarding_complete', ...)`
- Navegação 1→2→3→/dashboard intacta; telas são puramente visuais

**Task 3 — Navbar com usuário real**
- `Navbar.tsx`: busca `GET /api/auth/me` no mount
- Avatar, nome e email mostram dados reais do usuário autenticado
- Fallback `..` enquanto carrega; erros silenciosos

## Verification
- ✅ `localStorage` em onboarding: zero matches
- ✅ Welcome/Login não apontam para `/onboarding/1`
- ✅ `ProtectedAuthLayout` em `routes.tsx`
- ✅ Navbar sem "John Doe" / "john@otto.private" hardcoded
- ✅ Welcome e Login apontam para `/signup`
