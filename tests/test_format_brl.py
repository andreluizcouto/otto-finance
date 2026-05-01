from backend.core import format_brl


def test_format_brl_basic():
    """format_brl formats a standard decimal as Brazilian Real."""
    assert format_brl(1234.56) == "R$ 1.234,56"


def test_format_brl_zero():
    """format_brl formats zero correctly."""
    assert format_brl(0) == "R$ 0,00"


def test_format_brl_large():
    """format_brl formats large numbers with correct thousand separators."""
    assert format_brl(1000000.99) == "R$ 1.000.000,99"
