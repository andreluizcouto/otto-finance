import pytest

# These tests will be activated (skip removed) after Wave 1 creates src/data/classifier.py


def test_build_payload():
    """AICL-01: build_classification_payload() returns dict with user_id, transactions[], categories[].
    transactions items must only contain fields: id, description, merchant_name, amount.
    No extra fields (e.g. user_id per-transaction, notes, payment_method) allowed.
    """
    from backend.modules.transactions.services import build_classification_payload
    transactions = [
        {"id": "abc", "description": "RCHLO COMPRA", "merchant_name": "RCHLO", "amount": 199.90,
         "user_id": "u1", "notes": "ignore this"},
    ]
    categories = [{"id": "c1", "name": "Compras", "slug": "compras"}]
    payload = build_classification_payload("u1", transactions, categories)
    assert payload["user_id"] == "u1"
    assert len(payload["transactions"]) == 1
    txn = payload["transactions"][0]
    assert set(txn.keys()) == {"id", "description", "merchant_name", "amount"}
    assert "notes" not in txn
    assert "user_id" not in txn


def test_build_payload_normalizes_merchant_name_runtime():
    """AICL-02 gap closure: payload builder must normalize cryptic merchant names."""
    from backend.modules.transactions.services import build_classification_payload

    transactions = [
        {"id": "t1", "description": "Compra", "merchant_name": "RCHLO", "amount": 120.0},
        {"id": "t2", "description": "Assinatura", "merchant_name": "PAG*XYZ", "amount": 39.9},
        {"id": "t3", "description": "Streaming", "merchant_name": "NF123", "amount": 55.0},
    ]
    categories = [{"id": "c1", "name": "Compras", "slug": "compras"}]

    payload = build_classification_payload("u1", transactions, categories)
    merchant_names = [t["merchant_name"] for t in payload["transactions"]]
    assert merchant_names == ["Riachuelo", "PagSeguro", "Netflix"]


def test_merchant_lookup_table():
    """AICL-02: resolve_merchant_name() maps cryptic Brazilian codes to readable names.
    RCHLO -> Riachuelo, MELI -> Mercado Livre, NF* prefix -> Netflix, SPT* prefix -> Spotify.
    """
    from backend.modules.transactions.services import resolve_merchant_name
    assert resolve_merchant_name("RCHLO") == "Riachuelo"
    assert resolve_merchant_name("MELI") == "Mercado Livre"
    assert resolve_merchant_name("NETFLIX") == "Netflix"
    assert resolve_merchant_name("SPT2345") == "Spotify"
    assert resolve_merchant_name("UNKNOWN_XYZ") == "UNKNOWN_XYZ"  # passthrough


def test_confidence_mapping():
    """AICL-03 + D-10: map_confidence_score() maps float to 3-tier enum string.
    >= 0.8 -> 'high', 0.5 <= x < 0.8 -> 'medium', < 0.5 -> 'low'.
    Boundary values must be exact.
    """
    from backend.modules.transactions.services import map_confidence_score
    assert map_confidence_score(1.0) == "high"
    assert map_confidence_score(0.8) == "high"
    assert map_confidence_score(0.79) == "medium"
    assert map_confidence_score(0.5) == "medium"
    assert map_confidence_score(0.49) == "low"
    assert map_confidence_score(0.0) == "low"


def test_unclassified_query():
    """AICL-04 + D-02: get_unclassified_transactions() fetches only rows where
    category_id IS NULL OR confidence_score IS NULL AND manually_reviewed IS NOT TRUE.
    Uses supabase .or_() filter, not separate queries.
    """
    from backend.modules.transactions.services import get_unclassified_transactions
    import unittest.mock as mock
    # Build a mock client that records the filter args
    client = mock.MagicMock()
    resp = mock.MagicMock()
    resp.data = []
    client.table.return_value.select.return_value.eq.return_value.or_.return_value.eq.return_value.execute.return_value = resp
    get_unclassified_transactions(client, "user-123")
    # Verify .or_() was called with the correct PostgREST filter string
    call_args = client.table.return_value.select.return_value.eq.return_value.or_.call_args
    or_filter = call_args[0][0]
    assert "category_id.is.null" in or_filter
    assert "confidence_score.is.null" in or_filter
