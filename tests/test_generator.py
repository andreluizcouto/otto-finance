"""Tests for transaction data generator.

These tests validate the generator output against the expected schema,
amount ranges, date ranges, and category distribution. All tests are
marked as skip until the generator is implemented in Plan 02.
"""

from datetime import date, timedelta

import pytest

# Generator module does not exist yet -- created in Plan 02
pytestmark = pytest.mark.skip(reason="Implemented in Plan 02")


@pytest.fixture
def mock_category_map():
    """Map of category slugs to dicts mimicking Supabase category rows."""
    slugs = [
        "alimentacao",
        "transporte",
        "moradia",
        "saude",
        "lazer",
        "educacao",
        "compras",
        "assinaturas",
        "delivery",
        "outros",
    ]
    return {slug: {"id": f"fake-uuid-{slug}", "slug": slug} for slug in slugs}


@pytest.fixture
def generated_transactions(mock_category_map):
    from src.data.generator import generate_transactions

    return generate_transactions("fake-uid", mock_category_map)


def test_generate_returns_list(generated_transactions):
    """generate_transactions returns a list with 120-180 items (3 months * 40-60/month)."""
    assert isinstance(generated_transactions, list)
    assert 120 <= len(generated_transactions) <= 180


def test_transaction_schema(generated_transactions):
    """Each transaction dict has all required keys matching the DB schema."""
    required_keys = {
        "user_id",
        "amount",
        "date",
        "description",
        "merchant_name",
        "category_id",
        "confidence_score",
        "payment_method",
        "is_recurring",
    }
    for txn in generated_transactions:
        assert required_keys.issubset(
            txn.keys()
        ), f"Missing keys: {required_keys - txn.keys()}"


def test_amount_ranges(generated_transactions, mock_category_map):
    """Each transaction amount falls within the declared AMOUNT_RANGES for its category."""
    from src.data.generator import AMOUNT_RANGES

    # Build reverse map: category_id -> slug
    id_to_slug = {v["id"]: slug for slug, v in mock_category_map.items()}

    for txn in generated_transactions:
        slug = id_to_slug.get(txn["category_id"])
        assert slug is not None, f"Unknown category_id: {txn['category_id']}"
        lo, hi = AMOUNT_RANGES[slug]
        assert lo <= txn["amount"] <= hi, (
            f"Amount {txn['amount']} out of range [{lo}, {hi}] for {slug}"
        )


def test_dates_within_range(generated_transactions):
    """All transaction dates fall within 3 months of today."""
    today = date.today()
    three_months_ago = today - timedelta(days=93)
    for txn in generated_transactions:
        txn_date = (
            txn["date"] if isinstance(txn["date"], date) else date.fromisoformat(txn["date"])
        )
        assert three_months_ago <= txn_date <= today, (
            f"Date {txn_date} out of 3-month range"
        )


def test_category_distribution(generated_transactions, mock_category_map):
    """Weighted distribution: alimentacao appears more often than outros."""
    from src.data.generator import CATEGORY_WEIGHTS

    alim_id = mock_category_map["alimentacao"]["id"]
    outros_id = mock_category_map["outros"]["id"]

    alim_count = sum(1 for t in generated_transactions if t["category_id"] == alim_id)
    outros_count = sum(1 for t in generated_transactions if t["category_id"] == outros_id)

    assert alim_count > outros_count, (
        f"alimentacao ({alim_count}) should appear more than outros ({outros_count})"
    )
