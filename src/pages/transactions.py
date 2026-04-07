"""
transactions.py — Transactions page with AI classification CTA and inline review.
"""

from __future__ import annotations

import pandas as pd
import streamlit as st

from src.auth import get_current_user
from src.config import get_authenticated_client
from src.data.classifier import trigger_classification


def _confidence_label(score: str | None) -> str:
    if score == "high":
        return "Alta"
    if score == "medium":
        return "Media"
    if score == "low":
        return "Baixa"
    return "—"


def show_transactions():
    st.title("Transacoes")

    user = get_current_user()
    if not user:
        st.stop()

    client = get_authenticated_client()

    unclassified_resp = (
        client.table("transactions")
        .select("id", count="exact")
        .eq("user_id", user["id"])
        .or_("category_id.is.null,confidence_score.is.null")
        .eq("manually_reviewed", False)
        .execute()
    )
    unclassified_count = unclassified_resp.count or 0

    if st.session_state.get("classify_success"):
        success_msg = st.session_state.pop("classify_success")
        st.success(success_msg)
        st.toast(success_msg, icon="✅")
    if st.session_state.get("classify_error"):
        st.error(st.session_state.pop("classify_error"))

    st.markdown('<div class="classify-btn">', unsafe_allow_html=True)
    classify_clicked = st.button(
        "Classificar transacoes nao classificadas",
        key="btn_classify_transactions",
        disabled=(unclassified_count == 0),
        use_container_width=True,
    )
    st.markdown("</div>", unsafe_allow_html=True)

    if unclassified_count == 0:
        st.caption("Todas as transacoes ja foram classificadas")

    if classify_clicked:
        with st.spinner("Classificando... Isso pode levar alguns segundos."):
            result = trigger_classification(client, user["id"])

        if result.get("success"):
            count = result.get("classified_count", 0)
            st.session_state["classify_success"] = (
                f"{count} transacoes classificadas com sucesso!"
            )
        else:
            st.session_state["classify_error"] = result.get(
                "error",
                "Erro ao conectar com o servico de classificacao. Tente novamente.",
            )
        st.rerun()

    st.divider()

    txn_resp = (
        client.table("transactions")
        .select(
            "id, date, description, merchant_name, amount, confidence_score, manually_reviewed, category_id, categories(name, emoji)"
        )
        .eq("user_id", user["id"])
        .order("date", desc=True)
        .execute()
    )
    transactions = txn_resp.data or []

    if not transactions:
        st.markdown('<div class="empty-state">', unsafe_allow_html=True)
        st.markdown("### Nenhuma transacao encontrada")
        st.markdown("Gere dados de teste nas Configuracoes para comecar.")
        st.markdown("</div>", unsafe_allow_html=True)
        return

    cat_resp = (
        client.table("categories")
        .select("id, name, emoji")
        .order("is_default", desc=True)
        .order("name")
        .execute()
    )
    categories = cat_resp.data or []
    category_options = [""] + [f"{c['emoji']} {c['name']}".strip() for c in categories]
    category_display_to_id = {
        f"{c['emoji']} {c['name']}".strip(): c["id"] for c in categories
    }

    rows = []
    for t in transactions:
        cat = t.get("categories") or {}
        category_display = (
            f"{cat.get('emoji', '')} {cat.get('name', '')}".strip() if cat else "—"
        )
        is_low = t.get("confidence_score") == "low" and not t.get(
            "manually_reviewed", False
        )
        rows.append(
            {
                "_id": t["id"],
                "_is_low": is_low,
                "Data": t["date"],
                "Descricao": t["description"],
                "Merchant": t.get("merchant_name") or "—",
                "Categoria": category_display,
                "Valor": float(t["amount"]),
                "Confianca": "? Baixa" if is_low else _confidence_label(t.get("confidence_score")),
                "Corrigir": "" if is_low else None,
            }
        )

    df = pd.DataFrame(rows)

    if "corrected_ids" not in st.session_state:
        st.session_state["corrected_ids"] = set()

    low_count = int(df["_is_low"].sum())
    if low_count > 0:
        st.markdown(
            f'<span class="confidence-badge-low">? Baixa</span> {low_count} transacao(oes) aguardando revisao manual.',
            unsafe_allow_html=True,
        )

    st.markdown('<div class="transactions-container">', unsafe_allow_html=True)
    edited_df = st.data_editor(
        df[["Data", "Descricao", "Merchant", "Categoria", "Valor", "Confianca", "Corrigir"]],
        column_config={
            "Data": st.column_config.DateColumn("Data", format="DD/MM/YYYY"),
            "Descricao": st.column_config.TextColumn("Descricao", disabled=True),
            "Merchant": st.column_config.TextColumn("Merchant", disabled=True),
            "Categoria": st.column_config.TextColumn("Categoria", disabled=True),
            "Valor": st.column_config.NumberColumn("Valor", format="R$ %.2f"),
            "Confianca": st.column_config.TextColumn("Confianca", disabled=True),
            "Corrigir": st.column_config.SelectboxColumn(
                "Corrigir",
                options=category_options,
                help="Selecione a categoria correta",
                required=False,
            ),
        },
        disabled=["Data", "Descricao", "Merchant", "Categoria", "Valor", "Confianca"],
        hide_index=True,
        use_container_width=True,
        key="transactions_editor",
    )
    st.markdown("</div>", unsafe_allow_html=True)

    correction_made = False
    for idx, edited_row in edited_df.iterrows():
        txn_id = df.at[idx, "_id"]
        is_low = df.at[idx, "_is_low"]
        selected = edited_row.get("Corrigir")
        if (
            is_low
            and selected
            and txn_id not in st.session_state["corrected_ids"]
            and selected in category_display_to_id
        ):
            client.table("transactions").update(
                {
                    "category_id": category_display_to_id[selected],
                    "confidence_score": "high",
                    "manually_reviewed": True,
                }
            ).eq("id", txn_id).execute()
            st.session_state["corrected_ids"].add(txn_id)
            st.toast("Categoria corrigida.", icon="✅")
            correction_made = True

    if correction_made:
        st.rerun()
