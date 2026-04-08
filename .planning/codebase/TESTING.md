# Testing Patterns
_Last updated: 2026-04-08_

## Summary

The project has a Python/pytest test suite under `tests/` covering legacy backend services. The React/TypeScript frontend has zero test files — no jest, vitest, cypress, or testing-library is present in `package.json`. All frontend code is untested. The Python tests reference `backend.modules.*` import paths that do not yet exist in the codebase (the modules are planned but not implemented), making most tests currently failing.

---

## Test Framework

**Frontend:**
- None. No test runner, no test files, no coverage tooling in the frontend stack.
- `package.json` contains no testing dependencies (no `jest`, `vitest`, `@testing-library/*`, `cypress`, `playwright`).

**Backend (Python):**
- Runner: `pytest`
- Config: `pyproject.toml` — `[tool.pytest.ini_options]`
- Assertion: Python `assert` statements (no additional library)

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_functions = ["test_*"]
addopts = "-x -q"
```

**Run commands:**
```bash
pytest          # Run all tests, stop on first failure (-x), quiet output (-q)
pytest tests/test_classifier.py   # Run single file
```

---

## Test File Locations

```
tests/
├── conftest.py          # Shared pytest fixtures
├── test_categories.py   # Category CRUD service tests
├── test_classifier.py   # AI classification service tests
├── test_dashboard.py    # Dashboard date filter logic tests
└── legacy/              # Older test files (not actively maintained)
    ├── test_charts.py
    ├── test_generator.py
    ├── test_settings.py
    └── test_transactions.py
```

All active tests target `backend.modules.*` import paths. No tests import from the `src/` (React) directory.

---

## Shared Fixtures

Defined in `tests/conftest.py`:

```python
@pytest.fixture
def mock_supabase():
    """Mock Supabase client for unit tests. Avoids real DB calls."""
    client = MagicMock()
    client.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
    client.table.return_value.insert.return_value.execute.return_value.data = []
    client.table.return_value.update.return_value.eq.return_value.execute.return_value.data = []
    client.table.return_value.delete.return_value.eq.return_value.execute.return_value.data = []
    return client
```

Usage: `def test_add_category(mock_supabase): ...` — inject as parameter.

---

## Test Patterns

### Pure unit tests with MagicMock

```python
def test_add_category(mock_supabase):
    from backend.modules.categories.services import add_category
    mock_supabase.table.return_value.select.return_value.ilike.return_value.execute.return_value.data = []
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [{"id": "new-id"}]
    result = add_category(mock_supabase, "user-1", "Minha Categoria", "#00FF00", "")
    assert result["success"] is True
```

### Custom recorder objects (for complex query chain assertions)

When `MagicMock` is insufficient for verifying chained calls, `_RecorderQuery` / `_RecorderClient` classes are built inline in the test file:

```python
class _RecorderQuery:
    def select(self, *_args, **_kwargs): return self
    def eq(self, field, value):
        self.eq_calls.append((field, value))
        return self
    def execute(self): ...

# Usage:
query = _RecorderQuery()
client = _RecorderClient(query)
result = rename_category(client, "user-9", "cat-1", "Novo Nome")
assert ("user_id", "user-9") in query.eq_calls
```

### mock.patch.object for HTTP/external calls

```python
with (
    mock.patch.object(classifier, "get_unclassified_transactions", return_value=unclassified),
    mock.patch.object(classifier, "get_make_webhook_url", return_value="https://hook.example"),
    mock.patch.object(classifier.httpx, "post", return_value=fake_response) as post_mock,
):
    result = classifier.trigger_classification(client, "user-1")

assert result == {"success": True, "classified_count": 1}
post_mock.assert_called_once()
```

### Error/timeout path testing

```python
with mock.patch.object(classifier.httpx, "post", side_effect=httpx.TimeoutException("timeout")):
    result = classifier.trigger_classification(client, "user-1")

assert result["success"] is False
assert "nao respondeu" in result["error"]
```

### Date logic unit tests

```python
def test_date_filter_this_week():
    from backend.modules.dashboard.services import calculate_date_range
    today_wednesday = date(2026, 4, 8)
    start, end = calculate_date_range("Esta semana", today_wednesday)
    assert start == date(2026, 4, 6)
    assert end == date(2026, 4, 8)
```

---

## What Is Tested

| Area | File | Coverage |
|------|------|----------|
| Category CRUD (add, rename, delete) | `test_categories.py` | Service-level, mocked DB |
| AI classification payload building | `test_classifier.py` | Pure logic, no OpenAI calls |
| Merchant name normalization | `test_classifier.py` | RCHLO→Riachuelo, MELI→Mercado Livre, etc. |
| Confidence score mapping | `test_classifier.py` | Boundary values (0.8, 0.5) |
| OpenAI JSON schema structure | `test_classifier.py` | Contract parity with Make.com |
| HTTP webhook call + fallback | `test_classifier.py` | Mocked httpx |
| Dashboard date range logic | `test_dashboard.py` | Pure date math |

---

## What Is NOT Tested

- **All React/TypeScript frontend** — zero test coverage
- **API route handlers** (`backend/main.py` routes, FastAPI endpoints)
- **Authentication flow** — login, token validation, session management
- **Supabase RLS / real DB queries** — all tests mock the client
- **UI interactions** — no component tests, no e2e tests
- **Make.com webhook integration** — tested only via mock patches
- **Z-API WhatsApp messaging** — no tests
- **Data seeding / Faker generator** — legacy `tests/legacy/test_generator.py` exists but unmaintained

---

## Import Status Warning

Most active test files import from `backend.modules.*` paths that do not currently exist:

```python
from backend.modules.transactions.services import build_classification_payload  # module not found
from backend.modules.categories.services import add_category                    # module not found
from backend.modules.dashboard.services import calculate_date_range             # module not found
```

Running `pytest` against these files will produce `ModuleNotFoundError` until the backend modules are implemented.

---

## Coverage

- No coverage tooling configured (`pytest-cov` not in `requirements.txt`)
- No coverage targets defined
- To add coverage: `pip install pytest-cov` then run `pytest --cov=backend --cov-report=term-missing`

---

## Gaps / Unknowns

- `tests/legacy/` files (`test_charts.py`, `test_generator.py`, `test_settings.py`, `test_transactions.py`) — not read, contents unknown, marked as legacy
- No decision recorded on whether frontend testing will be added (vitest + testing-library is the natural fit given the Vite stack)
- No CI pipeline — tests are only run locally
- `-x` flag in `addopts` means the first failure stops the entire suite; remove for full failure reports during development
