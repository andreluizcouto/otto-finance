from typing import Annotated
from fastapi import APIRouter, Depends, Header, HTTPException, status

from backend.core import get_access_token, get_current_user
from .schemas import LoginRequest, SignUpRequest
from .services import sign_in, sign_out, sign_up

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/signup")
def signup(payload: SignUpRequest) -> dict:
    result = sign_up(payload.email, payload.password)
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Falha ao criar conta."),
        )
    return result

@router.post("/login")
def login(payload: LoginRequest) -> dict:
    result = sign_in(payload.email, payload.password)
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result.get("error", "Falha de autenticacao."),
        )
    return result

@router.post("/logout")
def logout(
    access_token: Annotated[str, Depends(get_access_token)],
    refresh_token: Annotated[str | None, Header(alias="X-Refresh-Token")] = None,
) -> dict:
    sign_out(access_token, refresh_token)
    return {"success": True}

@router.get("/me")
def me(user: Annotated[dict, Depends(get_current_user)]) -> dict:
    return {"user": user}
