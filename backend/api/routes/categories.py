from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from backend.api.deps import get_current_client, get_current_user
from backend.schemas.categories import CreateCategoryRequest, RenameCategoryRequest
from backend.services.categories_service import (
    add_category,
    delete_category,
    list_categories,
    rename_category,
)

router = APIRouter(prefix="/api", tags=["categories"])


@router.get("/categories")
def get_categories(
    user: Annotated[dict, Depends(get_current_user)] = None,
    client: Annotated[Client, Depends(get_current_client)] = None,
) -> dict:
    _ = user
    return {"categories": list_categories(client)}


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
    payload: RenameCategoryRequest,
    user: Annotated[dict, Depends(get_current_user)] = None,
    client: Annotated[Client, Depends(get_current_client)] = None,
) -> dict:
    result = rename_category(
        client=client,
        user_id=user["id"],
        category_id=category_id,
        new_name=payload.name,
    )
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Erro ao renomear categoria."),
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

