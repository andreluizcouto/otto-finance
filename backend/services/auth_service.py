from __future__ import annotations

from typing import Any

from backend.core.config import get_authenticated_client, get_supabase_client


def _serialize_user(user: Any) -> dict[str, Any]:
    return {
        "id": str(user.id),
        "email": user.email,
        "created_at": str(user.created_at),
    }


def _serialize_session(session: Any) -> dict[str, str]:
    return {
        "access_token": session.access_token,
        "refresh_token": session.refresh_token,
        "token_type": "bearer",
    }


def sign_up(email: str, password: str) -> dict[str, Any]:
    client = get_supabase_client()
    try:
        response = client.auth.sign_up({"email": email, "password": password})
        if response.user:
            result: dict[str, Any] = {
                "success": True,
                "user": _serialize_user(response.user),
                "error": None,
            }
            if response.session:
                result["session"] = _serialize_session(response.session)
            else:
                result["needs_confirmation"] = True
            return result
        return {
            "success": False,
            "user": None,
            "error": "Algo deu errado. Verifique sua conexao e tente novamente.",
        }
    except Exception as exc:
        error_msg = str(exc).lower()
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


def sign_in(email: str, password: str) -> dict[str, Any]:
    client = get_supabase_client()
    try:
        response = client.auth.sign_in_with_password(
            {"email": email, "password": password}
        )
        if response.user and response.session:
            return {
                "success": True,
                "user": _serialize_user(response.user),
                "session": _serialize_session(response.session),
                "error": None,
            }
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


def sign_out(access_token: str, refresh_token: str | None = None) -> None:
    try:
        client = get_authenticated_client(access_token, refresh_token)
        client.auth.sign_out()
    except Exception:
        return


def get_user_from_token(access_token: str) -> dict[str, Any] | None:
    try:
        client = get_supabase_client()
        response = client.auth.get_user(access_token)
        user = response.user
        if not user:
            return None
        return _serialize_user(user)
    except Exception:
        return None

