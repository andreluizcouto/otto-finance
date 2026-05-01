"""
Characterization tests for _fallback_local_classification().

These tests document the *current* behavior — including imperfections flagged in TODO.md.
When a TODO is resolved, the associated test will fail and must be updated to match
the new behavior.

Do NOT mock internal helpers (_infer_category_slug, _canonical_description, etc.);
they are part of the behavior being characterized.
"""
import unittest.mock as mock

import pytest

from backend.modules.transactions.services import _fallback_local_classification

# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _make_client(learned_rows=None):
    """Minimal Supabase MagicMock wired for _fallback_local_classification.

    learned_rows: list of dicts returned by the _load_learned_category_map SELECT.
    Pass None to rely on MagicMock's default empty-iteration behavior (equivalent to []).
    """
    client = mock.MagicMock()
    if learned_rows is not None:
        (
            client.table.return_value
            .select.return_value
            .eq.return_value
            .eq.return_value
            .limit.return_value
            .execute.return_value
        ).data = learned_rows
    return client


# ---------------------------------------------------------------------------
# Category fixtures — realistic slugs from the production _CATEGORY_HINTS taxonomy
# ---------------------------------------------------------------------------

CATEGORY_OUTROS = {"id": "cat-outros", "name": "Outros", "slug": "outros"}
CATEGORY_DELIVERY = {"id": "cat-delivery", "name": "Delivery", "slug": "delivery"}
CATEGORY_ALIMENTACAO = {"id": "cat-alimentacao", "name": "Alimentação", "slug": "alimentacao"}
CATEGORY_ASSINATURAS = {"id": "cat-assinaturas", "name": "Assinaturas", "slug": "assinaturas"}
CATEGORY_COMPRAS = {"id": "cat-compras", "name": "Compras", "slug": "compras"}

ALL_CATEGORIES = [
    CATEGORY_OUTROS,
    CATEGORY_DELIVERY,
    CATEGORY_ALIMENTACAO,
    CATEGORY_ASSINATURAS,
    CATEGORY_COMPRAS,
]


# ==============================================================================
# Scenario 1: empty categories list
# ==============================================================================

def test_empty_categories_returns_failure():
    """Scenario: no categories exist — fallback_category_id cannot be resolved.

    Returns success=False with classified_count=0 and skipped_count equal to the
    number of input transactions.
    Note: 'fallback_used' key is ABSENT in this early-exit path (see TODO-CL-04).
    """
    client = _make_client()
    unclassified = [
        {"id": "txn-1", "description": "Uber viagem centro", "merchant_name": "Uber", "amount": 25.00},
        {"id": "txn-2", "description": "iFood pedido jantar", "merchant_name": "IFOOD", "amount": 48.90},
    ]
    result = _fallback_local_classification(client, "user-abc", unclassified, categories=[])

    assert result["success"] is False
    assert result["classified_count"] == 0
    assert result["skipped_count"] == 2
    assert "fallback_used" not in result


# ==============================================================================
# Scenario 2: empty unclassified list
# ==============================================================================

def test_empty_transactions_returns_zero_counts():
    """Scenario: no unclassified transactions — loop body never executes.

    Returns success=True with zero counts and fallback_used=True.
    """
    client = _make_client(learned_rows=[])
    result = _fallback_local_classification(
        client, "user-abc", unclassified=[], categories=ALL_CATEGORIES
    )

    assert result == {
        "success": True,
        "classified_count": 0,
        "skipped_count": 0,
        "fallback_used": True,
    }


# ==============================================================================
# Scenario 3: recognized by learned category map
# ==============================================================================

def test_learned_category_takes_priority_over_hints():
    """Scenario: transaction merchant matches a key from the user's manually-reviewed history.

    The learned category_id is used instead of the hint-based slug.
    Confidence is forced to 'high' for all learned matches.
    """
    learned_rows = [
        {
            "description": "iFood delivery jantar",
            "merchant_name": "iFood",
            "category_id": "cat-delivery",
        }
    ]
    client = _make_client(learned_rows=learned_rows)
    unclassified = [
        {
            "id": "txn-1",
            "description": "iFood delivery jantar",
            "merchant_name": "IFOOD",
            "amount": 38.50,
        }
    ]

    result = _fallback_local_classification(client, "user-abc", unclassified, ALL_CATEGORIES)

    assert result["classified_count"] == 1
    assert result["skipped_count"] == 0

    update_args = client.table.return_value.update.call_args[0][0]
    assert update_args["category_id"] == "cat-delivery"
    assert update_args["confidence_score"] == "high"


# ==============================================================================
# Scenario 4: recognized by keyword hint
# ==============================================================================

def test_keyword_hint_classifies_as_alimentacao_with_medium_confidence():
    """Scenario: description contains 'supermercado' — matches _CATEGORY_HINTS['alimentacao'].

    'alimentacao' is NOT in the high-confidence set {delivery, assinaturas, compras},
    so confidence is 'medium'.
    """
    client = _make_client(learned_rows=[])
    unclassified = [
        {
            "id": "txn-1",
            "description": "Supermercado Pão de Açúcar compras da semana",
            "merchant_name": None,
            "amount": 312.45,
        }
    ]

    result = _fallback_local_classification(client, "user-abc", unclassified, ALL_CATEGORIES)

    assert result["classified_count"] == 1
    assert result["skipped_count"] == 0

    update_args = client.table.return_value.update.call_args[0][0]
    assert update_args["category_id"] == "cat-alimentacao"
    assert update_args["confidence_score"] == "medium"


def test_keyword_matching_is_case_insensitive():
    """Scenario: description in UPPERCASE still matches _CATEGORY_HINTS.

    _normalize_text() converts to lowercase before substring matching.
    """
    client = _make_client(learned_rows=[])
    unclassified = [
        {
            "id": "txn-1",
            "description": "SUPERMERCADO EXTRA COMPRAS MES",
            "merchant_name": None,
            "amount": 215.60,
        }
    ]

    result = _fallback_local_classification(client, "user-abc", unclassified, ALL_CATEGORIES)

    assert result["classified_count"] == 1
    update_args = client.table.return_value.update.call_args[0][0]
    assert update_args["category_id"] == "cat-alimentacao"
    assert update_args["confidence_score"] == "medium"


# ==============================================================================
# Scenario 5: totally unknown transaction
# ==============================================================================

def test_unknown_transaction_is_classified_as_outros_with_low_confidence():
    """Scenario: description has no keyword match and no learned category.

    Transaction IS counted as classified_count (not skipped) and gets category
    'outros' with confidence 'low'.
    """
    client = _make_client(learned_rows=[])
    unclassified = [
        {
            "id": "txn-1",
            "description": "PIX RECEBIDO JOAO SILVA",
            "merchant_name": None,
            "amount": -500.00,
        }
    ]

    result = _fallback_local_classification(client, "user-abc", unclassified, ALL_CATEGORIES)

    assert result["classified_count"] == 1
    assert result["skipped_count"] == 0

    update_args = client.table.return_value.update.call_args[0][0]
    assert update_args["category_id"] == "cat-outros"
    assert update_args["confidence_score"] == "low"


def test_merchant_with_special_characters_normalizes_and_falls_back_to_outros():
    """Scenario: merchant name contains Brazilian special characters (cedilha, accents).

    _normalize_text() strips accents via NFKD+ASCII encoding, so 'Açaí da Esquina'
    becomes 'acai da esquina' — no keyword hint matches — falls back to 'outros'.
    """
    client = _make_client(learned_rows=[])
    unclassified = [
        {
            "id": "txn-1",
            "description": "Açaí da Esquina",
            "merchant_name": "Açaí da Esquina",
            "amount": 18.00,
        }
    ]

    result = _fallback_local_classification(client, "user-abc", unclassified, ALL_CATEGORIES)

    assert result["classified_count"] == 1
    update_args = client.table.return_value.update.call_args[0][0]
    assert update_args["category_id"] == "cat-outros"
    assert update_args["confidence_score"] == "low"


def test_zero_amount_transaction_is_classified_normally():
    """Scenario: transaction with amount=0 (e.g., trial, cashback reversal).

    Amount is not used in classification logic — the transaction is classified
    by merchant/description hints as normal.
    """
    client = _make_client(learned_rows=[])
    unclassified = [
        {
            "id": "txn-1",
            "description": "Spotify assinatura mensal",
            "merchant_name": "SPOTIFY",
            "amount": 0.00,
        }
    ]

    result = _fallback_local_classification(client, "user-abc", unclassified, ALL_CATEGORIES)

    assert result["classified_count"] == 1
    assert result["skipped_count"] == 0


# ==============================================================================
# Scenario 6: transaction without id
# ==============================================================================

def test_transaction_without_id_is_skipped():
    """Scenario: transaction dict has no 'id' key (or id is falsy).

    The transaction is counted in skipped_count, not classified_count.
    No Supabase UPDATE is attempted.
    """
    client = _make_client(learned_rows=[])
    unclassified = [
        {"description": "Açaí da Esquina", "merchant_name": None, "amount": 18.00},
    ]

    result = _fallback_local_classification(client, "user-abc", unclassified, ALL_CATEGORIES)

    assert result["success"] is True
    assert result["classified_count"] == 0
    assert result["skipped_count"] == 1


# ==============================================================================
# Scenario 7: Supabase UPDATE raises exception
# ==============================================================================

def test_supabase_update_exception_counts_as_skipped_and_does_not_raise():
    """Scenario: Supabase UPDATE raises during the transaction loop.

    The exception is caught by the bare except; the transaction is counted in
    skipped_count. The function does NOT propagate the exception to the caller.
    """
    client = _make_client(learned_rows=[])
    client.table.return_value.update.side_effect = Exception("Supabase timeout")

    unclassified = [
        {
            "id": "txn-1",
            "description": "Boleto Banco Bradesco pagamento",
            "merchant_name": None,
            "amount": 1200.00,
        }
    ]

    result = _fallback_local_classification(client, "user-abc", unclassified, ALL_CATEGORIES)

    assert result["success"] is True
    assert result["classified_count"] == 0
    assert result["skipped_count"] == 1


# ==============================================================================
# Mixed batch
# ==============================================================================

def test_mixed_batch_tracks_classified_and_skipped_independently():
    """Scenario: batch with a valid transaction and one without id.

    classified_count and skipped_count are tracked independently per transaction.
    """
    client = _make_client(learned_rows=[])
    unclassified = [
        {
            "id": "txn-1",
            "description": "Rappi entrega supermercado",
            "merchant_name": None,
            "amount": 95.00,
        },
        {"description": "sem id aqui", "merchant_name": None, "amount": 12.00},
    ]

    result = _fallback_local_classification(client, "user-abc", unclassified, ALL_CATEGORIES)

    assert result["classified_count"] == 1
    assert result["skipped_count"] == 1
    assert result["success"] is True


# ==============================================================================
# TODO characterization tests — document current imperfect behavior
# ==============================================================================

def test_todo_cl_01_load_learned_exception_is_silenced():
    """
    CARACTERIZAÇÃO (TODO-CL-01): quando _load_learned_category_map falha com exceção
    do Supabase, o erro é silenciado e a função continua sem aprendizado.

    O caller não tem como detectar que o aprendizado foi ignorado — não há campo
    'learning_degraded' (ou equivalente) no retorno.

    Quando TODO-CL-01 for resolvido, este teste vai falhar e deve ser atualizado.
    """
    client = mock.MagicMock()
    # Make the SELECT (learned categories) raise — UPDATE path must remain unaffected
    (
        client.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .limit.return_value
        .execute
    ).side_effect = Exception("Supabase SELECT timeout")

    unclassified = [
        {
            "id": "txn-1",
            "description": "Mercado São João compras da semana",
            "merchant_name": None,
            "amount": 210.30,
        }
    ]

    # Function must not raise
    result = _fallback_local_classification(client, "user-abc", unclassified, ALL_CATEGORIES)

    assert result["success"] is True
    # Still classified via hints — degradation is invisible
    assert result["classified_count"] == 1
    # Current behavior: no indication that learned categories were skipped
    assert "learning_degraded" not in result


def test_todo_cl_02_description_used_as_merchant_triggers_spurious_prefix_match():
    """
    CARACTERIZAÇÃO (TODO-CL-02): quando merchant_name é None, a description é passada
    para resolve_merchant_name(). O prefixo "NF" em _MERCHANT_PREFIX_LOOKUP bate com
    "NF COMPRA ONLINE LIVRARIA", produzindo merchant_name="Netflix".

    A transação é então classificada como 'assinaturas' com confidence='high' — errado,
    já que "NF" aqui significa Nota Fiscal, não Netflix.

    Quando TODO-CL-02 for resolvido, este teste vai falhar e deve ser atualizado.
    """
    client = _make_client(learned_rows=[])
    unclassified = [
        {
            "id": "txn-1",
            "description": "NF COMPRA ONLINE LIVRARIA",  # NF = Nota Fiscal, não Netflix
            "merchant_name": None,
            "amount": 89.90,
        }
    ]

    result = _fallback_local_classification(client, "user-abc", unclassified, ALL_CATEGORIES)

    assert result["classified_count"] == 1

    update_args = client.table.return_value.update.call_args[0][0]
    # Current (buggy) behavior: description "NF..." triggers "NF" prefix → merchant="Netflix"
    assert update_args["merchant_name"] == "Netflix"
    # Consequently classified as assinaturas with high confidence
    assert update_args["category_id"] == "cat-assinaturas"
    assert update_args["confidence_score"] == "high"


def test_todo_cl_03_delivery_keyword_match_emits_high_confidence():
    """
    CARACTERIZAÇÃO (TODO-CL-03): slugs 'delivery', 'assinaturas' e 'compras' recebem
    confidence='high' mesmo sendo apenas keyword match em _CATEGORY_HINTS.

    'high' deveria ser reservado para classificação por IA ou revisão humana.
    O campo confidence_score está semanticamente inflacionado para essas categorias.

    Quando TODO-CL-03 for resolvido, este teste vai falhar e deve ser atualizado.
    """
    client = _make_client(learned_rows=[])
    unclassified = [
        {
            "id": "txn-1",
            # "restaurante" evitado — bateria "alimentacao" primeiro no dict.
            # "iFood entrega" só bate delivery hints.
            "description": "iFood entrega pedido",
            "merchant_name": "IFOOD",
            "amount": 62.90,
        }
    ]

    result = _fallback_local_classification(client, "user-abc", unclassified, ALL_CATEGORIES)

    assert result["classified_count"] == 1
    update_args = client.table.return_value.update.call_args[0][0]
    assert update_args["category_id"] == "cat-delivery"
    # Current behavior: high confidence from keyword match — semantically incorrect
    assert update_args["confidence_score"] == "high"


def test_todo_cl_04_structural_inconsistency_between_empty_list_and_empty_categories():
    """
    CARACTERIZAÇÃO (TODO-CL-04): dois caminhos de "zero classificações" retornam
    estruturas diferentes:
    - Lista de transações vazia → success=True, fallback_used=True (presente)
    - Categorias vazias → success=False, fallback_used ausente

    O campo 'fallback_used' deveria estar presente em ambos para que o caller
    possa tratar os casos de forma uniforme.

    Quando TODO-CL-04 for resolvido, este teste vai falhar e deve ser atualizado.
    """
    client = _make_client(learned_rows=[])

    # Path A: empty transactions list
    result_empty_txns = _fallback_local_classification(
        client, "user-abc", unclassified=[], categories=ALL_CATEGORIES
    )
    assert "fallback_used" in result_empty_txns  # present
    assert result_empty_txns["success"] is True

    # Path B: empty categories (no fallback_category_id)
    result_empty_cats = _fallback_local_classification(
        client,
        "user-abc",
        unclassified=[
            {
                "id": "txn-1",
                "description": "Mercado Livre compra eletrônicos",
                "merchant_name": "MELI",
                "amount": 349.90,
            }
        ],
        categories=[],
    )
    assert "fallback_used" not in result_empty_cats  # absent — structural inconsistency
    assert result_empty_cats["success"] is False
