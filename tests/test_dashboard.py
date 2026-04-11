"""Tests for dashboard date filter logic.

These tests validate the calculate_date_range utility that maps
user-facing period labels to (start_date, end_date) tuples.
All tests are marked as skip until the function is implemented in Plan 03.
"""

from datetime import date
from types import SimpleNamespace

import pandas as pd
import pytest

def test_date_filter_this_week():
    """'Esta semana' returns Monday of current week through today."""
    from backend.modules.dashboard.services import calculate_date_range

    # Monday 2026-04-06
    today_monday = date(2026, 4, 6)
    start, end = calculate_date_range("Esta semana", today_monday)
    assert start == date(2026, 4, 6)
    assert end == date(2026, 4, 6)

    # Wednesday 2026-04-08 -- start should still be Monday
    today_wednesday = date(2026, 4, 8)
    start, end = calculate_date_range("Esta semana", today_wednesday)
    assert start == date(2026, 4, 6)
    assert end == date(2026, 4, 8)


def test_date_filter_this_month():
    """'Este mes' returns 1st of current month through today."""
    from backend.modules.dashboard.services import calculate_date_range

    today = date(2026, 4, 15)
    start, end = calculate_date_range("Este mes", today)
    assert start == date(2026, 4, 1)
    assert end == date(2026, 4, 15)


def test_date_filter_last_3_months():
    """'Ultimos 3 meses' returns 1st of month 2 months prior through today."""
    from backend.modules.dashboard.services import calculate_date_range

    today = date(2026, 4, 15)
    start, end = calculate_date_range("Ultimos 3 meses", today)
    assert start == date(2026, 2, 1)
    assert end == date(2026, 4, 15)


def test_compute_kpis_handles_transactions_without_category():
    """KPI calculation should not fail when category_id is missing/null."""
    from backend.modules.dashboard.services import compute_kpis

    df = pd.DataFrame(
        [
            {"amount": 10.0, "date": pd.Timestamp("2026-04-10"), "category_id": None},
            {"amount": 20.0, "date": pd.Timestamp("2026-04-11"), "category_id": None},
        ]
    )
    kpis = compute_kpis(
        df=df,
        categories={},
        start_date=date(2026, 4, 1),
        end_date=date(2026, 4, 11),
        all_transactions=[],
    )

    assert kpis["total_spent"] == 30.0
    assert kpis["top_category"] == "-"
    assert kpis["top_category_total"] == 0.0


def test_build_flow_summary_calculates_totals_and_status():
    from backend.modules.dashboard.services import _build_flow_summary

    df = pd.DataFrame(
        [
            {"amount": 1200.0},
            {"amount": -350.0},
            {"amount": -150.0},
        ]
    )

    flow = _build_flow_summary(df)

    assert flow["inflow_total"] == 1200.0
    assert flow["outflow_total"] == 500.0
    assert flow["net_flow"] == 700.0
    assert flow["net_flow_status"] == "positive"
    assert flow["inflow_total_label"] == "R$ 1.200,00"
    assert flow["outflow_total_label"] == "R$ 500,00"
    assert flow["net_flow_label"] == "R$ 700,00"


def test_build_category_insights_calculates_share_delta_and_trend():
    from backend.modules.dashboard.services import _build_category_insights

    start_date = date(2026, 4, 8)
    end_date = date(2026, 4, 14)
    df = pd.DataFrame(
        [
            {"amount": -100.0, "category_id": "cat_food", "date": pd.Timestamp("2026-04-10")},
            {"amount": -50.0, "category_id": "cat_transport", "date": pd.Timestamp("2026-04-11")},
            {"amount": 300.0, "category_id": "cat_salary", "date": pd.Timestamp("2026-04-12")},
        ]
    )
    all_transactions = [
        {"amount": -80.0, "category_id": "cat_food", "date": "2026-04-02"},
        {"amount": -50.0, "category_id": "cat_transport", "date": "2026-04-04"},
        {"amount": -100.0, "category_id": "cat_food", "date": "2026-04-10"},
        {"amount": -50.0, "category_id": "cat_transport", "date": "2026-04-11"},
        {"amount": 300.0, "category_id": "cat_salary", "date": "2026-04-12"},
    ]
    cat_by_id = {
        "cat_food": {"id": "cat_food", "name": "Alimentacao", "emoji": "A"},
        "cat_transport": {"id": "cat_transport", "name": "Transporte", "emoji": "T"},
    }

    insights = _build_category_insights(
        df=df,
        all_transactions=all_transactions,
        start_date=start_date,
        end_date=end_date,
        cat_by_id=cat_by_id,
    )

    assert len(insights) == 2
    assert insights[0]["category_id"] == "cat_food"
    assert insights[0]["share_pct"] == 66.7
    assert insights[0]["delta_pct"] == 25.0
    assert insights[0]["trend"] == "up"
    assert insights[1]["category_id"] == "cat_transport"
    assert insights[1]["share_pct"] == 33.3
    assert insights[1]["delta_pct"] == 0.0
    assert insights[1]["trend"] == "flat"


def test_build_budget_progress_calculates_statuses():
    from backend.modules.dashboard.services import _build_budget_progress

    category_insights = [
        {"category_id": "cat_a", "category_name": "A", "current_amount": 50.0},
        {"category_id": "cat_b", "category_name": "B", "current_amount": 85.0},
        {"category_id": "cat_c", "category_name": "C", "current_amount": 120.0},
        {"category_id": "cat_d", "category_name": "D", "current_amount": 40.0},
    ]
    budgets_by_category = {
        "cat_a": 100.0,
        "cat_b": 100.0,
        "cat_c": 100.0,
    }

    progress = _build_budget_progress(category_insights, budgets_by_category)
    by_id = {item["category_id"]: item for item in progress}

    assert by_id["cat_a"]["status"] == "on_track"
    assert by_id["cat_a"]["progress_pct"] == 50.0
    assert by_id["cat_b"]["status"] == "warning"
    assert by_id["cat_b"]["progress_pct"] == 85.0
    assert by_id["cat_c"]["status"] == "exceeded"
    assert by_id["cat_c"]["progress_pct"] == 120.0
    assert by_id["cat_d"]["status"] == "no_limit"
    assert by_id["cat_d"]["progress_pct"] == 0.0


class _BudgetQuery:
    def __init__(self, rows):
        self.rows = rows

    def select(self, *_args, **_kwargs):
        return self

    def eq(self, *_args, **_kwargs):
        return self

    def execute(self):
        return SimpleNamespace(data=self.rows)


class _BudgetClient:
    def __init__(self, rows):
        self.rows = rows

    def table(self, _name):
        return _BudgetQuery(self.rows)


def test_load_user_budgets_returns_category_limit_map():
    from backend.modules.dashboard.services import _load_user_budgets

    client = _BudgetClient(
        [
            {"category_id": "cat_a", "monthly_limit": 120.5},
            {"category_id": "cat_b", "monthly_limit": 350},
        ]
    )

    budgets = _load_user_budgets(client, "user-1")

    assert budgets == {"cat_a": 120.5, "cat_b": 350.0}


def test_dashboard_payload_includes_flow_and_budget_progress(monkeypatch: pytest.MonkeyPatch):
    from backend.modules.dashboard import services

    def _fake_load_dashboard_data(_client, _user_id, _start_date, _end_date):
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
        }
        return {
            "transactions": [
                {
                    "id": "txn-1",
                    "amount": -100.0,
                    "date": "2026-04-10",
                    "description": "Mercado",
                    "merchant_name": "Mercado",
                    "category_id": "cat_food",
                },
                {
                    "id": "txn-2",
                    "amount": 800.0,
                    "date": "2026-04-11",
                    "description": "Salario",
                    "merchant_name": "Empresa",
                    "category_id": None,
                },
            ],
            "all_transactions": [
                {"id": "old-1", "amount": -80.0, "date": "2026-03-25", "category_id": "cat_food"},
                {"id": "new-1", "amount": -100.0, "date": "2026-04-10", "category_id": "cat_food"},
            ],
            "categories": categories,
        }

    monkeypatch.setattr(services, "load_dashboard_data", _fake_load_dashboard_data)
    monkeypatch.setattr(services, "_load_user_budgets", lambda _client, _user_id: {"cat_food": 90.0})

    payload = services.get_dashboard_payload(client=object(), user_id="user-1", period="Este mes")

    assert "flow" in payload
    assert "category_insights" in payload
    assert "budget_progress" in payload
    assert payload["flow"]["inflow_total"] == 800.0
    assert payload["flow"]["outflow_total"] == 100.0
    assert payload["flow"]["net_flow"] == 700.0
    assert payload["flow"]["net_flow_status"] == "positive"
