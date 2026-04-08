from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client

from backend.core.config import get_authenticated_client
from backend.services.auth_service import get_user_from_token

bearer_scheme = HTTPBearer(auto_error=False)


def get_access_token(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> str:
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticacao nao fornecido.",
        )
    return credentials.credentials


def get_refresh_token(
    refresh_token: Annotated[str | None, Header(alias="X-Refresh-Token")] = None,
) -> str | None:
    return refresh_token


def get_current_user(access_token: Annotated[str, Depends(get_access_token)]) -> dict:
    user = get_user_from_token(access_token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalido ou expirado.",
        )
    return user


def get_current_client(
    access_token: Annotated[str, Depends(get_access_token)],
    refresh_token: Annotated[str | None, Depends(get_refresh_token)],
) -> Client:
    return get_authenticated_client(access_token=access_token, refresh_token=refresh_token)

