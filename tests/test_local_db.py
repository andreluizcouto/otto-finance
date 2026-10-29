"""Banco local (SQLite) que substitui o Supabase: filtros, joins e escrita no formato que os módulos usam."""

import pytest
from fastapi.testclient import TestClient

from backend.local_db import LocalClient, LocalDatabase

USER = "00000000-0000-4000-8000-000000000001"


@pytest.fixture
def client(tmp_path):
    return LocalClient(LocalDatabase(tmp_path / "otto.db"))


def test_seeds_default_categories(client):
    rows = client.table("categories").select("slug, is_default").eq("is_default", True).execute().data
    assert len(rows) == 10
    assert all(row["is_default"] is True for row in rows)


def test_insert_returns_row_with_id_and_timestamps(client):
    row = client.table("goals").insert({
        "user_id": USER, "name": "Viagem", "target_amount": 1000, "deadline": "2027-01",
    }).execute().data[0]
    assert row["id"] and row["created_at"]
    assert row["current_amount"] == 0
    assert row["status"] == "active"


def test_or_filter_and_ilike_with_accents(client):
    client.table("categories").insert({
        "name": "Saúde Mental", "slug": "saude_mental", "emoji": "🧠", "color_hex": "#000000",
        "user_id": USER, "is_default": False,
    }).execute()
    client.table("categories").insert({
        "name": "Outro usuário", "slug": "outro", "emoji": "x", "color_hex": "#000000",
        "user_id": "outro", "is_default": False,
    }).execute()

    visible = client.table("categories").select("name").or_(f"is_default.eq.true,user_id.eq.{USER}").execute().data
    names = {row["name"] for row in visible}
    assert "Saúde Mental" in names and "Outro usuário" not in names

    found = client.table("categories").select("id").ilike("name", "SAÚDE MENTAL").execute().data
    assert len(found) == 1


def test_embedded_select_and_count(client):
    category = client.table("categories").select("id").eq("slug", "lazer").execute().data[0]
    client.table("transactions").insert([
        {"user_id": USER, "amount": -10, "date": "2026-10-01", "description": "Cinema", "category_id": category["id"]},
        {"user_id": USER, "amount": -20, "date": "2026-10-02", "description": "Sem nada"},
    ]).execute()

    rows = (
        client.table("transactions")
        .select("description, categories(name, emoji)")
        .eq("user_id", USER)
        .order("date", desc=True)
        .execute()
        .data
    )
    assert rows[0] == {"description": "Sem nada", "categories": None}
    assert rows[1]["categories"] == {"name": "Lazer", "emoji": "🎮"}

    pending = (
        client.table("transactions")
        .select("id", count="exact")
        .or_("category_id.is.null,confidence_score.is.null")
        .eq("manually_reviewed", False)
        .limit(1)
        .execute()
    )
    assert pending.count == 2
    assert len(pending.data) == 1


def test_update_upsert_and_delete(client):
    client.table("profiles").upsert({"user_id": USER, "name": "Ana"}, on_conflict="user_id").execute()
    client.table("profiles").upsert({"user_id": USER, "name": "Ana Paula"}, on_conflict="user_id").execute()
    profiles = client.table("profiles").select("*").execute().data
    assert [row["name"] for row in profiles] == ["Ana Paula"]

    custom = client.table("categories").insert({
        "name": "Pets", "slug": "pets", "emoji": "🐶", "color_hex": "#000000", "user_id": USER,
    }).execute().data[0]
    txn = client.table("transactions").insert({
        "user_id": USER, "amount": -5, "date": "2026-10-01", "description": "Ração", "category_id": custom["id"],
    }).execute().data[0]

    updated = client.table("transactions").update({"manually_reviewed": True}).eq("id", txn["id"]).execute().data
    assert updated[0]["manually_reviewed"] is True

    client.table("categories").delete().eq("id", custom["id"]).execute()
    after = client.table("transactions").select("category_id").eq("id", txn["id"]).execute().data[0]
    assert after["category_id"] is None  # ON DELETE SET NULL


def test_app_runs_without_login(tmp_path, monkeypatch):
    import backend.local_db as local_db

    monkeypatch.setattr(local_db, "_database", LocalDatabase(tmp_path / "otto.db"))
    from backend.main import app

    api = TestClient(app)
    assert api.get("/api/categories").status_code == 200
    assert api.get("/api/dashboard").status_code == 200
    assert api.get("/api/local").json()["db_path"].endswith("otto.db")
