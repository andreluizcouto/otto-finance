---
phase: 6
slug: dashboard-ui-ux-pro-max-fluxo-liquido-top-categorias-orcamento-por-categoria-alertas-acionaveis-e-cortes-recomendados
status: draft
shadcn_initialized: false
preset: none
created: 2026-04-11
---

# Phase 6 — UI Design Contract

> Visual and interaction contract for the dashboard redesign focused on financial decisions.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | Existing React + Tailwind + custom UI components |
| Preset | not applicable |
| Component library | local `src/shared/components/ui` |
| Icon library | lucide-react |
| Font | Inter + Cormorant Garamond (existing theme) |

---

## Spacing Scale

Declared values (multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | micro gaps in badges/labels |
| sm | 8px | compact text spacing |
| md | 16px | default card internal spacing |
| lg | 24px | section blocks |
| xl | 32px | content groups |
| 2xl | 48px | major section separation |
| 3xl | 64px | page vertical rhythm |

Exceptions: none

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 14-16px | 400-500 | 1.5 |
| Label | 10-12px | 500-600 | 1.4 |
| Heading | 24-32px | 500 | 1.2 |
| Display | 40-52px | 300-400 | 1.05 |

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | #0A0A0A | page background |
| Secondary (30%) | #1C1C1E | cards/panels |
| Accent (10%) | #F0F0F0 | primary emphasis text/elements |
| Destructive | #ef4444 | risk/exceeded states only |

Accent reserved for: headline KPIs, active period toggle, key action emphasis.

Risk semantic colors (additive, not replacing base palette):
- `risk-high`: #ef4444
- `risk-medium`: #f59e0b
- `risk-low`: #22c55e

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary decision block title | `Estou melhorando ou piorando?` |
| Secondary decision block title | `Onde estou exagerando?` |
| Tertiary decision block title | `O que cortar primeiro?` |
| Main KPI title | `Fluxo líquido no período` |
| Supporting KPI labels | `Entradas no período`, `Saídas no período` |
| Budget section title | `Orçamento por categoria` |
| Alerts section title | `Alertas acionáveis` |
| Cut section title | `Cortes recomendados (Top 3)` |
| Footer title | `Resumo do período` |
| Disclaimer | `Nao inclui saldo anterior da conta.` |

---

## Interaction Contract

1. `Fluxo líquido` must always show status pill (`Positivo`, `Negativo` or `Neutro`).
2. Category rows must show:
   - category name/emoji
   - BRL value
   - `% do total`
   - directional delta (`↑`, `↓`, `→`) vs período anterior.
3. Budget rows must show progress bar + status badge:
   - `No limite`, `Atenção`, `Estourado`, `Sem limite`.
4. Alerts must be sorted by severity: `high` -> `medium` -> `low`.
5. Cut recommendations must always contain BRL economy amount and rationale text.

---

## Responsive Contract

- Mobile (`<768px`): single-column stack for all cards/sections.
- Tablet/Desktop (`>=768px`): two-column layout where main decision blocks stay on left and support panels on right.
- No horizontal overflow for labels, alert messages or summary text.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| local ui components | Card, Button, Input patterns | pass |
| third-party | none | not required |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
