from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from backend.local_db import LocalClient as Client

from backend.core import get_current_client, get_current_user
from backend.schemas import CreateCategoryRequest, UpdateCategoryRequest
from .services import (
    add_category,
    delete_category,
    list_categories,
    update_category,
)

router = APIRouter(prefix="/api", tags=["categories"])

@router.get("/categories")
def get_categories(
    user: Annotated[dict, Depends(get_current_user)] = None,
    client: Annotated[Client, Depends(get_current_client)] = None,
) -> dict:
    return {"categories": list_categories(client, user_id=user["id"])}

@router.post("/categories")
def create_category(
    payload: CreateCategoryRequest,
    user: Annotated[dict, Depends(get_current_user)] = None,
    client: Annotated[Client, Depends(get_current_client)] = None,
) -> dict:
    result = add_category(
        client=client,
        user_id=user["id"],
        name=payload.name,
        color_hex=payload.color_hex,
        emoji=payload.emoji,
    )
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Erro ao criar categoria."),
        )
    return result

@router.patch("/categories/{category_id}")
def update_category_name(
    category_id: str,
    payload: UpdateCategoryRequest,
    user: Annotated[dict, Depends(get_current_user)] = None,
    client: Annotated[Client, Depends(get_current_client)] = None,
) -> dict:
    result = update_category(
        client=client,
        user_id=user["id"],
        category_id=category_id,
        new_name=payload.name,
        color_hex=payload.color_hex,
        emoji=payload.emoji,
    )
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Erro ao atualizar categoria."),
        )
    return result

@router.delete("/categories/{category_id}")
def remove_category(
    category_id: str,
    user: Annotated[dict, Depends(get_current_user)] = None,
    client: Annotated[Client, Depends(get_current_client)] = None,
) -> dict:
    result = delete_category(client=client, user_id=user["id"], category_id=category_id)
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Erro ao remover categoria."),
        )
    return result
