import json
from typing import Annotated
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

@router.get("/transactions")
def get_transactions(
    limit: int = Query(default=200, ge=1, le=1000),
    user: Annotated[dict, Depends(get_current_user)] = None,
    client: Annotated[Client, Depends(get_current_client)] = None,
) -> dict:
    try:
        return list_transactions(client, user["id"], limit=limit)
    except Exception:
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
    _ = user
    result = correct_transaction_category(
        client=client,
        transaction_id=transaction_id,
        category_id=payload.category_id,
    )
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Falha ao corrigir categoria."),
        )
    return result


@router.post("/transactions/import")
def import_pdf_transactions(
    payload: ImportPdfRequest,
    user: Annotated[dict, Depends(get_current_user)] = None,
    client: Annotated[Client, Depends(get_current_client)] = None,
) -> dict:
    try:
        data = json.loads(payload.result)
        transacoes = data.get("transacoes", [])
        if not isinstance(transacoes, list):
            raise ValueError("Campo 'transacoes' invalido.")
    except (json.JSONDecodeError, ValueError):
        raise HTTPException(status_code=422, detail="JSON de extracao invalido.")

    result = import_transactions_from_pdf(client, user["id"], transacoes)
    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["error"],
        )
    return result
