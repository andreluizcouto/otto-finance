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

    categories = {cat["slug"]: cat for cat in cat_resp.data}
    return {
        "transactions": txn_resp.data,
        "all_transactions": all_txn_resp.data,
        "categories": categories,
    }


def _build_flow_summary(df: pd.DataFrame) -> dict[str, Any]:
    if df.empty or "amount" not in df.columns:
        inflow_total = 0.0
        outflow_total = 0.0
    else:
        amounts = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0)
        inflow_total = float(amounts[amounts > 0].sum())
        outflow_total = abs(float(amounts[amounts < 0].sum()))

    net_flow = inflow_total - outflow_total
    if net_flow > 0:
        net_flow_status = "positive"
    elif net_flow < 0:
        net_flow_status = "negative"
    else:
        net_flow_status = "neutral"

    return {
        "inflow_total": inflow_total,
        "outflow_total": outflow_total,
        "net_flow": net_flow,
        "net_flow_status": net_flow_status,
        "inflow_total_label": format_brl(inflow_total),
        "outflow_total_label": format_brl(outflow_total),
        "net_flow_label": format_brl(net_flow),
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
                "monthly_limit_label": format_brl(monthly_limit),
                "spent_amount": spent_amount,
                "spent_amount_label": format_brl(spent_amount),
                "progress_pct": progress_pct,
                "status": status,
            }
        )
    return rows


def _build_actionable_alerts(
    category_insights: list[dict], budget_progress: list[dict]
) -> list[dict[str, Any]]:
    severity_rank = {"high": 0, "medium": 1, "low": 2}
    progress_by_category = {
        row.get("category_id"): row for row in budget_progress if row.get("category_id")
    }

    alerts: list[dict[str, Any]] = []
    for index, insight in enumerate(category_insights):
        category_id = insight.get("category_id")
        if not category_id:
            continue

        category_name = insight.get("category_name", "Outros")
        delta_pct = insight.get("delta_pct")
        progress = progress_by_category.get(category_id, {})
        budget_status = progress.get("status")

        severity = None
        title = ""
        message = ""

        if budget_status == "exceeded":
            severity = "high"
            title = f"Orcamento estourado em {category_name}"
            message = (
                f"Gasto atual {progress.get('spent_amount_label', format_brl(progress.get('spent_amount', 0.0)))} "
                f"acima do limite mensal {progress.get('monthly_limit_label', format_brl(progress.get('monthly_limit', 0.0)))}."
            )
        elif isinstance(delta_pct, (int, float)) and delta_pct >= 25:
            severity = "high"
            title = f"Alta acentuada em {category_name}"
            message = f"{category_name} subiu {delta_pct:.1f}% vs periodo anterior."
        elif budget_status == "warning":
            severity = "medium"
            title = f"Atenção ao limite de {category_name}"
            message = (
                f"Consumo em {progress.get('spent_amount_label', format_brl(progress.get('spent_amount', 0.0)))} "
                "proximo do limite mensal."
            )
        elif (
            isinstance(delta_pct, (int, float))
            and 10 <= delta_pct < 25
        ):
            severity = "medium"
            title = f"Crescimento relevante em {category_name}"
            message = f"{category_name} aumentou {delta_pct:.1f}% vs periodo anterior."
        elif index == 0 and float(insight.get("current_amount", 0.0)) > 0:
            severity = "low"
            title = f"Maior gasto atual: {category_name}"
            message = (
                f"Categoria lidera o periodo com {insight.get('current_amount_label', format_brl(insight.get('current_amount', 0.0)))}."
            )

        if severity:
            alerts.append(
                {
                    "id": f"alert-{category_id}-{severity}",
                    "severity": severity,
                    "title": title,
                    "message": message,
                }
            )

    alerts.sort(key=lambda row: severity_rank.get(row["severity"], 3))
    return alerts


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
                "suggested_cut_amount_label": format_brl(suggested_cut_amount),
                "rationale": rationale,
            }
        )

    cuts.sort(key=lambda row: row["suggested_cut_amount"], reverse=True)
    return cuts[:3]


def _build_narrative_summary(
    flow: dict[str, Any], cuts: list[dict], category_insights: list[dict]
) -> str:
    net_flow_label = flow.get("net_flow_label", format_brl(float(flow.get("net_flow", 0.0))))
    net_flow_status = flow.get("net_flow_status", "neutral")

    if cuts:
        top_categories = ", ".join(cut.get("category_name", "Outros") for cut in cuts[:2])
        total_cut = sum(float(cut.get("suggested_cut_amount", 0.0)) for cut in cuts)
        total_cut_label = format_brl(total_cut)
        if net_flow_status == "negative":
            return (
                f"Fluxo liquido atual {net_flow_label}. Exageros em {top_categories}; "
                f"reduza cerca de {total_cut_label} para melhorar o fechamento do periodo."
            )
        return (
            f"Fluxo liquido atual {net_flow_label}. Ajustes em {top_categories} podem "
            f"gerar folga adicional de {total_cut_label}."
        )

    if category_insights:
        top_category = category_insights[0].get("category_name", "Outros")
        if net_flow_status == "negative":
            return (
                f"Fluxo liquido atual {net_flow_label}. Priorize reduzir {top_category} "
                "para voltar ao azul."
            )
        if net_flow_status == "positive":
            return (
                f"Fluxo liquido atual {net_flow_label}. Mantenha controle em {top_category} "
                "para preservar a tendencia positiva."
            )

    return f"Fluxo liquido atual {net_flow_label}. Sem alertas relevantes no periodo."

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

    if not df.empty and "category_id" in df.columns:
        cat_totals = (
            df.dropna(subset=["category_id"]).groupby("category_id")["amount"].sum()
        )
        if not cat_totals.empty:
            top_cat_id = cat_totals.idxmax()
            top_cat = cat_by_id.get(top_cat_id, {})
            emoji = top_cat.get("emoji", "")
            name = top_cat.get("name", "Outros")
            top_category = f"{emoji} {name}".strip()
            top_category_total = float(cat_totals.max())
        else:
            top_category = "-"
            top_category_total = 0.0
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
            all_df["amount"] = pd.to_numeric(all_df["amount"], errors="coerce").fillna(0.0)
            all_df["date"] = pd.to_datetime(all_df["date"], errors="coerce").dt.date
            all_df = all_df.dropna(subset=["date"])
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

    df_trend = df.dropna(subset=["date"]).copy()
    if df_trend.empty:
        return []

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

    category_totals = (
        df.dropna(subset=["category_id"]).groupby("category_id")["amount"].sum().reset_index()
    )
    if category_totals.empty:
        return []

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

    table_df = df.dropna(subset=["date"]).head(20).copy()
    if table_df.empty:
        return []

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
        all_df["amount"] = pd.to_numeric(all_df["amount"], errors="coerce").fillna(0.0)
        all_df["date"] = pd.to_datetime(all_df["date"], errors="coerce").dt.date
        all_df = all_df.dropna(subset=["date"])

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

    categories_names: list[str] = []
    current_amounts: list[float] = []
    previous_amounts: list[float] = []
    for category_id in all_cat_ids:
        categories_names.append(cat_by_id.get(category_id, {}).get("name", "Outros"))
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
        "categories": categories_names,
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
        df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0)
        df["date"] = pd.to_datetime(df["date"], errors="coerce")
        df = df.dropna(subset=["date"])

    kpis = compute_kpis(df, categories, start_date, end_date, all_transactions)
    trend = _serialize_trend_data(df, period)
    category_totals = _serialize_category_totals(df, cat_by_id)
    recent_transactions = _serialize_recent_transactions(df, cat_by_id)
    comparison = _serialize_comparison(all_transactions, end_date, cat_by_id, period)
    flow = _build_flow_summary(df)
    category_insights = _build_category_insights(
        df=df,
        all_transactions=all_transactions,
        start_date=start_date,
        end_date=end_date,
        cat_by_id=cat_by_id,
    )[:5]
    budgets_by_category = _load_user_budgets(client, user_id)
    budget_progress = _build_budget_progress(category_insights, budgets_by_category)
    alerts = _build_actionable_alerts(category_insights, budget_progress)
    cuts = _build_cut_recommendations(category_insights, budget_progress)
    narrative_summary = _build_narrative_summary(flow, cuts, category_insights)

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
        "flow": flow,
        "category_insights": category_insights,
        "budget_progress": budget_progress,
        "alerts": alerts,
        "cuts": cuts,
        "narrative_summary": narrative_summary,
        "disclaimer": "Nao inclui saldo anterior da conta.",
    }
