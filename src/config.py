import os

import streamlit as st
from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()


def get_supabase_url() -> str:
    """Get Supabase URL from st.secrets (production) or .env (local dev)."""
    try:
        return st.secrets["SUPABASE_URL"]
    except (FileNotFoundError, KeyError):
        url = os.getenv("SUPABASE_URL")
        if not url:
            raise ValueError("SUPABASE_URL not found in st.secrets or .env")
        return url


def get_supabase_anon_key() -> str:
    """Get Supabase anon key from st.secrets (production) or .env (local dev)."""
    try:
        return st.secrets["SUPABASE_ANON_KEY"]
    except (FileNotFoundError, KeyError):
        key = os.getenv("SUPABASE_ANON_KEY")
        if not key:
            raise ValueError("SUPABASE_ANON_KEY not found in st.secrets or .env")
        return key


def get_supabase_client() -> Client:
    """Create and return a Supabase client instance."""
    url = get_supabase_url()
    key = get_supabase_anon_key()
    return create_client(url, key)


def get_authenticated_client() -> Client:
    """Create Supabase client with user's JWT session for RLS-compliant operations."""
    url = get_supabase_url()
    key = get_supabase_anon_key()
    client = create_client(url, key)
    access_token = st.session_state.get("access_token")
    refresh_token = st.session_state.get("refresh_token")
    if access_token and refresh_token:
        client.auth.set_session(access_token, refresh_token)
    return client


def get_make_webhook_url() -> str:
    """Get Make.com classification webhook URL from st.secrets (production) or .env (local dev)."""
    try:
        return st.secrets["MAKE_WEBHOOK_URL"]
    except (FileNotFoundError, KeyError):
        url = os.getenv("MAKE_WEBHOOK_URL")
        if not url:
            raise ValueError("MAKE_WEBHOOK_URL not found in st.secrets or .env")
        return url
