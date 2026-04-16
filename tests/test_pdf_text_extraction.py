from backend.modules.utils.pdf_text_extraction import (
    has_meaningful_financial_text,
    infer_source_from_text,
    truncate_text_for_llm,
)


def test_has_meaningful_financial_text_requires_date_and_amount():
    assert not has_meaningful_financial_text("apenas texto sem campos financeiros")
    assert has_meaningful_financial_text(
        "01/04/2026 COMPRA SUPERMERCADO 123,45\n"
        "02/04/2026 PIX RECEBIDO 800,00\n"
        "03/04/2026 FARMACIA 55,20\n"
        "04/04/2026 CINEMA 44,10\n"
        "05/04/2026 MERCADO 79,99\n"
    )


def test_infer_source_from_text_prefers_credit_card_when_fatura_signals_are_present():
    text = (
        "FATURA OUROCARD\n"
        "VENCIMENTO 10/04/2026\n"
        "LIMITE UNICO\n"
        "12/03/2026 COMPRA MERCADO 80,00"
    )
    assert infer_source_from_text(text) == "credit_card"


def test_truncate_text_for_llm_keeps_head_and_tail():
    long_text = ("A" * 1000) + ("B" * 1000) + ("C" * 1000)
    truncated = truncate_text_for_llm(long_text, max_chars=600)
    assert len(truncated) > 0
    assert truncated.startswith("A")
    assert truncated.endswith("C")
    assert "TRECHO INTERMEDIARIO OMITIDO" in truncated
