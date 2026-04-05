import streamlit as st
from streamlit_option_menu import option_menu
from src.auth import sign_out, get_current_user


def show_sidebar() -> str:
    """
    Render the sidebar with navigation and return the selected page name.
    Returns one of: "Dashboard", "Configuracoes"
    """
    with st.sidebar:
        # App branding
        st.markdown('<div class="sidebar-brand">FinCoach AI</div>', unsafe_allow_html=True)

        # Navigation menu
        selected = option_menu(
            menu_title=None,
            options=["Dashboard", "Configuracoes"],
            icons=["house", "gear"],
            default_index=0,
            styles={
                "container": {"padding": "0"},
                "icon": {"font-size": "16px"},
                "nav-link": {
                    "font-size": "16px",
                    "text-align": "left",
                    "margin": "0px",
                    "color": "#94A3B8",
                    "background-color": "transparent",
                },
                "nav-link:hover": {
                    "background-color": "#334155",
                },
                "nav-link-selected": {
                    "background-color": "#2563EB",
                    "color": "#F8FAFC",
                },
            },
        )

        # Spacer to push footer down
        st.markdown("<br>" * 5, unsafe_allow_html=True)

        # Footer with user email and logout
        user = get_current_user()
        if user:
            st.markdown(
                f'<div class="sidebar-email">{user["email"]}</div>',
                unsafe_allow_html=True,
            )
            if st.button("Sair", key="sidebar_logout"):
                sign_out()
                st.rerun()

    return selected
