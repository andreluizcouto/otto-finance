from __future__ import annotations

from contextlib import contextmanager

import pandas as pd
import pytest


class _RerunCalled(Exception):
    pass


class _StopCalled(Exception):
    pass


class _FakeResponse:
    def __init__(self, data=None, count=None):
        self.data = data if data is not None else []
        self.count = count


class _FakeQuery:
    def __init__(self, response: _FakeResponse, updates: list[dict]):
        self._response = response
        self._updates = updates
        self._update_payload = None
        self._update_id = None

    def select(self, *_args, **_kwargs):
        return self

    def eq(self, key, value):
        if key == "id":
            self._update_id = value
        return self

    def or_(self, *_args, **_kwargs):
        return self

    def order(self, *_args, **_kwargs):
        return self

    def update(self, payload):
        self._update_payload = payload
        return self

    def execute(self):
        if self._update_payload is not None:
            self._updates.append({"id": self._update_id, "payload": self._update_payload})
            return _FakeResponse(data=[{"id": self._update_id}])
        return self._response


class _FakeClient:
    def __init__(self, transactions_responses=None, categories_responses=None):
        self._transactions_responses = list(transactions_responses or [])
        self._categories_responses = list(categories_responses or [])
        self.updates = []

    def table(self, name):
        if name == "transactions":
            resp = (
                self._transactions_responses.pop(0)
                if self._transactions_responses
                else _FakeResponse(data=[])
            )
            return _FakeQuery(resp, self.updates)
        if name == "categories":
            resp = (
                self._categories_responses.pop(0)
                if self._categories_responses
                else _FakeResponse(data=[])
            )
            return _FakeQuery(resp, self.updates)
        raise AssertionError(f"Unexpected table: {name}")


class _FakeStreamlit:
    def __init__(self, button_returns=None, editor_return=None):
        self.session_state = {}
        self.button_returns = list(button_returns or [])
        self.editor_return = editor_return
        self.button_calls = []
        self.spinner_messages = []
        self.markdowns = []
        self.captions = []
        self.successes = []
        self.errors = []
        self.toasts = []
        self.last_data_editor_df = None
        self.column_config = _FakeColumnConfig()

    def title(self, *_args, **_kwargs):
        return None

    def error(self, message):
        self.errors.append(message)

    def stop(self):
        raise _StopCalled()

    def markdown(self, content, **_kwargs):
        self.markdowns.append(content)

    def button(self, label, **kwargs):
        self.button_calls.append({"label": label, **kwargs})
        return self.button_returns.pop(0) if self.button_returns else False

    def caption(self, text):
        self.captions.append(text)

    @contextmanager
    def spinner(self, message):
        self.spinner_messages.append(message)
        yield

    def rerun(self):
        raise _RerunCalled()

    def divider(self):
        return None

    def data_editor(self, *_args, **_kwargs):
        if _args:
            self.last_data_editor_df = _args[0]
        return self.editor_return

    def success(self, message):
        self.successes.append(message)

    def toast(self, message, **_kwargs):
        self.toasts.append(message)


class _FakeColumnConfig:
    @staticmethod
    def DateColumn(*_args, **_kwargs):
        return {}

    @staticmethod
    def NumberColumn(*_args, **_kwargs):
        return {}

    @staticmethod
    def TextColumn(*_args, **_kwargs):
        return {}

    @staticmethod
    def SelectboxColumn(*_args, **_kwargs):
        return {}


def test_classify_button_disabled_when_no_pending(monkeypatch):
    import src.pages.transactions as transactions

    fake_st = _FakeStreamlit(button_returns=[False])
    fake_client = _FakeClient(
        transactions_responses=[
            _FakeResponse(data=[], count=0),  # unclassified count
            _FakeResponse(data=[]),  # all transactions
        ]
    )
    monkeypatch.setattr(transactions, "st", fake_st)
    monkeypatch.setattr(transactions, "get_current_user", lambda: {"id": "user-1"})
    monkeypatch.setattr(transactions, "get_authenticated_client", lambda: fake_client)

    transactions.show_transactions()

    classify_button = fake_st.button_calls[0]
    assert classify_button["label"] == "Classificar transacoes nao classificadas"
    assert classify_button["disabled"] is True
    assert "Todas as transacoes ja foram classificadas" in fake_st.captions


@pytest.mark.parametrize(
    ("result", "expected_key", "expected_value"),
    [
        ({"success": True, "classified_count": 3}, "classify_success", "3 transacoes classificadas com sucesso!"),
        ({"success": False, "error": "Erro X"}, "classify_error", "Erro X"),
    ],
)
def test_classify_click_triggers_pipeline_and_feedback(
    monkeypatch, result, expected_key, expected_value
):
    import src.pages.transactions as transactions

    fake_st = _FakeStreamlit(button_returns=[True])
    fake_client = _FakeClient(
        transactions_responses=[
            _FakeResponse(data=[], count=2),  # unclassified count
            _FakeResponse(data=[]),  # all transactions
        ]
    )
    called = {"value": False}

    def _trigger(client, user_id):
        called["value"] = True
        assert client is fake_client
        assert user_id == "user-1"
        return result

    monkeypatch.setattr(transactions, "st", fake_st)
    monkeypatch.setattr(transactions, "get_current_user", lambda: {"id": "user-1"})
    monkeypatch.setattr(transactions, "get_authenticated_client", lambda: fake_client)
    monkeypatch.setattr(transactions, "trigger_classification", _trigger)

    with pytest.raises(_RerunCalled):
        transactions.show_transactions()

    assert called["value"] is True
    assert "Classificando... Isso pode levar alguns segundos." in fake_st.spinner_messages
    assert fake_st.session_state[expected_key] == expected_value


def test_empty_state_when_no_transactions(monkeypatch):
    import src.pages.transactions as transactions

    fake_st = _FakeStreamlit(button_returns=[False])
    fake_client = _FakeClient(
        transactions_responses=[
            _FakeResponse(data=[], count=1),  # unclassified count
            _FakeResponse(data=[]),  # all transactions
        ]
    )
    monkeypatch.setattr(transactions, "st", fake_st)
    monkeypatch.setattr(transactions, "get_current_user", lambda: {"id": "user-1"})
    monkeypatch.setattr(transactions, "get_authenticated_client", lambda: fake_client)

    transactions.show_transactions()

    rendered = "\n".join(fake_st.markdowns)
    assert "Nenhuma transacao encontrada" in rendered


def test_table_marks_only_low_confidence_rows_for_correction(monkeypatch):
    import src.pages.transactions as transactions

    tx_rows = [
        {
            "id": "t1",
            "date": "2026-04-07",
            "description": "Compra 1",
            "merchant_name": "Loja 1",
            "amount": 20.0,
            "confidence_score": "low",
            "manually_reviewed": False,
            "categories": {"name": "Outros", "emoji": "📦"},
        },
        {
            "id": "t2",
            "date": "2026-04-06",
            "description": "Compra 2",
            "merchant_name": "Loja 2",
            "amount": 35.0,
            "confidence_score": "high",
            "manually_reviewed": False,
            "categories": {"name": "Compras", "emoji": "🛍️"},
        },
    ]
    fake_st = _FakeStreamlit(button_returns=[False])
    fake_client = _FakeClient(
        transactions_responses=[
            _FakeResponse(data=[], count=1),  # unclassified count
            _FakeResponse(data=tx_rows),  # all transactions
        ],
        categories_responses=[_FakeResponse(data=[])],
    )
    monkeypatch.setattr(transactions, "st", fake_st)
    monkeypatch.setattr(transactions, "get_current_user", lambda: {"id": "user-1"})
    monkeypatch.setattr(transactions, "get_authenticated_client", lambda: fake_client)

    def _echo_df(df, **_kwargs):
        fake_st.last_data_editor_df = df
        return df

    fake_st.data_editor = _echo_df
    transactions.show_transactions()

    rendered_df = fake_st.last_data_editor_df
    assert rendered_df.loc[0, "Confianca"] == "? Baixa"
    assert rendered_df.loc[0, "Corrigir"] == ""
    assert pd.isna(rendered_df.loc[1, "Corrigir"])


def test_correction_updates_transaction_and_tracks_corrected_ids(monkeypatch):
    import src.pages.transactions as transactions

    tx_rows = [
        {
            "id": "t1",
            "date": "2026-04-07",
            "description": "Compra 1",
            "merchant_name": "Loja 1",
            "amount": 20.0,
            "confidence_score": "low",
            "manually_reviewed": False,
            "categories": {"name": "Outros", "emoji": "📦"},
        }
    ]
    categories = [{"id": "c1", "name": "Compras", "emoji": "🛍️"}]
    edited = pd.DataFrame(
        [
            {
                "Data": "2026-04-07",
                "Descricao": "Compra 1",
                "Merchant": "Loja 1",
                "Categoria": "📦 Outros",
                "Valor": 20.0,
                "Confianca": "? Baixa",
                "Corrigir": "🛍️ Compras",
            }
        ]
    )

    fake_st = _FakeStreamlit(button_returns=[False], editor_return=edited)
    fake_client = _FakeClient(
        transactions_responses=[
            _FakeResponse(data=[], count=1),  # unclassified count
            _FakeResponse(data=tx_rows),  # all transactions
        ],
        categories_responses=[_FakeResponse(data=categories)],
    )
    monkeypatch.setattr(transactions, "st", fake_st)
    monkeypatch.setattr(transactions, "get_current_user", lambda: {"id": "user-1"})
    monkeypatch.setattr(transactions, "get_authenticated_client", lambda: fake_client)

    with pytest.raises(_RerunCalled):
        transactions.show_transactions()

    assert isinstance(fake_st.session_state["corrected_ids"], set)
    assert fake_client.updates == [
        {
            "id": "t1",
            "payload": {
                "category_id": "c1",
                "confidence_score": "high",
                "manually_reviewed": True,
            },
        }
    ]


def test_feedback_messages_are_shown_and_cleared_from_session(monkeypatch):
    import src.pages.transactions as transactions

    fake_st = _FakeStreamlit(button_returns=[False])
    fake_st.session_state["classify_success"] = "ok"
    fake_st.session_state["classify_error"] = "erro"
    fake_client = _FakeClient(
        transactions_responses=[
            _FakeResponse(data=[], count=0),
            _FakeResponse(data=[]),
        ]
    )
    monkeypatch.setattr(transactions, "st", fake_st)
    monkeypatch.setattr(transactions, "get_current_user", lambda: {"id": "user-1"})
    monkeypatch.setattr(transactions, "get_authenticated_client", lambda: fake_client)

    transactions.show_transactions()

    assert "ok" in fake_st.successes
    assert "erro" in fake_st.errors
    assert "classify_success" not in fake_st.session_state
    assert "classify_error" not in fake_st.session_state


def test_invalid_correction_selection_is_ignored(monkeypatch):
    import src.pages.transactions as transactions

    tx_rows = [
        {
            "id": "t1",
            "date": "2026-04-07",
            "description": "Compra 1",
            "merchant_name": "Loja 1",
            "amount": 20.0,
            "confidence_score": "low",
            "manually_reviewed": False,
            "categories": {"name": "Outros", "emoji": "📦"},
        }
    ]
    categories = [{"id": "c1", "name": "Compras", "emoji": "🛍️"}]
    edited = pd.DataFrame(
        [
            {
                "Data": "2026-04-07",
                "Descricao": "Compra 1",
                "Merchant": "Loja 1",
                "Categoria": "📦 Outros",
                "Valor": 20.0,
                "Confianca": "? Baixa",
                "Corrigir": "Categoria Invalida",
            }
        ]
    )

    fake_st = _FakeStreamlit(button_returns=[False], editor_return=edited)
    fake_client = _FakeClient(
        transactions_responses=[
            _FakeResponse(data=[], count=1),
            _FakeResponse(data=tx_rows),
        ],
        categories_responses=[_FakeResponse(data=categories)],
    )
    monkeypatch.setattr(transactions, "st", fake_st)
    monkeypatch.setattr(transactions, "get_current_user", lambda: {"id": "user-1"})
    monkeypatch.setattr(transactions, "get_authenticated_client", lambda: fake_client)

    transactions.show_transactions()

    assert fake_client.updates == []
    assert fake_st.toasts == []


def test_already_corrected_id_does_not_patch_again(monkeypatch):
    import src.pages.transactions as transactions

    tx_rows = [
        {
            "id": "t1",
            "date": "2026-04-07",
            "description": "Compra 1",
            "merchant_name": "Loja 1",
            "amount": 20.0,
            "confidence_score": "low",
            "manually_reviewed": False,
            "categories": {"name": "Outros", "emoji": "📦"},
        }
    ]
    categories = [{"id": "c1", "name": "Compras", "emoji": "🛍️"}]
    edited = pd.DataFrame(
        [
            {
                "Data": "2026-04-07",
                "Descricao": "Compra 1",
                "Merchant": "Loja 1",
                "Categoria": "📦 Outros",
                "Valor": 20.0,
                "Confianca": "? Baixa",
                "Corrigir": "🛍️ Compras",
            }
        ]
    )

    fake_st = _FakeStreamlit(button_returns=[False], editor_return=edited)
    fake_st.session_state["corrected_ids"] = {"t1"}
    fake_client = _FakeClient(
        transactions_responses=[
            _FakeResponse(data=[], count=1),
            _FakeResponse(data=tx_rows),
        ],
        categories_responses=[_FakeResponse(data=categories)],
    )
    monkeypatch.setattr(transactions, "st", fake_st)
    monkeypatch.setattr(transactions, "get_current_user", lambda: {"id": "user-1"})
    monkeypatch.setattr(transactions, "get_authenticated_client", lambda: fake_client)

    transactions.show_transactions()

    assert fake_client.updates == []
