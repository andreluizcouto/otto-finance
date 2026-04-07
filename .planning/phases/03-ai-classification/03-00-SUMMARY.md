---
phase: 03-ai-classification
plan: "00"
subsystem: testing
tags: [test-infrastructure, schema, wave-0, ai-classification]
dependency_graph:
  requires: []
  provides:
    - tests/conftest.py (mock_supabase fixture)
    - tests/test_classifier.py (5 skip-marked stubs)
    - tests/test_categories.py (2 skip-marked stubs)
    - supabase/schema.sql (manually_reviewed column documented)
  affects:
    - Wave 1 (test_classifier.py stubs activate after src/data/classifier.py)
    - Wave 3 (test_categories.py stubs activate after src/data/categories.py)
tech_stack:
  added: []
  patterns:
    - pytest.mark.skip for pre-implementation stub gating
    - MagicMock for Supabase client simulation in unit tests
    - conftest.py fixture shared across test modules
key_files:
  created:
    - tests/conftest.py
    - tests/test_classifier.py
    - tests/test_categories.py
  modified:
    - supabase/schema.sql
decisions:
  - "Test stubs use @pytest.mark.skip (not xfail) so failures are silent until Wave 1/3 activate them"
  - "mock_supabase fixture in conftest.py covers full CRUD chain for Supabase query builder"
  - "manually_reviewed column documented in schema.sql as ALTER TABLE comment (manual Supabase step already applied)"
metrics:
  duration: "~4 minutes"
  completed_date: "2026-04-07"
  tasks_completed: 2
  files_changed: 4
---

# Phase 3 Plan 00: Wave 0 Test Infrastructure Summary

**One-liner:** pytest stub suite with 7 skip-marked tests and mock_supabase fixture, plus manually_reviewed column documented in schema.sql.

## What Was Built

Wave 0 establishes the test infrastructure that subsequent waves (1-3) will activate as they implement `src/data/classifier.py` and `src/data/categories.py`.

### Task 0 — Schema Documentation (f733a3a)

Updated `supabase/schema.sql` to document the `manually_reviewed BOOLEAN DEFAULT false` column on the `transactions` table. The column was already applied in Supabase via `ALTER TABLE` (confirmed by user before this plan executed). The schema.sql change is documentation-only — it keeps the file as source of truth for DB state.

### Task 1 — Test Stubs (f903a5a)

Created three test infrastructure files:

**tests/conftest.py** — Shared `mock_supabase` fixture using `MagicMock`. Stubs the full supabase-py query builder chain (select/eq/insert/update/delete/execute) returning empty data by default. Wave 1 and Wave 3 tests use this fixture to avoid real DB calls.

**tests/test_classifier.py** — 5 stub tests (all `@pytest.mark.skip`):
- `test_build_payload` — AICL-01: payload field filtering
- `test_merchant_lookup_table` — AICL-02: Brazilian merchant code resolution
- `test_confidence_mapping` — AICL-03 + D-10: float to enum tier mapping
- `test_unclassified_query` — AICL-04 + D-02: PostgREST `.or_()` filter verification
- `test_json_schema_structure` — AICL-06 + D-08: OpenAI JSON schema with 10 category slugs

**tests/test_categories.py** — 2 stub tests (all `@pytest.mark.skip`):
- `test_add_duplicate` — AICL-05: duplicate name rejection without DB insert
- `test_add_category` — AICL-05: slug generation and correct field insertion

## Verification Results

```
python -m pytest tests/ -- 14 passed, 7 skipped in 1.56s
```

- 7 new stubs: all SKIPPED (zero FAILED, zero ERROR)
- 14 existing tests (test_charts, test_dashboard, test_generator): all PASSED
- `grep -n "manually_reviewed" supabase/schema.sql` returns 2 matches (line 38 + comment line 42)

## Deviations from Plan

None — plan executed exactly as written.

Task 0 was pre-approved by the user (manually_reviewed column confirmed present in Supabase dashboard before execution began). Schema documentation applied directly without checkpoint gate.

## Known Stubs

All stubs are intentional and tracked:

| File | Tests | Activates When |
|------|-------|----------------|
| tests/test_classifier.py | 5 stubs | Wave 1 creates src/data/classifier.py |
| tests/test_categories.py | 2 stubs | Wave 3 creates src/data/categories.py |

These stubs exist by design — they are the acceptance criteria for Wave 1 and Wave 3 plans. They do not prevent this plan's goal (test infrastructure established).

## Threat Flags

None — no new network endpoints, auth paths, or trust boundary changes introduced. conftest.py mock uses no real credentials.

## Self-Check: PASSED

- [x] supabase/schema.sql contains "manually_reviewed BOOLEAN DEFAULT false" (line 38)
- [x] tests/conftest.py contains "def mock_supabase"
- [x] tests/test_classifier.py exists with 5 skip-marked stubs
- [x] tests/test_categories.py exists with 2 skip-marked stubs
- [x] Commit f733a3a exists (Task 0)
- [x] Commit f903a5a exists (Task 1)
- [x] Full suite: 14 passed, 7 skipped, 0 failed
