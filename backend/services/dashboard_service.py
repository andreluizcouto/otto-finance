from __future__ import annotations

from datetime import date, timedelta
from typing import Any

import pandas as pd
from supabase import Client


def format_brl(value: float) -> str:
    return f"R$ {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def calculate_date_range(period: str, today: date | None = None) -> tuple[date, date]:
    if today is None:
        today = date.today()
    if period == "Esta semana":
        start = today - timedelta(days=today.weekday())
    elif period == "Este mes":
        start = today.replace(day=1)
    else:
        month = today.month - 2
        year = today.year
        if month <= 0:
            month += 12
            year -= 1
        start = date(year, month, 1)
    return (start, today)


def load_dashboard_data(
    client: Client, user_id: str, start_date: date, end_date: date
) -> dict[str, Any]:
    txn_resp = (
        client.table("transactions")
        .select("*")
        .eq("user_id", user_id)
        .gte("date", start_date.isoformat())
        .lte("date", end_date.isoformat())
        .order("date", desc=True)
        .execute()
    )
    all_txn_resp = (
        client.table("transactions")
        .select("id, amount, date, category_id")
        .eq("user_id", user_id)
        .execute()
    )
    cat_resp = client.table("categories").select("*").eq("is_default", True).execute()
    categories = {cat["slug"]: cat for cat in cat_resp.data}
    return {
        "transactions": txn_resp.data,
        "all_transactions": all_txn_resp.data,
        "categories": categories,
    }


def compute_kpis(
    df: pd.DataFrame,
    categories: dict,
    start_date: date,
    end_date: date,
    all_transactions: list,
) -> dict[str, Any]:
    cat_by_id = {cat["id"]: cat for cat in categories.values()}
    total_spent = float(df["amount"].sum()) if not df.empty else 0.0
    txn_count = len(df)

    if not df.empty:
        cat_totals = df.groupby("category_id")["amount"].sum()
        top_cat_id = cat_totals.idxmax()
        top_cat = cat_by_id.get(top_cat_id, {})
        emoji = top_cat.get("emoji", "")
        name = top_cat.get("name", "Outros")
        top_category = f"{emoji} {name}".strip()
        top_category_total = float(cat_totals.max())
    else:
        top_category = "-"
        top_category_total = 0.0

    days_in_range = (end_date - start_date).days + 1
    daily_avg = (
        total_spent / days_in_range if txn_count > 0 and days_in_range > 0 else 0.0
    )

    delta_pct = None
    if total_spent > 0:
        duration = (end_date - start_date).days
        prior_end = start_date - timedelta(days=1)
        prior_start = prior_end - timedelta(days=duration)
        if all_transactions:
            all_df = pd.DataFrame(all_transactions)
            all_df["amount"] = all_df["amount"].astype(float)
            all_df["date"] = pd.to_datetime(all_df["date"]).dt.date
            prior_df = all_df[
                (all_df["date"] >= prior_start) & (all_df["date"] <= prior_end)
            ]
            prior_total = float(prior_df["amount"].sum()) if not prior_df.empty else 0.0
            if prior_total > 0:
                delta_pct = round((total_spent - prior_total) / prior_total * 100, 1)

    return {
        "total_spent": total_spent,
        "txn_count": txn_count,
        "top_category": top_category,
        "top_category_total": top_category_total,
        "daily_avg": daily_avg,
        "delta_pct": delta_pct,
    }


def _serialize_trend_data(df: pd.DataFrame, period: str) -> list[dict[str, Any]]:
    if df.empty:
        return []

    df_trend = df.copy()
    if period == "Ultimos 3 meses":
        df_trend["period_label"] = df_trend["date"].dt.to_period("W").astype(str)
    else:
        df_trend["period_label"] = df_trend["date"].dt.strftime("%d/%m")

    trend_agg = df_trend.groupby("period_label")["amount"].sum().reset_index()
    trend_agg.columns = ["period_label", "total_amount"]
    return trend_agg.to_dict(orient="records")


def _serialize_category_totals(df: pd.DataFrame, cat_by_id: dict[str, Any]) -> list[dict]:
    if df.empty:
        return []

    category_totals = df.groupby("category_id")["amount"].sum().reset_index()
    category_totals["category_name"] = category_totals["category_id"].map(
        lambda cid: cat_by_id.get(cid, {}).get("name", "Outros")
    )
    category_totals["emoji"] = category_totals["category_id"].map(
        lambda cid: cat_by_id.get(cid, {}).get("emoji", "")
    )
    category_totals["color_hex"] = category_totals["category_id"].map(
        lambda cid: cat_by_id.get(cid, {}).get("color_hex", "#64748B")
    )
    return category_totals.to_dict(orient="records")


def _serialize_recent_transactions(df: pd.DataFrame, cat_by_id: dict[str, Any]) -> list[dict]:
    if df.empty:
        return []

    table_df = df.head(20).copy()
    rows: list[dict] = []
    for _, row in table_df.iterrows():
        category = cat_by_id.get(row.get("category_id"), {})
        rows.append(
            {
                "id": row.get("id"),
                "date": row["date"].strftime("%Y-%m-%d"),
                "date_label": row["date"].strftime("%d/%m/%Y"),
                "description": row.get("merchant_name") or row.get("description") or "-",
                "amount": float(row["amount"]),
                "amount_label": format_brl(float(row["amount"])),
                "category_id": row.get("category_id"),
                "category_name": category.get("name", "Outros"),
                "category_emoji": category.get("emoji", ""),
                "category_color_hex": category.get("color_hex", "#64748B"),
            }
        )
    return rows


def _serialize_comparison(
    all_transactions: list[dict],
    end_date: date,
    cat_by_id: dict[str, Any],
    period: str,
) -> dict[str, Any] | None:
    if period == "Esta semana":
        return None

    current_month_start = end_date.replace(day=1)
    if current_month_start.month == 1:
        prev_month_start = date(current_month_start.year - 1, 12, 1)
    else:
        prev_month_start = date(
            current_month_start.year, current_month_start.month - 1, 1
        )
    if prev_month_start.month == 12:
        prev_month_end = date(prev_month_start.year + 1, 1, 1) - timedelta(days=1)
    else:
        prev_month_end = date(prev_month_start.year, prev_month_start.month + 1, 1) - timedelta(
            days=1
        )

    all_df = (
        pd.DataFrame(all_transactions)
        if all_transactions
        else pd.DataFrame(columns=["amount", "date", "category_id"])
    )
    if not all_df.empty:
        all_df["amount"] = all_df["amount"].astype(float)
        all_df["date"] = pd.to_datetime(all_df["date"]).dt.date

    curr_df = (
        all_df[(all_df["date"] >= current_month_start) & (all_df["date"] <= end_date)]
        if not all_df.empty
        else pd.DataFrame(columns=["amount", "date", "category_id"])
    )
    prev_df = (
        all_df[(all_df["date"] >= prev_month_start) & (all_df["date"] <= prev_month_end)]
        if not all_df.empty
        else pd.DataFrame(columns=["amount", "date", "category_id"])
    )

    all_cat_ids: set[Any] = set()
    if not curr_df.empty:
        all_cat_ids.update(curr_df["category_id"].unique())
    if not prev_df.empty:
        all_cat_ids.update(prev_df["category_id"].unique())

    categories: list[str] = []
    current_amounts: list[float] = []
    previous_amounts: list[float] = []
    for category_id in all_cat_ids:
        categories.append(cat_by_id.get(category_id, {}).get("name", "Outros"))
        current_amounts.append(
            float(curr_df[curr_df["category_id"] == category_id]["amount"].sum())
            if not curr_df.empty
            else 0.0
        )
        previous_amounts.append(
            float(prev_df[prev_df["category_id"] == category_id]["amount"].sum())
            if not prev_df.empty
            else 0.0
        )

    return {
        "categories": categories,
        "current_amounts": current_amounts,
        "previous_amounts": previous_amounts,
    }


def get_dashboard_payload(client: Client, user_id: str, period: str) -> dict[str, Any]:
    start_date, end_date = calculate_date_range(period)
    data = load_dashboard_data(client, user_id, start_date, end_date)

    transactions = data["transactions"]
    categories = data["categories"]
    all_transactions = data["all_transactions"]
    cat_by_id = {cat["id"]: cat for cat in categories.values()}

    df = (
        pd.DataFrame(transactions)
        if transactions
        else pd.DataFrame(
            columns=["id", "amount", "date", "description", "merchant_name", "category_id"]
        )
    )

    if not df.empty:
        df["amount"] = df["amount"].astype(float)
        df["date"] = pd.to_datetime(df["date"])

    kpis = compute_kpis(df, categories, start_date, end_date, all_transactions)
    trend = _serialize_trend_data(df, period)
    category_totals = _serialize_category_totals(df, cat_by_id)
    recent_transactions = _serialize_recent_transactions(df, cat_by_id)
    comparison = _serialize_comparison(all_transactions, end_date, cat_by_id, period)

    return {
        "period": period,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "empty_state": not transactions and not all_transactions,
        "kpis": {
            **kpis,
            "total_spent_label": format_brl(kpis["total_spent"]),
            "daily_avg_label": format_brl(kpis["daily_avg"]),
            "top_category_total_label": format_brl(kpis["top_category_total"]),
        },
        "trend": trend,
        "category_totals": category_totals,
        "comparison": comparison,
        "recent_transactions": recent_transactions,
    }
