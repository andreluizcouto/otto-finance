# Phase 3: AI Classification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the discussion.

**Date:** 2026-04-07
**Phase:** 03-ai-classification
**Mode:** discuss
**Areas discussed:** Classification trigger, Review queue UX, Category management, Re-classify scope

## Gray Areas Presented

| Area | Options offered | User chose |
|------|----------------|-----------|
| Classification trigger | Manual button / Auto after generation / Both | Manual button |
| Review queue UX | Inline in table / Dedicated page / Banner | Inline in table |
| Category management | Settings page / Inline from transactions | Settings page |
| Re-classify scope | Only unclassified / All transactions / User's choice | Only unclassified |

## Decisions Made

### Classification Trigger
- **Chosen:** Manual button on Transactions page
- **Rationale:** Simple, predictable, no background complexity

### Review Queue
- **Chosen:** Inline in transactions table
- **Rationale:** Low-confidence rows get a warning badge; click to correct. No separate page needed.

### Category Management
- **Chosen:** Settings page (existing)
- **Rationale:** Fits current pattern, avoids cluttering Transactions view

### Re-classify Scope
- **Chosen:** Only unclassified transactions
- **Rationale:** Safe, idempotent — doesn't overwrite manual corrections

## Corrections Made

No corrections — all recommended options confirmed.

## Prior Decisions Applied

- Dark theme (Phase 1 D-03) carried forward for badge styling
- Settings page as extension point (Phase 2 decision) confirmed for category management
- gpt-4o-mini model from CLAUDE.md stack reference applied to D-09
- httpx webhook pattern from CLAUDE.md applied to D-07
