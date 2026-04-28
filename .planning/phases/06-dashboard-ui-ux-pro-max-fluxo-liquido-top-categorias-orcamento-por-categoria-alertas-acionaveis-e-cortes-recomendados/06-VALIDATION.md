---
phase: 6
slug: dashboard-ui-ux-pro-max-fluxo-liquido-top-categorias-orcamento-por-categoria-alertas-acionaveis-e-cortes-recomendados
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-11
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest + TypeScript build checks |
| **Config file** | `pyproject.toml` + `package.json` scripts |
| **Quick run command** | `py -3 -m pytest tests/test_dashboard.py -q` |
| **Full suite command** | `py -3 -m pytest tests -q` + `npm run build` |
| **Estimated runtime** | ~20-60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `py -3 -m pytest tests/test_dashboard.py -q`
- **After every plan wave:** Run `py -3 -m pytest tests -q`
- **Before `$gsd-verify-work`:** Full suite + `npm run build` must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | DASH-02 | unit | `py -3 -m pytest tests/test_dashboard.py -q` | ✅ | ⬜ pending |
| 06-01-02 | 01 | 1 | BUDG-02 | unit | `py -3 -m pytest tests/test_dashboard.py -q` | ✅ | ⬜ pending |
| 06-02-01 | 02 | 2 | DASH-01 | build | `npm run build` | ✅ | ⬜ pending |
| 06-02-02 | 02 | 2 | DASH-04 | integration | `py -3 -m pytest tests/test_dashboard.py -q` + `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/test_dashboard.py` — adicionar asserts para `flow`, `budget_progress`, `alerts`, `cuts`
- [ ] Garantir fixture/minimal stubs para cenarios de categoria sem budget

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Clareza de leitura ("estou no positivo ou negativo?") | UX semantic | Julgamento humano de UX e copy | Abrir dashboard e validar entendimento em <10s sem explicacao externa |
| Utilidade das recomendacoes de corte | D-06/D-10 | Qualidade contextual depende de dados reais | Validar se cada recomendacao tem valor em BRL e racional legivel |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
