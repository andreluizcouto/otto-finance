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


def show_dashboard():
    """Render the full interactive spending dashboard."""
    user = get_current_user()
    if not user:
        st.error("Erro ao carregar dados. Verifique sua conexao e tente novamente.")
        return

    # --- Filter bar (per D-11, D-12) ---
    # Right-align filter using 3-column layout, filter in last column
    _, _, filter_col = st.columns([2, 2, 1])
    with filter_col:
        period = st.selectbox(
            "Periodo",
            options=["Esta semana", "Este mes", "Ultimos 3 meses"],
            index=1,
            key="dashboard_period_filter",
            label_visibility="collapsed",
        )

    start_date, end_date = calculate_date_range(period)

    # --- Load data ---
    try:
        with st.spinner("Carregando dashboard..."):
            data = load_dashboard_data(user["id"], start_date, end_date)
    except Exception:
        st.error("Erro ao carregar dados. Verifique sua conexao e tente novamente.")
        return

    transactions = data["transactions"]
    categories = data["categories"]
    all_transactions = data["all_transactions"]

    # Build category id->cat lookup for fast lookups
    cat_by_id = {cat["id"]: cat for cat in categories.values()}

    # --- Empty state (no transactions at all) ---
    if not transactions and not all_transactions:
        st.markdown("""
        <div class="empty-state">
            <div class="empty-heading">Nenhuma transacao encontrada</div>
            <div class="empty-body">Va em Configuracoes e clique em Gerar Dados para popular o dashboard com transacoes simuladas.</div>
        </div>
        """, unsafe_allow_html=True)
        return

    # Build DataFrame for filtered period
    df = pd.DataFrame(transactions) if transactions else pd.DataFrame(
        columns=["id", "amount", "date", "description", "merchant_name", "category_id"]
    )
    if not df.empty:
        df["amount"] = df["amount"].astype(float)
        df["date"] = pd.to_datetime(df["date"])

    # --- KPI cards (per D-05) ---
    kpis = compute_kpis(df, categories, start_date, end_date, all_transactions)

    top_cat_display = kpis["top_category"]

    # Spacer above KPIs
    st.markdown('<div style="margin-top: 32px;"></div>', unsafe_allow_html=True)

    kpi_cols = st.columns(4)
    kpi_data = [
        ("bi-cash-stack", format_brl(kpis["total_spent"]), "Total no mes", kpis["delta_pct"]),
        ("bi-receipt", f"{kpis['txn_count']} transacoes", "Transacoes", None),
        ("bi-trophy", top_cat_display, "Categoria mais cara", None),
        ("bi-calendar3", format_brl(kpis["daily_avg"]), "Media por dia", None),
    ]
    for col, (icon, metric, label, delta) in zip(kpi_cols, kpi_data):
        with col:
            delta_html = ""
            if delta is not None:
                sign = "+" if delta > 0 else ""
                css_class = "negative" if delta > 0 else "positive"
                delta_html = f'<div class="kpi-delta {css_class}">{sign}{delta:.1f}% vs mes anterior</div>'
            st.markdown(f"""
            <div class="kpi-card">
                <div class="kpi-icon"><i class="{icon}"></i></div>
                <div class="kpi-metric">{metric}</div>
                <div class="kpi-label">{label}</div>
                {delta_html}
            </div>
            """, unsafe_allow_html=True)

    st.markdown('<div style="margin-top: 32px;"></div>', unsafe_allow_html=True)

    # --- Empty filtered state ---
    if df.empty:
        st.info("Nenhuma transacao neste periodo.")
        return

    # --- Donut chart: Gastos por Categoria (per D-08, DASH-01) ---
    st.markdown('<div class="chart-container">', unsafe_allow_html=True)
    st.markdown('<p class="section-heading">Gastos por Categoria</p>', unsafe_allow_html=True)
    category_totals = df.groupby("category_id")["amount"].sum().reset_index()
    category_totals["category_name"] = category_totals["category_id"].map(
        lambda cid: cat_by_id.get(cid, {}).get("name", "Outros")
    )
    category_totals["color_hex"] = category_totals["category_id"].map(
        lambda cid: cat_by_id.get(cid, {}).get("color_hex", "#64748B")
    )
    total_formatted = format_brl(kpis["total_spent"])
    fig_donut = create_donut_chart(category_totals, total_formatted)
    st.plotly_chart(fig_donut, use_container_width=True, config={"displayModeBar": False})
    st.markdown('</div>', unsafe_allow_html=True)

    st.markdown('<div style="margin-top: 32px;"></div>', unsafe_allow_html=True)

    # --- Trend line chart: Tendencia de Gastos (per D-09, DASH-03) ---
    st.markdown('<div class="chart-container">', unsafe_allow_html=True)
    st.markdown('<p class="section-heading">Tendencia de Gastos</p>', unsafe_allow_html=True)
    # Determine grouping granularity: weekly for 3-month view, daily otherwise
    df_trend = df.copy()
    if period == "Ultimos 3 meses":
        df_trend["period_label"] = df_trend["date"].dt.to_period("W").astype(str)
    else:
        df_trend["period_label"] = df_trend["date"].dt.strftime("%d/%m")
    trend_agg = df_trend.groupby("period_label")["amount"].sum().reset_index()
    trend_agg.columns = ["period_label", "total_amount"]
    fig_trend = create_trend_chart(trend_agg)
    st.plotly_chart(fig_trend, use_container_width=True, config={"displayModeBar": False})
    st.markdown('</div>', unsafe_allow_html=True)

    # --- Comparison chart: Atual vs Mes Anterior (per D-10, DASH-04) ---
    # Show only for "Este mes" and "Ultimos 3 meses" (not "Esta semana")
    if period != "Esta semana":
        st.markdown('<div style="margin-top: 32px;"></div>', unsafe_allow_html=True)
        st.markdown('<div class="chart-container">', unsafe_allow_html=True)
        st.markdown('<p class="section-heading">Atual vs Mes Anterior</p>', unsafe_allow_html=True)

        # Current month: month of end_date
        current_month_start = end_date.replace(day=1)
        if current_month_start.month == 1:
            prev_month_start = date(current_month_start.year - 1, 12, 1)
        else:
            prev_month_start = date(current_month_start.year, current_month_start.month - 1, 1)
        if prev_month_start.month == 12:
            prev_month_end = date(prev_month_start.year + 1, 1, 1) - timedelta(days=1)
        else:
            prev_month_end = date(prev_month_start.year, prev_month_start.month + 1, 1) - timedelta(days=1)

        all_df = pd.DataFrame(all_transactions) if all_transactions else pd.DataFrame(
            columns=["amount", "date", "category_id"]
        )
        if not all_df.empty:
            all_df["amount"] = all_df["amount"].astype(float)
            all_df["date"] = pd.to_datetime(all_df["date"]).dt.date

        curr_df = all_df[
            (all_df["date"] >= current_month_start) & (all_df["date"] <= end_date)
        ] if not all_df.empty else pd.DataFrame(columns=["amount", "date", "category_id"])
        prev_df = all_df[
            (all_df["date"] >= prev_month_start) & (all_df["date"] <= prev_month_end)
        ] if not all_df.empty else pd.DataFrame(columns=["amount", "date", "category_id"])

        # Get all category names present in either month
        all_cat_ids = set()
        if not curr_df.empty:
            all_cat_ids.update(curr_df["category_id"].unique())
        if not prev_df.empty:
            all_cat_ids.update(prev_df["category_id"].unique())

        if all_cat_ids:
            cat_names = [cat_by_id.get(cid, {}).get("name", "Outros") for cid in all_cat_ids]
            curr_totals = [
                float(curr_df[curr_df["category_id"] == cid]["amount"].sum()) if not curr_df.empty else 0.0
                for cid in all_cat_ids
            ]
            prev_totals = [
                float(prev_df[prev_df["category_id"] == cid]["amount"].sum()) if not prev_df.empty else 0.0
                for cid in all_cat_ids
            ]
            fig_comparison = create_comparison_chart(cat_names, curr_totals, prev_totals)
            st.plotly_chart(fig_comparison, use_container_width=True, config={"displayModeBar": False})
        else:
            st.info("Nenhuma transacao neste periodo.")
        st.markdown('</div>', unsafe_allow_html=True)

    # --- Recent transactions table (per D-07) ---
    st.markdown('<div style="margin-top: 32px;"></div>', unsafe_allow_html=True)
    st.markdown('<div class="chart-container">', unsafe_allow_html=True)
    st.markdown('<p class="section-heading">Transacoes Recentes</p>', unsafe_allow_html=True)

    table_df = df.head(20).copy()
    table_df["Data"] = table_df["date"].dt.strftime("%d/%m")
    table_df["Merchant"] = table_df["merchant_name"].fillna(table_df["description"])
    table_df["Categoria"] = table_df["category_id"].map(
        lambda cid: f"{cat_by_id.get(cid, {}).get('emoji', '')} {cat_by_id.get(cid, {}).get('name', 'Outros')}"
    )
    table_df["Valor"] = table_df["amount"].apply(format_brl)
    display_df = table_df[["Data", "Merchant", "Categoria", "Valor"]].rename(
        columns={"Merchant": "Estabelecimento"}
    )

    st.dataframe(
        display_df,
        use_container_width=True,
        hide_index=True,
        column_config={
            "Data": st.column_config.TextColumn("Data", width="small"),
            "Estabelecimento": st.column_config.TextColumn("Estabelecimento", width="medium"),
            "Categoria": st.column_config.TextColumn("Categoria", width="medium"),
            "Valor": st.column_config.TextColumn("Valor", width="small"),
        },
    )
    st.markdown('</div>', unsafe_allow_html=True)
