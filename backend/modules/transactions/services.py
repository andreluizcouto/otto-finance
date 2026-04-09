from datetime import datetime
from typing import Any
import unicodedata
import httpx
from supabase import Client
from backend.core import get_make_webhook_url

# ==============================================================================
# CLASSIFICATION LOGIC
# ==============================================================================
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

# ---------------------------------------------------------------------------
# Confidence score mapping (AICL-03 + D-10)
# ---------------------------------------------------------------------------

def map_confidence_score(confidence: float) -> str:
    """Map a float confidence (0.0–1.0) to a 3-tier enum string."""
    if confidence >= 0.8:
        return "high"
    elif confidence >= 0.5:
        return "medium"
    else:
        return "low"


# ---------------------------------------------------------------------------
# OpenAI JSON schema (AICL-06 + D-08 + D-09)
# ---------------------------------------------------------------------------

def get_openai_json_schema() -> dict[str, Any]:
    """Return the OpenAI Structured Outputs JSON schema for classification."""
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
                    "description": "Category slug matching the categories table. Fallback to 'outros' if unknown.",
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


# ==============================================================================
# TRANSACTIONS SERVICE
# ==============================================================================
_ADMIN_TRANSACTION_TERMS = (
    "saldo anterior",
    "saldo fatura anterior",
    "pgto. cash",
    "pagamento de boleto",
    "pagamento boleto",
    "pagamento pix cartao",
    "pagamento pix cartão",
    "pagamento conta",
    "pagamento fatura",
    "juros saque pix",
    "iof",
    "anuidade",
    "encargo",
)


def _normalize_text(value: str) -> str:
    text = " ".join((value or "").split()).strip().lower()
    return (
        unicodedata.normalize("NFKD", text)
        .encode("ascii", "ignore")
        .decode("ascii")
    )


def _is_administrative_transaction(description: str) -> bool:
    normalized = _normalize_text(description)
    if normalized == "saldo":
        return True
    return any(term in normalized for term in _ADMIN_TRANSACTION_TERMS)


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


def import_transactions_from_pdf(
    client: Client,
    user_id: str,
    transacoes: list[dict[str, Any]],
) -> dict[str, Any]:
    imported_count = 0
    skipped_count = 0

    try:
        for item in transacoes:
            date_str = datetime.strptime(item["data"], "%d/%m/%Y").date().isoformat()
            raw_amount = float(item["valor"])
            amount = raw_amount if item["tipo"] == "credito" else -raw_amount
            description = " ".join(str(item["descricao"]).split())

            if _is_administrative_transaction(description):
                skipped_count += 1
                continue

            duplicate_resp = (
                client.table("transactions")
                .select("id")
                .eq("user_id", user_id)
                .eq("date", date_str)
                .eq("amount", amount)
                .eq("description", description)
                .execute()
            )
            if duplicate_resp.data:
                skipped_count += 1
                continue

            (
                client.table("transactions")
                .insert(
                    {
                        "date": date_str,
                        "description": description,
                        "amount": amount,
                        "user_id": user_id,
                        "category_id": None,
                        "merchant_name": None,
                        "confidence_score": None,
                        "manually_reviewed": False,
                    }
                )
                .execute()
            )
            imported_count += 1
    except Exception as e:
        return {"imported": 0, "skipped": 0, "error": str(e)}

    return {"imported": imported_count, "skipped": skipped_count}
