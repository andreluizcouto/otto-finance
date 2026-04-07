import streamlit as st


def inject_custom_css():
    """Inject all custom CSS overrides for FinCoach AI. Call once at app entry point."""
    st.markdown("""
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
    <style>
    /* Global font */
    html, body, [class*="css"] {
        font-family: 'Inter', sans-serif;
    }

    /* Login page centering */
    .login-container {
        max-width: 400px;
        margin: 64px auto 0 auto;
        padding: 24px;
    }

    /* App title on login */
    .login-title {
        font-size: 32px;
        font-weight: 600;
        line-height: 1.1;
        color: #2563EB;
        text-align: center;
        margin-bottom: 4px;
    }

    /* Tagline */
    .login-tagline {
        font-size: 16px;
        font-weight: 400;
        color: #94A3B8;
        text-align: center;
        margin-bottom: 32px;
    }

    /* Placeholder card on dashboard */
    .placeholder-card {
        background-color: #1E293B;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 24px;
        text-align: center;
    }

    .placeholder-card .main-text {
        color: #94A3B8;
        font-size: 16px;
        margin-bottom: 8px;
    }

    .placeholder-card .sub-text {
        color: #64748B;
        font-size: 14px;
    }

    /* Sidebar branding */
    .sidebar-brand {
        font-size: 24px;
        font-weight: 600;
        color: #2563EB;
        padding: 16px 0 8px 0;
    }

    /* Sidebar footer */
    .sidebar-footer {
        position: fixed;
        bottom: 16px;
        padding: 0 16px;
    }

    .sidebar-email {
        color: #94A3B8;
        font-size: 14px;
    }

    /* Settings page max width */
    .settings-container {
        max-width: 600px;
    }

    /* Logout button red outline style */
    .logout-btn button {
        border: 1px solid #EF4444 !important;
        color: #EF4444 !important;
        background-color: transparent !important;
    }
    .logout-btn button:hover {
        background-color: #EF4444 !important;
        color: #F8FAFC !important;
    }

    /* KPI card styling */
    .kpi-card {
        background-color: #1E293B;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 24px;
    }
    .kpi-card .kpi-icon {
        font-size: 20px;
        color: #94A3B8;
        margin-bottom: 8px;
    }
    .kpi-card .kpi-metric {
        font-size: 28px;
        font-weight: 600;
        color: #F8FAFC;
        line-height: 1.1;
    }
    .kpi-card .kpi-label {
        font-size: 14px;
        font-weight: 400;
        color: #94A3B8;
        margin-top: 4px;
    }
    .kpi-card .kpi-delta {
        font-size: 14px;
        margin-top: 4px;
    }
    .kpi-card .kpi-delta.positive {
        color: #22C55E;
    }
    .kpi-card .kpi-delta.negative {
        color: #EF4444;
    }

    /* Generate data button */
    .generate-btn button {
        background-color: #2563EB !important;
        color: #F8FAFC !important;
        border: none !important;
    }
    .generate-btn button:hover {
        background-color: #1D4ED8 !important;
    }

    /* Destructive button (Limpar Dados) */
    .destructive-btn button {
        border: 1px solid #EF4444 !important;
        color: #EF4444 !important;
        background-color: transparent !important;
    }
    .destructive-btn button:hover {
        background-color: #EF4444 !important;
        color: #F8FAFC !important;
    }

    /* Section heading */
    .section-heading {
        font-size: 20px;
        font-weight: 600;
        color: #F8FAFC;
        margin-bottom: 16px;
        line-height: 1.2;
    }

    /* Chart container */
    .chart-container {
        background-color: #1E293B;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 24px;
        margin-bottom: 32px;
    }

    /* Empty state */
    .empty-state {
        background-color: #1E293B;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 48px 24px;
        text-align: center;
    }
    .empty-state .empty-heading {
        color: #94A3B8;
        font-size: 16px;
        margin-bottom: 8px;
    }
    .empty-state .empty-body {
        color: #64748B;
        font-size: 14px;
    }

    /* Classify CTA button */
    .classify-btn button {
        background-color: #2563EB !important;
        color: #F8FAFC !important;
        border: none !important;
        width: 100%;
    }
    .classify-btn button:hover {
        background-color: #1D4ED8 !important;
    }

    /* Low-confidence badge */
    .confidence-badge-low {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background-color: rgba(239, 68, 68, 0.15);
        border: 1px solid #EF4444;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 12px;
        font-weight: 600;
        color: #EF4444;
        white-space: nowrap;
    }

    /* Transactions table container */
    .transactions-container {
        background-color: #1E293B;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 24px;
    }

    /* Category row in Settings */
    .category-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 0;
        border-bottom: 1px solid #334155;
    }

    /* Category color swatch */
    .category-swatch {
        width: 16px;
        height: 16px;
        border-radius: 3px;
        display: inline-block;
        flex-shrink: 0;
    }
    </style>
    """, unsafe_allow_html=True)
