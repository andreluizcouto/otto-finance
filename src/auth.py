import streamlit as st

from src.config import get_supabase_client


def sign_up(email: str, password: str) -> dict:
    """
    Register a new user with email and password.
    Returns dict with 'success' (bool), 'user' (object or None), 'error' (str or None).
    """
    client = get_supabase_client()
    try:
        response = client.auth.sign_up({"email": email, "password": password})
        if response.user:
            st.session_state["access_token"] = (
                response.session.access_token if response.session else None
            )
            st.session_state["user"] = {
                "id": str(response.user.id),
                "email": response.user.email,
                "created_at": str(response.user.created_at),
            }
            return {"success": True, "user": response.user, "error": None}
        return {
            "success": False,
            "user": None,
            "error": "Algo deu errado. Verifique sua conexao e tente novamente.",
        }
    except Exception as e:
        error_msg = str(e).lower()
        if "already registered" in error_msg or "already been registered" in error_msg:
            return {
                "success": False,
                "user": None,
                "error": "Este email ja esta cadastrado. Tente fazer login.",
            }
        if "password" in error_msg and (
            "weak" in error_msg or "short" in error_msg or "least" in error_msg
        ):
            return {
                "success": False,
                "user": None,
                "error": "A senha deve ter pelo menos 6 caracteres.",
            }
        return {
            "success": False,
            "user": None,
            "error": "Algo deu errado. Verifique sua conexao e tente novamente.",
        }


def sign_in(email: str, password: str) -> dict:
    """
    Sign in an existing user with email and password.
    Returns dict with 'success' (bool), 'user' (object or None), 'error' (str or None).
    """
    client = get_supabase_client()
    try:
        response = client.auth.sign_in_with_password(
            {"email": email, "password": password}
        )
        if response.user and response.session:
            st.session_state["access_token"] = response.session.access_token
            st.session_state["refresh_token"] = response.session.refresh_token
            st.session_state["user"] = {
                "id": str(response.user.id),
                "email": response.user.email,
                "created_at": str(response.user.created_at),
            }
            return {"success": True, "user": response.user, "error": None}
        return {
            "success": False,
            "user": None,
            "error": "Email ou senha incorretos. Tente novamente.",
        }
    except Exception:
        return {
            "success": False,
            "user": None,
            "error": "Email ou senha incorretos. Tente novamente.",
        }


def sign_out() -> None:
    """Sign out the current user and clear session state."""
    try:
        client = get_supabase_client()
        client.auth.sign_out()
    except Exception:
        pass  # Even if server sign-out fails, clear local state
    for key in ["access_token", "refresh_token", "user"]:
        st.session_state.pop(key, None)


def is_authenticated() -> bool:
    """Check if a user is currently authenticated via session state."""
    return (
        "access_token" in st.session_state
        and st.session_state["access_token"] is not None
        and "user" in st.session_state
        and st.session_state["user"] is not None
    )


def get_current_user() -> dict | None:
    """Return the current user dict from session state, or None if not authenticated."""
    if is_authenticated():
        return st.session_state["user"]
    return None
