import base64
import json
import logging
import os
from datetime import datetime
from io import BytesIO
from typing import Annotated

import anthropic
import pikepdf
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from backend.core import get_current_user
from backend.modules.transactions.router import (
    _normalize_transaction_items,
    _parse_transactions_from_result,
)
from .pdf_text_extraction import (
    extract_text_from_pdf_bytes,
    filter_bank_statement_noise,
    has_meaningful_financial_text,
    infer_source_from_text,
    truncate_text_for_llm,
)

router = APIRouter(prefix="/api", tags=["utils"])
logger = logging.getLogger(__name__)


def _build_text_extraction_prompt(extracted_text: str, source_hint: str | None) -> str:
    source_default = source_hint or "bank_statement"
    year = datetime.now().year
    return (
        "Extraia transacoes de documento financeiro BR (extrato ou fatura).\n"
        "Ignore: saldo, juros, IOF, pagamento de fatura, limite, vencimento, encargos.\n"
        "Retorne SO JSON puro:\n"
        '{"t":[{"d":"AAAA-MM-DD","h":"HH:MM" ou null,"m":"merchant","a":-12.34,"c":"categoria" ou null,"o":"bank_statement|credit_card"}]}\n'
        "Regras:\n"
        f"- d: ISO 8601; se vier DD/MM, use ano {year}\n"
        "- h: HH:MM explicito; senao null (sem aspas)\n"
        "- m: merchant limpo, sem prefixos como Pix/Compra/Pagamento\n"
        "- a: numerico, negativo=debito, positivo=credito\n"
        "- c: categoria curta PT ou null\n"
        f'- o: "{source_default}" default\n\n'
        "TEXTO:\n"
        f"{extracted_text}"
    )


def _build_document_extraction_prompt() -> str:
    year = datetime.now().year
    return (
        "Extraia transacoes deste PDF financeiro BR (extrato ou fatura). "
        "Retorne SO JSON puro (sem markdown).\n"
        'Formato: {"t":[{"d":"AAAA-MM-DD","h":"HH:MM" ou null,"m":"merchant","a":-12.34,"c":"categoria" ou null,"o":"bank_statement|credit_card"}]}\n'
        "Regras: "
        f"d=ISO8601 (DD/MM vira ano {year}); "
        "h=HH:MM explicito ou null sem aspas; "
        "m=sem prefixos (Pix/Compra/Pagamento); "
        "a=negativo debito/positivo credito; "
        "c=categoria curta PT ou null; "
        "o=bank_statement para extrato/debito, credit_card para fatura. "
        "Ignore: saldo, juros, IOF, pagamento de fatura, limite, vencimento."
    )


def _coerce_transactions_json_result(raw_result: str) -> str:
    try:
        items = _parse_transactions_from_result(raw_result)
        normalized = _normalize_transaction_items(items)
    except Exception:
        logger.exception("Erro ao normalizar transacoes extraidas pelo Claude.")
        normalized = []
    return json.dumps({"transacoes": normalized}, ensure_ascii=False)


def _run_anthropic_text_analysis(
    client: anthropic.Anthropic,
    model_name: str,
    extracted_text: str,
) -> str:
    source_hint = infer_source_from_text(extracted_text)
    filtered_text = filter_bank_statement_noise(extracted_text)
    prompt = _build_text_extraction_prompt(
        extracted_text=truncate_text_for_llm(filtered_text),
        source_hint=source_hint,
    )
    message = client.messages.create(
        model=model_name,
        max_tokens=8192,
        messages=[
            {
                "role": "user",
                "content": [{"type": "text", "text": prompt}],
            }
        ],
    )
    return message.content[0].text


def _run_anthropic_document_analysis(
    client: anthropic.Anthropic,
    model_name: str,
    pdf_content: bytes,
) -> str:
    pdf_base64 = base64.standard_b64encode(pdf_content).decode("utf-8")
    message = client.messages.create(
        model=model_name,
        max_tokens=8192,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "document",
                        "source": {
                            "type": "base64",
                            "media_type": "application/pdf",
                            "data": pdf_base64,
                        },
                    },
                    {
                        "type": "text",
                        "text": _build_document_extraction_prompt(),
                    },
                ],
            }
        ],
    )
    return message.content[0].text

MAX_PDF_BYTES = 20 * 1024 * 1024  # 20 MB


@router.post("/decrypt")
async def decrypt_pdf(
    file: UploadFile = File(...),
    password: str = Form(...),
    user: Annotated[dict, Depends(get_current_user)] = None,
):
    """
    Descriptografa um PDF (ex: fatura do BB) usando a senha fornecida.
    Retorna o PDF sem criptografia para processamento posterior.
    """
    _ = user
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="O arquivo deve ser um PDF.")

    try:
        pdf_content = await file.read(MAX_PDF_BYTES + 1)
        if len(pdf_content) > MAX_PDF_BYTES:
            raise HTTPException(status_code=413, detail="PDF muito grande. Limite: 20 MB.")

        with pikepdf.open(BytesIO(pdf_content), password=password) as pdf:
            output_buffer = BytesIO()
            pdf.save(output_buffer)
            output_buffer.seek(0)

            import os as _os
            safe_filename = "decrypted_" + _os.path.basename(file.filename or "file.pdf").replace('"', "")

            return StreamingResponse(
                output_buffer,
                media_type="application/pdf",
                headers={"Content-Disposition": f'attachment; filename="{safe_filename}"'},
            )

    except HTTPException:
        raise
    except pikepdf.PasswordError:
        raise HTTPException(status_code=401, detail="Senha incorreta para o PDF.")
    except Exception:
        logger.exception("Erro ao descriptografar PDF")
        raise HTTPException(status_code=500, detail="Erro ao processar PDF.")
    finally:
        await file.close()


@router.post("/analyze-pdf")
async def analyze_pdf(
    file: UploadFile = File(...),
    user: Annotated[dict, Depends(get_current_user)] = None,
):
    """
    Recebe um PDF ja descriptografado, prioriza extracao textual do PDF
    e usa IA apenas para estruturar os dados em JSON.
    """
    _ = user
    pdf_content = await file.read(MAX_PDF_BYTES + 1)
    if len(pdf_content) > MAX_PDF_BYTES:
        raise HTTPException(status_code=413, detail="PDF muito grande. Limite: 20 MB.")

    extracted_text = ""
    try:
        extracted_text = extract_text_from_pdf_bytes(pdf_content)
    except Exception:
        logger.exception("Falha ao extrair texto do PDF via camada textual.")

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY não configurada.")

    model_name = os.getenv("ANTHROPIC_PDF_MODEL", "claude-sonnet-4-6").strip()

    client = anthropic.Anthropic(api_key=api_key)

    if has_meaningful_financial_text(extracted_text):
        try:
            raw_result = _run_anthropic_text_analysis(client, model_name, extracted_text)
            coerced = _coerce_transactions_json_result(raw_result)
            parsed = json.loads(coerced)
            if not parsed.get("transacoes"):
                logger.warning("Modo text-first: Claude nao retornou transacoes. Tentando fallback.")
                raise ValueError("Sem transacoes no modo text-first.")
            return {
                "result": coerced,
                "mode": "text-first",
                "text_chars": len(extracted_text),
            }
        except Exception:
            logger.exception("Falha no modo text-first. Tentando fallback com documento.")

    try:
        raw_result = _run_anthropic_document_analysis(client, model_name, pdf_content)
        coerced = _coerce_transactions_json_result(raw_result)
        parsed = json.loads(coerced)
        if not parsed.get("transacoes"):
            return {
                "result": json.dumps({"transacoes": []}, ensure_ascii=False),
                "mode": "document-fallback",
                "warning": "Nao foi possivel extrair transacoes deste PDF. O formato pode nao ser suportado ou o documento esta ilegivel.",
            }
        return {
            "result": coerced,
            "mode": "document-fallback",
            "text_chars": len(extracted_text),
        }
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Falha ao analisar PDF: {str(exc)}")
