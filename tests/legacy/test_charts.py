"""Tests for Plotly chart builder functions.

These tests validate that chart builders return correct Plotly Figure objects
with the expected trace types, layout properties, and formatting.
"""

import pytest
import pandas as pd
import plotly.graph_objects as go

from backend.modules.shared.utils import format_brl


def test_format_brl_basic():
    """format_brl formats a standard decimal as Brazilian Real."""
    assert format_brl(1234.56) == "R$ 1.234,56"


def test_format_brl_zero():
    """format_brl formats zero correctly."""
    assert format_brl(0) == "R$ 0,00"


def test_format_brl_large():
    """format_brl formats large numbers with correct thousand separators."""
    assert format_brl(1000000.99) == "R$ 1.000.000,99"


@pytest.mark.skip(reason="create_donut_chart is deprecated/removed")
def test_donut_chart():
    pass

@pytest.mark.skip(reason="create_trend_chart is deprecated/removed")
def test_trend_chart():
    pass

@pytest.mark.skip(reason="create_comparison_chart is deprecated/removed")
def test_comparison_chart():
    pass
