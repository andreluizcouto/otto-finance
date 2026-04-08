def format_brl(value: float) -> str:
    """Formata um valor float para o padrao de moeda brasileiro (R$)."""
    return f"R$ {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
