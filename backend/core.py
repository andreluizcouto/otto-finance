import os
from functools import lru_cache
from typing import Annotated

from dotenv import load_dotenv
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client, create_client

load_dotenv()

class Settings:
    def __init__(self) -> None:
        self.supabase_url = self._get_required("SUPABASE_URL")
        self.supabase_anon_key = self._get_required("SUPABASE_ANON_KEY")
        self.make_webhook_url = os.getenv("MAKE_WEBHOOK_URL", "").strip()

    @staticmethod
    def _get_required(name: str) -> str:
        value = os.getenv(name, "").strip()
        if not value:
            raise ValueError(f"{name} not found in environment")
        return value

@lru_cache
def get_settings() -> Settings:
    return Settings()

def get_supabase_client() -> Client:
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_anon_key)

def get_authenticated_client(
    access_token: str | None = None,
    refresh_token: str | None = None,
) -> Client:
    client = get_supabase_client()

    if access_token and refresh_token:
        client.auth.set_session(access_token, refresh_token)
    elif access_token:
        client.postgrest.auth(access_token)

    return client

def get_make_webhook_url() -> str:
    settings = get_settings()
    if not settings.make_webhook_url:
        raise ValueError("MAKE_WEBHOOK_URL not found in environment")
    return settings.make_webhook_url

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
    from backend.modules.auth.services import get_user_from_token
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


def format_brl(value: float) -> str:
    """Formata um valor float para o padrão de moeda brasileiro (R$)."""
    return f"R$ {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")