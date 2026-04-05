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
    </style>
    """, unsafe_allow_html=True)
