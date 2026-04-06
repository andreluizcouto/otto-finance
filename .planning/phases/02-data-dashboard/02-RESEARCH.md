# Phase 2: Data & Dashboard - Research

**Researched:** 2026-04-06
**Domain:** Simulated data generation (Faker) + Interactive financial dashboard (Streamlit + Plotly)
**Confidence:** HIGH

## Summary

Phase 2 builds two capabilities: (1) a simulated transaction generator using Faker pt_BR with custom merchant/amount templates, writing batch data to Supabase via authenticated client, and (2) an interactive Plotly-based dashboard inside Streamlit showing KPIs, donut chart, trend line, month-over-month comparison, and a recent transactions table -- all controlled by a single time-period filter.

The critical technical gap in the current codebase is the lack of an authenticated Supabase client helper. The existing `get_supabase_client()` returns a plain anon-key client. Since all tables have RLS policies requiring `auth.uid()`, both inserts (data generation) and selects (dashboard queries) MUST use a client with the user's JWT set via `set_session()`. This must be addressed before any data operations work.

**Primary recommendation:** Build an `get_authenticated_client()` helper first, then the data generator, then the dashboard -- in that order. Each subsequent piece depends on the prior one.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Button on Settings page to generate fake transactions with one click
- **D-02:** 3 months of simulated history
- **D-03:** High realism: real Brazilian merchant names (Carrefour, iFood, Uber, 99, Riachuelo), coherent amounts per category (delivery R$25-60, supermarket R$150-400), realistic distribution throughout the month
- **D-04:** Clear + regenerate data button on Settings
- **D-05:** 3-4 KPI cards at top: Total spent, Transaction count, Top category, Daily average
- **D-06:** Single page with scroll: KPIs -> Category chart -> Monthly trend -> Previous month comparison -> Recent transactions table
- **D-07:** Table with last 10-20 transactions: date, merchant, category (with emoji/color), amount
- **D-08:** Donut chart for category breakdown with total in center (e.g., "R$ 4.230")
- **D-09:** Line chart for spending trend over time (total spending per week/month)
- **D-10:** Side-by-side bars for current vs previous month comparison: blue (current) vs gray (previous), grouped by category
- **D-11:** Selectbox at top with fixed periods: "Esta semana" | "Este mes" | "Ultimos 3 meses" -- native st.selectbox
- **D-12:** Single global filter controlling all charts and KPIs at once

### Claude's Discretion
- KPI card design (colors, icons, layout)
- Monetary value formatting (R$ with Brazilian separators)
- Exact number of transactions per month in the generator
- Loading states during data generation and dashboard loading
- Color palette for trend and comparison charts (beyond category colors already defined)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DATA-02 | AI-generated simulated transactions populate the system for testing (realistic Brazilian merchant names) | Faker pt_BR locale + custom merchant/amount templates; batch insert via supabase-py; authenticated client for RLS compliance |
| DASH-01 | User can view spending breakdown by category with charts | Plotly donut chart (go.Pie with hole=0.55), category colors from seed_categories.sql, pandas groupby aggregation |
| DASH-02 | User can view spending by time period (week, month) | st.selectbox global filter with date range calculation, pandas date filtering, all components re-render on filter change |
| DASH-03 | User can see spending trend charts over time | Plotly line chart (go.Scatter mode='lines+markers' with fill='tozeroy'), weekly/monthly aggregation via pandas |
| DASH-04 | User can compare current month vs previous month | Plotly grouped bar chart (barmode='group'), two Bar traces with #2563EB vs #475569 colors |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Streamlit | 1.56.0 | Dashboard UI framework | Installed. st.columns for KPI layout, st.plotly_chart for charts, st.selectbox for filters, st.spinner for loading states. [VERIFIED: pip show] |
| Plotly | 6.6.0 | Interactive charts | Installed. go.Pie (donut), go.Scatter (trend), go.Bar (comparison). Plotly 6.x uses Plotly.js 3.0 internally. [VERIFIED: pip show] |
| pandas | 3.0.2 | Data aggregation | Installed. groupby for category totals, resample for time series, merge for month comparison. [VERIFIED: pip show] |
| Faker | 40.12.0 | Simulated data | Installed. pt_BR locale for Brazilian names. No built-in financial provider -- custom merchant/amount templates needed. [VERIFIED: pip show, Faker docs] |
| supabase-py | 2.28.3 | Database operations | Installed. Batch insert via `.insert([list]).execute()`, select with filters, delete for clearing data. [VERIFIED: pip show] |
| pydantic | 2.12.5 | Data validation | Installed. Optional for this phase but useful for transaction schema validation before insert. [VERIFIED: pip show] |

### No New Libraries Needed

All required functionality is covered by installed packages. No additional pip installs required for Phase 2.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── config.py           # existing -- ADD get_authenticated_client()
├── auth.py             # existing -- no changes needed
├── data/
│   └── generator.py    # NEW -- simulated transaction generator
├── pages/
│   ├── dashboard.py    # REPLACE placeholder with real dashboard
│   └── settings.py     # EXTEND with data generation section
└── ui/
    ├── styles.py       # EXTEND with KPI card CSS
    └── charts.py       # NEW -- Plotly chart builder functions
```

### Pattern 1: Authenticated Supabase Client
**What:** Helper that creates a Supabase client with the user's JWT session, so RLS policies resolve `auth.uid()` correctly.
**When to use:** Every database operation that touches RLS-protected tables (insert, select, delete on transactions).
**Example:**
```python
# Source: https://supabase.com/docs/reference/python/auth-setsession
import streamlit as st
from supabase import create_client

def get_authenticated_client():
    """Create Supabase client with user's auth session for RLS compliance."""
    from src.config import get_supabase_url, get_supabase_anon_key
    client = create_client(get_supabase_url(), get_supabase_anon_key())
    access_token = st.session_state.get("access_token")
    refresh_token = st.session_state.get("refresh_token")
    if access_token and refresh_token:
        client.auth.set_session(access_token, refresh_token)
    return client
```
[VERIFIED: Supabase docs + GitHub issue #915 confirm set_session sets Authorization header for PostgREST]

### Pattern 2: Batch Insert with supabase-py
**What:** Insert multiple rows in a single API call by passing a list of dicts.
**When to use:** Data generation -- insert 40-60 transactions per month (120-180 total) in one call.
**Example:**
```python
# Source: https://supabase.com/docs/reference/python/insert
rows = [
    {"user_id": uid, "amount": 45.90, "date": "2026-01-15", ...},
    {"user_id": uid, "amount": 120.00, "date": "2026-01-16", ...},
]
response = client.table("transactions").insert(rows).execute()
```
[VERIFIED: Supabase insert docs -- list of dicts for batch insert]

### Pattern 3: Global Filter State
**What:** Single st.selectbox controlling all dashboard components via date range calculation.
**When to use:** Dashboard page -- filter changes should re-render everything.
**Example:**
```python
import streamlit as st
from datetime import date, timedelta

period = st.selectbox("Periodo", ["Esta semana", "Este mes", "Ultimos 3 meses"], index=1)

today = date.today()
if period == "Esta semana":
    start_date = today - timedelta(days=today.weekday())  # Monday
elif period == "Este mes":
    start_date = today.replace(day=1)
else:  # Ultimos 3 meses
    start_date = (today.replace(day=1) - timedelta(days=89)).replace(day=1)

# All queries use start_date/today as bounds
```
[ASSUMED -- standard Python date calculation pattern]

### Pattern 4: Plotly Dark Theme Config (from UI-SPEC)
**What:** Shared Plotly layout config matching the app's dark theme.
**When to use:** Every chart creation.
**Example:**
```python
# Source: 02-UI-SPEC.md
PLOTLY_LAYOUT = dict(
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
    font=dict(family="Inter", color="#94A3B8", size=14),
    margin=dict(l=0, r=0, t=32, b=0),
    legend=dict(font=dict(size=14, color="#94A3B8")),
    xaxis=dict(gridcolor="rgba(51,65,85,0.3)", zerolinecolor="#334155"),
    yaxis=dict(gridcolor="rgba(51,65,85,0.3)", zerolinecolor="#334155"),
)
```
[VERIFIED: defined in 02-UI-SPEC.md, matches existing dark theme tokens from styles.py]

### Pattern 5: Category Lookup from Supabase
**What:** Query categories table to get id-to-name/color/emoji mapping, needed for both data generation (category_id foreign key) and dashboard (chart colors, table display).
**When to use:** On dashboard load and before data generation.
**Example:**
```python
response = client.table("categories").select("*").eq("is_default", True).execute()
categories = {cat["slug"]: cat for cat in response.data}
# categories["alimentacao"]["id"] -> UUID for FK
# categories["alimentacao"]["color_hex"] -> "#EF4444" for chart
# categories["alimentacao"]["emoji"] -> emoji for table
```
[VERIFIED: schema.sql + seed_categories.sql confirm structure]

### Anti-Patterns to Avoid
- **Creating unauthenticated client for RLS tables:** `get_supabase_client()` as-is will fail all RLS checks. Always use authenticated client.
- **Inserting one row at a time:** Supabase-py supports batch insert. Don't loop 180 individual insert calls.
- **Using st.cache_data for user-specific queries:** Cached results would leak between users. Use fresh queries per session, or key cache by user_id.
- **Plotly Express for custom styled charts:** For this dashboard's specific styling needs (dark theme, custom colors from category table, center annotation on donut), use `plotly.graph_objects` directly. px shorthand fights against custom theming.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Brazilian currency formatting | Custom regex | `f"R$ {value:,.2f}".replace(",","X").replace(".",",").replace("X",".")` | The replace chain is the standard Python pattern for pt-BR formatting. No library needed, but don't invent your own approach. [ASSUMED] |
| Date period calculation | Manual date math | Python `datetime` + `timedelta` + `.replace(day=1)` | Standard library handles month boundaries, leap years correctly. [ASSUMED] |
| Interactive charts | Streamlit native charts | Plotly `graph_objects` | st.line_chart/st.bar_chart lack tooltips, custom colors, donut holes, grouped bars. [VERIFIED: CLAUDE.md explicitly forbids native charts for this use case] |
| Weighted random selection | Custom probability code | `random.choices(population, weights=weights, k=n)` | Built-in Python. Handles category distribution (20% Alimentacao, 15% Delivery, etc). [ASSUMED] |

## Common Pitfalls

### Pitfall 1: RLS Blocks Unauthenticated Operations
**What goes wrong:** Inserts return empty data or throw "row-level security policy" errors. Selects return empty arrays even though data exists in the table.
**Why it happens:** `get_supabase_client()` creates a client with only the anon key. RLS policies require `auth.uid()` to match `user_id`, but without a session the uid is null.
**How to avoid:** Always use `get_authenticated_client()` with `set_session()` for any operation on transactions, budgets, or goals tables.
**Warning signs:** Empty response.data on select, or error mentioning "row-level security" on insert.
[VERIFIED: Supabase GitHub issue #915, discussion #3479]

### Pitfall 2: Supabase set_session Token Expiry
**What goes wrong:** `set_session()` works initially but fails after ~1 hour when the JWT expires.
**Why it happens:** Supabase JWTs have a default 1-hour expiry. If the refresh_token is not passed, the client cannot auto-refresh.
**How to avoid:** Always pass both access_token AND refresh_token to `set_session()`. The SDK handles refresh internally.
**Warning signs:** Operations that worked earlier suddenly return auth errors.
[VERIFIED: Supabase auth docs -- set_session refreshes expired tokens when refresh_token provided]

### Pitfall 3: Plotly 6.x Title Font Syntax
**What goes wrong:** `titlefont=dict(size=40)` raises deprecation warning or error in Plotly 6.
**Why it happens:** Plotly 6 changed the title API to nested dict structure.
**How to avoid:** Use `fig.update_layout(title=dict(text="Title", font=dict(size=20)))` instead of the flat `titlefont` parameter.
**Warning signs:** DeprecationWarning about titlefont.
[VERIFIED: https://plotly.com/python/v6-migration/]

### Pitfall 4: Streamlit Rerun Clears Spinner State
**What goes wrong:** After data generation completes with `st.rerun()`, success message briefly shows then disappears.
**Why it happens:** `st.rerun()` resets the entire page. Transient messages from the previous run are lost.
**How to avoid:** Store success/error status in `st.session_state` before rerunning, then display the message on the next render cycle. Clear the flag after displaying.
**Warning signs:** User clicks "Gerar Dados" and nothing visible happens (data was generated but message was lost in rerun).
[ASSUMED -- standard Streamlit session state pattern]

### Pitfall 5: Empty DataFrame Crash on Charts
**What goes wrong:** Plotly throws errors when given empty data (no transactions match the filter period).
**Why it happens:** No guard before chart creation when filter returns zero rows.
**How to avoid:** Check `if df.empty:` before every chart render. Show the "Nenhuma transacao neste periodo" empty state from the copywriting contract.
**Warning signs:** Traceback in Streamlit app with Plotly ValueError.
[ASSUMED -- standard defensive programming pattern]

### Pitfall 6: Faker pt_BR Missing Financial Providers
**What goes wrong:** Trying to call `fake.bank_account()` or `fake.transaction()` on pt_BR locale returns AttributeError.
**Why it happens:** Faker pt_BR only has providers for address, person, company, phone, etc. -- not financial transactions. There is no built-in financial transaction provider for any locale.
**How to avoid:** Don't use Faker for transaction data directly. Use Faker only for supplementary data (dates via `fake.date_between()`). Build custom merchant pools and amount ranges as plain Python data structures per the UI-SPEC contract.
**Warning signs:** AttributeError on Faker methods.
[VERIFIED: Faker pt_BR docs -- https://faker.readthedocs.io/en/latest/locales/pt_BR.html]

## Code Examples

### Donut Chart (Category Breakdown)
```python
# Source: https://plotly.com/python/pie-charts/ + 02-UI-SPEC.md
import plotly.graph_objects as go

def create_donut_chart(df_categories, total_formatted):
    """df_categories: DataFrame with columns [category_name, amount, color_hex]"""
    fig = go.Figure(data=[go.Pie(
        labels=df_categories["category_name"],
        values=df_categories["amount"],
        hole=0.55,
        marker=dict(colors=df_categories["color_hex"].tolist()),
        textinfo="percent",
        hovertemplate="%{label}<br>R$ %{value:,.2f}<br>%{percent}<extra></extra>",
    )])
    fig.update_layout(
        **PLOTLY_LAYOUT,
        annotations=[dict(
            text=total_formatted,
            x=0.5, y=0.5,
            font=dict(size=20, color="#F8FAFC", family="Inter"),
            showarrow=False,
        )],
    )
    return fig
```
[VERIFIED: Plotly 6.6.0 docs confirm go.Pie with hole parameter and annotations for center text]

### Trend Line Chart
```python
# Source: https://plotly.com/python/line-charts/ + 02-UI-SPEC.md
import plotly.graph_objects as go

def create_trend_chart(df_trend):
    """df_trend: DataFrame with columns [period_label, total_amount]"""
    fig = go.Figure(data=[go.Scatter(
        x=df_trend["period_label"],
        y=df_trend["total_amount"],
        mode="lines+markers",
        line=dict(color="#2563EB", width=2),
        marker=dict(size=6, color="#2563EB"),
        fill="tozeroy",
        fillcolor="rgba(37, 99, 235, 0.1)",
        hovertemplate="R$ %{y:,.2f}<extra></extra>",
    )])
    fig.update_layout(**PLOTLY_LAYOUT)
    return fig
```
[VERIFIED: Plotly 6.6.0 docs confirm go.Scatter with fill='tozeroy']

### Comparison Bar Chart (Current vs Previous Month)
```python
# Source: https://plotly.com/python/bar-charts/ + 02-UI-SPEC.md
import plotly.graph_objects as go

def create_comparison_chart(categories, current_amounts, previous_amounts):
    fig = go.Figure(data=[
        go.Bar(name="Mes atual", x=categories, y=current_amounts,
               marker_color="#2563EB"),
        go.Bar(name="Mes anterior", x=categories, y=previous_amounts,
               marker_color="#475569"),
    ])
    fig.update_layout(
        **PLOTLY_LAYOUT,
        barmode="group",
        bargap=0.2,
        bargroupgap=0.1,
    )
    return fig
```
[VERIFIED: Plotly docs confirm barmode='group' with multiple Bar traces]

### Data Generator Core Pattern
```python
# Custom merchant/amount template (NOT using Faker financial providers)
import random
from datetime import date, timedelta

MERCHANTS = {
    "alimentacao": ["Carrefour", "Pao de Acucar", "Extra", "Assai", "BIG"],
    "transporte": ["Uber", "99", "Shell", "Ipiranga", "Sem Parar"],
    "delivery": ["iFood", "Rappi", "Ze Delivery", "Uber Eats"],
    # ... per 02-UI-SPEC.md merchant table
}

AMOUNT_RANGES = {
    "alimentacao": (15.00, 350.00),
    "transporte": (5.00, 150.00),
    # ... per 02-UI-SPEC.md amount table
}

CATEGORY_WEIGHTS = {
    "alimentacao": 0.20, "delivery": 0.15, "transporte": 0.15,
    "moradia": 0.10, "compras": 0.10, "lazer": 0.10,
    "assinaturas": 0.08, "saude": 0.05, "educacao": 0.04, "outros": 0.03,
}

def generate_transactions(user_id, category_map, months=3, per_month_range=(40, 60)):
    transactions = []
    today = date.today()
    for month_offset in range(months):
        month_date = (today.replace(day=1) - timedelta(days=30 * month_offset))
        month_start = month_date.replace(day=1)
        # Calculate month_end
        if month_start.month == 12:
            month_end = month_start.replace(year=month_start.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            month_end = month_start.replace(month=month_start.month + 1, day=1) - timedelta(days=1)

        n_transactions = random.randint(*per_month_range)
        slugs = list(CATEGORY_WEIGHTS.keys())
        weights = list(CATEGORY_WEIGHTS.values())
        chosen_categories = random.choices(slugs, weights=weights, k=n_transactions)

        for slug in chosen_categories:
            cat = category_map[slug]
            merchant = random.choice(MERCHANTS[slug])
            min_amt, max_amt = AMOUNT_RANGES[slug]
            amount = round(random.uniform(min_amt, max_amt), 2)
            # Weighted toward beginning/end of month
            day = _weighted_day(month_start, month_end)
            transactions.append({
                "user_id": user_id,
                "amount": amount,
                "date": day.isoformat(),
                "description": merchant,
                "merchant_name": merchant,
                "category_id": cat["id"],
                "confidence_score": "high",  # simulated = always high confidence
                "payment_method": random.choice(["credito", "debito", "pix"]),
                "is_recurring": slug in ("assinaturas", "moradia"),
            })
    return transactions
```
[ASSUMED -- custom implementation pattern based on UI-SPEC data contract]

### Authenticated Client for RLS Operations
```python
# Critical: must call set_session before any table operation
import streamlit as st
from supabase import create_client
from src.config import get_supabase_url, get_supabase_anon_key

def get_authenticated_client():
    url = get_supabase_url()
    key = get_supabase_anon_key()
    client = create_client(url, key)
    access_token = st.session_state.get("access_token")
    refresh_token = st.session_state.get("refresh_token")
    if access_token and refresh_token:
        client.auth.set_session(access_token, refresh_token)
    return client
```
[VERIFIED: Supabase docs confirm set_session sets Authorization header for PostgREST RLS]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Plotly 5.x `titlefont=` | Plotly 6.x `title=dict(text=, font=)` | Plotly 6.0 (2025) | Must use nested dict for chart titles |
| Plotly 5.x `heatmapgl` trace | Plotly 6.x `heatmap` | Plotly 6.0 (2025) | Not relevant to this phase |
| pandas <2.0 Copy-on-Write off | pandas 3.0.2 CoW on by default | pandas 3.0 (2025) | In-place modifications on slices raise warnings; use `.copy()` explicitly |
| `st.experimental_memo` | `st.cache_data` | Streamlit 1.18 (2023) | Use `@st.cache_data` for any caching needs |

[VERIFIED: Plotly v6 migration guide, pandas 3.0 release notes, Streamlit docs]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Global filter via st.selectbox + date math is sufficient (no need for st.date_input range) | Architecture Patterns | LOW -- user explicitly chose fixed period selectbox (D-11) |
| A2 | 120-180 transactions can be batch-inserted in a single supabase-py call without chunking | Code Examples | LOW -- well under the 500-row optimal batch size documented by Supabase |
| A3 | `random.choices` with weights handles category distribution correctly | Code Examples | VERY LOW -- standard Python stdlib |
| A4 | st.session_state flag pattern for persisting success messages across rerun | Pitfalls | LOW -- well-known Streamlit pattern |
| A5 | Replace chain `f"R$ {v:,.2f}".replace(",","X").replace(".",",").replace("X",".")` produces correct pt-BR format | Don't Hand-Roll | LOW -- commonly used pattern |

## Open Questions

1. **Authenticated client placement**
   - What we know: `get_supabase_client()` in config.py returns unauthenticated client. We need authenticated version for RLS.
   - What's unclear: Should the authenticated client function live in config.py alongside the existing one, or in a separate module?
   - Recommendation: Add to config.py as `get_authenticated_client()` -- keeps all Supabase client logic in one place.

2. **Month-over-month comparison when less than 2 months of data exist**
   - What we know: User can clear and regenerate data. If they filter to "Esta semana", there's no "previous month" concept.
   - What's unclear: Should comparison chart be hidden, show zeros, or show a message?
   - Recommendation: Hide the comparison section when the filter is "Esta semana". Show it for "Este mes" and "Ultimos 3 meses" only.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest 9.0.2 |
| Config file | none -- see Wave 0 |
| Quick run command | `pytest tests/ -x -q` |
| Full suite command | `pytest tests/ -v` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-02 | Generator produces realistic transactions with correct schema | unit | `pytest tests/test_generator.py -x` | Wave 0 |
| DATA-02 | Batch insert writes to Supabase successfully | integration (manual) | Manual -- requires live Supabase | N/A |
| DASH-01 | Donut chart renders with category data | unit | `pytest tests/test_charts.py::test_donut_chart -x` | Wave 0 |
| DASH-02 | Date filter calculates correct date ranges | unit | `pytest tests/test_dashboard.py::test_date_filters -x` | Wave 0 |
| DASH-03 | Trend chart renders with time-series data | unit | `pytest tests/test_charts.py::test_trend_chart -x` | Wave 0 |
| DASH-04 | Comparison chart renders with two-month data | unit | `pytest tests/test_charts.py::test_comparison_chart -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `pytest tests/ -x -q`
- **Per wave merge:** `pytest tests/ -v`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/__init__.py` -- package init
- [ ] `tests/test_generator.py` -- covers DATA-02 (generator output validation)
- [ ] `tests/test_charts.py` -- covers DASH-01, DASH-03, DASH-04 (chart creation returns valid Figure)
- [ ] `tests/test_dashboard.py` -- covers DASH-02 (date filter range calculation)
- [ ] `pytest.ini` or `pyproject.toml [tool.pytest.ini_options]` -- test configuration

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Handled in Phase 1 (Supabase Auth) |
| V3 Session Management | yes (indirectly) | Authenticated client uses existing JWT from session_state. No new session logic. |
| V4 Access Control | yes | RLS policies on transactions table enforce user_id isolation. Authenticated client must pass JWT. |
| V5 Input Validation | yes | Validate generated data matches schema constraints before insert (amount > 0, valid date, valid category_id, valid payment_method enum) |
| V6 Cryptography | no | No crypto operations in this phase |

### Known Threat Patterns for This Phase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Data leakage via unauthenticated client | Information Disclosure | Always use get_authenticated_client() with set_session() |
| User A deleting User B's data | Tampering | RLS DELETE policy requires auth.uid() = user_id |
| Injecting malformed transactions via generator | Tampering | Validate all generated data against schema constraints before batch insert |

## Sources

### Primary (HIGH confidence)
- pip show (local install verification) -- streamlit 1.56.0, plotly 6.6.0, pandas 3.0.2, Faker 40.12.0, supabase 2.28.3
- [Supabase Python insert docs](https://supabase.com/docs/reference/python/insert) -- batch insert API
- [Supabase Python set_session docs](https://supabase.com/docs/reference/python/auth-setsession) -- authenticated client pattern
- [Plotly v6 migration guide](https://plotly.com/python/v6-migration/) -- breaking changes from v5
- [Plotly Pie Charts docs](https://plotly.com/python/pie-charts/) -- donut chart with hole parameter
- [Plotly Bar Charts docs](https://plotly.com/python/bar-charts/) -- grouped bar with barmode='group'
- [Faker pt_BR locale docs](https://faker.readthedocs.io/en/latest/locales/pt_BR.html) -- available providers
- Phase 1 codebase (src/config.py, src/auth.py, supabase/schema.sql, supabase/seed_categories.sql)
- 02-UI-SPEC.md -- visual contract, data contract, copywriting contract

### Secondary (MEDIUM confidence)
- [Supabase GitHub issue #915](https://github.com/supabase/supabase-py/issues/915) -- set_session for RLS flow
- [Supabase batch insert discussion #11349](https://github.com/orgs/supabase/discussions/11349) -- 500-row batch optimal size

### Tertiary (LOW confidence)
- None -- all critical claims verified against primary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries installed and versions verified via pip show
- Architecture: HIGH -- patterns verified against official Supabase/Plotly docs and existing codebase
- Pitfalls: HIGH (RLS, Plotly 6.x) / MEDIUM (Streamlit rerun state) -- RLS issue verified via multiple GitHub sources

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (stable stack, no fast-moving dependencies)
