"""Tests for Plotly chart builder functions.

These tests validate that chart builders return correct Plotly Figure objects
with the expected trace types, layout properties, and formatting.
"""

import pandas as pd
import plotly.graph_objects as go

from src.ui.charts import (
    create_comparison_chart,
    create_donut_chart,
    create_trend_chart,
    format_brl,
)


def test_format_brl_basic():
    """format_brl formats a standard decimal as Brazilian Real."""
    assert format_brl(1234.56) == "R$ 1.234,56"


def test_format_brl_zero():
    """format_brl formats zero correctly."""
    assert format_brl(0) == "R$ 0,00"


def test_format_brl_large():
    """format_brl formats large numbers with correct thousand separators."""
    assert format_brl(1000000.99) == "R$ 1.000.000,99"


def test_donut_chart():
    """create_donut_chart returns a Figure with a Pie trace and center annotation."""
    df = pd.DataFrame(
        {
            "category_name": ["Alimentacao", "Transporte", "Lazer"],
            "amount": [500.0, 300.0, 200.0],
            "color_hex": ["#EF4444", "#3B82F6", "#F59E0B"],
        }
    )
    fig = create_donut_chart(df, "R$ 1.000,00")

    assert isinstance(fig, go.Figure)
    assert len(fig.data) == 1
    assert fig.data[0].hole == 0.55
    assert fig.layout.annotations[0].text == "R$ 1.000,00"


def test_trend_chart():
    """create_trend_chart returns a Figure with a Scatter trace in lines+markers mode."""
    df = pd.DataFrame(
        {
            "period_label": ["Jan", "Fev", "Mar", "Abr"],
            "total_amount": [1000.0, 1200.0, 900.0, 1100.0],
        }
    )
    fig = create_trend_chart(df)

    assert isinstance(fig, go.Figure)
    assert fig.data[0].mode == "lines+markers"
    assert fig.data[0].fill == "tozeroy"


def test_comparison_chart():
    """create_comparison_chart returns a Figure with 2 Bar traces in group mode."""
    fig = create_comparison_chart(["A", "B"], [100, 200], [80, 150])

    assert isinstance(fig, go.Figure)
    assert len(fig.data) == 2
    assert fig.layout.barmode == "group"
