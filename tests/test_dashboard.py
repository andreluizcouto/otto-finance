"""Tests for dashboard date filter logic.

These tests validate the calculate_date_range utility that maps
user-facing period labels to (start_date, end_date) tuples.
All tests are marked as skip until the function is implemented in Plan 03.
"""

from datetime import date

import pytest

def test_date_filter_this_week():
    """'Esta semana' returns Monday of current week through today."""
    from src.pages.dashboard import calculate_date_range

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
    from src.pages.dashboard import calculate_date_range

    today = date(2026, 4, 15)
    start, end = calculate_date_range("Este mes", today)
    assert start == date(2026, 4, 1)
    assert end == date(2026, 4, 15)


def test_date_filter_last_3_months():
    """'Ultimos 3 meses' returns 1st of month 2 months prior through today."""
    from src.pages.dashboard import calculate_date_range

    today = date(2026, 4, 15)
    start, end = calculate_date_range("Ultimos 3 meses", today)
    assert start == date(2026, 2, 1)
    assert end == date(2026, 4, 15)
