import os
from functools import lru_cache

from dotenv import load_dotenv
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
        # Allows RLS-aware queries when only a bearer token is available.
        client.postgrest.auth(access_token)

    return client


def get_make_webhook_url() -> str:
    settings = get_settings()
    if not settings.make_webhook_url:
        raise ValueError("MAKE_WEBHOOK_URL not found in environment")
    return settings.make_webhook_url

