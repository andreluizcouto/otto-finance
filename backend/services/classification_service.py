from __future__ import annotations

from typing import Any

import httpx

from backend.core.config import get_make_webhook_url

_MERCHANT_LOOKUP: dict[str, str] = {
    "RCHLO": "Riachuelo",
    "MELI": "Mercado Livre",
    "ML": "Mercado Livre",
    "AMZN": "Amazon",
    "MCF": "McDonald's",
}

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
    normalized = merchant.upper().strip()

    if normalized in _MERCHANT_LOOKUP:
        return _MERCHANT_LOOKUP[normalized]

    for prefix, name in _MERCHANT_PREFIX_LOOKUP:
        if normalized.startswith(prefix):
            return name

    return merchant


def build_classification_payload(
    user_id: str,
    transactions: list[dict[str, Any]],
    categories: list[dict[str, Any]],
) -> dict[str, Any]:
    return {
        "user_id": user_id,
        "transactions": [
            {
                "id": t["id"],
                "description": t["description"],
                "merchant_name": resolve_merchant_name(t.get("merchant_name", "")),
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


def get_unclassified_transactions(client: Any, user_id: str) -> list[dict[str, Any]]:
    resp = (
        client.table("transactions")
        .select("id, description, merchant_name, amount")
        .eq("user_id", user_id)
        .or_("category_id.is.null,confidence_score.is.null")
        .eq("manually_reviewed", False)
        .execute()
    )
    return resp.data or []


def trigger_classification(client: Any, user_id: str) -> dict[str, Any]:
    unclassified = get_unclassified_transactions(client, user_id)
    if not unclassified:
        return {"success": True, "classified_count": 0}

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
        response = httpx.post(webhook_url, json=payload, timeout=60.0)
        response.raise_for_status()
        result = response.json()
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

