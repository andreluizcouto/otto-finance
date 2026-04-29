import pytest


def test_normalize_deadline_accepts_month_label():
    from backend.modules.goals.services import normalize_deadline

    assert normalize_deadline("Abr 2026") == "2026-04-01"


def test_normalize_deadline_accepts_iso_date():
    from backend.modules.goals.services import normalize_deadline

    assert normalize_deadline("2026-04-15") == "2026-04-15"


def test_normalize_deadline_rejects_invalid_value():
    from backend.modules.goals.services import normalize_deadline

    with pytest.raises(ValueError):
        normalize_deadline("nao existe")


class _GoalQuery:
    def __init__(self, rows=None):
        self.rows = rows if rows is not None else [{"id": "goal-1"}]
        self.eq_calls = []
        self.updated_payload = None

    def update(self, payload):
        self.updated_payload = payload
        return self

    def eq(self, field, value):
        self.eq_calls.append((field, value))
        return self

    def select(self, *_args):
        return self

    def limit(self, *_args):
        return self

    def execute(self):
        class _Resp:
            data = []

        resp = _Resp()
        resp.data = self.rows
        return resp


class _GoalClient:
    def __init__(self, query):
        self.query = query

    def table(self, name):
        assert name == "goals"
        return self.query


def test_update_goal_status_filters_by_user_id():
    from backend.modules.goals.services import update_goal_status

    query = _GoalQuery()
    result = update_goal_status(_GoalClient(query), "user-1", "goal-1", "completed")

    assert result["success"] is True
    assert query.updated_payload == {"status": "completed"}
    assert ("id", "goal-1") in query.eq_calls
    assert ("user_id", "user-1") in query.eq_calls


def test_update_goal_status_returns_error_when_not_found():
    from backend.modules.goals.services import update_goal_status

    result = update_goal_status(_GoalClient(_GoalQuery(rows=[])), "user-1", "goal-1", "completed")

    assert result["success"] is False
