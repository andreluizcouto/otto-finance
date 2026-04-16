import logging
from datetime import datetime
from typing import Any
import unicodedata
import httpx
from supabase import Client
from backend.core import get_make_webhook_url

logger = logging.getLogger(__name__)

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

_CATEGORY_HINTS: dict[str, tuple[str, ...]] = {
    "alimentacao": ("mercado", "supermercado", "padaria", "restaurante", "lanchonete"),
    "delivery": ("ifood", "rappi", "uber eats", "entrega"),
    "transporte": ("uber", "99", "taxi", "combustivel", "posto", "estacionamento", "metrô", "metro"),
    "moradia": ("aluguel", "condominio", "energia", "luz", "agua", "saneamento", "gas", "internet"),
    "saude": ("farmacia", "hospital", "consulta", "plano de saude", "laboratorio"),
    "lazer": ("cinema", "show", "bar", "viagem", "hotel"),
    "educacao": ("curso", "faculdade", "escola", "livro"),
    "compras": ("amazon", "mercado livre", "riachuelo", "shopping", "loja"),
    "assinaturas": ("netflix", "spotify", "prime video", "youtube", "assinatura"),
}

def resolve_merchant_name(merchant: str | None) -> str:
    if not merchant:
        return ""
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
                "description": t.get("description") or "",
                "merchant_name": resolve_merchant_name(t.get("merchant_name")),
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


def _infer_category_slug(description: str, merchant_name: str) -> tuple[str, str]:
    text = _normalize_text(f"{description} {merchant_name}")
    for slug, hints in _CATEGORY_HINTS.items():
        if any(hint in text for hint in hints):
            if slug in {"delivery", "assinaturas", "compras"}:
                return (slug, "high")
            return (slug, "medium")
    return ("outros", "low")


def _slug_to_category_id(categories: list[dict[str, Any]]) -> dict[str, str]:
    result: dict[str, str] = {}
    for category in categories:
        slug = str(category.get("slug") or "").strip()
        category_id = str(category.get("id") or "").strip()
        if slug and category_id:
            result[slug] = category_id
    return result


def _fallback_local_classification(
    client: Any,
    user_id: str,
    unclassified: list[dict[str, Any]],
    categories: list[dict[str, Any]],
) -> dict[str, Any]:
    slug_map = _slug_to_category_id(categories)
    fallback_category_id = slug_map.get("outros") or next(iter(slug_map.values()), None)

    if not fallback_category_id:
        return {"success": False, "classified_count": 0, "skipped_count": len(unclassified)}

    classified_count = 0
    skipped_count = 0

    for transaction in unclassified:
        try:
            transaction_id = transaction.get("id")
            if not transaction_id:
                skipped_count += 1
                continue

            raw_description = str(transaction.get("description") or "")
            resolved_merchant = resolve_merchant_name(str(transaction.get("merchant_name") or raw_description))
            slug, confidence = _infer_category_slug(raw_description, resolved_merchant)
            category_id = slug_map.get(slug, fallback_category_id)

            (
                client.table("transactions")
                .update(
                    {
                        "merchant_name": resolved_merchant or None,
                        "category_id": category_id,
                        "confidence_score": confidence,
                        "manually_reviewed": False,
                    }
                )
                .eq("id", transaction_id)
                .eq("user_id", user_id)
                .execute()
            )
            classified_count += 1
        except Exception:
            skipped_count += 1

    return {
        "success": True,
        "classified_count": classified_count,
        "skipped_count": skipped_count,
        "fallback_used": True,
    }

def trigger_classification(client: Any, user_id: str) -> dict[str, Any]:
    unclassified = get_unclassified_transactions(client, user_id)
    if not unclassified:
        return {"success": True, "classified_count": 0, "skipped_count": 0}

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
        count = int(result.get("classified_count", len(unclassified)))
        skipped_count = max(len(unclassified) - count, 0)
        return {"success": True, "classified_count": count, "skipped_count": skipped_count}
    except httpx.TimeoutException:
        fallback = _fallback_local_classification(client, user_id, unclassified, categories)
        if fallback.get("success"):
            fallback["warning"] = (
                "Classificacao em modo local aplicada porque o servico externo nao respondeu."
            )
            return fallback
        return {
            "success": False,
            "error": "O servico de classificacao nao respondeu. Tente novamente em alguns minutos.",
        }
    except Exception:
        fallback = _fallback_local_classification(client, user_id, unclassified, categories)
        if fallback.get("success"):
            fallback["warning"] = (
                "Classificacao em modo local aplicada porque o servico externo estava indisponivel."
            )
            return fallback
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
    "saldo do dia",
    "saldo fatura anterior",
    "resumo da fatura",
    "compras nacionais",
    "compras internacionais",
    "tarifas, encargos e multas",
    "limite unico",
    "limite único",
    "vencimento",
    "pgto. cash",
    "pagamento pix cartao",
    "pagamento pix cartão",
    "pagamento fatura",
    "pagamento de fatura",
    "banco bradescard",
    "ourocard",
    "cartao de credito",
    "cartão de crédito",
    "pagamento minimo",
    "pagamento mínimo",
    "juros saque pix",
    "iof",
    "anuidade",
    "encargo",
    "tarifa",
)

_DEBIT_CARD_TERMS = (
    "compra no debito",
    "compra debito",
    "cartao de debito",
    "cartao debito",
    "via debito",
    "debito a vista",
)


def _normalize_text(value: str) -> str:
    text = " ".join((value or "").split()).strip().lower()
    return (
        unicodedata.normalize("NFKD", text)
        .encode("ascii", "ignore")
        .decode("ascii")
    )


def _normalize_source(value: Any) -> str | None:
    normalized = _normalize_text(str(value or ""))
    if normalized in {"bank_statement", "statement", "extrato", "banco", "bank"}:
        return "bank_statement"
    if normalized in {"credit_card", "card", "fatura", "cartao", "cartao_credito", "invoice"}:
        return "credit_card"
    return None


def _canonical_description(value: str) -> str:
    normalized = _normalize_text(value)
    for noisy_term in (
        "cartao de debito",
        "cartao debito",
        "compra no debito",
        "compra debito",
        "cartao de credito",
        "cartao credito",
    ):
        normalized = normalized.replace(noisy_term, " ")
    cleaned = []
    for ch in normalized:
        cleaned.append(ch if ch.isalnum() else " ")
    return " ".join("".join(cleaned).split())


def _normalize_category_key(value: str) -> str:
    normalized = _normalize_text(value).replace("&", " e ")
    parts = []
    for ch in normalized:
        parts.append(ch if ch.isalnum() else " ")
    return " ".join("".join(parts).split())


def _build_category_match_index(categories: list[dict[str, Any]]) -> dict[str, str]:
    index: dict[str, str] = {}

    for category in categories:
        category_id = str(category.get("id") or "").strip()
        if not category_id:
            continue

        for raw_key in (category.get("name"), category.get("slug")):
            key = _normalize_category_key(str(raw_key or ""))
            if key:
                index[key] = category_id

    alias_map = {
        "alimentacao": ("alimentacao", "alimentacao e bebidas", "mercado", "supermercado", "restaurante"),
        "transporte": ("transporte", "mobilidade", "combustivel"),
        "moradia": ("moradia", "casa", "contas da casa"),
        "saude": ("saude", "farmacia", "medico"),
        "lazer": ("lazer", "entretenimento", "diversao"),
        "educacao": ("educacao", "estudos"),
        "compras": ("compras", "shopping", "varejo"),
        "assinaturas": ("assinaturas", "servicos recorrentes", "streaming"),
        "delivery": ("delivery", "entregas"),
        "outros": ("outros", "sem categoria"),
    }

    for target, aliases in alias_map.items():
        target_id = index.get(_normalize_category_key(target))
        if not target_id:
            continue
        for alias in aliases:
            index.setdefault(_normalize_category_key(alias), target_id)

    return index


def _match_category_id_from_hint(
    categories: list[dict[str, Any]],
    category_hint: str | None,
) -> str | None:
    hint_key = _normalize_category_key(str(category_hint or ""))
    if not hint_key:
        return None

    index = _build_category_match_index(categories)
    if hint_key in index:
        return index[hint_key]

    for key, category_id in index.items():
        if hint_key in key or key in hint_key:
            return category_id

    return None


def _is_administrative_transaction(description: str) -> bool:
    normalized = _normalize_text(description)
    if normalized == "saldo":
        return True
    return any(term in normalized for term in _ADMIN_TRANSACTION_TERMS)


def _is_debit_card_purchase(description: str) -> bool:
    normalized = _normalize_text(description)
    return any(term in normalized for term in _DEBIT_CARD_TERMS)


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
                "category_name": category.get("name", "Sem categoria"),
                "category_emoji": category.get("emoji", ""),
                "categories": (
                    {
                        "name": category.get("name", "Sem categoria"),
                        "emoji": category.get("emoji", ""),
                    }
                    if transaction.get("category_id")
                    else None
                ),
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
    user_id: str,
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
            .eq("user_id", user_id)
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
        categories_resp = (
            client.table("categories")
            .select("id, name, slug")
            .or_(f"is_default.eq.true,user_id.eq.{user_id}")
            .order("is_default", desc=True)
            .order("name")
            .execute()
        )
        categories = categories_resp.data or []

        for item in transacoes:
            date_str = datetime.strptime(item["data"], "%d/%m/%Y").date().isoformat()
            raw_amount = float(item["valor"])
            amount = raw_amount if item["tipo"] == "credito" else -raw_amount
            merchant_name = resolve_merchant_name(
                " ".join(
                    str(
                        item.get("merchant_name")
                        or item.get("descricao")
                        or item.get("description")
                        or ""
                    ).split()
                )
            )
            description = merchant_name or " ".join(str(item["descricao"]).split())
            source = _normalize_source(item.get("origem") or item.get("source"))
            transaction_time = str(item.get("time") or "").strip() or None
            raw_text = " ".join(str(item.get("raw_text") or description).split())
            category_id = _match_category_id_from_hint(categories, item.get("category_hint"))

            if _is_administrative_transaction(description):
                skipped_count += 1
                continue

            if source == "credit_card" and _is_debit_card_purchase(description):
                skipped_count += 1
                continue

            # Deduplicacao simples: date + transaction_time + amount + user_id
            # No extrato bancario brasileiro toda movimentacao tem timestamp unico.
            # Se bater data + hora + valor = ja existe, nao importar.
            dup_query = (
                client.table("transactions")
                .select("id")
                .eq("user_id", user_id)
                .eq("date", date_str)
                .eq("amount", amount)
            )
            if transaction_time:
                dup_query = dup_query.eq("transaction_time", transaction_time)
            duplicate_resp = dup_query.execute()
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
                        "category_id": category_id,
                        "merchant_name": merchant_name or None,
                        "raw_text": raw_text,
                        "transaction_time": transaction_time,
                        "confidence_score": None,
                        "manually_reviewed": False,
                    }
                )
                .execute()
            )
            imported_count += 1
    except Exception:
        logger.exception("Erro ao importar transacoes do PDF para user_id=%s", user_id)
        return {"imported": 0, "skipped": 0, "error": "Erro interno ao importar transacoes."}

    return {"imported": imported_count, "skipped": skipped_count}
