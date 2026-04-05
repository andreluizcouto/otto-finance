import streamlit as st
from src.auth import sign_in, sign_up


def show_login_page():
    """Render the login/signup page. No sidebar should be visible."""
    # Initialize auth mode
    if "auth_mode" not in st.session_state:
        st.session_state["auth_mode"] = "login"

    # Centered container
    st.markdown('<div class="login-container">', unsafe_allow_html=True)
    st.markdown('<div class="login-title">FinCoach AI</div>', unsafe_allow_html=True)
    st.markdown('<div class="login-tagline">Seu coach financeiro pessoal</div>', unsafe_allow_html=True)

    if st.session_state["auth_mode"] == "login":
        _show_login_form()
    else:
        _show_signup_form()

    st.markdown('</div>', unsafe_allow_html=True)


def _show_login_form():
    """Render the login form."""
    with st.form("login_form"):
        email = st.text_input("Email", key="login_email")
        password = st.text_input("Senha", type="password", key="login_password")
        submitted = st.form_submit_button("Entrar", type="primary", use_container_width=True)

    if submitted:
        if not email or not password:
            st.error("Preencha todos os campos.")
            return
        with st.spinner("Entrando..."):
            result = sign_in(email, password)
        if result["success"]:
            st.rerun()
        else:
            st.error(result["error"])

    # Toggle to signup
    if st.button("Nao tem conta? Criar conta", key="goto_signup"):
        st.session_state["auth_mode"] = "signup"
        st.rerun()


def _show_signup_form():
    """Render the signup form."""
    with st.form("signup_form"):
        email = st.text_input("Email", key="signup_email")
        password = st.text_input("Senha", type="password", key="signup_password")
        confirm_password = st.text_input("Confirmar senha", type="password", key="signup_confirm")
        submitted = st.form_submit_button("Criar conta", type="primary", use_container_width=True)

    if submitted:
        if not email or not password or not confirm_password:
            st.error("Preencha todos os campos.")
            return
        if password != confirm_password:
            st.error("As senhas nao coincidem.")
            return
        with st.spinner("Criando conta..."):
            result = sign_up(email, password)
        if result["success"]:
            st.success("Conta criada com sucesso!")
            st.rerun()
        else:
            st.error(result["error"])

    # Toggle to login
    if st.button("Ja tem conta? Entrar", key="goto_login"):
        st.session_state["auth_mode"] = "login"
        st.rerun()
