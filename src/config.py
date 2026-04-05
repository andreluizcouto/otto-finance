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
