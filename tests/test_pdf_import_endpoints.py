import json
from types import SimpleNamespace

from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.core import get_current_client, get_current_user
from backend.modules.transactions.router import router as transactions_router
from backend.modules.utils.router import router as utils_router


class _FakeTransactionsTable:
    def __init__(self, existing_rows=None):
        self._existing_rows = set(existing_rows or [])
        self._filters = {}
        self._mode = None
        self._pending_insert = None
        self.inserted_rows = []

    def select(self, *_args, **_kwargs):
        self._mode = "select"
        self._filters = {}
        return self

    def eq(self, field, value):
        self._filters[field] = value
        return self

    def insert(self, row):
        self._mode = "insert"
        self._pending_insert = row
        return self

    def execute(self):
        if self._mode == "select":
            key = (
                self._filters["user_id"],
                self._filters["date"],
                float(self._filters["amount"]),
                self._filters["description"],
            )
            data = [{"id": "existing"}] if key in self._existing_rows else []
            return SimpleNamespace(data=data)

        row = self._pending_insert
        key = (row["user_id"], row["date"], float(row["amount"]), row["description"])
        self._existing_rows.add(key)
        self.inserted_rows.append(row)
        return SimpleNamespace(data=[row])


class _FakeClient:
    def __init__(self, table):
        self._table = table

    def table(self, _name):
        return self._table


def _app_with_utils_router():
    app = FastAPI()
    app.include_router(utils_router)
    return app


def _app_with_transactions_router(fake_client=None, user_id="user-from-jwt"):
    app = FastAPI()
    app.include_router(transactions_router)
    if fake_client is not None:
        app.dependency_overrides[get_current_user] = lambda: {"id": user_id}
        app.dependency_overrides[get_current_client] = lambda: fake_client
    return app


def test_analyze_pdf_requires_auth():
    client = TestClient(_app_with_utils_router())
    response = client.post(
        "/api/analyze-pdf",
        files={"file": ("invoice.pdf", b"fake", "application/pdf")},
    )
    assert response.status_code == 401


def test_import_transactions_requires_auth():
    client = TestClient(_app_with_transactions_router())
    response = client.post("/api/transactions/import", json={"result": '{"transacoes": []}'})
    assert response.status_code == 401


def test_import_transactions_inserts_and_skips_duplicates():
    from backend.modules.transactions.services import import_transactions_from_pdf

    existing = {("user-1", "2024-03-15", -50.0, "Padaria")}
    table = _FakeTransactionsTable(existing_rows=existing)
    result = import_transactions_from_pdf(
        _FakeClient(table),
        "user-1",
        [
            {"data": "15/03/2024", "descricao": "Padaria", "valor": 50.0, "tipo": "debito"},
            {"data": "16/03/2024", "descricao": "Salario", "valor": 1000.0, "tipo": "credito"},
            {"data": "17/03/2024", "descricao": "Mercado", "valor": 220.5, "tipo": "debito"},
        ],
    )

    assert result == {"imported": 2, "skipped": 1}
    assert len(table.inserted_rows) == 2
    assert table.inserted_rows[0]["date"] == "2024-03-16"
    assert table.inserted_rows[0]["amount"] == 1000.0
    assert table.inserted_rows[1]["date"] == "2024-03-17"
    assert table.inserted_rows[1]["amount"] == -220.5


def test_import_endpoint_uses_user_id_from_jwt():
    table = _FakeTransactionsTable()
    app = _app_with_transactions_router(fake_client=_FakeClient(table), user_id="jwt-user")
    client = TestClient(app)

    payload = {
        "result": json.dumps(
            {
                "transacoes": [
                    {
                        "data": "18/03/2024",
                        "descricao": "Restaurante",
                        "valor": 120.0,
                        "tipo": "debito",
                    }
                ]
            }
        )
    }
    response = client.post("/api/transactions/import", json=payload)

    assert response.status_code == 200
    assert response.json() == {"imported": 1, "skipped": 0}
    assert table.inserted_rows[0]["user_id"] == "jwt-user"
