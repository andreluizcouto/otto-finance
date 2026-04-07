---
phase: 3
slug: ai-classification
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-07
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 9.0.2 |
| **Config file** | `pyproject.toml` (`[tool.pytest.ini_options]`) |
| **Quick run command** | `python -m pytest tests/ -x -q` |
| **Full suite command** | `python -m pytest tests/ -v` |
| **Estimated runtime** | ~10 seconds (14 existing + ~8 new tests) |

---

## Sampling Rate

- **After every task commit:** Run `python -m pytest tests/ -x -q`
- **After every plan wave:** Run `python -m pytest tests/ -v`
- **Before `/gsd-verify-work`:** Full suite must be green + manual Make.com E2E smoke test
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-xx-01 | TBD | 0 | AICL-01 | — | payload builder uses only allowed fields | unit | `python -m pytest tests/test_classifier.py::test_build_payload -x` | ❌ W0 | ⬜ pending |
| 03-xx-02 | TBD | 0 | AICL-02 | — | known merchant names resolved before LLM call | unit | `python -m pytest tests/test_classifier.py::test_merchant_lookup_table -x` | ❌ W0 | ⬜ pending |
| 03-xx-03 | TBD | 0 | AICL-03 | — | confidence tiers computed correctly | unit | `python -m pytest tests/test_classifier.py::test_confidence_mapping -x` | ❌ W0 | ⬜ pending |
| 03-xx-04 | TBD | 0 | AICL-04 | — | unclassified query uses correct filter | unit | `python -m pytest tests/test_classifier.py::test_unclassified_query -x` | ❌ W0 | ⬜ pending |
| 03-xx-05 | TBD | 0 | AICL-05 | T-3-02 | duplicate category name rejected | unit | `python -m pytest tests/test_categories.py::test_add_duplicate -x` | ❌ W0 | ⬜ pending |
| 03-xx-06 | TBD | 0 | AICL-05 | — | add_category creates correct fields | unit | `python -m pytest tests/test_categories.py::test_add_category -x` | ❌ W0 | ⬜ pending |
| 03-xx-07 | TBD | 0 | AICL-06 | T-3-01 | JSON schema has strict:true and correct enum | unit | `python -m pytest tests/test_classifier.py::test_json_schema_structure -x` | ❌ W0 | ⬜ pending |
| 03-xx-08 | TBD | — | INTG-01 | — | Make.com end-to-end pipeline processes transaction | manual | Run Make.com scenario with test payload, verify Supabase update | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/test_classifier.py` — stubs for AICL-01, AICL-02, AICL-03, AICL-04, AICL-06
- [ ] `tests/test_categories.py` — stubs for AICL-05
- [ ] `tests/conftest.py` — add mock supabase-py client fixture if not already present

*Note: OpenAI is never called from Python — the call lives in Make.com. Unit tests cover only Python helpers (payload builder, confidence mapper, category CRUD). Use `unittest.mock.patch` for supabase-py calls.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Make.com scenario processes transaction via OpenAI and writes result to Supabase | INTG-01 | Make.com automation cannot be unit-tested from Python | Trigger Make.com webhook with test payload; verify `category_id` and `confidence_score` updated in Supabase |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
