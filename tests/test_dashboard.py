from datetime import date

import pytest


def test_date_filter_this_week():
    from backend.modules.dashboard.services import calculate_date_range

    today_monday = date(2026, 4, 6)
    start, end = calculate_date_range("Esta semana", today_monday)
    assert start == date(2026, 4, 6)
    assert end == date(2026, 4, 6)

    today_wednesday = date(2026, 4, 8)
    start, end = calculate_date_range("Esta semana", today_wednesday)
    assert start == date(2026, 4, 6)
    assert end == date(2026, 4, 8)


def test_date_filter_this_month():
    from backend.modules.dashboard.services import calculate_date_range

    today = date(2026, 4, 15)
    start, end = calculate_date_range("Este mes", today)
    assert start == date(2026, 4, 1)
    assert end == date(2026, 4, 15)


def test_date_filter_last_3_months():
    from backend.modules.dashboard.services import calculate_date_range

    today = date(2026, 4, 15)
    start, end = calculate_date_range("Ultimos 3 meses", today)
    assert start == date(2026, 2, 1)
    assert end == date(2026, 4, 15)


def _build_fake_dashboard_data():
    categories = {
        "alimentacao": {
            "id": "cat_food",
            "name": "Alimentacao",
            "emoji": "A",
            "color_hex": "#111111",
        },
        "transporte": {
            "id": "cat_transport",
            "name": "Transporte",
            "emoji": "T",
            "color_hex": "#222222",
        },
        "lazer": {
            "id": "cat_fun",
            "name": "Lazer",
            "emoji": "L",
            "color_hex": "#333333",
        },
        "saude": {
            "id": "cat_health",
            "name": "Saude",
            "emoji": "S",
            "color_hex": "#444444",
        },
    }

    transactions = [
        {
            "id": "txn-1",
            "amount": -300.0,
            "date": "2026-04-10",
            "description": "Mercado",
            "merchant_name": "Mercado",
            "category_id": "cat_food",
        },
        {
            "id": "txn-2",
            "amount": -120.0,
            "date": "2026-04-11",
            "description": "Uber",
            "merchant_name": "Uber",
            "category_id": "cat_transport",
        },
        {
            "id": "txn-3",
            "amount": -80.0,
            "date": "2026-04-12",
            "description": "Cinema",
            "merchant_name": "Cinema",
            "category_id": "cat_fun",
        },
        {
            "id": "txn-4",
            "amount": -40.0,
            "date": "2026-04-13",
            "description": "Farmacia",
            "merchant_name": "Farmacia",
            "category_id": "cat_health",
        },
        {
            "id": "txn-5",
            "amount": 3000.0,
            "date": "2026-04-14",
            "description": "Salario",
            "merchant_name": "Empresa",
            "category_id": None,
        },
    ]

    all_transactions = [
        {"id": "old-1", "amount": -200.0, "date": "2026-04-01", "category_id": "cat_food"},
        {"id": "old-2", "amount": -150.0, "date": "2026-04-02", "category_id": "cat_transport"},
        {"id": "old-3", "amount": -40.0, "date": "2026-04-03", "category_id": "cat_health"},
        {"id": "new-1", "amount": -300.0, "date": "2026-04-10", "category_id": "cat_food"},
        {"id": "new-2", "amount": -120.0, "date": "2026-04-11", "category_id": "cat_transport"},
        {"id": "new-3", "amount": -80.0, "date": "2026-04-12", "category_id": "cat_fun"},
        {"id": "new-4", "amount": -40.0, "date": "2026-04-13", "category_id": "cat_health"},
    ]

    return {
        "transactions": transactions,
        "all_transactions": all_transactions,
        "categories": categories,
    }


def test_dashboard_payload_contract_is_v1_core_only(monkeypatch: pytest.MonkeyPatch):
    from backend.modules.dashboard import services

    monkeypatch.setattr(
        services, "calculate_date_range", lambda _period: (date(2026, 4, 8), date(2026, 4, 14))
    )
    monkeypatch.setattr(services, "load_dashboard_data", lambda *_args, **_kwargs: _build_fake_dashboard_data())
    monkeypatch.setattr(
        services,
        "_load_user_budgets",
        lambda _client, _user_id: {
            "cat_food": 180.0,
            "cat_transport": 150.0,
            "cat_fun": 50.0,
            "cat_health": 20.0,
        },
    )

    payload = services.get_dashboard_payload(client=object(), user_id="user-1", period="Este mes")

    assert set(payload.keys()) == {
        "upload",
        "classification",
        "categories",
        "comparison",
        "saving_tips",
    }
    assert payload["upload"]["cta_label"]
    assert payload["classification"]["cta_label"]


def test_dashboard_payload_categories_returns_ranked_spend_with_share(monkeypatch: pytest.MonkeyPatch):
    from backend.modules.dashboard import services

    monkeypatch.setattr(
        services, "calculate_date_range", lambda _period: (date(2026, 4, 8), date(2026, 4, 14))
    )
    monkeypatch.setattr(services, "load_dashboard_data", lambda *_args, **_kwargs: _build_fake_dashboard_data())
    monkeypatch.setattr(services, "_load_user_budgets", lambda *_args, **_kwargs: {})

    payload = services.get_dashboard_payload(client=object(), user_id="user-1", period="Este mes")
    categories = payload["categories"]

    assert [item["category_id"] for item in categories] == [
        "cat_food",
        "cat_transport",
        "cat_fun",
        "cat_health",
    ]
    assert categories[0]["amount_label"] == "R$ 300,00"
    assert categories[0]["share_pct"] == 55.6
    assert categories[1]["share_pct"] == 22.2


def test_dashboard_payload_comparison_returns_trend_and_delta(monkeypatch: pytest.MonkeyPatch):
    from backend.modules.dashboard import services

    monkeypatch.setattr(
        services, "calculate_date_range", lambda _period: (date(2026, 4, 8), date(2026, 4, 14))
    )
    monkeypatch.setattr(services, "load_dashboard_data", lambda *_args, **_kwargs: _build_fake_dashboard_data())
    monkeypatch.setattr(services, "_load_user_budgets", lambda *_args, **_kwargs: {})

    payload = services.get_dashboard_payload(client=object(), user_id="user-1", period="Este mes")
    by_id = {item["category_id"]: item for item in payload["comparison"]}

    assert by_id["cat_food"]["trend"] == "up"
    assert by_id["cat_food"]["delta_pct"] == 50.0
    assert by_id["cat_transport"]["trend"] == "down"
    assert by_id["cat_transport"]["delta_pct"] == -20.0
    assert by_id["cat_fun"]["trend"] == "flat"
    assert by_id["cat_fun"]["delta_pct"] is None


def test_dashboard_payload_saving_tips_caps_at_three_and_prioritizes(monkeypatch: pytest.MonkeyPatch):
    from backend.modules.dashboard import services

    monkeypatch.setattr(
        services, "calculate_date_range", lambda _period: (date(2026, 4, 8), date(2026, 4, 14))
    )
    monkeypatch.setattr(services, "load_dashboard_data", lambda *_args, **_kwargs: _build_fake_dashboard_data())
    monkeypatch.setattr(
        services,
        "_load_user_budgets",
        lambda _client, _user_id: {
            "cat_food": 180.0,
            "cat_transport": 150.0,
            "cat_fun": 50.0,
            "cat_health": 20.0,
        },
    )

    payload = services.get_dashboard_payload(client=object(), user_id="user-1", period="Este mes")
    tips = payload["saving_tips"]

    assert len(tips) <= 3
    assert [item["category_id"] for item in tips] == ["cat_food", "cat_fun", "cat_health"]
    assert tips[0]["potential_saving_label"] == "R$ 120,00"
    assert all(isinstance(item["rationale"], str) and item["rationale"] for item in tips)
