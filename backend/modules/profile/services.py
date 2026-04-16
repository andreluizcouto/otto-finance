from __future__ import annotations

from typing import Any

from supabase import Client


def _only_digits(value: str) -> str:
    return "".join(ch for ch in value if ch.isdigit())


def is_valid_cpf(cpf: str) -> bool:
    digits = _only_digits(cpf)
    if len(digits) != 11 or digits == digits[0] * 11:
        return False

    total = sum(int(digits[i]) * (10 - i) for i in range(9))
    check_1 = (total * 10 % 11) % 10
    total = sum(int(digits[i]) * (11 - i) for i in range(10))
    check_2 = (total * 10 % 11) % 10
    return digits[-2:] == f"{check_1}{check_2}"


def get_profile(client: Client, user: dict[str, Any]) -> dict[str, Any]:
    user_id = user["id"]
    email = user.get("email") or ""
    response = (
        client.table("profiles")
        .select("user_id, name, phone, cpf")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    profile = (response.data or [None])[0] or {}
    return {
        "name": profile.get("name") or email.split("@")[0] or "Usuário",
        "email": email,
        "phone": profile.get("phone") or "",
        "cpf": profile.get("cpf") or "",
    }


def update_profile(client: Client, user_id: str, name: str, phone: str, cpf: str) -> dict[str, Any]:
    if cpf and not is_valid_cpf(cpf):
        return {"success": False, "error": "CPF invalido."}

    row = {
        "user_id": user_id,
        "name": name.strip(),
    }
    if phone:
        row["phone"] = phone.strip()
    if cpf:
        row["cpf"] = cpf.strip()

    client.table("profiles").upsert(row, on_conflict="user_id").execute()
    return {"success": True}
