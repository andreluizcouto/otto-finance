import json
import importlib
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

    def or_(self, *_args, **_kwargs):
        return self

    def order(self, *_args, **_kwargs):
        return self

    def insert(self, row):
        self._mode = "insert"
        self._pending_insert = row
        return self

    def execute(self):
        if self._mode == "select":
            if "amount" not in self._filters:
                return SimpleNamespace(data=[])
            user_id = self._filters["user_id"]
            date = self._filters["date"]
            amount = float(self._filters["amount"])
            data = [
                {
                    "id": "existing",
                    "description": key[3],
                    "raw_text": key[4] if len(key) > 4 else None,
                    "transaction_time": key[5] if len(key) > 5 else None,
                }
                for key in self._existing_rows
                if key[0] == user_id and key[1] == date and float(key[2]) == amount
            ]
            return SimpleNamespace(data=data)

        row = self._pending_insert
        key = (
            row["user_id"],
            row["date"],
            float(row["amount"]),
            row["description"],
            row.get("raw_text"),
            row.get("transaction_time"),
        )
        self._existing_rows.add(key)
        self.inserted_rows.append(row)
        return SimpleNamespace(data=[row])


class _FakeCategoriesTable:
    def __init__(self, rows=None):
        self._rows = list(rows or [])

    def select(self, *_args, **_kwargs):
        return self

    def or_(self, *_args, **_kwargs):
        return self

    def order(self, *_args, **_kwargs):
        return self

    def execute(self):
        return SimpleNamespace(data=self._rows)


class _FakeClient:
    def __init__(self, transactions_table, categories_rows=None):
        self._transactions_table = transactions_table
        self._categories_table = _FakeCategoriesTable(categories_rows)

    def table(self, name):
        if name == "transactions":
            return self._transactions_table
        if name == "categories":
            return self._categories_table
        raise AssertionError(f"Unexpected table: {name}")


def _app_with_utils_router(authenticated=False):
    app = FastAPI()
    app.include_router(utils_router)
    if authenticated:
        app.dependency_overrides[get_current_user] = lambda: {"id": "jwt-user"}
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


def test_analyze_pdf_prefers_text_first_mode(monkeypatch):
    utils_router_module = importlib.import_module("backend.modules.utils.router")

    captured_payload = {}

    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")
    extracted_text = (
        "01/04/2026 MERCADO CENTRAL 120,45\n"
        "02/04/2026 SALARIO 2500,00\n"
        "03/04/2026 FARMACIA 45,90\n"
        "04/04/2026 PADARIA 18,30\n"
        "05/04/2026 CINEMA 39,90\n"
    )
    monkeypatch.setattr(
        utils_router_module,
        "extract_text_from_pdf_bytes",
        lambda _pdf: extracted_text,
    )

    class _FakeMessages:
        def create(self, **kwargs):
            captured_payload.update(kwargs)
            return SimpleNamespace(
                content=[
                    SimpleNamespace(
                        text=json.dumps(
                            {
                                "transacoes": [
                                    {
                                        "data": "01/04/2026",
                                        "descricao": "MERCADO CENTRAL",
                                        "valor": 120.45,
                                        "tipo": "debito",
                                        "origem": "bank_statement",
                                    }
                                ]
                            },
                            ensure_ascii=False,
                        )
                    )
                ]
            )

    class _FakeAnthropic:
        def __init__(self, api_key):
            assert api_key == "test-key"
            self.messages = _FakeMessages()

    monkeypatch.setattr(utils_router_module.anthropic, "Anthropic", _FakeAnthropic)

    client = TestClient(_app_with_utils_router(authenticated=True))
    response = client.post(
        "/api/analyze-pdf",
        files={"file": ("invoice.pdf", b"%PDF-1.4 fake", "application/pdf")},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["mode"] == "text-first"
    assert body["result"]
    assert "document" not in json.dumps(captured_payload)


def test_analyze_pdf_uses_document_fallback_when_text_is_not_meaningful(monkeypatch):
    utils_router_module = importlib.import_module("backend.modules.utils.router")

    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")
    monkeypatch.setattr(
        utils_router_module,
        "extract_text_from_pdf_bytes",
        lambda _pdf: "texto curto",
    )

    class _FakeMessages:
        def create(self, **kwargs):
            return SimpleNamespace(
                content=[
                    SimpleNamespace(
                        text=json.dumps(
                            {
                                "transacoes": [
                                    {
                                        "data": "03/04/2026",
                                        "descricao": "PADARIA",
                                        "valor": 25.0,
                                        "tipo": "debito",
                                        "origem": "bank_statement",
                                    }
                                ]
                            },
                            ensure_ascii=False,
                        )
                    )
                ]
            )

    class _FakeAnthropic:
        def __init__(self, api_key):
            assert api_key == "test-key"
            self.messages = _FakeMessages()

    monkeypatch.setattr(utils_router_module.anthropic, "Anthropic", _FakeAnthropic)

    client = TestClient(_app_with_utils_router(authenticated=True))
    response = client.post(
        "/api/analyze-pdf",
        files={"file": ("invoice.pdf", b"%PDF-1.4 fake", "application/pdf")},
    )

    assert response.status_code == 200
    assert response.json()["mode"] == "document-fallback"


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


def test_import_transactions_skips_administrative_lines():
    from backend.modules.transactions.services import import_transactions_from_pdf

    table = _FakeTransactionsTable()
    result = import_transactions_from_pdf(
        _FakeClient(table),
        "user-1",
        [
            {"data": "08/04/2026", "descricao": "SALDO FATURA ANTERIOR", "valor": 674.69, "tipo": "debito"},
            {"data": "10/03/2026", "descricao": "PGTO. CASH AG. 0000 000000000 000", "valor": 674.69, "tipo": "credito"},
            {"data": "11/03/2026", "descricao": "SUPERMERCADO IRMAOS", "valor": 50.03, "tipo": "debito"},
        ],
    )

    assert result == {"imported": 1, "skipped": 2}
    assert len(table.inserted_rows) == 1
    assert table.inserted_rows[0]["description"] == "SUPERMERCADO IRMAOS"


def test_import_transactions_normalizes_whitespace_for_dedupe():
    from backend.modules.transactions.services import import_transactions_from_pdf

    existing = {("user-1", "2024-03-15", -50.0, "Padaria Centro")}
    table = _FakeTransactionsTable(existing_rows=existing)
    result = import_transactions_from_pdf(
        _FakeClient(table),
        "user-1",
        [
            {"data": "15/03/2024", "descricao": "Padaria   Centro", "valor": 50.0, "tipo": "debito"},
        ],
    )

    assert result == {"imported": 0, "skipped": 1}
    assert len(table.inserted_rows) == 0


def test_import_transactions_keeps_non_card_boleto_payment():
    from backend.modules.transactions.services import import_transactions_from_pdf

    table = _FakeTransactionsTable()
    result = import_transactions_from_pdf(
        _FakeClient(table),
        "user-1",
        [
            {
                "data": "10/03/2024",
                "descricao": "Pagamento de Boleto - TELEFONICA BRASIL",
                "valor": 25.70,
                "tipo": "debito",
            }
        ],
    )

    assert result == {"imported": 1, "skipped": 0}
    assert len(table.inserted_rows) == 1


def test_import_transactions_skips_debit_purchase_tagged_as_credit_card():
    from backend.modules.transactions.services import import_transactions_from_pdf

    table = _FakeTransactionsTable()
    result = import_transactions_from_pdf(
        _FakeClient(table),
        "user-1",
        [
            {
                "data": "10/03/2024",
                "descricao": "COMPRA NO DEBITO SUPERMERCADO CENTRAL",
                "valor": 85.40,
                "tipo": "debito",
                "origem": "credit_card",
            }
        ],
    )

    assert result == {"imported": 0, "skipped": 1}
    assert len(table.inserted_rows) == 0


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


def test_import_endpoint_accepts_markdown_wrapped_json():
    table = _FakeTransactionsTable()
    app = _app_with_transactions_router(fake_client=_FakeClient(table), user_id="jwt-user")
    client = TestClient(app)

    payload = {
        "result": """```json
{
  "transacoes": [
    {"data": "18/03/2024", "descricao": "Padaria", "valor": 19.9, "tipo": "debito"}
  ]
}
```"""
    }
    response = client.post("/api/transactions/import", json=payload)

    assert response.status_code == 200
    assert response.json() == {"imported": 1, "skipped": 0}
    assert table.inserted_rows[0]["description"] == "Padaria"


def test_import_endpoint_accepts_iso_date_and_english_keys():
    table = _FakeTransactionsTable()
    app = _app_with_transactions_router(fake_client=_FakeClient(table), user_id="jwt-user")
    client = TestClient(app)

    payload = {
        "result": json.dumps(
            {
                "transacoes": [
                    {
                        "date": "2024-03-19",
                        "description": "Salary",
                        "amount": 2500.0,
                        "type": "credit",
                    }
                ]
            }
        )
    }
    response = client.post("/api/transactions/import", json=payload)

    assert response.status_code == 200
    assert response.json() == {"imported": 1, "skipped": 0}
    assert table.inserted_rows[0]["date"] == "2024-03-19"
    assert table.inserted_rows[0]["amount"] == 2500.0


def test_import_endpoint_skips_debit_purchase_tagged_as_credit_card():
    table = _FakeTransactionsTable()
    app = _app_with_transactions_router(fake_client=_FakeClient(table), user_id="jwt-user")
    client = TestClient(app)

    payload = {
        "result": json.dumps(
            {
                "transacoes": [
                    {
                        "data": "19/03/2024",
                        "descricao": "Compra no débito Farmacia Bem Estar",
                        "valor": 47.35,
                        "tipo": "debito",
                        "source": "credit_card",
                    }
                ]
            }
        )
    }
    response = client.post("/api/transactions/import", json=payload)

    assert response.status_code == 200
    assert response.json() == {"imported": 0, "skipped": 1}
    assert len(table.inserted_rows) == 0


def test_import_endpoint_accepts_structured_ai_fields_and_matches_category():
    table = _FakeTransactionsTable()
    categories = [{"id": "cat-1", "name": "Alimentação", "slug": "alimentacao"}]
    app = _app_with_transactions_router(
        fake_client=_FakeClient(table, categories_rows=categories),
        user_id="jwt-user",
    )
    client = TestClient(app)

    payload = {
        "result": json.dumps(
            {
                "transacoes": [
                    {
                        "date": "2026-04-08",
                        "time": "08:45",
                        "merchant_name": "Super Mercado Irmãos",
                        "description": "Super Mercado Irmãos",
                        "amount": -42.75,
                        "category_hint": "Alimentação",
                        "raw_text": "Compra com cartão 08/04 08:45 SUPER MERCADO IRMAOS",
                        "source": "credit_card",
                    }
                ]
            },
            ensure_ascii=False,
        )
    }

    response = client.post("/api/transactions/import", json=payload)

    assert response.status_code == 200
    assert response.json() == {"imported": 1, "skipped": 0}
    assert table.inserted_rows[0]["date"] == "2026-04-08"
    assert table.inserted_rows[0]["transaction_time"] == "08:45"
    assert table.inserted_rows[0]["merchant_name"] == "Super Mercado Irmãos"
    assert table.inserted_rows[0]["description"] == "Super Mercado Irmãos"
    assert table.inserted_rows[0]["raw_text"] == "Compra com cartão 08/04 08:45 SUPER MERCADO IRMAOS"
    assert table.inserted_rows[0]["category_id"] == "cat-1"


def test_import_transactions_skips_duplicate_when_raw_text_date_and_time_match():
    from backend.modules.transactions.services import import_transactions_from_pdf

    existing = {
        (
            "user-1",
            "2026-04-08",
            -42.75,
            "Super Mercado Irmãos",
            "Compra com cartão 08/04 08:45 SUPER MERCADO IRMAOS",
            "08:45",
        )
    }
    table = _FakeTransactionsTable(existing_rows=existing)

    result = import_transactions_from_pdf(
        _FakeClient(table),
        "user-1",
        [
            {
                "data": "08/04/2026",
                "descricao": "Super Mercado Irmãos",
                "merchant_name": "Super Mercado Irmãos",
                "valor": 42.75,
                "tipo": "debito",
                "time": "08:45",
                "raw_text": "Compra com cartão 08/04 08:45 SUPER MERCADO IRMAOS",
            }
        ],
    )

    assert result == {"imported": 0, "skipped": 1}
    assert len(table.inserted_rows) == 0
