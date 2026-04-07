import pandas as pd
import plotly.graph_objects as go

PLOTLY_LAYOUT = dict(
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
    font=dict(family="Inter", color="#CBD5E1", size=14),
    margin=dict(l=0, r=0, t=32, b=0),
    legend=dict(font=dict(size=13, color="#94A3B8")),
    xaxis=dict(gridcolor="rgba(148,163,184,0.16)", zerolinecolor="rgba(148,163,184,0.16)"),
    yaxis=dict(gridcolor="rgba(148,163,184,0.16)", zerolinecolor="rgba(148,163,184,0.16)"),
)


def format_brl(value: float) -> str:
    """Format a numeric value as Brazilian Real currency string."""
    return f"R$ {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def create_donut_chart(df_categories: pd.DataFrame, total_formatted: str) -> go.Figure:
    """Create a donut chart showing spending by category.

    Args:
        df_categories: DataFrame with columns: category_name, amount, color_hex
        total_formatted: Pre-formatted total string for center annotation (e.g. "R$ 1.000,00")
    """
    fig = go.Figure(
        data=[
            go.Pie(
                labels=df_categories["category_name"],
                values=df_categories["amount"],
                hole=0.55,
                marker=dict(colors=df_categories["color_hex"].tolist()),
                textinfo="percent",
                hovertemplate="%{label}<br>R$ %{value:,.2f}<br>%{percent}<extra></extra>",
            )
        ]
    )
    fig.update_layout(
        **PLOTLY_LAYOUT,
        annotations=[
            dict(
                text=total_formatted,
                x=0.5,
                y=0.5,
                font=dict(size=20, color="#F8FAFC", family="Inter"),
                showarrow=False,
            )
        ],
    )
    return fig


def create_trend_chart(df_trend: pd.DataFrame) -> go.Figure:
    """Create a line chart showing spending trend over time.

    Args:
        df_trend: DataFrame with columns: period_label, total_amount
    """
    fig = go.Figure(
        data=[
            go.Scatter(
                x=df_trend["period_label"],
                y=df_trend["total_amount"],
                mode="lines+markers",
                line=dict(color="#3B82F6", width=2.5),
                marker=dict(size=6, color="#60A5FA"),
                fill="tozeroy",
                fillcolor="rgba(59, 130, 246, 0.14)",
                hovertemplate="R$ %{y:,.2f}<extra></extra>",
            )
        ]
    )
    fig.update_layout(**PLOTLY_LAYOUT)
    return fig


def create_comparison_chart(
    categories: list, current_amounts: list, previous_amounts: list
) -> go.Figure:
    """Create a grouped bar chart comparing current vs previous month spending.

    Args:
        categories: List of category names for x-axis
        current_amounts: List of amounts for current month
        previous_amounts: List of amounts for previous month
    """
    fig = go.Figure(
        data=[
            go.Bar(
                x=categories,
                y=current_amounts,
                name="Mes atual",
                marker_color="#3B82F6",
            ),
            go.Bar(
                x=categories,
                y=previous_amounts,
                name="Mes anterior",
                marker_color="#334155",
            ),
        ]
    )
    fig.update_layout(
        **PLOTLY_LAYOUT,
        barmode="group",
        bargap=0.2,
        bargroupgap=0.1,
    )
    return fig
