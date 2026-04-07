"""
classifier.py — AI classification pipeline helpers for Phase 3.

Architecture: Streamlit (this module) → Make.com webhook → OpenAI → Supabase PATCH
Python never calls OpenAI directly. This module only:
  1. Builds the webhook payload
  2. Fires the webhook via httpx
  3. Provides helper functions for UI and test coverage

Make.com scenario setup: see .planning/phases/03-ai-classification/03-01-PLAN.md user_setup
OpenAI JSON schema: see get_openai_json_schema() below — embed in Make.com HTTP module body
"""
from __future__ import annotations

import httpx
from typing import Any

from src.config import get_make_webhook_url

# ---------------------------------------------------------------------------
# Merchant name resolution (AICL-02 + D-07)
# Maps cryptic Brazilian merchant codes to readable names.
# Used in the system prompt embedded in Make.com — NOT called at runtime
# from Python during classification. Provided here for:
#   a) unit testing (test_merchant_lookup_table)
#   b) documentation / future use if prompt moves to Python
# ---------------------------------------------------------------------------

_MERCHANT_LOOKUP: dict[str, str] = {
    "RCHLO": "Riachuelo",
    "MELI": "Mercado Livre",
    "ML": "Mercado Livre",
    "AMZN": "Amazon",
    "MCF": "McDonald's",
}

# Prefix-based matches (checked after exact match)
_MERCHANT_PREFIX_LOOKUP: list[tuple[str, str]] = [
    ("RCHLO", "Riachuelo"),
    ("PAG", "PagSeguro"),
    ("AMZ", "Amazon"),
    ("NF", "Netflix"),
    ("NETFLIX", "Netflix"),
    ("SPT", "Spotify"),
    ("SPOTIFY", "Spotify"),
    ("MCDONALD", "McDonald's"),
    ("BK", "Burger King"),
    ("BURGER", "Burger King"),
    ("IFOOD", "iFood"),
    ("VTEX", "loja virtual"),
    ("LOJA", "loja virtual"),
]


def resolve_merchant_name(merchant: str) -> str:
    """Map a cryptic Brazilian merchant code to a readable name.

    Checks exact match first, then prefix match (longest prefix wins).
    Returns the original string unchanged if no match found.

    Args:
        merchant: Raw merchant name from transaction (e.g. "RCHLO", "SPT2345")

    Returns:
        Human-readable merchant name, or original if unknown.
    """
    normalized = merchant.upper().strip()

    # Exact match
    if normalized in _MERCHANT_LOOKUP:
        return _MERCHANT_LOOKUP[normalized]

    # Prefix match — use first match found (list ordered by specificity)
    for prefix, name in _MERCHANT_PREFIX_LOOKUP:
        if normalized.startswith(prefix):
            return name

    return merchant  # passthrough: unknown merchant returned unchanged


# ---------------------------------------------------------------------------
# Confidence score mapping (AICL-03 + D-10)
# ---------------------------------------------------------------------------

def map_confidence_score(confidence: float) -> str:
    """Map a float confidence (0.0–1.0) to a 3-tier enum string.

    Thresholds per D-10 (non-configurable in MVP):
      >= 0.8  → 'high'
      >= 0.5  → 'medium'
      < 0.5   → 'low'

    Args:
        confidence: Float from 0.0 to 1.0 as returned by OpenAI via Make.com

    Returns:
        One of: 'high', 'medium', 'low'
    """
    if confidence >= 0.8:
        return "high"
    elif confidence >= 0.5:
        return "medium"
    else:
        return "low"


# ---------------------------------------------------------------------------
# Payload builder (AICL-01 + D-07)
# ---------------------------------------------------------------------------

def build_classification_payload(
    user_id: str,
    transactions: list[dict[str, Any]],
    categories: list[dict[str, Any]],
) -> dict[str, Any]:
    """Build the webhook payload to send to Make.com.

    Strips transactions down to only the fields Make.com needs, preventing
    accidental PII leakage and keeping payload size small.

    Args:
        user_id: Supabase auth.uid() of the current user
        transactions: Raw transaction dicts from Supabase (may have many fields)
        categories: Category dicts with id, name, slug

    Returns:
        Dict with user_id, transactions (id/description/merchant_name/amount only),
        and categories (id/name/slug only).
    """
    return {
        "user_id": user_id,
        "transactions": [
            {
                "id": t["id"],
                "description": t["description"],
                "merchant_name": t.get("merchant_name", ""),
                "amount": t["amount"],
            }
            for t in transactions
        ],
        "categories": [
            {
                "id": c["id"],
                "name": c["name"],
                "slug": c["slug"],
            }
            for c in categories
        ],
    }


# ---------------------------------------------------------------------------
# Supabase query helpers (AICL-04 + D-02)
# ---------------------------------------------------------------------------

def get_unclassified_transactions(client: Any, user_id: str) -> list[dict[str, Any]]:
    """Fetch transactions that need classification.

    Idempotent per D-02: only fetches rows where category_id IS NULL or
    confidence_score IS NULL, AND manually_reviewed IS NOT TRUE.
    This ensures user corrections are never overwritten.

    Args:
        client: Authenticated Supabase client (RLS-scoped to user_id)
        user_id: Supabase auth.uid() of the current user

    Returns:
        List of transaction dicts with id, description, merchant_name, amount
    """
    resp = (
        client.table("transactions")
        .select("id, description, merchant_name, amount")
        .eq("user_id", user_id)
        .or_("category_id.is.null,confidence_score.is.null")
        .eq("manually_reviewed", False)
        .execute()
    )
    return resp.data or []


# ---------------------------------------------------------------------------
# OpenAI JSON schema (AICL-06 + D-08 + D-09)
# This function returns the JSON schema dict that must be embedded in
# Make.com Module 4 HTTP body as response_format.json_schema.
# It is NOT called at runtime — it exists for documentation and testing.
# ---------------------------------------------------------------------------

def get_openai_json_schema() -> dict[str, Any]:
    """Return the OpenAI Structured Outputs JSON schema for classification.

    Embed this in Make.com HTTP module (Module 4) under:
      response_format > json_schema

    Strict mode guarantees the model cannot produce non-conforming responses.
    The category_slug enum must match the slugs in the categories table exactly.

    Returns:
        Dict representing the json_schema object (not the full response_format wrapper)
    """
    return {
        "name": "classification_result",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "category_slug": {
                    "type": "string",
                    "enum": [
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
                    ],
                    "description": "Category slug matching the categories table",
                },
                "confidence": {
                    "type": "number",
                    "description": (
                        "Confidence score from 0.0 to 1.0. "
                        "Return < 0.5 if merchant name is cryptic, abbreviated, or unknown."
                    ),
                },
            },
            "required": ["category_slug", "confidence"],
            "additionalProperties": False,
        },
    }


# ---------------------------------------------------------------------------
# Webhook trigger (AICL-01 + INTG-01 + D-01 + D-07)
# ---------------------------------------------------------------------------

def trigger_classification(
    client: Any,
    user_id: str,
) -> dict[str, Any]:
    """Trigger Make.com classification pipeline for all unclassified transactions.

    Workflow:
      1. Fetch unclassified transactions + all categories from Supabase
      2. Build webhook payload
      3. POST to Make.com webhook (timeout=60s for large batches per RESEARCH.md pitfall 3)
      4. Return result dict with classified_count or error

    Args:
        client: Authenticated Supabase client (RLS-scoped to user_id)
        user_id: Supabase auth.uid() of the current user

    Returns:
        {"success": True, "classified_count": N} on success
        {"success": False, "error": "message"} on failure
    """
    # Fetch unclassified transactions
    unclassified = get_unclassified_transactions(client, user_id)
    if not unclassified:
        return {"success": True, "classified_count": 0}

    # Fetch all visible categories (default + user's own per RLS)
    cat_resp = (
        client.table("categories")
        .select("id, name, slug")
        .order("is_default", desc=True)
        .order("name")
        .execute()
    )
    categories = cat_resp.data or []

    payload = build_classification_payload(user_id, unclassified, categories)

    try:
        webhook_url = get_make_webhook_url()
        r = httpx.post(webhook_url, json=payload, timeout=60.0)
        r.raise_for_status()
        result = r.json()
        count = result.get("classified_count", len(unclassified))
        return {"success": True, "classified_count": count}
    except httpx.TimeoutException:
        return {
            "success": False,
            "error": "O servico de classificacao nao respondeu. Tente novamente em alguns minutos.",
        }
    except Exception:
        return {
            "success": False,
            "error": "Erro ao conectar com o servico de classificacao. Tente novamente.",
        }
