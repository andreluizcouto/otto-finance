import streamlit as st
from src.auth import get_current_user, sign_out


def show_settings():
    """Render the settings page with account info and session management."""
    st.title("Configuracoes")

    st.markdown('<div class="settings-container">', unsafe_allow_html=True)

    # Account section
    st.header("Conta")
    user = get_current_user()
    if user:
        st.text_input("Email", value=user["email"], disabled=True, key="settings_email")
        st.text_input("Membro desde", value=user["created_at"][:10], disabled=True, key="settings_created")

    st.divider()

    # Session section
    st.header("Sessao")
    st.markdown('<div class="logout-btn">', unsafe_allow_html=True)
    if st.button("Sair da conta", key="settings_logout", use_container_width=False):
        sign_out()
        st.rerun()
    st.markdown('</div>', unsafe_allow_html=True)

    st.divider()

    # Future placeholder
    st.markdown(
        '<p style="color: #64748B; font-size: 14px;">Mais opcoes em breve</p>',
        unsafe_allow_html=True,
    )

    st.markdown('</div>', unsafe_allow_html=True)
