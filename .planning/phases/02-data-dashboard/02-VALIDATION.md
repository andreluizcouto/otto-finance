---
phase: 2
slug: data-dashboard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-06
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 9.0.2 |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `pytest tests/ -x -q` |
| **Full suite command** | `pytest tests/ -v` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pytest tests/ -x -q`
- **After every plan wave:** Run `pytest tests/ -v`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | DATA-02 | T-02-01 | Generator validates schema before insert | unit | `pytest tests/test_generator.py -x` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | DATA-02 | T-02-02 | Batch insert uses authenticated client | integration (manual) | Manual — requires live Supabase | N/A | ⬜ pending |
| 02-02-01 | 02 | 1 | DASH-01 | — | N/A | unit | `pytest tests/test_charts.py::test_donut_chart -x` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | DASH-02 | — | N/A | unit | `pytest tests/test_dashboard.py::test_date_filters -x` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 1 | DASH-03 | — | N/A | unit | `pytest tests/test_charts.py::test_trend_chart -x` | ❌ W0 | ⬜ pending |
| 02-02-04 | 02 | 1 | DASH-04 | — | N/A | unit | `pytest tests/test_charts.py::test_comparison_chart -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/__init__.py` — package init
- [ ] `tests/test_generator.py` — covers DATA-02 (generator output validation)
- [ ] `tests/test_charts.py` — covers DASH-01, DASH-03, DASH-04 (chart creation returns valid Figure)
- [ ] `tests/test_dashboard.py` — covers DASH-02 (date filter range calculation)
- [ ] `pyproject.toml [tool.pytest.ini_options]` — test configuration

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Batch insert writes to Supabase | DATA-02 | Requires live Supabase connection with auth | 1. Generate data via Settings button 2. Check Supabase dashboard for rows |
| Dashboard renders correctly in browser | DASH-01-04 | Visual rendering requires Streamlit server | 1. Run `streamlit run app.py` 2. Navigate to Dashboard 3. Verify charts display |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
