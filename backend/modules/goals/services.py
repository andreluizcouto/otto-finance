from __future__ import annotations

from datetime import date, datetime
from typing import Any

from backend.local_db import LocalClient as Client

_MONTH_LABEL_TO_NUMBER = {
    "jan": 1,
    "fev": 2,
    "mar": 3,
    "abr": 4,
    "mai": 5,
    "jun": 6,
    "jul": 7,
    "ago": 8,
    "set": 9,
    "out": 10,
    "nov": 11,
    "dez": 12,
}


def normalize_deadline(value: str) -> str:
    raw = " ".join(str(value or "").strip().split())
    if not raw:
        raise ValueError("Deadline invalido.")

    try:
        return datetime.fromisoformat(raw[:10]).date().isoformat()
    except ValueError:
        pass

    if len(raw) == 7 and raw[4] == "-":
        year, month = raw.split("-")
        return date(int(year), int(month), 1).isoformat()

    parts = raw.lower().split()
    if len(parts) == 2 and parts[0] in _MONTH_LABEL_TO_NUMBER:
        return date(int(parts[1]), _MONTH_LABEL_TO_NUMBER[parts[0]], 1).isoformat()

    raise ValueError("Deadline invalido.")


def list_goals(client: Client, user_id: str) -> list[dict[str, Any]]:
    response = (
        client.table("goals")
        .select(
            "id, name, emoji, type, target_amount, current_amount, deadline, color, category, status, created_at"
        )
        .eq("user_id", user_id)
        .eq("status", "active")
        .order("created_at", desc=False)
        .execute()
    )
    rows = response.data or []
    return [
        {
            "id": row["id"],
            "name": row["name"],
            "emoji": row.get("emoji") or "🎯",
            "type": row.get("type") or "savings",
            "target_amount": float(row.get("target_amount") or 0),
            "current_amount": float(row.get("current_amount") or 0),
            "deadline": row.get("deadline") or "",
            "color": row.get("color") or "#FFFFFF",
            "category": row.get("category"),
            "status": row.get("status") or "active",
            "created_at": row.get("created_at"),
        }
        for row in rows
    ]


def create_goal(client: Client, user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    row = {
        "user_id": user_id,
        "name": payload["name"].strip(),
        "emoji": payload["emoji"],
        "type": payload["type"],
        "target_amount": payload["target_amount"],
        "current_amount": payload.get("current_amount", 0),
        "deadline": normalize_deadline(payload["deadline"]),
        "color": payload["color"],
        "category": payload.get("category"),
        "status": "active",
    }
    response = client.table("goals").insert(row).execute()
    created = (response.data or [{}])[0]
    return {"success": True, "goal": created}


def update_goal_progress(
    client: Client,
    user_id: str,
    goal_id: str,
    action: str,
    amount: float,
) -> dict[str, Any]:
    existing_resp = (
        client.table("goals")
        .select("id, current_amount")
        .eq("id", goal_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    row = (existing_resp.data or [None])[0]
    if not row:
        return {"success": False, "error": "Meta nao encontrada."}

    current_amount = float(row.get("current_amount") or 0)
    next_amount = current_amount + amount if action == "add" else max(current_amount - amount, 0)

    update_resp = (
        client.table("goals")
        .update({"current_amount": next_amount})
        .eq("id", goal_id)
        .eq("user_id", user_id)
        .execute()
    )
    updated = (update_resp.data or [{}])[0]
    return {"success": True, "goal": updated}


def update_goal_status(
    client: Client,
    user_id: str,
    goal_id: str,
    status: str,
) -> dict[str, Any]:
    existing_resp = (
        client.table("goals")
        .select("id")
        .eq("id", goal_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not existing_resp.data:
        return {"success": False, "error": "Meta nao encontrada."}

    update_resp = (
        client.table("goals")
        .update({"status": status})
        .eq("id", goal_id)
        .eq("user_id", user_id)
        .execute()
    )
    return {"success": True}
