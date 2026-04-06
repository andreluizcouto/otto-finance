import streamlit as st
import pandas as pd
from datetime import date, timedelta

from src.config import get_authenticated_client
from src.auth import get_current_user
from src.ui.charts import (
    create_donut_chart,
    create_trend_chart,
    create_comparison_chart,
    format_brl,
)


def calculate_date_range(period: str, today: date | None = None) -> tuple[date, date]:
    """Map a user-facing period label to a (start_date, end_date) tuple.

    Args:
        period: One of "Esta semana", "Este mes", "Ultimos 3 meses"
        today: Reference date. Defaults to date.today() when None.

    Returns:
        Tuple of (start_date, end_date) inclusive.
    """
    if today is None:
        today = date.today()
    if period == "Esta semana":
        start = today - timedelta(days=today.weekday())  # Monday of current week
    elif period == "Este mes":
        start = today.replace(day=1)
    else:  # "Ultimos 3 meses"
        # Go back 2 full months to get the 1st of that month
        month = today.month - 2
        year = today.year
        if month <= 0:
            month += 12
            year -= 1
        start = date(year, month, 1)
    return (start, today)


def load_dashboard_data(user_id: str, start_date: date, end_date: date) -> dict:
    """Load transactions and categories from Supabase for the dashboard.

    Uses get_authenticated_client() so RLS policies filter by auth.uid().

    Args:
        user_id: The authenticated user's UUID.
        start_date: Inclusive start of the date range.
        end_date: Inclusive end of the date range.

    Returns:
        Dict with keys: transactions (list), all_transactions (list), categories (dict slug->cat).
    """
    client = get_authenticated_client()
    # Fetch transactions in date range
    txn_resp = (
        client.table("transactions")
        .select("*")
        .eq("user_id", user_id)
        .gte("date", start_date.isoformat())
        .lte("date", end_date.isoformat())
        .order("date", desc=True)
        .execute()
    )
    # Fetch ALL transactions for this user (needed for comparison month logic)
    all_txn_resp = (
        client.table("transactions")
        .select("id, amount, date, category_id")
        .eq("user_id", user_id)
        .execute()
    )
    # Fetch categories (is_default=True)
    cat_resp = (
        client.table("categories").select("*").eq("is_default", True).execute()
    )
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
) -> dict:
    """Compute KPI values from filtered transaction data.

    Args:
        df: DataFrame of transactions in the selected period.
        categories: Dict of slug -> category record.
        start_date: Start of selected period.
        end_date: End of selected period.
        all_transactions: All user transactions (for delta calculation).

    Returns:
        Dict with keys: total_spent, txn_count, top_category, daily_avg, delta_pct.
    """
    # Build id->category lookup
    cat_by_id = {cat["id"]: cat for cat in categories.values()}

    # Total spent
    total_spent = float(df["amount"].sum()) if not df.empty else 0.0

    # Transaction count
    txn_count = len(df)

    # Top category by total spending
    if not df.empty:
        cat_totals = df.groupby("category_id")["amount"].sum()
        top_cat_id = cat_totals.idxmax()
        top_cat = cat_by_id.get(top_cat_id, {})
        emoji = top_cat.get("emoji", "")
        name = top_cat.get("name", "Outros")
        top_category = f"{emoji} {name}".strip()
    else:
        top_category = "\u2014"

    # Daily average
    days_in_range = (end_date - start_date).days + 1
    daily_avg = total_spent / days_in_range if txn_count > 0 and days_in_range > 0 else 0.0

    # Delta percentage vs prior period
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
        "daily_avg": daily_avg,
        "delta_pct": delta_pct,
    }
