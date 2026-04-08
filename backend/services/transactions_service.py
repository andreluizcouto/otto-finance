from __future__ import annotations

from typing import Any

from supabase import Client

from backend.services.classification_service import trigger_classification


def confidence_label(score: str | None) -> str:
    if score == "high":
        return "Alta"
    if score == "medium":
        return "Media"
    if score == "low":
        return "Baixa"
    return "-"


def get_unclassified_count(client: Client, user_id: str) -> int:
    unclassified_resp = (
        client.table("transactions")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .or_("category_id.is.null,confidence_score.is.null")
        .eq("manually_reviewed", False)
        .execute()
    )
    return unclassified_resp.count or 0


def list_transactions(client: Client, user_id: str, limit: int = 200) -> dict[str, Any]:
    txn_resp = (
        client.table("transactions")
        .select(
            "id, date, description, merchant_name, amount, confidence_score, manually_reviewed, category_id, categories(name, emoji)"
        )
        .eq("user_id", user_id)
        .order("date", desc=True)
        .limit(limit)
        .execute()
    )
    transactions = txn_resp.data or []

    cat_resp = (
        client.table("categories")
        .select("id, name, emoji")
        .order("is_default", desc=True)
        .order("name")
        .execute()
    )
    categories = cat_resp.data or []

    serialized = []
    for transaction in transactions:
        category = transaction.get("categories") or {}
        serialized.append(
            {
                "id": transaction["id"],
                "date": transaction["date"],
                "description": transaction["description"],
                "merchant_name": transaction.get("merchant_name"),
                "amount": float(transaction["amount"]),
                "category_id": transaction.get("category_id"),
                "category_name": category.get("name", "Outros"),
                "category_emoji": category.get("emoji", ""),
                "confidence_score": transaction.get("confidence_score"),
                "confidence_label": confidence_label(transaction.get("confidence_score")),
                "manually_reviewed": bool(transaction.get("manually_reviewed", False)),
                "needs_review": transaction.get("confidence_score") == "low"
                and not bool(transaction.get("manually_reviewed", False)),
            }
        )

    return {
        "transactions": serialized,
        "categories": categories,
        "unclassified_count": get_unclassified_count(client, user_id),
    }


def classify_transactions(client: Client, user_id: str) -> dict[str, Any]:
    return trigger_classification(client, user_id)


def correct_transaction_category(
    client: Client,
    transaction_id: str,
    category_id: str,
) -> dict[str, Any]:
    try:
        (
            client.table("transactions")
            .update(
                {
                    "category_id": category_id,
                    "confidence_score": "high",
                    "manually_reviewed": True,
                }
            )
            .eq("id", transaction_id)
            .execute()
        )
        return {"success": True}
    except Exception:
        return {"success": False, "error": "Erro ao atualizar categoria da transacao."}

