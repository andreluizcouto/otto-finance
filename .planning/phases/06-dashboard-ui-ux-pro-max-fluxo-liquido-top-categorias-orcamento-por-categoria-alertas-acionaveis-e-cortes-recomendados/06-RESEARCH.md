# Phase 6: Dashboard UI/UX pro max - Research

**Researched:** 2026-04-11
**Domain:** Dashboard de decisao financeira orientado a fluxo (React + FastAPI + Supabase)
**Confidence:** HIGH

## Summary

O dashboard atual exibe bons dados de tendencia, mas mistura semantica de fluxo com linguagem de saldo, o que gera confusao de leitura para usuarios nao tecnicos. O contrato backend atual (`/api/dashboard`) nao expoe diretamente os indicadores necessarios para tomada de decisao (fluxo liquido, excessos por categoria, severidade de alertas e plano de corte).

A melhor estrategia e manter o endpoint unico `/api/dashboard`, expandindo o payload com blocos analiticos orientados a acao:
- `flow` (entradas, saidas, liquido, status positivo/negativo)
- `category_insights` (top gastos com participacao e delta vs periodo anterior)
- `budget_progress` (gasto atual vs `monthly_limit`)
- `alerts` (insights acionaveis ordenados por severidade)
- `cuts` (3 recomendacoes com economia estimada)
- `narrative_summary` (resumo curto em PT-BR)

Isso permite um frontend mais claro sem criar chamadas extras nem duplicar regra de negocio no cliente.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

- Mostrar de forma explicita se o usuario esta melhorando ou piorando.
- Transformar dados em orientacao pratica ("onde exagerou" e "o que cortar primeiro").
- Manter separacao conceitual entre fluxo e saldo.
- Mostrar barras de orcamento por categoria com destaque para excesso.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DASH-01 | Breakdown por categoria | `category_insights` com `% do total` + ranking |
| DASH-02 | Analise por periodo | Mantem filtro atual + novos KPIs por periodo |
| DASH-03 | Tendencia temporal | Reaproveitar `trend` atual com semantica de fluxo |
| DASH-04 | Comparativo periodo anterior | Delta em `flow` e por categoria |
| BUDG-02 | Progresso vs limite | `budget_progress` por categoria usando `budgets.monthly_limit` |
| COACH-01 (parcial in-app) | Insight em linguagem natural | `narrative_summary` + `alerts` acionaveis |

</phase_requirements>

## Standard Stack

### Backend
- FastAPI router/service pattern ja adotado em `backend/modules/dashboard`.
- Pandas ja usado no service para agregacoes.
- Supabase query API ja utilizada para `transactions` e `categories`.

### Frontend
- React + Recharts ja presente no dashboard.
- Componentes base (`Card`, `Button`) e tokens de design (`theme.css`) ja existentes.

### No New Dependencies
- Nao ha necessidade de novas libs para entregar a fase; usar stack atual.

## Architecture Patterns

### Pattern 1: Backend como fonte da verdade analitica
- Evitar calculos criticos no frontend.
- Enviar do backend valores ja calculados e rotulados.
- Beneficio: consistencia de regras e testes unicos no Python.

### Pattern 2: Cards com semantica forte
- Card principal: `Fluxo liquido`.
- Cards secundarios: `Entradas no periodo`, `Saidas no periodo`, `Top categoria`, `Risco de excesso`.
- Cada card inclui microcopy de contexto para reduzir ambiguidade.

### Pattern 3: Alertas acionaveis com severidade
- `high`: categoria estourada (>100% do limite ou crescimento extremo).
- `medium`: crescimento relevante vs base historica.
- `low`: observacao informativa.

### Pattern 4: Recomendacao de corte explicita
- Formula simples e auditavel:
  - Se ha limite: economia = max(0, gasto_atual - limite).
  - Sem limite: usar baseline de media 3 meses e sugerir reducao percentual conservadora (ex.: 15% a 25% em categorias de impulso).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Formato monetario no frontend para logica de negocio | Calcular/formatar regra de negocio em TS | Retornar labels BRL do backend | Evita drift entre Python e TS |
| Multiplas chamadas para cada bloco do dashboard | Varios endpoints fragmentados | Payload unico em `/api/dashboard` | Melhor performance e coerencia |
| Alertas hardcoded no frontend | Strings fixas no TS | Alertas calculados no backend | Permite testes deterministas |

## Common Pitfalls

1. **Misturar saldo com fluxo**
   - Mitigacao: labels e microcopy explicitos; nunca chamar fluxo de "saldo disponivel".

2. **Comparar categorias sem janela equivalente**
   - Mitigacao: sempre comparar periodo atual com janela imediatamente anterior de mesma duracao.

3. **Barra de orcamento sem limite configurado**
   - Mitigacao: estado vazio explicito + CTA.

4. **Insights opacos ("IA disse")**
   - Mitigacao: recomendacoes com valores concretos e rastreaveis.

## Schema Analysis

### Evidencia relevante
- `supabase/schema.sql` define `budgets.monthly_limit`, `budgets.user_id`, `budgets.category_id`.
- `transactions` ja possui `amount`, `date`, `category_id`.

### Implicacao
- E possivel calcular progresso de orcamento sem migracao de schema.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest + vitest/tsc checks existentes no projeto |
| Config file | `pyproject.toml` e `package.json` scripts |
| Quick run command | `py -3 -m pytest tests/test_dashboard.py -q` |
| Full suite command | `py -3 -m pytest tests -q` + `npm run build` |

### Requirement Coverage Strategy
- Backend: testes unitarios para calculos de fluxo, alertas, cortes e budget progress.
- Frontend: testes de renderizacao/estado (quando aplicavel) e compilacao sem erro.
- Contrato: payload do dashboard validado por snapshots/asserts de campos obrigatorios.

## Environment Availability

| Dependency | Required | Available | Notes |
|------------|----------|-----------|-------|
| Python + pytest | Yes | Yes | Ja usado no projeto |
| Node + Vite build | Yes | Yes | Ja ativo no workspace |
| Supabase tables budgets/transactions | Yes | Yes (schema) | Limites podem nao existir para todos usuarios |

## Open Questions

1. Quais categorias devem ter recomendacao de corte por padrao quando nao existe budget?
2. Devemos priorizar gasto absoluto ou excesso percentual no ranking de risco?

**Direcao para planejamento:** iniciar com regra deterministica simples e explicita; evoluir heuristica em fases futuras.

## Sources

- `src/features/dashboard/pages/Dashboard.tsx`
- `backend/modules/dashboard/services.py`
- `backend/modules/dashboard/router.py`
- `supabase/schema.sql`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/phases/06-.../06-CONTEXT.md`

---

## Metadata

**Confidence breakdown:**
- Contrato e capacidade tecnica: HIGH
- Heuristica de alertas/recomendacoes: MEDIUM (ajustavel com dados reais)

**Research date:** 2026-04-11
