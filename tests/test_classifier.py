from unittest import mock

import httpx
import pytest

# These tests will be activated (skip removed) after Wave 1 creates src/data/classifier.py


def test_build_payload():
    """AICL-01: build_classification_payload() returns dict with user_id, transactions[], categories[].
    transactions items must only contain fields: id, description, merchant_name, amount.
    No extra fields (e.g. user_id per-transaction, notes, payment_method) allowed.
    """
    from src.data.classifier import build_classification_payload
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


def test_merchant_lookup_table():
    """AICL-02: resolve_merchant_name() maps cryptic Brazilian codes to readable names.
    RCHLO -> Riachuelo, MELI -> Mercado Livre, NF* prefix -> Netflix, SPT* prefix -> Spotify.
    """
    from src.data.classifier import resolve_merchant_name
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
    from src.data.classifier import map_confidence_score
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
    from src.data.classifier import get_unclassified_transactions
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


def test_json_schema_structure():
    """AICL-06 + D-08: get_openai_json_schema() returns a dict with strict:true and
    category_slug enum containing all 10 Brazilian category slugs.
    This schema is embedded in the Make.com HTTP module body as documentation.
    """
    from src.data.classifier import get_openai_json_schema
    schema = get_openai_json_schema()
    assert schema["strict"] is True
    assert schema["name"] == "classification_result"
    props = schema["schema"]["properties"]
    assert "category_slug" in props
    assert "confidence" in props
    slugs = props["category_slug"]["enum"]
    for expected in ["alimentacao", "transporte", "moradia", "saude", "lazer",
                     "educacao", "compras", "assinaturas", "delivery", "outros"]:
        assert expected in slugs, f"Missing slug: {expected}"
    assert schema["schema"].get("additionalProperties") is False


def test_trigger_classification_fallbacks_to_unclassified_length():
    """trigger_classification() uses len(unclassified) when webhook response omits classified_count."""
    from src.data import classifier

    client = mock.MagicMock()
    client.table.return_value.select.return_value.order.return_value.order.return_value.execute.return_value.data = [
        {"id": "c1", "name": "Compras", "slug": "compras"}
    ]
    unclassified = [{"id": "t1", "description": "x", "merchant_name": "RCHLO", "amount": 10.0}]

    fake_response = mock.MagicMock()
    fake_response.raise_for_status.return_value = None
    fake_response.json.return_value = {}

    with (
        mock.patch.object(classifier, "get_unclassified_transactions", return_value=unclassified),
        mock.patch.object(classifier, "get_make_webhook_url", return_value="https://hook.example"),
        mock.patch.object(classifier.httpx, "post", return_value=fake_response) as post_mock,
    ):
        result = classifier.trigger_classification(client, "user-1")

    assert result == {"success": True, "classified_count": 1}
    post_mock.assert_called_once()


def test_trigger_classification_timeout_error_message():
    """trigger_classification() returns timeout-specific error copy."""
    from src.data import classifier

    client = mock.MagicMock()
    client.table.return_value.select.return_value.order.return_value.order.return_value.execute.return_value.data = [
        {"id": "c1", "name": "Compras", "slug": "compras"}
    ]
    unclassified = [{"id": "t1", "description": "x", "merchant_name": "RCHLO", "amount": 10.0}]

    with (
        mock.patch.object(classifier, "get_unclassified_transactions", return_value=unclassified),
        mock.patch.object(classifier, "get_make_webhook_url", return_value="https://hook.example"),
        mock.patch.object(
            classifier.httpx, "post", side_effect=httpx.TimeoutException("timeout")
        ),
    ):
        result = classifier.trigger_classification(client, "user-1")

    assert result["success"] is False
    assert "nao respondeu" in result["error"]


def test_trigger_classification_generic_error_message():
    """trigger_classification() returns generic integration error copy on unexpected exceptions."""
    from src.data import classifier

    client = mock.MagicMock()
    client.table.return_value.select.return_value.order.return_value.order.return_value.execute.return_value.data = [
        {"id": "c1", "name": "Compras", "slug": "compras"}
    ]
    unclassified = [{"id": "t1", "description": "x", "merchant_name": "RCHLO", "amount": 10.0}]

    with (
        mock.patch.object(classifier, "get_unclassified_transactions", return_value=unclassified),
        mock.patch.object(classifier, "get_make_webhook_url", return_value="https://hook.example"),
        mock.patch.object(classifier.httpx, "post", side_effect=RuntimeError("boom")),
    ):
        result = classifier.trigger_classification(client, "user-1")

    assert result["success"] is False
    assert "Erro ao conectar com o servico de classificacao" in result["error"]
