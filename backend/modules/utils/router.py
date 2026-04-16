import base64
import json
import logging
import os
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
    has_meaningful_financial_text,
    infer_source_from_text,
    truncate_text_for_llm,
)

router = APIRouter(prefix="/api", tags=["utils"])
logger = logging.getLogger(__name__)


def _build_text_extraction_prompt(extracted_text: str, source_hint: str | None) -> str:
    source_instruction = (
        (
            f'Use origem="{source_hint}" como padrao para as transacoes deste documento. '
            "Se houver evidencia clara de linha no debito, use origem=\"bank_statement\" nessa linha."
        )
        if source_hint
        else (
            "Identifique a origem de cada transacao: "
            '"bank_statement" para extrato/conta e "credit_card" para fatura.'
        )
    )

    return (
        "Voce recebera TEXTO bruto extraido de um PDF financeiro brasileiro (extrato ou fatura).\n"
        "Nao invente nenhuma transacao. Use apenas linhas explicitamente presentes no texto.\n"
        "Ignore linhas administrativas (saldo anterior, saldo do dia, limite, vencimento, resumo, pagamento de fatura, encargos).\n"
        "Retorne SOMENTE JSON puro no formato:\n"
        '{"transacoes":[{"date":"AAAA-MM-DD","time":"HH:MM ou null","merchant_name":"...","description":"...","amount":-12.34,"category_hint":"...","raw_text":"linha original","origem":"bank_statement|credit_card"}]}\n'
        "Regras:\n"
        "1) date deve ser ISO 8601 (AAAA-MM-DD). Se no texto vier apenas DD/MM, use o ano corrente.\n"
        "2) time deve conter HH:MM quando houver horario explicito; caso contrario use null.\n"
        '3) merchant_name deve vir limpo, sem prefixos como "Compra com cartao", "Compra no debito", "Pix", "Pagamento".\n'
        "4) description deve repetir merchant_name limpo, nunca o texto bruto completo.\n"
        "5) amount deve ser numerico e negativo para debito, positivo para credito.\n"
        "6) category_hint deve ser uma categoria curta e plausivel em portugues (ex.: Alimentacao, Transporte, Saude) ou null.\n"
        "7) raw_text deve preservar a linha original usada para extrair a transacao.\n"
        f"8) {source_instruction}\n\n"
        "TEXTO EXTRAIDO:\n"
        f"{extracted_text}"
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
    prompt = _build_text_extraction_prompt(
        extracted_text=truncate_text_for_llm(extracted_text),
        source_hint=infer_source_from_text(extracted_text),
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
                        "text": (
                            "Extraia todas as transacoes deste PDF financeiro (extrato bancario ou fatura de cartao). "
                            "Retorne SOMENTE o JSON puro, sem markdown, sem ```json, sem nenhum texto antes ou depois. "
                            "Cada transacao deve incluir date, time, merchant_name, description, amount, category_hint, raw_text e origem. "
                            "Use date em formato AAAA-MM-DD; se o documento trouxer apenas DD/MM, use o ano corrente. "
                            "Use time no formato HH:MM quando houver horario explicito; senao null. "
                            "merchant_name deve vir limpo, removendo prefixos operacionais como compra com cartao, compra no debito, pix e pagamento. "
                            "description deve repetir merchant_name, nao o texto bruto. "
                            "amount deve ser negativo para debitos e positivo para creditos. "
                            "category_hint deve ser uma categoria curta inferida pelo contexto do merchant em portugues ou null. "
                            "raw_text deve preservar a linha original usada na extracao. "
                            "Cada transacao deve incluir a origem no campo origem: "
                            '"bank_statement" para extrato bancario e compras no debito; '
                            '"credit_card" para compras da fatura do cartao. '
                            'Se uma compra estiver explicitamente no debito, use origem="bank_statement". '
                            "Ignore linhas administrativas (ex.: saldo anterior, saldo do dia, limite, vencimento, pagamento de fatura). "
                            "Formato exato: "
                            '{"transacoes": [{"date": "AAAA-MM-DD", '
                            '"time": "HH:MM ou null", '
                            '"merchant_name": "...", '
                            '"description": "...", '
                            '"amount": -12.34, '
                            '"category_hint": "...", '
                            '"raw_text": "...", '
                            '"origem": "bank_statement" ou "credit_card"}]}'
                        ),
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
