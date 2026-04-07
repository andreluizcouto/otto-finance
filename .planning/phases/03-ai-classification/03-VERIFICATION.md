---
phase: 03-ai-classification
verified: 2026-04-07T00:00:00Z
status: gaps_found
score: 3/5 must-haves verified
gaps:
  - truth: "New transactions are automatically classified into categories via the Make.com-to-OpenAI pipeline"
    status: failed
    reason: "Classification is user-triggered by a button; no automatic classification trigger for new transactions was found."
    artifacts:
      - path: "src/pages/transactions.py"
        issue: "Calls trigger_classification() only inside classify button click handler."
    missing:
      - "Automatic classification trigger when new transactions are created/imported (without manual button click)."
  - truth: "Cryptic Brazilian merchant names (e.g., RCHLO, Pag*) are correctly mapped and classified"
    status: failed
    reason: "Mapping helper exists but is not wired into runtime classification flow."
    artifacts:
      - path: "src/data/classifier.py"
        issue: "resolve_merchant_name() is defined but not used by trigger_classification() or UI pipeline."
    missing:
      - "Use merchant normalization in live classification flow (or enforce equivalent mapping in integrated pipeline with verifiable evidence)."
  - truth: "Classification uses structured outputs (JSON schema) for reliability"
    status: partial
    reason: "JSON schema helper exists in Python, but repo does not verify Make.com scenario actually enforces it at runtime."
    artifacts:
      - path: "src/data/classifier.py"
        issue: "get_openai_json_schema() is documentation/test helper only and not runtime-enforced in codebase."
    missing:
      - "Executable/config-as-code evidence that Make.com OpenAI call uses strict JSON schema in production flow."
---

# Phase 3: AI Classification Verification Report

**Phase Goal:** Transactions are automatically and reliably classified into spending categories by AI  
**Verified:** 2026-04-07T00:00:00Z  
**Status:** gaps_found  
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | New transactions are automatically classified into categories via the Make.com-to-OpenAI pipeline | ✗ FAILED | `src/pages/transactions.py` only triggers classification on button click (`trigger_classification(...)` at line 65). |
| 2 | Cryptic Brazilian merchant names (e.g., RCHLO, Pag*) are correctly mapped and classified | ✗ FAILED | `resolve_merchant_name()` exists in `src/data/classifier.py` but no runtime usage found. |
| 3 | Each classified transaction shows a confidence indicator (high/medium/low) in the UI | ✓ VERIFIED | `src/pages/transactions.py` renders confidence via `_confidence_label(...)` and low marker `? Baixa`. |
| 4 | Low-confidence classifications appear in a review queue where the user can correct them | ✓ VERIFIED | Low-confidence rows get `Corrigir` selectbox; correction updates `category_id`, `confidence_score='high'`, `manually_reviewed=True`. |
| 5 | User can create, rename, and delete custom spending categories | ✓ VERIFIED | `src/pages/settings.py` + `src/data/categories.py` implement add/rename/delete flows and guards for default categories. |

**Score:** 3/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `src/data/classifier.py` | Classification helpers + webhook trigger | ✓ VERIFIED | Exists, substantive, used by transactions page. |
| `src/data/categories.py` | Category CRUD | ✓ VERIFIED | Exists, substantive, imported/used by settings page. |
| `src/pages/transactions.py` | Classification UI + review queue | ✓ VERIFIED | Exists, substantive, routed from `app.py`. |
| `src/pages/settings.py` | Category management UI | ✓ VERIFIED | Exists, substantive, wired to categories data module. |
| `src/navigation.py` | Transacoes nav item | ✓ VERIFIED | Includes `Transacoes` option and icon, routed in `app.py`. |
| `src/ui/styles.py` | Phase 3 CSS classes | ✓ VERIFIED | Contains `.classify-btn`, `.confidence-badge-low`, `.transactions-container`, `.category-swatch`. |
| `supabase/schema.sql` | `manually_reviewed` schema documentation | ✓ VERIFIED | Column and ALTER comment present. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `src/pages/transactions.py` | `src/data/classifier.py` | `trigger_classification(...)` import + call | WIRED | Import present and called in classify action flow. |
| `src/data/classifier.py` | `src/config.py` | `get_make_webhook_url()` | WIRED | Accessor imported and used before `httpx.post`. |
| `src/pages/settings.py` | `src/data/categories.py` | add/rename/delete/get_all_categories imports | WIRED | All CRUD helpers imported and invoked. |
| `app.py` | `src/pages/transactions.py` | route branch for `"Transacoes"` | WIRED | `show_transactions()` called when selected. |
| `resolve_merchant_name()` | live classification pipeline | runtime usage | NOT_WIRED | No call path from trigger/UI to mapping helper. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `src/pages/transactions.py` | `unclassified_count` | Supabase query (`transactions` with `.or_(category_id/confidence_score).eq(manually_reviewed, False)`) | Yes | ✓ FLOWING |
| `src/pages/transactions.py` | `transactions` | Supabase `transactions` select/order query | Yes | ✓ FLOWING |
| `src/pages/settings.py` | `categories` | `get_all_categories(client)` -> Supabase `categories` query | Yes | ✓ FLOWING |
| `src/data/classifier.py` | webhook response `classified_count` | `httpx.post(MAKE_WEBHOOK_URL)` JSON result | External | ? NEEDS HUMAN (external Make/OpenAI pipeline) |
| `src/data/classifier.py` | merchant mapping | `resolve_merchant_name()` table | No runtime use | ✗ DISCONNECTED |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Core phase tests pass | `python -m pytest tests/test_classifier.py tests/test_categories.py tests/test_transactions.py -q` | 37 passed | ✓ PASS |
| Full suite regression | `python -m pytest tests/ -q` | 23 passed | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| AICL-01 | 03-00/01/02 | Automatic AI classification via Make/OpenAI | ✗ BLOCKED | Webhook trigger exists, but only manual button flow found (not automatic new-transaction classification). |
| AICL-02 | 03-00/01 | Brazilian merchant mapping | ✗ BLOCKED | Mapping helper exists, but not wired into runtime classification path. |
| AICL-03 | 03-00/01/02 | Confidence score shown | ✓ SATISFIED | Confidence labels rendered in transactions UI; tests pass. |
| AICL-04 | 03-00/02 | Low-confidence flagged for review | ✓ SATISFIED | `? Baixa` marker + correction selectbox + update path with `manually_reviewed=True`. |
| AICL-05 | 03-00/03 | Custom category CRUD | ✓ SATISFIED | Add/rename/delete flows in settings and categories module; tests pass. |
| AICL-06 | 03-00/01 | Structured outputs JSON schema reliability | ✗ BLOCKED | Schema helper exists, but no runtime-enforced pipeline config in repository. |
| INTG-01 | 03-01/02 | Make.com webhook integration | ? NEEDS HUMAN | `httpx.post` to `MAKE_WEBHOOK_URL` exists; external Make.com orchestration cannot be verified from code alone. |

Orphaned requirements for Phase 3: none detected (all phase requirement IDs are declared in phase plans).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `src/data/classifier.py` | 185 | Comment indicates schema helper is not runtime-used | ⚠️ Warning | Reliability contract (AICL-06) is not enforced in executable flow. |

### Human Verification Required

### 1. Make.com runtime structured output enforcement
**Test:** Execute a real classification run through Make.com and inspect Module 4 request config/output.  
**Expected:** OpenAI call uses strict JSON schema and returns conforming payload for each transaction.  
**Why human:** Make.com scenario config is external to repository.

### 2. End-to-end webhook orchestration
**Test:** Trigger classification in UI with real data and verify Supabase rows are patched with category/confidence.  
**Expected:** Transactions are updated in DB and reflected in UI.  
**Why human:** External network/service integration cannot be fully verified offline.

### Gaps Summary

Phase 03 has strong implementation for UI review and category CRUD, and tests are passing. However, the phase goal is not fully achieved: classification is not automatic for new transactions, merchant mapping is not wired into live flow, and structured-output reliability is not enforced in versioned runtime config.

---

_Verified: 2026-04-07T00:00:00Z_  
_Verifier: the agent (gsd-verifier)_
