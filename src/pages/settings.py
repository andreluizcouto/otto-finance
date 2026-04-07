import streamlit as st
from src.auth import get_current_user, sign_out
from src.config import get_authenticated_client
from src.data.categories import add_category, delete_category, get_all_categories, rename_category
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

    # --- Categorias section (D-05) ---
    st.header("Categorias")

    if st.session_state.get("cat_success"):
        st.success(st.session_state.pop("cat_success"))
    if st.session_state.get("cat_error"):
        st.error(st.session_state.pop("cat_error"))

    categories = get_all_categories(client)

    for cat in categories:
        is_default = cat.get("is_default", False)
        cat_id = cat["id"]

        col1, col2, col3, col4, col5 = st.columns([0.5, 3, 1, 1, 1])

        with col1:
            st.markdown(
                f'<span class="category-swatch" style="background-color:{cat["color_hex"]};"></span>',
                unsafe_allow_html=True,
            )
        with col2:
            st.write(f"{cat['emoji']} {cat['name']}")

        with col3:
            rename_key = f"rename_trigger_{cat_id}"
            if not is_default:
                if st.button(
                    "Renomear", key=f"btn_rename_{cat_id}", use_container_width=True
                ):
                    st.session_state[rename_key] = True
                    st.rerun()

        with col4:
            confirm_key = f"confirm_delete_{cat_id}"
            if is_default:
                st.button(
                    "Excluir",
                    key=f"btn_del_{cat_id}",
                    disabled=True,
                    help="Categoria padrao — nao pode ser removida",
                    use_container_width=True,
                )
            else:
                st.markdown('<div class="destructive-btn">', unsafe_allow_html=True)
                if st.button(
                    "Excluir", key=f"btn_del_{cat_id}", use_container_width=True
                ):
                    st.session_state[confirm_key] = True
                    st.rerun()
                st.markdown("</div>", unsafe_allow_html=True)

        with col5:
            pass

        rename_key = f"rename_trigger_{cat_id}"
        if st.session_state.get(rename_key):
            new_name = st.text_input(
                "Novo nome",
                value=cat["name"],
                key=f"rename_input_{cat_id}",
                max_chars=50,
            )
            rcol1, rcol2 = st.columns(2)
            with rcol1:
                if st.button(
                    "Salvar", key=f"btn_save_rename_{cat_id}", use_container_width=True
                ):
                    result = rename_category(client, user["id"], cat_id, new_name)
                    if result["success"]:
                        st.session_state["cat_success"] = "Categoria renomeada com sucesso."
                    else:
                        st.session_state["cat_error"] = result.get(
                            "error", "Erro ao renomear."
                        )
                    st.session_state.pop(rename_key, None)
                    st.rerun()
            with rcol2:
                if st.button(
                    "Cancelar",
                    key=f"btn_cancel_rename_{cat_id}",
                    use_container_width=True,
                ):
                    st.session_state.pop(rename_key, None)
                    st.rerun()

        confirm_key = f"confirm_delete_{cat_id}"
        if st.session_state.get(confirm_key):
            st.warning(
                f"Tem certeza? Isso removera a categoria '{cat['name']}'. "
                "Transacoes associadas ficarao sem categoria."
            )
            dcol1, dcol2 = st.columns(2)
            with dcol1:
                st.markdown('<div class="destructive-btn">', unsafe_allow_html=True)
                if st.button(
                    "Confirmar exclusao",
                    key=f"btn_confirm_del_{cat_id}",
                    use_container_width=True,
                ):
                    result = delete_category(client, user["id"], cat_id)
                    if result["success"]:
                        st.session_state["cat_success"] = "Categoria removida."
                    else:
                        st.session_state["cat_error"] = result.get(
                            "error", "Erro ao remover."
                        )
                    st.session_state.pop(confirm_key, None)
                    st.rerun()
                st.markdown("</div>", unsafe_allow_html=True)
            with dcol2:
                if st.button(
                    "Cancelar",
                    key=f"btn_cancel_del_{cat_id}",
                    use_container_width=True,
                ):
                    st.session_state.pop(confirm_key, None)
                    st.rerun()

    st.subheader("Adicionar categoria")
    with st.form("add_category_form", clear_on_submit=True):
        new_cat_name = st.text_input("Nome da categoria", max_chars=50)
        new_cat_color = st.color_picker("Cor", value="#6366F1")
        new_cat_emoji = st.text_input("Emoji (opcional)", placeholder="🏷️", max_chars=4)
        submitted = st.form_submit_button("Adicionar categoria")

    if submitted:
        result = add_category(client, user["id"], new_cat_name, new_cat_color, new_cat_emoji)
        if result["success"]:
            st.session_state["cat_success"] = "Categoria adicionada com sucesso."
        else:
            st.session_state["cat_error"] = result.get(
                "error", "Erro ao adicionar categoria."
            )
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
