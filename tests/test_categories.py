import pytest


# These tests will be activated (skip removed) after Wave 3 creates src/data/categories.py


def test_add_duplicate(mock_supabase):
    """AICL-05 + T-3-02: add_category() returns error dict when a category with same name
    (case-insensitive) already exists. Must NOT insert into DB.
    """
    from src.data.categories import add_category
    # Simulate existing category found
    mock_supabase.table.return_value.select.return_value.ilike.return_value.execute.return_value.data = [
        {"id": "existing-id"}
    ]
    result = add_category(mock_supabase, "user-1", "Pets", "#FF0000", "🐶")
    assert result["success"] is False
    assert "nome" in result["error"].lower() or "existe" in result["error"].lower()
    # insert must NOT have been called
    mock_supabase.table.return_value.insert.assert_not_called()


def test_add_category(mock_supabase):
    """AICL-05: add_category() inserts correct fields when name is unique.
    Slug must be lowercase, spaces -> underscores, hyphens -> underscores.
    is_default must be False. user_id must match argument.
    """
    from src.data.categories import add_category
    # No existing category
    mock_supabase.table.return_value.select.return_value.ilike.return_value.execute.return_value.data = []
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [{"id": "new-id"}]
    result = add_category(mock_supabase, "user-1", "Minha Categoria", "#00FF00", "")
    assert result["success"] is True
    # Verify insert was called with correct shape
    insert_call = mock_supabase.table.return_value.insert.call_args[0][0]
    assert insert_call["slug"] == "minha_categoria"
    assert insert_call["is_default"] is False
    assert insert_call["user_id"] == "user-1"
    assert insert_call["emoji"] == "🏷️"  # fallback emoji when empty
