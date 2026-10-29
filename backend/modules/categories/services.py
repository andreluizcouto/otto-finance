from backend.local_db import LocalClient as Client


def _slugify(name: str) -> str:
    slug = name.lower().replace(" ", "_").replace("-", "_")
    return "".join(char for char in slug if char.isalnum() or char == "_").strip("_") or "categoria"


def _user_slug(base: str, user_id: str) -> str:
    suffix = "_" + user_id.replace("-", "")[:8]
    return f"{base[:50 - len(suffix)]}{suffix}"


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

    slug = _slugify(name)
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
    return update_category(
        client=client,
        user_id=user_id,
        category_id=category_id,
        new_name=new_name,
    )


def update_category(
    client: Client,
    user_id: str,
    category_id: str,
    new_name: str,
    color_hex: str | None = None,
    emoji: str | None = None,
) -> dict:
    new_name = new_name.strip()
    if not new_name:
        return {"success": False, "error": "O nome da categoria nao pode estar vazio."}

    current = (
        client.table("categories")
        .select("id, name, slug, emoji, color_hex, is_default, user_id")
        .eq("id", category_id)
        .limit(1)
        .execute()
    )
    current_category = (current.data or [None])[0]
    if not current_category:
        return {"success": False, "error": "Categoria nao encontrada."}

    existing_query = client.table("categories").select("id").ilike("name", new_name)
    if hasattr(existing_query, "or_"):
        existing_query = existing_query.or_(f"is_default.eq.true,user_id.eq.{user_id}")
    existing = existing_query.execute()
    conflicts = [row for row in (existing.data or []) if row.get("id") != category_id]
    if conflicts:
        return {"success": False, "error": "Ja existe uma categoria com esse nome."}

    payload = {"name": new_name}
    if color_hex is not None:
        payload["color_hex"] = color_hex
    if emoji is not None:
        payload["emoji"] = emoji.strip() if emoji.strip() else "🏷️"

    if current_category.get("is_default"):
        default_payload = {
            "name": new_name,
            "color_hex": payload.get("color_hex") or current_category.get("color_hex") or "#FFFFFF",
            "emoji": payload.get("emoji") or current_category.get("emoji") or "🏷️",
        }
        try:
            insert_resp = client.table("categories").insert({
                **default_payload,
                "slug": _user_slug(_slugify(new_name), user_id),
                "user_id": user_id,
                "is_default": False,
            }).execute()
            created = (insert_resp.data or [None])[0]
            new_category_id = created.get("id") if created else None
            if not new_category_id:
                return {"success": False, "error": "Erro ao criar categoria personalizada."}

            client.table("transactions").update({"category_id": new_category_id}).eq("user_id", user_id).eq("category_id", category_id).execute()
            client.table("budgets").update({"category_id": new_category_id}).eq("user_id", user_id).eq("category_id", category_id).execute()
            return {"success": True, "category_id": new_category_id, "replaced_default": True}
        except Exception:
            return {"success": False, "error": "Erro ao atualizar categoria."}

    try:
        response = (
            client.table("categories")
            .update(payload)
            .eq("id", category_id)
            .eq("user_id", user_id)
            .eq("is_default", False)
            .select("id")
            .execute()
        )
        if not response.data:
            return {"success": False, "error": "Categoria nao encontrada ou nao editavel."}
        return {"success": True}
    except Exception:
        return {"success": False, "error": "Erro ao atualizar categoria."}

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
