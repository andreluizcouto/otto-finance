import streamlit as st
from src.auth import get_current_user, sign_out
from src.config import get_authenticated_client
from src.data.generator import generate_transactions


def show_settings():
    """Render the settings page with account info, data management, and session controls."""
    st.title("Configuracoes")

    st.markdown('<div class="settings-container">', unsafe_allow_html=True)

    # --- Conta section ---
    st.header("Conta")
    user = get_current_user()
    if user:
        st.text_input("Email", value=user["email"], disabled=True, key="settings_email")
        st.text_input(
            "Membro desde",
            value=user["created_at"][:10],
            disabled=True,
            key="settings_created",
        )

    st.divider()

    # --- Dados de Teste section ---
    st.header("Dados de Teste")

    client = get_authenticated_client()
    user = get_current_user()

    # Count existing transactions
    count_resp = (
        client.table("transactions")
        .select("id", count="exact")
        .eq("user_id", user["id"])
        .execute()
    )
    txn_count = count_resp.count or 0

    # Display success/error feedback from previous action (persists across st.rerun)
    if st.session_state.get("data_success"):
        st.success(st.session_state.pop("data_success"))
    if st.session_state.get("data_error"):
        st.error(st.session_state.pop("data_error"))

    if txn_count == 0:
        # No data -- show generate button
        st.markdown('<div class="generate-btn">', unsafe_allow_html=True)
        generate_clicked = st.button(
            "Gerar Dados", key="btn_generate", use_container_width=True
        )
        st.markdown("</div>", unsafe_allow_html=True)
        st.caption("Gera 3 meses de transacoes simuladas com merchants brasileiros")

        if generate_clicked:
            try:
                with st.spinner("Gerando transacoes..."):
                    cat_resp = (
                        client.table("categories")
                        .select("*")
                        .eq("is_default", True)
                        .execute()
                    )
                    category_map = {cat["slug"]: cat for cat in cat_resp.data}
                    transactions = generate_transactions(user["id"], category_map)
                    client.table("transactions").insert(transactions).execute()
                    st.session_state["data_success"] = (
                        f"{len(transactions)} transacoes geradas com sucesso!"
                    )
                    st.rerun()
            except Exception:
                st.session_state["data_error"] = (
                    "Erro ao gerar transacoes. Tente novamente em alguns segundos."
                )
                st.rerun()
    else:
        # Has data -- show info and management buttons
        st.info(f"Voce tem {txn_count} transacoes no sistema.")

        if not st.session_state.get("confirm_clear", False):
            col1, col2 = st.columns(2)
            with col1:
                st.markdown('<div class="destructive-btn">', unsafe_allow_html=True)
                if st.button("Limpar Dados", key="btn_clear", use_container_width=True):
                    st.session_state["confirm_clear"] = True
                    st.rerun()
                st.markdown("</div>", unsafe_allow_html=True)
            with col2:
                st.button(
                    "Regerar Dados",
                    key="btn_regen",
                    use_container_width=True,
                    disabled=True,
                    help="Limpe os dados primeiro para regerar",
                )
        else:
            # Confirmation flow
            st.warning("Tem certeza? Isso removera todas as suas transacoes.")
            col1, col2 = st.columns(2)
            with col1:
                st.markdown('<div class="destructive-btn">', unsafe_allow_html=True)
                if st.button("Confirmar", key="btn_confirm_clear", use_container_width=True):
                    try:
                        client.table("transactions").delete().eq(
                            "user_id", user["id"]
                        ).execute()
                        st.session_state["data_success"] = "Dados removidos com sucesso."
                        st.session_state.pop("confirm_clear", None)
                        st.rerun()
                    except Exception:
                        st.session_state["data_error"] = (
                            "Erro ao remover transacoes. Tente novamente em alguns segundos."
                        )
                        st.session_state.pop("confirm_clear", None)
                        st.rerun()
                st.markdown("</div>", unsafe_allow_html=True)
            with col2:
                if st.button("Cancelar", key="btn_cancel_clear", use_container_width=True):
                    st.session_state.pop("confirm_clear", None)
                    st.rerun()

    st.divider()

    # --- Sessao section ---
    st.header("Sessao")
    st.markdown('<div class="logout-btn">', unsafe_allow_html=True)
    if st.button("Sair da conta", key="settings_logout", use_container_width=False):
        sign_out()
        st.rerun()
    st.markdown("</div>", unsafe_allow_html=True)

    st.markdown("</div>", unsafe_allow_html=True)
