---
phase: 03-ai-classification
plan: "01"
subsystem: ai-classification
tags: [classifier, make-com, webhook, httpx, unit-tests, wave-1]
dependency_graph:
  requires:
    - 03-00 (test stubs, conftest.py, manually_reviewed schema column)
  provides:
    - src/data/classifier.py (6 exported helper functions)
    - src/config.py::get_make_webhook_url (Make.com webhook URL accessor)
  affects:
    - Wave 2 (src/pages/transactions.py imports trigger_classification, get_unclassified_transactions)
    - Wave 3 (src/data/categories.py — independent)
tech_stack:
  added: []
  patterns:
    - httpx.post with timeout=60.0 for Make.com webhook call (RESEARCH.md pitfall 3 mitigation)
    - st.secrets → os.getenv fallback pattern (matches existing config.py functions)
    - Exact-then-prefix merchant lookup (no DB table, no microservice)
    - Idempotent unclassified query: .or_("category_id.is.null,confidence_score.is.null").eq("manually_reviewed", False)
    - No OpenAI import in Python — classification lives entirely in Make.com
key_files:
  created:
    - src/data/classifier.py
  modified:
    - src/config.py (added get_make_webhook_url)
    - tests/test_classifier.py (removed 5 @pytest.mark.skip decorators)
decisions:
  - "No OpenAI import in classifier.py — all AI calls route through Make.com webhook per CLAUDE.md architecture"
  - "Merchant lookup uses exact-match dict first, then prefix list — no DB table needed at MVP scale"
  - "trigger_classification returns structured dict {success, classified_count/error} for uniform UI handling in Wave 2"
  - "timeout=60.0 on httpx.post — mitigates T-01-03 (DoS via timeout) per threat model"
  - "build_classification_payload field whitelist strips PII — mitigates T-01-01 per threat model"
metrics:
  duration: "~5 minutes"
  completed_date: "2026-04-07"
  tasks_completed: 1
  files_changed: 3
---

# Phase 3 Plan 01: Wave 1 AI Classification Helpers Summary

**One-liner:** Python classification pipeline helpers (6 functions) + Make.com webhook accessor, with all 5 Wave 0 test stubs activated and green.

## What Was Built

### Task 1 — Classification Pipeline Helpers (9293a97)

Three files modified/created to implement the Python layer of the AI classification pipeline.

**src/data/classifier.py** — New file with 6 exported functions:

- `resolve_merchant_name(merchant)` — Maps cryptic Brazilian merchant codes (RCHLO, MELI, SPT*, NF*, etc.) to readable names using exact-match dict + prefix list. Returns original string unchanged for unknown merchants (passthrough).
- `map_confidence_score(confidence)` — Buckets float 0.0–1.0 into `high` (≥0.8), `medium` (≥0.5), `low` (<0.5) per D-10 thresholds.
- `build_classification_payload(user_id, transactions, categories)` — Constructs Make.com webhook payload. Strips transactions to only `{id, description, merchant_name, amount}` — no PII, no extra fields. Mitigates T-01-01.
- `get_unclassified_transactions(client, user_id)` — Queries Supabase with `.or_("category_id.is.null,confidence_score.is.null").eq("manually_reviewed", False)`. Idempotent per D-02 — never overwrites user corrections.
- `get_openai_json_schema()` — Returns the OpenAI Structured Outputs JSON schema for Make.com Module 4. Strict mode, 10-slug enum. Documentation/test function — not called at runtime.
- `trigger_classification(client, user_id)` — Orchestrates the full pipeline: fetch unclassified → fetch categories → build payload → POST to Make.com webhook (timeout=60.0) → return `{success, classified_count}` or `{success: False, error}`.

**src/config.py** — Added `get_make_webhook_url()` following the exact same `st.secrets → os.getenv → raise ValueError` pattern as the existing `get_supabase_url()` and `get_supabase_anon_key()` functions.

**tests/test_classifier.py** — Removed all 5 `@pytest.mark.skip` decorators. Tests now active and green.

## Verification Results

```
python -m pytest tests/test_classifier.py -v
5 passed in 1.18s

python -m pytest tests/
19 passed, 2 skipped in 1.56s
```

- 5 classifier tests: all PASSED
- 2 skipped: test_categories.py stubs (Wave 3, expected)
- 14 pre-existing tests: all PASSED

Grep checks:
- `grep "RCHLO" src/data/classifier.py` — match (lookup table present)
- `grep "manually_reviewed" src/data/classifier.py` — match (idempotency guard)
- `grep "timeout=60.0" src/data/classifier.py` — match (DoS mitigation)
- `grep "def get_make_webhook_url" src/config.py` — match
- No OpenAI import in classifier.py — confirmed via AST scan

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None in this plan. The 2 skipped tests in test_categories.py are Wave 0 stubs (from 03-00), not introduced here.

## Threat Flags

No new threat surface beyond what is documented in the plan's threat model. The mitigations for T-01-01 (payload field whitelist in `build_classification_payload`) and T-01-03 (timeout=60.0 + TimeoutException handler in `trigger_classification`) are implemented as specified.

## Self-Check: PASSED

- [x] src/data/classifier.py exists
- [x] src/data/classifier.py exports: build_classification_payload, resolve_merchant_name, map_confidence_score, get_unclassified_transactions, get_openai_json_schema, trigger_classification
- [x] src/config.py contains def get_make_webhook_url
- [x] tests/test_classifier.py has 0 @pytest.mark.skip decorators remaining
- [x] python -m pytest tests/test_classifier.py -v → 5 PASSED
- [x] python -m pytest tests/ → 19 passed, 2 skipped
- [x] grep "RCHLO" src/data/classifier.py → match
- [x] grep "manually_reviewed" src/data/classifier.py → match
- [x] grep "timeout=60.0" src/data/classifier.py → match
- [x] No OpenAI import in classifier.py
- [x] Commit 9293a97 exists
