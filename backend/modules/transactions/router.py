import json
from datetime import datetime
from typing import Annotated, Any
import unicodedata
from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import Client

from backend.core import get_current_client, get_current_user
from backend.schemas import CorrectTransactionRequest, ImportPdfRequest
from .services import (
    classify_transactions,
    correct_transaction_category,
    import_transactions_from_pdf,
    list_transactions,
)

router = APIRouter(prefix="/api", tags=["transactions"])


def _extract_json_payload(raw: str) -> str:
    text = (raw or "").strip()
    if not text:
        raise ValueError("Conteudo vazio.")

    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].strip().startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()

    return text


def _parse_transactions_from_result(raw: str) -> list[dict[str, Any]]:
    text = _extract_json_payload(raw)
    candidates = [text]

    first_obj = text.find("{")
    last_obj = text.rfind("}")
    if first_obj >= 0 and last_obj > first_obj:
        sliced = text[first_obj : last_obj + 1]
        if sliced != text:
            candidates.append(sliced)

    for candidate in candidates:
        try:
            data = json.loads(candidate)
        except json.JSONDecodeError:
            continue

        if isinstance(data, list):
            return data

        if isinstance(data, dict):
            transacoes = data.get("transacoes")
            if transacoes is None:
                transacoes = data.get("transações")
            if isinstance(transacoes, list):
                return transacoes

    raise ValueError("JSON de extracao invalido.")


def _normalize_tipo(value: Any) -> str:
    raw = str(value or "").strip().lower()
    if raw in {"debito", "débito", "debit", "saida", "expense"}:
        return "debito"
    if raw in {"credito", "crédito", "credit", "entrada", "income"}:
        return "credito"
    if raw in {"debito", "credito"}:
        return raw
    raise ValueError("Campo 'tipo' invalido.")


def _normalize_data(value: Any) -> str:
    raw = str(value or "").strip()
    if "/" in raw:
        parts = raw.split("/")
        if len(parts) == 2:
            day, month = parts
            raw = f"{day}/{month}/{datetime.now().year}"
        return raw

    # Accept ISO-like dates from model outputs.
    try:
        parsed = datetime.fromisoformat(raw[:10])
        return parsed.strftime("%d/%m/%Y")
    except ValueError as exc:
        raise ValueError("Campo 'data' invalido.") from exc


def _normalize_source(value: Any) -> str | None:
    raw = str(value or "").strip().lower()
    if not raw:
        return None
    normalized = (
        unicodedata.normalize("NFKD", raw).encode("ascii", "ignore").decode("ascii")
    )
    if normalized in {"bank_statement", "statement", "extrato", "banco", "bank"}:
        return "bank_statement"
    if normalized in {"credit_card", "card", "fatura", "cartao", "cartao_credito", "invoice"}:
        return "credit_card"
    return None


def _normalize_time(value: Any) -> str | None:
    raw = str(value or "").strip()
    if not raw:
        return None

    try:
        parsed = datetime.strptime(raw, "%H:%M")
        return parsed.strftime("%H:%M")
    except ValueError as exc:
        raise ValueError("Campo 'time' invalido.") from exc


def _normalize_category_hint(value: Any) -> str | None:
    raw = " ".join(str(value or "").split()).strip()
    return raw or None


def _normalize_raw_text(value: Any, fallback: str) -> str:
    raw = " ".join(str(value or fallback).split()).strip()
    if not raw:
        raise ValueError("Campo 'raw_text' invalido.")
    return raw


def _normalize_transaction_items(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []

    for item in items:
        if not isinstance(item, dict):
            raise ValueError("Item de transacao invalido.")

        data = _normalize_data(item.get("data") or item.get("date"))
        descricao = item.get("descricao") or item.get("description")
        merchant_name = item.get("merchant_name")
        if not descricao and not merchant_name:
            raise ValueError("Campo 'descricao' invalido.")

        valor = item.get("valor")
        if valor is None:
            valor = item.get("amount")
        if valor is None:
            raise ValueError("Campo 'valor' invalido.")

        if item.get("tipo") or item.get("type"):
            tipo = _normalize_tipo(item.get("tipo") or item.get("type"))
        else:
            tipo = "credito" if float(valor) >= 0 else "debito"
        origem = _normalize_source(item.get("origem") or item.get("source"))
        time_value = _normalize_time(item.get("time"))
        category_hint = _normalize_category_hint(item.get("category_hint"))
        descricao_text = str(descricao or merchant_name)
        raw_text = _normalize_raw_text(item.get("raw_text"), descricao_text)
        amount_value = abs(float(valor))

        normalized.append(
            {
                "data": data,
                "descricao": descricao_text,
                "merchant_name": str(merchant_name or descricao_text),
                "raw_text": raw_text,
                "time": time_value,
                "category_hint": category_hint,
                "valor": amount_value,
                "tipo": tipo,
                "origem": origem,
            }
        )

    return normalized

@router.get("/transactions")
def get_transactions(
    limit: int = Query(default=200, ge=1, le=1000),
    user: Annotated[dict, Depends(get_current_user)] = None,
    client: Annotated[Client, Depends(get_current_client)] = None,
) -> dict:
    try:
        return list_transactions(client, user["id"], limit=limit)
    except Exception as e:
        import logging
        logging.getLogger(__name__).exception("Erro em GET /api/transactions user=%s", user.get("id") if user else "unknown")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao carregar transacoes.",
        )

@router.post("/transactions/classify")
def classify(
    user: Annotated[dict, Depends(get_current_user)] = None,
    client: Annotated[Client, Depends(get_current_client)] = None,
) -> dict:
    result = classify_transactions(client, user["id"])
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=result.get("error", "Falha ao classificar transacoes."),
        )
    return result

@router.patch("/transactions/{transaction_id}/category")
def correct_category(
    transaction_id: str,
    payload: CorrectTransactionRequest,
    user: Annotated[dict, Depends(get_current_user)] = None,
    client: Annotated[Client, Depends(get_current_client)] = None,
) -> dict:
    result = correct_transaction_category(
        client=client,
        transaction_id=transaction_id,
        category_id=str(payload.category_id),
        user_id=user["id"],
    )
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Falha ao corrigir categoria."),
    )
    return result


@router.patch("/transactions/{transaction_id}")
def update_transaction(
    transaction_id: str,
    payload: CorrectTransactionRequest,
    user: Annotated[dict, Depends(get_current_user)] = None,
    client: Annotated[Client, Depends(get_current_client)] = None,
) -> dict:
    result = correct_transaction_category(
        client=client,
        transaction_id=transaction_id,
        category_id=str(payload.category_id),
        user_id=user["id"],
    )
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Falha ao atualizar transacao."),
        )
    return result


@router.post("/transactions/import")
def import_pdf_transactions(
    payload: ImportPdfRequest,
    user: Annotated[dict, Depends(get_current_user)] = None,
    client: Annotated[Client, Depends(get_current_client)] = None,
) -> dict:
    try:
        transacoes = _parse_transactions_from_result(payload.result)
        transacoes = _normalize_transaction_items(transacoes)
    except ValueError:
        raise HTTPException(status_code=422, detail="JSON de extracao invalido.")

    result = import_transactions_from_pdf(client, user["id"], transacoes)
    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["error"],
        )
    return result
