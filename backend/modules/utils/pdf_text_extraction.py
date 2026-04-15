from __future__ import annotations

import re
import unicodedata
from io import BytesIO

from pypdf import PdfReader

_DATE_PATTERN = re.compile(r"\b\d{2}/\d{2}(?:/\d{2,4})?\b")
_AMOUNT_PATTERN = re.compile(r"\b\d{1,3}(?:\.\d{3})*,\d{2}\b")


def extract_text_from_pdf_bytes(pdf_content: bytes) -> str:
    reader = PdfReader(BytesIO(pdf_content))
    pages: list[str] = []
    for page in reader.pages:
        text = (page.extract_text() or "").replace("\x00", " ").strip()
        if text:
            pages.append(text)
    return "\n\n".join(pages)


def _normalize_text(value: str) -> str:
    raw = " ".join((value or "").split()).strip().lower()
    return unicodedata.normalize("NFKD", raw).encode("ascii", "ignore").decode("ascii")


def has_meaningful_financial_text(text: str) -> bool:
    clean = (text or "").strip()
    if len(clean) < 120:
        return False
    has_date = bool(_DATE_PATTERN.search(clean))
    has_amount = bool(_AMOUNT_PATTERN.search(clean))
    return has_date and has_amount


def infer_source_from_text(text: str) -> str | None:
    normalized = _normalize_text(text)

    credit_card_hits = (
        "fatura",
        "cartao",
        "bradescard",
        "vencimento",
        "limite",
        "pagamento minimo",
    )
    bank_hits = (
        "extrato",
        "saldo anterior",
        "saldo do dia",
        "debito",
        "pix",
        "ted",
        "doc",
    )

    cc_score = sum(1 for token in credit_card_hits if token in normalized)
    bank_score = sum(1 for token in bank_hits if token in normalized)

    if cc_score == 0 and bank_score == 0:
        return None
    if cc_score >= bank_score:
        return "credit_card"
    return "bank_statement"


def truncate_text_for_llm(text: str, max_chars: int = 120000) -> str:
    if len(text) <= max_chars:
        return text

    head_size = int(max_chars * 0.6)
    tail_size = max_chars - head_size
    return (
        text[:head_size]
        + "\n\n[...TRECHO INTERMEDIARIO OMITIDO POR TAMANHO...]\n\n"
        + text[-tail_size:]
    )

