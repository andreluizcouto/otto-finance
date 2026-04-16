from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from backend.core import get_current_client, get_current_user
from backend.schemas import ProfilePatchRequest
from .services import get_profile, update_profile

router = APIRouter(prefix="/api", tags=["profile"])


@router.get("/profile")
def read_profile(
    user: Annotated[dict, Depends(get_current_user)] = None,
    client: Annotated[Client, Depends(get_current_client)] = None,
) -> dict:
    return {"profile": get_profile(client, user)}


@router.patch("/profile")
def patch_profile(
    payload: ProfilePatchRequest,
    user: Annotated[dict, Depends(get_current_user)] = None,
    client: Annotated[Client, Depends(get_current_client)] = None,
) -> dict:
    result = update_profile(
        client=client,
        user_id=user["id"],
        name=payload.name,
        phone=payload.phone,
        cpf=payload.cpf,
    )
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=result.get("error", "Falha ao salvar perfil."),
        )
    return result
