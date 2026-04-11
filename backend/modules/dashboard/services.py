from datetime import date, timedelta
from typing import Any

import pandas as pd
from supabase import Client

from backend.core import format_brl


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
    categories_query = client.table("categories").select("*")
    if hasattr(categories_query, "or_"):
        cat_resp = categories_query.or_(f"is_default.eq.true,user_id.eq.{user_id}").execute()
    else:
        default_resp = client.table("categories").select("*").eq("is_default", True).execute()
        user_resp = client.table("categories").select("*").eq("user_id", user_id).execute()
        merged_categories = {
            cat.get("id"): cat for cat in [*(default_resp.data or []), *(user_resp.data or [])]
        }
        cat_resp = type("Response", (), {"data": list(merged_categories.values())})()

    categories = {cat["slug"]: cat for cat in (cat_resp.data or []) if cat.get("slug")}
    return {
        "transactions": txn_resp.data or [],
        "all_transactions": all_txn_resp.data or [],
        "categories": categories,
    }


def _build_category_insights(
    df: pd.DataFrame,
    all_transactions: list[dict],
    start_date: date,
    end_date: date,
    cat_by_id: dict[str, Any],
) -> list[dict[str, Any]]:
    if df.empty or "amount" not in df.columns or "category_id" not in df.columns:
        return []

    current_outflows = df.copy()
    current_outflows = current_outflows.dropna(subset=["category_id"])
    if current_outflows.empty:
        return []

    current_outflows["amount"] = pd.to_numeric(current_outflows["amount"], errors="coerce").fillna(0.0)
    current_outflows = current_outflows[current_outflows["amount"] < 0]
    if current_outflows.empty:
        return []

    current_totals = current_outflows.groupby("category_id")["amount"].sum().abs().sort_values(ascending=False)
    total_outflow = float(current_totals.sum())

    duration = (end_date - start_date).days
    prior_end = start_date - timedelta(days=1)
    prior_start = prior_end - timedelta(days=duration)

    prior_totals_map: dict[str, float] = {}
    if all_transactions:
        prior_df = pd.DataFrame(all_transactions)
        if not prior_df.empty and {"amount", "date", "category_id"}.issubset(prior_df.columns):
            prior_df["amount"] = pd.to_numeric(prior_df["amount"], errors="coerce").fillna(0.0)
            prior_df["date"] = pd.to_datetime(prior_df["date"], errors="coerce").dt.date
            prior_df = prior_df.dropna(subset=["date", "category_id"])
            prior_df = prior_df[
                (prior_df["date"] >= prior_start)
                & (prior_df["date"] <= prior_end)
                & (prior_df["amount"] < 0)
            ]
            if not prior_df.empty:
                prior_totals_map = prior_df.groupby("category_id")["amount"].sum().abs().to_dict()

    insights: list[dict[str, Any]] = []
    for category_id, current_amount in current_totals.items():
        current_amount_value = float(current_amount)
        prior_amount = float(prior_totals_map.get(category_id, 0.0))

        if prior_amount > 0:
            delta_pct = round(((current_amount_value - prior_amount) / prior_amount) * 100, 1)
        else:
            delta_pct = None

        if delta_pct is None or delta_pct == 0:
            trend = "flat"
        elif delta_pct > 0:
            trend = "up"
        else:
            trend = "down"

        category = cat_by_id.get(category_id, {})
        share_pct = round((current_amount_value / total_outflow) * 100, 1) if total_outflow > 0 else 0.0
        insights.append(
            {
                "category_id": category_id,
                "category_name": category.get("name", "Outros"),
                "emoji": category.get("emoji", ""),
                "current_amount": current_amount_value,
                "current_amount_label": format_brl(current_amount_value),
                "share_pct": share_pct,
                "delta_pct": delta_pct,
                "trend": trend,
            }
        )

    return insights


def _load_user_budgets(client: Client, user_id: str) -> dict[str, float]:
    budgets_resp = (
        client.table("budgets")
        .select("category_id, monthly_limit")
        .eq("user_id", user_id)
        .eq("is_active", True)
        .execute()
    )
    budgets_by_category: dict[str, float] = {}
    for row in budgets_resp.data or []:
        category_id = row.get("category_id")
        monthly_limit = row.get("monthly_limit")
        if not category_id:
            continue
        limit_value = float(monthly_limit) if monthly_limit is not None else 0.0
        budgets_by_category[category_id] = limit_value
    return budgets_by_category


def _build_budget_progress(
    category_insights: list[dict], budgets_by_category: dict[str, float]
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for insight in category_insights:
        category_id = insight.get("category_id")
        spent_amount = float(insight.get("current_amount", 0.0))
        monthly_limit = float(budgets_by_category.get(category_id, 0.0))

        if monthly_limit > 0:
            progress_pct = round((spent_amount / monthly_limit) * 100, 1)
            if progress_pct >= 100:
                status = "exceeded"
            elif progress_pct >= 80:
                status = "warning"
            else:
                status = "on_track"
        else:
            progress_pct = 0.0
            status = "no_limit"

        rows.append(
            {
                "category_id": category_id,
                "category_name": insight.get("category_name", "Outros"),
                "monthly_limit": monthly_limit,
                "spent_amount": spent_amount,
                "progress_pct": progress_pct,
                "status": status,
            }
        )
    return rows


def _build_cut_recommendations(
    category_insights: list[dict], budget_progress: list[dict]
) -> list[dict[str, Any]]:
    progress_by_category = {
        row.get("category_id"): row for row in budget_progress if row.get("category_id")
    }
    amounts = [float(row.get("current_amount", 0.0)) for row in category_insights]
    median_spent = float(pd.Series(amounts).median()) if amounts else 0.0

    cuts: list[dict[str, Any]] = []
    for insight in category_insights:
        category_id = insight.get("category_id")
        if not category_id:
            continue

        category_name = insight.get("category_name", "Outros")
        current_amount = float(insight.get("current_amount", 0.0))
        progress = progress_by_category.get(category_id, {})
        spent_amount = float(progress.get("spent_amount", current_amount))
        monthly_limit = float(progress.get("monthly_limit", 0.0))

        suggested_cut_amount = 0.0
        rationale = ""

        if monthly_limit > 0:
            suggested_cut_amount = round(max(spent_amount - monthly_limit, 0.0), 2)
            if suggested_cut_amount > 0:
                rationale = "Ajuste para voltar ao limite mensal da categoria."
        elif current_amount > median_spent and current_amount > 0:
            suggested_cut_amount = round(current_amount * 0.15, 2)
            rationale = "Sem limite definido; aplicar corte conservador de 15%."

        if suggested_cut_amount <= 0:
            continue

        cuts.append(
            {
                "category_id": category_id,
                "category_name": category_name,
                "suggested_cut_amount": suggested_cut_amount,
                "rationale": rationale,
            }
        )

    cuts.sort(key=lambda row: row["suggested_cut_amount"], reverse=True)
    return cuts[:3]


def _build_upload_block(has_transactions: bool) -> dict[str, Any]:
    return {
        "cta_label": "Importar extrato PDF",
        "description": "Envie seu extrato para atualizar o dashboard com dados recentes.",
        "recommended_first_step": not has_transactions,
    }


def _build_classification_block(df: pd.DataFrame) -> dict[str, Any]:
    pending_count = 0
    if not df.empty and {"amount", "category_id"}.issubset(df.columns):
        expenses = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0) < 0
        unclassified = df["category_id"].isna()
        pending_count = int((expenses & unclassified).sum())

    return {
        "cta_label": "Classificar transações com IA",
        "description": "Classifique automaticamente transações pendentes para liberar os insights.",
        "pending_count": pending_count,
    }


def get_dashboard_payload(client: Client, user_id: str, period: str) -> dict[str, Any]:
    start_date, end_date = calculate_date_range(period)
    data = load_dashboard_data(client, user_id, start_date, end_date)

    transactions = data["transactions"]
    categories = data["categories"]
    all_transactions = data["all_transactions"]
    cat_by_id = {cat["id"]: cat for cat in categories.values() if cat.get("id")}

    df = (
        pd.DataFrame(transactions)
        if transactions
        else pd.DataFrame(columns=["id", "amount", "date", "description", "merchant_name", "category_id"])
    )
    if not df.empty:
        df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0)
        df["date"] = pd.to_datetime(df["date"], errors="coerce")
        df = df.dropna(subset=["date"])

    category_insights = _build_category_insights(
        df=df,
        all_transactions=all_transactions,
        start_date=start_date,
        end_date=end_date,
        cat_by_id=cat_by_id,
    )
    budgets_by_category = _load_user_budgets(client, user_id)
    budget_progress = _build_budget_progress(category_insights, budgets_by_category)
    cuts = _build_cut_recommendations(category_insights, budget_progress)

    categories_block = [
        {
            "category_id": item["category_id"],
            "category_name": item["category_name"],
            "emoji": item["emoji"],
            "amount": item["current_amount"],
            "amount_label": item["current_amount_label"],
            "share_pct": item["share_pct"],
        }
        for item in category_insights
    ]
    comparison_block = [
        {
            "category_id": item["category_id"],
            "category_name": item["category_name"],
            "emoji": item["emoji"],
            "trend": item["trend"],
            "delta_pct": item["delta_pct"],
        }
        for item in category_insights
    ]
    tips_block = [
        {
            "category_id": item["category_id"],
            "category_name": item["category_name"],
            "potential_saving": item["suggested_cut_amount"],
            "potential_saving_label": format_brl(float(item["suggested_cut_amount"])),
            "rationale": item["rationale"],
        }
        for item in cuts
    ]

    return {
        "upload": _build_upload_block(has_transactions=bool(transactions)),
        "classification": _build_classification_block(df),
        "categories": categories_block,
        "comparison": comparison_block,
        "saving_tips": tips_block,
    }
