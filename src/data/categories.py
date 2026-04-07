"""
categories.py — Category CRUD operations.

All operations use the authenticated Supabase client (RLS-scoped).
Default categories (is_default=True) are visible but not modifiable.
"""

from __future__ import annotations

from typing import Any


def get_all_categories(client: Any) -> list[dict[str, Any]]:
    """Fetch all categories visible to the current user (default + own)."""
    response = (
        client.table("categories")
        .select("id, name, slug, emoji, color_hex, is_default, user_id")
        .order("is_default", desc=True)
        .order("name")
        .execute()
    )
    return response.data or []


def add_category(
    client: Any,
    user_id: str,
    name: str,
    color_hex: str,
    emoji: str,
) -> dict[str, Any]:
    """Create a new custom category."""
    name = name.strip()
    if not name:
        return {"success": False, "error": "O nome da categoria nao pode estar vazio."}

    existing = client.table("categories").select("id").ilike("name", name).execute()
    if existing.data:
        return {"success": False, "error": "Ja existe uma categoria com esse nome."}

    slug = name.lower().replace(" ", "_").replace("-", "_")
    resolved_emoji = emoji.strip() if emoji and emoji.strip() else "🏷️"

    try:
        (
            client.table("categories")
            .insert(
                {
                    "name": name,
                    "slug": slug,
                    "emoji": resolved_emoji,
                    "color_hex": color_hex,
                    "user_id": user_id,
                    "is_default": False,
                }
            )
            .execute()
        )
        return {"success": True}
    except Exception as exc:
        if "23505" in str(exc):
            return {"success": False, "error": "Ja existe uma categoria com esse nome."}
        return {"success": False, "error": "Erro ao criar categoria."}


def rename_category(
    client: Any,
    user_id: str,
    category_id: str,
    new_name: str,
) -> dict[str, Any]:
    """Rename a custom category owned by the user."""
    new_name = new_name.strip()
    if not new_name:
        return {"success": False, "error": "O nome da categoria nao pode estar vazio."}

    existing = client.table("categories").select("id").ilike("name", new_name).execute()
    conflicts = [row for row in (existing.data or []) if row.get("id") != category_id]
    if conflicts:
        return {"success": False, "error": "Ja existe uma categoria com esse nome."}

    try:
        (
            client.table("categories")
            .update({"name": new_name})
            .eq("id", category_id)
            .eq("user_id", user_id)
            .eq("is_default", False)
            .execute()
        )
        return {"success": True}
    except Exception:
        return {"success": False, "error": "Erro ao renomear categoria."}


def delete_category(
    client: Any,
    user_id: str,
    category_id: str,
) -> dict[str, Any]:
    """Delete a custom category owned by the user."""
    try:
        (
            client.table("categories")
            .delete()
            .eq("id", category_id)
            .eq("user_id", user_id)
            .eq("is_default", False)
            .execute()
        )
        return {"success": True}
    except Exception:
        return {"success": False, "error": "Erro ao remover categoria."}
