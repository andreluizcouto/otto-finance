from supabase import Client

def list_categories(client: Client, user_id: str) -> list[dict]:
    response = (
        client.table("categories")
        .select("id, name, slug, emoji, color_hex, is_default")
        .or_(f"is_default.eq.true,user_id.eq.{user_id}")
        .order("is_default", desc=True)
        .order("name")
        .execute()
    )
    return response.data or []

def add_category(
    client: Client,
    user_id: str,
    name: str,
    color_hex: str,
    emoji: str,
) -> dict:
    name = name.strip()
    if not name:
        return {"success": False, "error": "O nome da categoria nao pode estar vazio."}

    existing = (
        client.table("categories")
        .select("id")
        .ilike("name", name)
        .or_(f"is_default.eq.true,user_id.eq.{user_id}")
        .execute()
    )
    if existing.data:
        return {"success": False, "error": "Ja existe uma categoria com esse nome."}

    slug = name.lower().replace(" ", "_").replace("-", "_")
    resolved_emoji = emoji.strip() if emoji and emoji.strip() else "🏷️"

    try:
        client.table("categories").insert({
            "name": name,
            "slug": slug,
            "emoji": resolved_emoji,
            "color_hex": color_hex,
            "user_id": user_id,
            "is_default": False,
        }).execute()
        return {"success": True}
    except Exception as exc:
        if "23505" in str(exc):
            return {"success": False, "error": "Ja existe uma categoria com esse nome."}
        return {"success": False, "error": "Erro ao criar categoria."}

def rename_category(
    client: Client,
    user_id: str,
    category_id: str,
    new_name: str,
) -> dict:
    new_name = new_name.strip()
    if not new_name:
        return {"success": False, "error": "O nome da categoria nao pode estar vazio."}

    existing = client.table("categories").select("id").ilike("name", new_name).execute()
    conflicts = [row for row in (existing.data or []) if row.get("id") != category_id]
    if conflicts:
        return {"success": False, "error": "Ja existe uma categoria com esse nome."}

    try:
        client.table("categories").update({"name": new_name}).eq("id", category_id).eq("user_id", user_id).eq("is_default", False).execute()
        return {"success": True}
    except Exception:
        return {"success": False, "error": "Erro ao renomear categoria."}

def delete_category(
    client: Client,
    user_id: str,
    category_id: str,
) -> dict:
    try:
        client.table("categories").delete().eq("id", category_id).eq("user_id", user_id).eq("is_default", False).execute()
        return {"success": True}
    except Exception:
        return {"success": False, "error": "Erro ao remover categoria."}
