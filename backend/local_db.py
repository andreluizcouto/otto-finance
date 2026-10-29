"""
Banco local do OTTO (SQLite).

Tudo fica num arquivo na máquina de quem roda o app (padrão: data/otto.db). Para os
módulos não precisarem mudar, LocalClient imita o pedaço do cliente do Supabase que
o OTTO usa: client.table("x").select(...).eq(...).order(...).execute().data
"""

from __future__ import annotations

import os
import re
import sqlite3
import threading
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_DB_PATH = ROOT_DIR / "data" / "otto.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    emoji TEXT NOT NULL,
    color_hex TEXT NOT NULL,
    user_id TEXT,
    is_default INTEGER DEFAULT 0,
    created_at TEXT
);

CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    transaction_time TEXT,
    description TEXT NOT NULL,
    merchant_name TEXT,
    raw_text TEXT,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    confidence_score TEXT CHECK (confidence_score IN ('high', 'medium', 'low')),
    payment_method TEXT CHECK (payment_method IN ('credito', 'debito', 'pix', 'dinheiro', 'transferencia')),
    is_recurring INTEGER DEFAULT 0,
    notes TEXT,
    created_at TEXT,
    updated_at TEXT,
    manually_reviewed INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    monthly_limit REAL NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT,
    updated_at TEXT,
    UNIQUE(user_id, category_id)
);

CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL DEFAULT '🎯',
    type TEXT NOT NULL DEFAULT 'savings' CHECK (type IN ('savings', 'spending')),
    target_amount REAL NOT NULL,
    current_amount REAL DEFAULT 0,
    deadline TEXT,
    color TEXT NOT NULL DEFAULT '#FFFFFF',
    category TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TEXT,
    updated_at TEXT
);

CREATE TABLE IF NOT EXISTS profiles (
    user_id TEXT PRIMARY KEY,
    name TEXT,
    phone TEXT,
    cpf TEXT,
    created_at TEXT,
    updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
"""

DEFAULT_CATEGORIES = [
    ("Alimentacao", "alimentacao", "🍔", "#EF4444"),
    ("Transporte", "transporte", "🚗", "#3B82F6"),
    ("Moradia", "moradia", "🏠", "#8B5CF6"),
    ("Saude", "saude", "💊", "#22C55E"),
    ("Lazer", "lazer", "🎮", "#F59E0B"),
    ("Educacao", "educacao", "📚", "#06B6D4"),
    ("Compras", "compras", "🛍️", "#EC4899"),
    ("Assinaturas", "assinaturas", "🔄", "#6366F1"),
    ("Delivery", "delivery", "🚴", "#F97316"),
    ("Outros", "outros", "📌", "#64748B"),
]

# SQLite guarda booleano como 0/1; estas colunas voltam como True/False, igual ao Postgres.
BOOL_COLUMNS = {
    "categories": {"is_default"},
    "transactions": {"is_recurring", "manually_reviewed"},
    "budgets": {"is_active"},
}

# Selects aninhados no estilo do PostgREST, ex.: "categories(name, emoji)" em transactions.
FOREIGN_KEYS = {
    ("transactions", "categories"): "category_id",
    ("budgets", "categories"): "category_id",
}

_IDENT_RE = re.compile(r"^[a-z_][a-z0-9_]*$")
_EMBED_RE = re.compile(r"^([a-z_][a-z0-9_]*)\((.*)\)$")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _ident(name: str) -> str:
    name = name.strip()
    if not _IDENT_RE.match(name):
        raise ValueError(f"Nome de coluna invalido: {name!r}")
    return name


def _to_sql(value: Any) -> Any:
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, uuid.UUID):
        return str(value)
    return value


def _ilike(value: Any, pattern: Any) -> int:
    """ILIKE do Postgres, inclusive com acento (o LIKE do SQLite só ignora caixa em ASCII)."""
    if value is None or pattern is None:
        return 0
    regex = "".join(
        ".*" if ch == "%" else "." if ch == "_" else re.escape(ch) for ch in str(pattern)
    )
    return int(re.fullmatch(regex, str(value), flags=re.IGNORECASE | re.DOTALL) is not None)


def _split_top_level(text: str) -> list[str]:
    parts, depth, current = [], 0, ""
    for ch in text:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        if ch == "," and depth == 0:
            parts.append(current.strip())
            current = ""
        else:
            current += ch
    if current.strip():
        parts.append(current.strip())
    return parts


def _parse_literal(raw: str) -> Any:
    lowered = raw.lower()
    if lowered == "null":
        return None
    if lowered == "true":
        return True
    if lowered == "false":
        return False
    return raw


_OPERATORS = {"eq": "=", "neq": "!=", "gt": ">", "gte": ">=", "lt": "<", "lte": "<="}


def _condition(column: str, op: str, value: Any) -> tuple[str, list[Any]]:
    column = _ident(column)
    if op == "is" or (op == "eq" and value is None):
        if value is None:
            return f"{column} IS NULL", []
        return f"{column} = ?", [_to_sql(value)]
    if op == "ilike":
        return f"ilike({column}, ?)", [value]
    if op not in _OPERATORS:
        raise ValueError(f"Operador nao suportado: {op}")
    return f"{column} {_OPERATORS[op]} ?", [_to_sql(value)]


@dataclass
class Result:
    data: list[dict[str, Any]]
    count: int | None = None


class LocalDatabase:
    def __init__(self, path: str | Path) -> None:
        self.path = str(path)
        self._lock = threading.Lock()
        self._ready = False

    def connect(self) -> sqlite3.Connection:
        if not self._ready:
            self._init()
        conn = sqlite3.connect(self.path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        conn.create_function("ilike", 2, _ilike, deterministic=True)
        return conn

    def _init(self) -> None:
        with self._lock:
            if self._ready:
                return
            if self.path != ":memory:":
                Path(self.path).parent.mkdir(parents=True, exist_ok=True)
            conn = sqlite3.connect(self.path)
            try:
                conn.executescript(SCHEMA)
                for name, slug, emoji, color in DEFAULT_CATEGORIES:
                    conn.execute(
                        "INSERT OR IGNORE INTO categories (id, name, slug, emoji, color_hex, user_id, is_default, created_at)"
                        " VALUES (?, ?, ?, ?, ?, NULL, 1, ?)",
                        (str(uuid.uuid4()), name, slug, emoji, color, _now()),
                    )
                conn.commit()
            finally:
                conn.close()
            self._ready = True


class Query:
    def __init__(self, db: LocalDatabase, table: str) -> None:
        self._db = db
        self._table = _ident(table)
        self._mode = "select"
        self._columns = "*"
        self._count: str | None = None
        self._where: list[tuple[str, list[Any]]] = []
        self._order: list[str] = []
        self._limit: int | None = None
        self._payload: Any = None
        self._on_conflict: str | None = None

    # ── leitura ──────────────────────────────────────────────────────────────
    def select(self, columns: str = "*", count: str | None = None) -> "Query":
        self._columns = columns
        self._count = count
        return self

    def eq(self, column: str, value: Any) -> "Query":
        self._where.append(_condition(column, "eq", value))
        return self

    def neq(self, column: str, value: Any) -> "Query":
        self._where.append(_condition(column, "neq", value))
        return self

    def gt(self, column: str, value: Any) -> "Query":
        self._where.append(_condition(column, "gt", value))
        return self

    def gte(self, column: str, value: Any) -> "Query":
        self._where.append(_condition(column, "gte", value))
        return self

    def lt(self, column: str, value: Any) -> "Query":
        self._where.append(_condition(column, "lt", value))
        return self

    def lte(self, column: str, value: Any) -> "Query":
        self._where.append(_condition(column, "lte", value))
        return self

    def ilike(self, column: str, pattern: str) -> "Query":
        self._where.append(_condition(column, "ilike", pattern))
        return self

    def match(self, filters: dict[str, Any]) -> "Query":
        for column, value in filters.items():
            self.eq(column, value)
        return self

    def or_(self, expression: str) -> "Query":
        """Filtro OR no formato do PostgREST: "is_default.eq.true,user_id.eq.abc"."""
        clauses, params = [], []
        for part in _split_top_level(expression):
            column, op, raw = part.split(".", 2)
            sql, values = _condition(column, op, _parse_literal(raw))
            clauses.append(sql)
            params.extend(values)
        self._where.append(("(" + " OR ".join(clauses) + ")", params))
        return self

    def order(self, column: str, desc: bool = False) -> "Query":
        self._order.append(f"{_ident(column)} {'DESC' if desc else 'ASC'}")
        return self

    def limit(self, count: int) -> "Query":
        self._limit = int(count)
        return self

    # ── escrita ──────────────────────────────────────────────────────────────
    def insert(self, rows: dict[str, Any] | list[dict[str, Any]]) -> "Query":
        self._mode = "insert"
        self._payload = rows
        return self

    def upsert(self, rows: dict[str, Any] | list[dict[str, Any]], on_conflict: str = "id") -> "Query":
        self._mode = "upsert"
        self._payload = rows
        self._on_conflict = on_conflict
        return self

    def update(self, values: dict[str, Any]) -> "Query":
        self._mode = "update"
        self._payload = values
        return self

    def delete(self) -> "Query":
        self._mode = "delete"
        return self

    # ── execução ─────────────────────────────────────────────────────────────
    def execute(self) -> Result:
        conn = self._db.connect()
        try:
            if self._mode == "select":
                result = self._run_select(conn)
            elif self._mode in ("insert", "upsert"):
                result = self._run_insert(conn)
            elif self._mode == "update":
                result = self._run_update(conn)
            else:
                result = self._run_delete(conn)
            conn.commit()
            return result
        finally:
            conn.close()

    def _where_sql(self) -> tuple[str, list[Any]]:
        if not self._where:
            return "", []
        clauses = [sql for sql, _ in self._where]
        params = [value for _, values in self._where for value in values]
        return " WHERE " + " AND ".join(clauses), params

    def _table_columns(self, conn: sqlite3.Connection) -> set[str]:
        return {row["name"] for row in conn.execute(f"PRAGMA table_info({self._table})")}

    def _fetch_rows(self, conn: sqlite3.Connection, where: str, params: list[Any]) -> list[dict[str, Any]]:
        sql = f"SELECT * FROM {self._table}{where}"
        if self._order:
            sql += " ORDER BY " + ", ".join(self._order)
        if self._limit is not None:
            sql += f" LIMIT {self._limit}"
        return [self._decode(self._table, dict(row)) for row in conn.execute(sql, params)]

    def _run_select(self, conn: sqlite3.Connection) -> Result:
        where, params = self._where_sql()
        count = None
        if self._count:
            count = conn.execute(f"SELECT COUNT(*) FROM {self._table}{where}", params).fetchone()[0]
        rows = self._fetch_rows(conn, where, params)
        return Result(data=self._project(conn, rows), count=count)

    def _run_insert(self, conn: sqlite3.Connection) -> Result:
        rows = self._payload if isinstance(self._payload, list) else [self._payload]
        table_columns = self._table_columns(conn)
        inserted_keys = []
        for row in rows:
            record = {key: _to_sql(value) for key, value in row.items()}
            if "id" in table_columns and not record.get("id"):
                record["id"] = str(uuid.uuid4())
            for stamp in ("created_at", "updated_at"):
                if stamp in table_columns and not record.get(stamp):
                    record[stamp] = _now()
            columns = [_ident(column) for column in record]
            placeholders = ", ".join("?" for _ in columns)
            sql = f"INSERT INTO {self._table} ({', '.join(columns)}) VALUES ({placeholders})"
            if self._mode == "upsert":
                conflict = [_ident(column) for column in (self._on_conflict or "id").split(",")]
                updates = [f"{column} = excluded.{column}" for column in columns if column not in conflict and column != "created_at"]
                sql += f" ON CONFLICT ({', '.join(conflict)}) DO " + (f"UPDATE SET {', '.join(updates)}" if updates else "NOTHING")
                key_column = conflict[0]
            else:
                key_column = "id" if "id" in record else columns[0]
            conn.execute(sql, list(record.values()))
            inserted_keys.append((key_column, record[key_column]))

        data = []
        for key_column, key in inserted_keys:
            row = conn.execute(f"SELECT * FROM {self._table} WHERE {key_column} = ?", [key]).fetchone()
            if row:
                data.append(self._decode(self._table, dict(row)))
        return Result(data=self._project(conn, data))

    def _run_update(self, conn: sqlite3.Connection) -> Result:
        values = {_ident(key): _to_sql(value) for key, value in self._payload.items()}
        if "updated_at" in self._table_columns(conn) and "updated_at" not in values:
            values["updated_at"] = _now()
        where, params = self._where_sql()
        rowids = [row[0] for row in conn.execute(f"SELECT rowid FROM {self._table}{where}", params)]
        if not rowids:
            return Result(data=[])
        assignments = ", ".join(f"{column} = ?" for column in values)
        marks = ", ".join("?" for _ in rowids)
        conn.execute(
            f"UPDATE {self._table} SET {assignments} WHERE rowid IN ({marks})",
            [*values.values(), *rowids],
        )
        rows = [
            self._decode(self._table, dict(row))
            for row in conn.execute(f"SELECT * FROM {self._table} WHERE rowid IN ({marks})", rowids)
        ]
        return Result(data=self._project(conn, rows))

    def _run_delete(self, conn: sqlite3.Connection) -> Result:
        where, params = self._where_sql()
        rows = [self._decode(self._table, dict(row)) for row in conn.execute(f"SELECT * FROM {self._table}{where}", params)]
        conn.execute(f"DELETE FROM {self._table}{where}", params)
        return Result(data=self._project(conn, rows))

    def _decode(self, table: str, row: dict[str, Any]) -> dict[str, Any]:
        for column in BOOL_COLUMNS.get(table, ()):
            if column in row and row[column] is not None:
                row[column] = bool(row[column])
        return row

    def _project(self, conn: sqlite3.Connection, rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        fields = _split_top_level(self._columns or "*")
        if fields == ["*"]:
            return rows

        plain = [field for field in fields if not _EMBED_RE.match(field)]
        embeds = [_EMBED_RE.match(field).groups() for field in fields if _EMBED_RE.match(field)]
        projected = []
        for row in rows:
            item = row if "*" in plain else {column: row.get(column) for column in plain}
            for related, related_columns in embeds:
                fk = FOREIGN_KEYS.get((self._table, related))
                if not fk:
                    raise ValueError(f"Relacao nao suportada: {self._table} -> {related}")
                item[related] = self._fetch_related(conn, related, related_columns, row.get(fk))
            projected.append(item)
        return projected

    def _fetch_related(self, conn: sqlite3.Connection, table: str, columns: str, key: Any) -> dict[str, Any] | None:
        if key is None:
            return None
        row = conn.execute(f"SELECT * FROM {_ident(table)} WHERE id = ?", [key]).fetchone()
        if not row:
            return None
        record = self._decode(table, dict(row))
        wanted = [column.strip() for column in columns.split(",") if column.strip()]
        return record if wanted == ["*"] else {column: record.get(column) for column in wanted}


class LocalClient:
    def __init__(self, db: LocalDatabase) -> None:
        self._db = db

    def table(self, name: str) -> Query:
        return Query(self._db, name)


_database: LocalDatabase | None = None
_database_lock = threading.Lock()


def get_database() -> LocalDatabase:
    global _database
    with _database_lock:
        if _database is None:
            path = os.getenv("OTTO_DB_PATH", "").strip() or DEFAULT_DB_PATH
            _database = LocalDatabase(path)
        return _database
