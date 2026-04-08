---
phase: quick
plan: 260408-cru
type: execute
wave: 1
depends_on: []
files_modified:
  - main.py
autonomous: true
requirements: []

must_haves:
  truths:
    - "git history reflects the full file migration (no unstaged deletions)"
    - "backend starts with uvicorn backend.main:app without import errors"
    - "root main.py proxy is removed — no orphan file causing confusion"
    - "npm run dev starts the Vite frontend without errors"
  artifacts:
    - path: "backend/main.py"
      provides: "FastAPI app — sole entry point"
    - path: "src/features"
      provides: "Migrated frontend feature modules committed to git"
  key_links:
    - from: "uvicorn command"
      to: "backend/main.py"
      via: "backend.main:app"
      pattern: "uvicorn backend.main:app"
---

<objective>
Commit the pending file migration, remove the broken root proxy entry point, and verify both the backend (uvicorn) and frontend (npm run dev) start cleanly.

Purpose: The project cannot be reliably cloned or started in its current state — ~80 migrated files exist only on disk, not in git, and the root main.py proxy adds unnecessary confusion.
Output: Clean git history, confirmed startup for both stacks.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/codebase/CONCERNS.md
@.planning/codebase/STACK.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Commit the file migration and remove root proxy</name>
  <files>main.py (deleted), all migrated src/ and backend/ files</files>
  <action>
    Stage all changes with `git add -A` to capture the ~80 physical moves as add+delete pairs, then commit. After the commit, delete root `main.py` (the one-line proxy `from backend.main import app`) — it is not the real entry point, only `backend/main.py` is. Stage and commit the deletion separately so the history is clean.

    Commands:
    1. `git add -A`
    2. `git commit -m "chore: commit full frontend+backend file migration to feature-based structure"`
    3. `git rm main.py` (or `git add -A` if already deleted on disk)
    4. `git commit -m "chore: remove root main.py proxy — entry point is backend/main.py"`

    Do NOT modify `backend/main.py` — it is correct as-is.
    The .env file exists and has valid SUPABASE_URL, SUPABASE_ANON_KEY, MAKE_WEBHOOK_URL — no changes needed there.
  </action>
  <verify>
    `git status` shows clean working tree (nothing to commit).
    `git log --oneline -3` shows the two new commits.
    `ls main.py` returns "No such file".
  </verify>
  <done>git working tree is clean, root main.py is gone, migration is in history.</done>
</task>

<task type="auto">
  <name>Task 2: Verify backend and frontend start cleanly</name>
  <files>(no file changes — verification only)</files>
  <action>
    Test backend startup:
    - Run `uvicorn backend.main:app --port 8000 --timeout-graceful-shutdown 2` for ~3 seconds, then kill. Look for "Application startup complete" in output, not any ImportError or ValueError.
    - If startup fails with ImportError: read the failing module and fix the import (likely a module under backend/modules/ with a broken relative import after restructure).
    - If startup fails with ValueError about env vars: the .env already has valid values, so this should not occur. If it does, check that `load_dotenv()` in backend/core.py is finding the .env at the project root (it uses the CWD — run uvicorn from the project root).

    Test frontend startup:
    - Run `npm run dev -- --port 5173` for ~5 seconds, then kill. Look for "Local: http://localhost:5173" in output, not any build error or missing module error.
    - If startup fails with "Cannot find module": run `npm install` first, then retry.

    If either server fails to start, read the error output, locate the root cause file, and apply the minimal fix.
  </action>
  <verify>
    Backend: `uvicorn backend.main:app --host 0.0.0.0 --port 8000` outputs "Application startup complete" (or equivalent Uvicorn ready message) without tracebacks.
    Frontend: `npm run dev` outputs a local URL (http://localhost:5173 or similar) without build errors.
  </verify>
  <done>Both servers start without errors. Project is runnable from a clean checkout given the .env file.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| .env → process | Credentials loaded from disk at startup; no exposure risk in this task (no new endpoints, no changed auth logic) |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-cru-01 | Information Disclosure | .env committed to git | accept | .env is already in .gitignore; git add -A will not stage it. Verify with `git status` after staging. |
</threat_model>

<verification>
After both tasks:
- `git status` → clean
- `curl http://localhost:8000/health` → `{"status":"ok"}` (when backend running)
- Browser opens http://localhost:5173 → Vite dev server serves the React app
</verification>

<success_criteria>
- git history contains the migration commit — no unstaged deletions remain
- root main.py does not exist
- `uvicorn backend.main:app` starts without errors
- `npm run dev` starts without errors
</success_criteria>

<output>
After completion, create `.planning/quick/260408-cru-fix-all-critical-issues-to-get-the-proje/260408-cru-SUMMARY.md`
</output>
