---
phase: quick-260411-ha4-o-produto-desviou-do-n-cleo-v1-simplific
plan: "01"
subsystem: dashboard
tags: [fastapi, react, dashboard, tdd]
requires:
  - phase: 06-dashboard-ui-ux-pro-max-fluxo-liquido-top-categorias-orcamento-por-categoria-alertas-acionaveis-e-cortes-recomendados
    provides: contrato expandido antigo do dashboard
provides:
  - contrato /api/dashboard enxuto com 5 blocos do core v1
  - dashboard react orientado a acao (upload + classificacao + leitura objetiva)
  - regressao de contrato coberta por testes TDD
affects: [phase-06-dashboard, quick-tasks-dashboard]
tech-stack:
  added: []
  patterns: [tdd-red-green, contrato-unico-core-v1]
key-files:
  created: []
  modified:
    - backend/modules/dashboard/services.py
    - tests/test_dashboard.py
    - src/features/dashboard/pages/Dashboard.tsx
key-decisions:
  - "Contrato do dashboard reduzido para apenas upload, classification, categories, comparison e saving_tips."
  - "A UI passou a disparar classificacao IA diretamente via POST /api/transactions/classify e recarregar o dashboard apos sucesso."
patterns-established:
  - "Payload de dashboard deve expor somente blocos usados pela tela para evitar drift de escopo."
  - "Comparacao e dicas reutilizam ranking de categorias para manter leitura consistente e direta."
requirements-completed: [PDF-01, AICL-01, DASH-01, DASH-03, COACH-01]
duration: 4min
completed: 2026-04-11
---

# Phase quick 260411-ha4 Plan 01: o-produto-desviou-do-n-cleo-v1-simplific Summary

**Dashboard v1 recenterizado com contrato mínimo de 5 blocos e fluxo de ação direto para upload, classificação e economia priorizada.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-11T15:33:29Z
- **Completed:** 2026-04-11T15:37:33Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Contrato `/api/dashboard` simplificado para o núcleo v1, removendo campos legados fora do escopo.
- Testes TDD atualizados para proteger shape e comportamento de categorias, comparação e dicas.
- `Dashboard.tsx` refatorado para 5 blocos centrais com CTA funcional de upload e classificação IA.

## Task Commits

1. **Task 1 (RED): Simplificar contrato do `/api/dashboard` para o core v1** - `1a8a0ce` (test)
2. **Task 1 (GREEN): Simplificar contrato do `/api/dashboard` para o core v1** - `02e0c87` (feat)
3. **Task 2: Refatorar `Dashboard.tsx` para fluxo v1 focado em ação** - `7c38a8d` (feat)

## Files Created/Modified

- `backend/modules/dashboard/services.py` - contrato novo do dashboard com os 5 blocos do core v1.
- `tests/test_dashboard.py` - suíte TDD para shape e regras centrais do payload.
- `src/features/dashboard/pages/Dashboard.tsx` - tela v1 com ações rápidas, categorias, comparação, dicas e empty state.

## Decisions Made

- Remover totalmente do payload/UI os blocos legados (`flow`, `budget_progress`, `alerts`, `narrative_summary`, `disclaimer`) para evitar drift de produto.
- Manter comparação de tendência por categoria no mesmo recorte de ranking de gastos para leitura imediata de “subiu/desceu”.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Dashboard está alinhado ao núcleo v1 e pronto para verificação funcional manual de UX (upload modal + classificação + refresh).
- Regressão de contrato está coberta por testes para bloquear retorno do payload expandido.

## Self-Check: PASSED

- Found summary file: `.planning/quick/260411-ha4-o-produto-desviou-do-n-cleo-v1-simplific/260411-ha4-SUMMARY.md`
- Found commits: `1a8a0ce`, `02e0c87`, `7c38a8d`
