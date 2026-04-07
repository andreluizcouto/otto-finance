import streamlit as st


def inject_custom_css():
    """Inject custom UI theme styles once at app startup."""
    css = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');

:root {
    --bg: #060b19;
    --bg-elev: #0f172a;
    --bg-card: #111c35;
    --line: rgba(148, 163, 184, 0.20);
    --line-strong: rgba(148, 163, 184, 0.32);
    --text: #e2e8f0;
    --muted: #94a3b8;
    --subtle: #64748b;
    --brand: #3b82f6;
    --brand-strong: #2563eb;
    --success: #22c55e;
    --danger: #ef4444;
    --radius: 14px;
    --shadow: 0 16px 42px rgba(2, 6, 23, 0.35);
}

html,
body,
[class*="css"],
[data-testid="stAppViewContainer"],
[data-testid="stMainBlockContainer"],
[data-testid="stSidebar"] .nav-link,
[data-testid="stSidebar"] p,
[data-testid="stSidebar"] label {
    font-family: "Inter", sans-serif !important;
}

/* Ensure Streamlit's Material Symbols icons render correctly (not as text) */
span[class*="material"],
[data-testid="stSidebarCollapsedControl"] span,
[data-testid="stSidebar"] button span,
[data-testid="collapsedControl"] span {
    font-family: "Material Symbols Rounded", "Material Icons" !important;
    font-feature-settings: 'liga';
    -webkit-font-feature-settings: 'liga';
    font-size: 20px;
}

[data-testid="stAppViewContainer"] {
    background:
        radial-gradient(circle at 90% -15%, rgba(59, 130, 246, 0.20), transparent 35%),
        radial-gradient(circle at 5% 8%, rgba(14, 165, 233, 0.14), transparent 28%),
        var(--bg);
    color: var(--text);
}

[data-testid="stHeader"] {
    background: rgba(6, 11, 25, 0.72);
    backdrop-filter: blur(8px);
}

[data-testid="stSidebar"] {
    background: linear-gradient(180deg, #18263f 0%, #101b33 100%);
    border-right: 1px solid var(--line);
}

[data-testid="stSidebar"] [data-testid="stVerticalBlock"] {
    padding-top: 0.4rem;
}

[data-testid="stSidebar"] .nav-link {
    border-radius: 10px;
    transition: all 0.2s ease;
}

[data-testid="stSidebar"] .nav-link:hover {
    background: rgba(59, 130, 246, 0.18) !important;
}

[data-testid="stSidebar"] .nav-link-selected {
    background: linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%) !important;
    box-shadow: 0 8px 24px rgba(37, 99, 235, 0.35);
}

h1,
h2,
h3 {
    color: #f8fafc !important;
    letter-spacing: -0.01em;
}

p,
label {
    color: var(--muted);
}

[data-testid="stCaptionContainer"] {
    color: var(--subtle) !important;
}

/* Don't mute form labels */
[data-testid="stWidgetLabel"] p,
[data-testid="stWidgetLabel"] label,
.stTextInput label,
.stSelectbox label,
.stTextArea label,
.stNumberInput label,
.stDateInput label,
.stColorPicker label {
    color: #cbd5e1 !important;
}

/* Alert / info boxes */
[data-testid="stAlert"],
.stAlert {
    border-radius: 12px !important;
    border: 1px solid var(--line) !important;
    background: rgba(15, 23, 42, 0.80) !important;
}

[data-testid="stAlert"][data-baseweb="notification"][kind="info"],
.stInfo {
    border-left: 3px solid var(--brand) !important;
}

[data-testid="stAlert"][kind="success"],
.stSuccess {
    border-left: 3px solid var(--success) !important;
}

[data-testid="stAlert"][kind="error"],
.stError {
    border-left: 3px solid var(--danger) !important;
}

[data-testid="stAlert"][kind="warning"],
.stWarning {
    border-left: 3px solid #f59e0b !important;
}

/* Main content padding */
[data-testid="stMainBlockContainer"] {
    padding-top: 2rem !important;
}

.stButton > button,
.stDownloadButton > button,
[data-testid="baseButton-secondary"],
[data-testid="baseButton-primary"] {
    border-radius: 12px !important;
    border: 1px solid var(--line) !important;
    background: rgba(15, 23, 42, 0.75) !important;
    color: var(--text) !important;
    box-shadow: none !important;
    transition: all 0.18s ease !important;
}

.stButton > button:hover,
.stDownloadButton > button:hover,
[data-testid="baseButton-secondary"]:hover,
[data-testid="baseButton-primary"]:hover {
    border-color: var(--line-strong) !important;
    transform: translateY(-1px);
}

.generate-btn button,
.classify-btn button,
[data-testid="baseButton-primary"] {
    background: linear-gradient(180deg, var(--brand) 0%, var(--brand-strong) 100%) !important;
    border: 1px solid rgba(96, 165, 250, 0.55) !important;
    color: #f8fafc !important;
}

.generate-btn button:hover,
.classify-btn button:hover,
[data-testid="baseButton-primary"]:hover {
    filter: brightness(1.08);
}

.destructive-btn button,
.logout-btn button {
    border: 1px solid rgba(239, 68, 68, 0.7) !important;
    color: #fca5a5 !important;
    background: rgba(239, 68, 68, 0.08) !important;
}

.destructive-btn button:hover,
.logout-btn button:hover {
    background: rgba(239, 68, 68, 0.20) !important;
    color: #fee2e2 !important;
}

.stTextInput input,
.stDateInput input,
.stNumberInput input,
.stSelectbox div[data-baseweb="select"] > div,
.stTextArea textarea {
    border-radius: 10px !important;
    border: 1px solid var(--line) !important;
    background: rgba(15, 23, 42, 0.70) !important;
    color: var(--text) !important;
}

.stTextInput input:focus,
.stDateInput input:focus,
.stNumberInput input:focus,
.stSelectbox div[data-baseweb="select"] > div:focus-within,
.stTextArea textarea:focus {
    border-color: rgba(96, 165, 250, 0.7) !important;
    box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.32) !important;
}

.stDataFrame,
[data-testid="stDataFrame"],
[data-testid="stTable"] {
    border-radius: var(--radius) !important;
    border: 1px solid var(--line) !important;
    overflow: hidden;
    background: rgba(15, 23, 42, 0.58);
}

[data-testid="stMetric"] {
    background: linear-gradient(160deg, rgba(30, 41, 59, 0.88), rgba(17, 24, 39, 0.88));
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 14px 16px;
}

.sidebar-brand {
    font-size: 22px;
    font-weight: 700;
    color: #f8fafc;
    letter-spacing: -0.015em;
    padding: 12px 0 10px;
}

.sidebar-email {
    color: var(--muted);
    font-size: 13px;
}

.login-container {
    max-width: 440px;
    margin: 80px auto 0;
    padding: 28px;
    border-radius: var(--radius);
    background: linear-gradient(180deg, rgba(17, 28, 53, 0.90), rgba(15, 23, 42, 0.92));
    border: 1px solid var(--line);
    box-shadow: var(--shadow);
}

.login-title {
    font-size: 36px;
    font-weight: 700;
    line-height: 1.1;
    color: #f8fafc;
    text-align: center;
    margin-bottom: 8px;
}

.login-tagline {
    font-size: 15px;
    color: var(--muted);
    text-align: center;
    margin-bottom: 26px;
}

.settings-container {
    max-width: 720px;
}

.kpi-card,
.chart-container,
.transactions-container,
.placeholder-card,
.empty-state {
    background: linear-gradient(160deg, rgba(17, 28, 53, 0.88), rgba(15, 23, 42, 0.88));
    border: 1px solid var(--line);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
}

.kpi-card {
    padding: 20px;
}

.kpi-card .kpi-icon {
    color: #93c5fd;
    font-size: 20px;
    margin-bottom: 9px;
}

.kpi-card .kpi-metric {
    font-size: 29px;
    font-weight: 700;
    color: #f8fafc;
    line-height: 1.08;
}

.kpi-card .kpi-label {
    font-size: 13px;
    color: var(--muted);
    margin-top: 4px;
}

.kpi-card .kpi-delta {
    font-size: 13px;
    margin-top: 8px;
}

.kpi-card .kpi-delta.positive {
    color: var(--success);
}

.kpi-card .kpi-delta.negative {
    color: var(--danger);
}

.section-heading {
    font-size: 20px;
    font-weight: 600;
    color: #f8fafc;
    margin-bottom: 14px;
}

.chart-container {
    padding: 20px;
    margin-bottom: 28px;
}

.transactions-container {
    padding: 14px;
    margin-bottom: 20px;
}

.empty-state {
    padding: 46px 24px;
    text-align: center;
}

.empty-state .empty-heading {
    color: #cbd5e1;
    font-size: 17px;
    margin-bottom: 6px;
}

.empty-state .empty-body {
    color: var(--subtle);
    font-size: 14px;
}

.confidence-badge-low {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background-color: rgba(239, 68, 68, 0.14);
    border: 1px solid rgba(239, 68, 68, 0.65);
    border-radius: 999px;
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 600;
    color: #fca5a5;
    white-space: nowrap;
}

.category-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid var(--line);
}

.category-swatch {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    display: inline-block;
    flex-shrink: 0;
    border: 1px solid rgba(255, 255, 255, 0.30);
}
</style>
"""
    if callable(getattr(st, "html", None)):
        st.html(css)
    else:
        st.markdown(css, unsafe_allow_html=True)
