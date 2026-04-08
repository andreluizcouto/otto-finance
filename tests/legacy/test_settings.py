from __future__ import annotations

from contextlib import contextmanager
from unittest.mock import MagicMock


class _RerunCalled(Exception):
    pass


class _FakeStreamlit:
    def __init__(self):
        self.session_state = {}

    def title(self, *_args, **_kwargs):
        return None

    def markdown(self, *_args, **_kwargs):
        return None

    def header(self, *_args, **_kwargs):
        return None

    def text_input(self, *_args, **_kwargs):
        return ""

    def divider(self):
        return None

    def caption(self, *_args, **_kwargs):
        return None

    def info(self, *_args, **_kwargs):
        return None

    def subheader(self, *_args, **_kwargs):
        return None

    def color_picker(self, *_args, **_kwargs):
        return "#6366F1"

    def form_submit_button(self, *_args, **_kwargs):
        return False

    @contextmanager
    def form(self, *_args, **_kwargs):
        yield

    @contextmanager
    def spinner(self, *_args, **_kwargs):
        yield

    def button(self, label, **_kwargs):
        return label == "Gerar Dados"

    def columns(self, n):
        return [self for _ in range(n)]

    def write(self, *_args, **_kwargs):
        return None

    def success(self, *_args, **_kwargs):
        return None

    def error(self, *_args, **_kwargs):
        return None

    def warning(self, *_args, **_kwargs):
        return None

    def rerun(self):
        raise _RerunCalled()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


def test_generate_data_triggers_automatic_classification(monkeypatch):
    import src.pages.settings as settings

    fake_st = _FakeStreamlit()
    fake_client = MagicMock()
    fake_client.table.return_value.select.return_value.eq.return_value.execute.side_effect = [
        MagicMock(count=0),  # transactions count
        MagicMock(data=[{"slug": "compras", "id": "c1"}]),  # default categories
    ]

    trigger_called = {"value": False}

    def _trigger(client, user_id):
        trigger_called["value"] = True
        assert client is fake_client
        assert user_id == "user-1"
        return {"success": True, "classified_count": 3}

    monkeypatch.setattr(settings, "st", fake_st)
    monkeypatch.setattr(settings, "get_authenticated_client", lambda: fake_client)
    monkeypatch.setattr(
        settings,
        "get_current_user",
        lambda: {"id": "user-1", "email": "u@x.com", "created_at": "2026-04-01T00:00:00"},
    )
    monkeypatch.setattr(settings, "generate_transactions", lambda *_: [{"id": "t1"}])
    monkeypatch.setattr(settings, "trigger_classification", _trigger, raising=False)

    with __import__("pytest").raises(_RerunCalled):
        settings.show_settings()

    assert trigger_called["value"] is True

