import streamlit as st


def show_dashboard():
    """Render the dashboard placeholder page."""
    st.title("Dashboard")

    st.markdown("""
    <div class="placeholder-card">
        <div class="main-text">Seus dados financeiros aparecerao aqui</div>
        <div class="sub-text">Os graficos e resumos serao adicionados na proxima fase.</div>
    </div>
    """, unsafe_allow_html=True)
