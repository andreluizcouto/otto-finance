import pytest


# These tests will be activated (skip removed) after Wave 3 creates src/data/categories.py


def test_add_duplicate(mock_supabase):
    """AICL-05 + T-3-02: add_category() returns error dict when a category with same name
    (case-insensitive) already exists. Must NOT insert into DB.
    """
    from backend.modules.categories.services import add_category
    # Simulate existing category found
    mock_supabase.table.return_value.select.return_value.ilike.return_value.or_.return_value.execute.return_value.data = [
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
    from backend.modules.categories.services import add_category
    # No existing category
    mock_supabase.table.return_value.select.return_value.ilike.return_value.or_.return_value.execute.return_value.data = []
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [{"id": "new-id"}]
    result = add_category(mock_supabase, "user-1", "Minha Categoria", "#00FF00", "")
    assert result["success"] is True
    # Verify insert was called with correct shape
    insert_call = mock_supabase.table.return_value.insert.call_args[0][0]
    assert insert_call["slug"] == "minha_categoria"
    assert insert_call["is_default"] is False
    assert insert_call["user_id"] == "user-1"
    assert insert_call["emoji"] == "🏷️"  # fallback emoji when empty


class _RecorderQuery:
    def __init__(self, existing_data=None, should_fail=False, execute_sequence=None):
        self.existing_data = existing_data if existing_data is not None else []
        self.execute_sequence = list(execute_sequence or [])
        self.should_fail = should_fail
        self.eq_calls = []
        self.updated_payload = None
        self.inserted_payload = None
        self.did_update = False
        self.did_delete = False
        self.did_insert = False

    def select(self, *_args, **_kwargs):
        return self

    def limit(self, *_args, **_kwargs):
        return self

    def ilike(self, *_args, **_kwargs):
        return self

    def or_(self, *_args, **_kwargs):
        return self

    def update(self, payload):
        self.did_update = True
        self.updated_payload = payload
        return self

    def insert(self, payload):
        self.did_insert = True
        self.inserted_payload = payload
        return self

    def delete(self):
        self.did_delete = True
        return self

    def eq(self, field, value):
        self.eq_calls.append((field, value))
        return self

    def execute(self):
        if self.should_fail:
            raise RuntimeError("db error")

        class _Resp:
            data = []

        resp = _Resp()
        if not self.did_update and not self.did_delete and not self.did_insert:
            resp.data = self.execute_sequence.pop(0) if self.execute_sequence else self.existing_data
        if self.did_update:
            resp.data = [{"id": "updated-id"}]
        if self.did_insert:
            resp.data = [{"id": "custom-cat"}]
        return resp


class _RecorderClient:
    def __init__(self, query):
        self.query = query

    def table(self, _name):
        return self.query


def test_rename_category_filters_user_and_non_default():
    from backend.modules.categories.services import rename_category

    query = _RecorderQuery(execute_sequence=[[{"id": "cat-1", "is_default": False}], []])
    client = _RecorderClient(query)

    result = rename_category(client, "user-9", "cat-1", "Novo Nome")

    assert result["success"] is True
    assert query.updated_payload == {"name": "Novo Nome"}
    assert ("id", "cat-1") in query.eq_calls
    assert ("user_id", "user-9") in query.eq_calls
    assert ("is_default", False) in query.eq_calls


def test_update_category_updates_name_color_and_emoji():
    from backend.modules.categories.services import update_category

    query = _RecorderQuery(execute_sequence=[[{"id": "cat-1", "is_default": False}], []])
    client = _RecorderClient(query)

    result = update_category(
        client,
        "user-9",
        "cat-1",
        "Mercado",
        color_hex="#22C55E",
        emoji="🛒",
    )

    assert result["success"] is True
    assert query.updated_payload == {
        "name": "Mercado",
        "color_hex": "#22C55E",
        "emoji": "🛒",
    }
    assert ("id", "cat-1") in query.eq_calls
    assert ("user_id", "user-9") in query.eq_calls
    assert ("is_default", False) in query.eq_calls


def test_rename_category_duplicate_returns_error_without_update():
    from backend.modules.categories.services import rename_category

    query = _RecorderQuery(execute_sequence=[[{"id": "cat-1", "is_default": False}], [{"id": "other-cat"}]])
    client = _RecorderClient(query)

    result = rename_category(client, "user-9", "cat-1", "Duplicada")

    assert result["success"] is False
    assert "existe" in result["error"].lower()
    assert query.did_update is False


def test_delete_category_filters_user_and_non_default():
    from backend.modules.categories.services import delete_category

    query = _RecorderQuery()
    client = _RecorderClient(query)

    result = delete_category(client, "user-9", "cat-1")

    assert result["success"] is True
    assert query.did_delete is True
    assert ("id", "cat-1") in query.eq_calls
    assert ("user_id", "user-9") in query.eq_calls
    assert ("is_default", False) in query.eq_calls


def test_delete_category_db_error_message():
    from backend.modules.categories.services import delete_category

    query = _RecorderQuery(should_fail=True)
    client = _RecorderClient(query)

    result = delete_category(client, "user-9", "cat-1")

    assert result["success"] is False
    assert "erro ao remover categoria" in result["error"].lower()
