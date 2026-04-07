import streamlit as st
from src.ui.styles import inject_custom_css
from src.auth import is_authenticated
from src.pages.login import show_login_page
from src.pages.dashboard import show_dashboard
from src.pages.transactions import show_transactions
from src.pages.settings import show_settings
from src.navigation import show_sidebar

# 1. Page config (MUST be first Streamlit call)
st.set_page_config(
    page_title="FinCoach AI",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="auto",
)

# 2. Inject custom CSS (fonts, theme overrides)
inject_custom_css()

# 3. Auth gate: unauthenticated users see only login page
if not is_authenticated():
    show_login_page()
    st.stop()  # Prevents sidebar and protected pages from rendering

# 4. Authenticated: show sidebar navigation
selected = show_sidebar()

# 5. Route to selected page
if selected == "Dashboard":
    show_dashboard()
elif selected == "Transacoes":
    show_transactions()
elif selected == "Configuracoes":
    show_settings()
