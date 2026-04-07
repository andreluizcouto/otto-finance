import pytest
from unittest.mock import MagicMock


@pytest.fixture
def mock_supabase():
    """Mock Supabase client for unit tests. Avoids real DB calls."""
    client = MagicMock()
    # Default: table().select().eq().execute() returns empty data
    client.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
    client.table.return_value.select.return_value.eq.return_value.execute.return_value.count = 0
    client.table.return_value.insert.return_value.execute.return_value.data = []
    client.table.return_value.update.return_value.eq.return_value.execute.return_value.data = []
    client.table.return_value.delete.return_value.eq.return_value.execute.return_value.data = []
    return client
