---
phase: 03-ai-classification
verified: 2026-04-07T19:26:47Z
status: gaps_found
score: 4/5 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 3/5
  gaps_closed:
    - "New transactions are automatically classified into categories via the Make.com-to-OpenAI pipeline"
    - "Cryptic Brazilian merchant names (e.g., RCHLO, Pag*) are correctly mapped and classified"
  gaps_remaining:
    - "Classification uses structured outputs (JSON schema) for reliability"
  regressions: []
gaps:
  - truth: "Classification uses structured outputs (JSON schema) for reliability"
    status: failed
    reason: "Runtime evidence now documented, but captured execution shows Gemini endpoint instead of OpenAI response_format.json_schema strict runtime proof required by phase contract."
    artifacts:
      - path: ".planning/phases/03-ai-classification/03-RESEARCH.md"
        issue: "Runtime Evidence (AICL-06) section records `generativelanguage.googleapis.com ... gemini-2.5-flash:generateContent`, not OpenAI Module 4 strict json_schema payload evidence."
    missing:
      - "Capture Make.com runtime evidence from the OpenAI module used for classification."
      - "Show response_format.type='json_schema' and json_schema.strict=true in runtime payload evidence."
      - "Attach one execution proof (scenario/module identifier + observed request fields)."
---

# Phase 3: AI Classification Verification Report

**Phase Goal:** Transactions are automatically and reliably classified into spending categories by AI  
**Verified:** 2026-04-07T19:26:47Z  
**Status:** gaps_found  
**Re-verification:** Yes — after gap closure

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | New transactions are automatically classified into categories via the Make.com-to-OpenAI pipeline | ✓ VERIFIED | `src/pages/settings.py:71-87` triggers `trigger_classification(client, user["id"])` immediately after insert; regression test `tests/test_settings.py:81-113` passes. |
| 2 | Cryptic Brazilian merchant names (e.g., RCHLO, Pag*) are correctly mapped and classified | ✓ VERIFIED | `src/data/classifier.py:136` uses `resolve_merchant_name(...)` inside runtime payload builder; test `tests/test_classifier.py:29-43` validates runtime normalization output. |
| 3 | Each classified transaction shows a confidence indicator (high/medium/low) in the UI | ✓ VERIFIED | `src/pages/transactions.py:130` renders `? Baixa` for low confidence and `_confidence_label(...)` for others. |
| 4 | Low-confidence classifications appear in a review queue where the user can correct them | ✓ VERIFIED | `src/pages/transactions.py:182-189` writes correction with `category_id`, `confidence_score="high"`, `manually_reviewed=True`; tests in `tests/test_transactions.py` pass. |
| 5 | Classification uses structured outputs (JSON schema) for reliability | ✗ FAILED | Contract helper/tests exist (`src/data/classifier.py:188-237`, `tests/test_classifier.py:91-136`), but runtime evidence section logs Gemini endpoint (`03-RESEARCH.md:678-689`) instead of OpenAI strict `response_format.json_schema` runtime proof. |

**Score:** 4/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `src/pages/settings.py` | Automatic post-create classification trigger | ✓ VERIFIED | Exists, substantive, wired (`trigger_classification` called after generate+insert). |
| `src/data/classifier.py` | Runtime merchant normalization in payload builder | ✓ VERIFIED | Exists, substantive, wired via `build_classification_payload` used by `trigger_classification`. |
| `tests/test_settings.py` | Regression for automatic trigger flow | ✓ VERIFIED | Exists and validates trigger invocation path. |
| `tests/test_classifier.py` | Strict schema contract checks | ✓ VERIFIED | Schema contract assertions present and passing. |
| `.planning/phases/03-ai-classification/03-RESEARCH.md` | Runtime strict-schema OpenAI evidence | ⚠️ HOLLOW | Evidence recorded, but endpoint is Gemini runtime, not OpenAI module proof requested in phase contract. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `src/pages/settings.py` | `src/data/classifier.py` | `trigger_classification(...)` | WIRED | Import at line 5; invocation at line 71. |
| `src/data/classifier.py` | Make webhook payload | `resolve_merchant_name(...)` in payload builder | WIRED | Normalization applied at payload construction (line 136). |
| `src/pages/transactions.py` | `src/data/classifier.py` | Manual fallback CTA call | WIRED | Manual classify button still triggers `trigger_classification` (lines 63-77). |
| `03-RESEARCH.md` runtime evidence | OpenAI strict schema runtime proof | Evidence checklist | NOT_WIRED | Runtime section demonstrates Gemini request, not OpenAI module 4 strict schema payload. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `src/pages/settings.py` | `transactions` → auto classification trigger | `generate_transactions(...)` then `client.table("transactions").insert(...).execute()` | Yes | ✓ FLOWING |
| `src/data/classifier.py` | `payload["transactions"][*]["merchant_name"]` | `resolve_merchant_name(...)` transform during payload build | Yes | ✓ FLOWING |
| `03-RESEARCH.md` runtime evidence | strict schema runtime proof | Documented external execution notes | No (OpenAI proof missing) | ⚠️ STATIC/MISMATCH |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Automatic trigger + classifier + transactions/category regressions | `python -m pytest tests/test_classifier.py tests/test_categories.py tests/test_settings.py tests/test_transactions.py -q` | `25 passed` | ✓ PASS |
| Runtime normalization contract test | Included in command above (`test_build_payload_normalizes_merchant_name_runtime`) | passed | ✓ PASS |
| OpenAI runtime strict-schema evidence | N/A (external Make.com runtime) | Not verifiable in repo; repo evidence currently points to Gemini endpoint | ✗ FAIL (evidence mismatch) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| AICL-01 | 03-01/03-04 | Automatic classification via OpenAI through Make.com | ? NEEDS HUMAN | Automatic trigger in code verified; external OpenAI runtime orchestration still needs direct Make.com runtime check. |
| AICL-02 | 03-01/03-04 | Brazilian merchant mapping | ✓ SATISFIED | Runtime payload normalization wired and tested. |
| AICL-03 | 03-01/03-02 | Confidence score tiers | ✓ SATISFIED | Mapping helper + UI confidence rendering + tests. |
| AICL-04 | 03-02/03-04 | Low-confidence review flow | ✓ SATISFIED | Inline correction path writes reviewed/high confidence and reruns. |
| AICL-05 | 03-03 | Custom category CRUD | ✓ SATISFIED | `src/data/categories.py` + settings UI + passing tests. |
| AICL-06 | 03-01/03-05 | Structured outputs JSON schema reliability | ✗ BLOCKED | Contract tests exist, but runtime proof artifact does not show OpenAI strict `response_format.json_schema` execution. |
| INTG-01 | 03-01/03-05 | Make.com webhook orchestration | ? NEEDS HUMAN | `httpx.post(MAKE_WEBHOOK_URL, ...)` exists and tested locally; external scenario execution must be validated in Make.com. |

Orphaned requirements mapped to Phase 3 but missing from plans: none found.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `.planning/phases/03-ai-classification/03-RESEARCH.md` | 678-689 | Runtime evidence points to Gemini endpoint, not OpenAI strict schema module | 🛑 Blocker | Leaves AICL-06 runtime reliability proof incomplete for this phase contract. |

### Human Verification Required

### 1. OpenAI runtime strict-schema verification in Make.com
**Test:** Open the production classification scenario, inspect the actual OpenAI HTTP module request body for one execution.  
**Expected:** `response_format.type = "json_schema"` and `response_format.json_schema.strict = true` with canonical enum and required fields.  
**Why human:** Make.com runtime config/execution is external to repository.

### 2. End-to-end external orchestration check
**Test:** Trigger classification from app with real webhook, then verify Supabase rows are patched and reflected in Transactions UI.  
**Expected:** category/confidence updates appear for processed rows, with low-confidence rows flagged for review.  
**Why human:** Depends on external network services (Make.com/OpenAI/Supabase runtime).

### Gaps Summary

Re-verification closed two prior blockers (automatic trigger and runtime merchant normalization).  
One blocker remains: runtime structured-output evidence in repo does not currently prove OpenAI strict JSON-schema execution (it documents Gemini runtime instead). Phase goal is close, but requirement-level reliability proof for AICL-06/OpenAI path is still incomplete.

---

_Verified: 2026-04-07T19:26:47Z_  
_Verifier: the agent (gsd-verifier)_
