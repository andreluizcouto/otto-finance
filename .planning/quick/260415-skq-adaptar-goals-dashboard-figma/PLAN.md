---
id: 260415-skq
slug: adaptar-goals-dashboard-figma
title: Adaptar Goals.tsx e Dashboard.tsx do Figma para OTTO
date: 2026-04-15
status: in-progress
---

# Adaptar Goals.tsx e Dashboard.tsx do Figma para OTTO

## Objetivo
Substituir os arquivos de UI do OTTO GitHub com as versões redesenhadas do projeto Figma "OTTO finance", adaptando imports e chamadas de API.

## Tarefas

### 1. Goals.tsx
- Substituir `src/features/goals/pages/Goals.tsx` pelo novo Goals.tsx completo do Figma
- Ajustar import `../lib/api` → `@/shared/lib/api`
- O arquivo tem: CircularProgress, GoalCard, NewGoalModal, SummaryBar, página Goals completa
- Tipos: `savings` (Juntar grana) e `spending` (Controlar gasto/Limites)

### 2. Dashboard.tsx
- Substituir `src/features/dashboard/pages/Dashboard.tsx` pelo Dashboard.tsx do Figma
- Adaptar chamadas de API:
  - `/monthly-summary` → derivar de `/api/dashboard?period=Este mes` (extrair income/expenses/balance das categories)
  - `/spending-by-category` → usar categories do `/api/dashboard` response
  - `/transactions?limit=10` → usar `/api/transactions?limit=10`
- Ajustar imports de `../lib/api` → `@/shared/lib/api`
- Manter os botões de importar PDF e classificar IA (ações rápidas) do dashboard atual

## Arquivos fonte (Figma)
- `~/Documents/OTTO finance/src/app/pages/Goals.tsx`
- `~/Documents/OTTO finance/src/app/pages/Dashboard.tsx`
- `~/Documents/OTTO finance/src/app/lib/api.ts`

## Arquivos destino (OTTO)
- `~/Documents/GitHub/OTTO/src/features/goals/pages/Goals.tsx`
- `~/Documents/GitHub/OTTO/src/features/dashboard/pages/Dashboard.tsx`
