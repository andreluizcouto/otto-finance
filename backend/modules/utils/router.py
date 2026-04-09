import base64
import os
from io import BytesIO

import anthropic
import pikepdf
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/api", tags=["utils"])

@router.post("/decrypt")
async def decrypt_pdf(
    file: UploadFile = File(...),
    password: str = Form(...)
):
    """
    Descriptografa um PDF (ex: fatura do BB) usando a senha fornecida.
    Retorna o PDF sem criptografia para processamento posterior.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="O arquivo deve ser um PDF.")

    try:
        pdf_content = await file.read()

        with pikepdf.open(BytesIO(pdf_content), password=password) as pdf:
            output_buffer = BytesIO()
            pdf.save(output_buffer)
            output_buffer.seek(0)

            filename = f"decrypted_{file.filename}"

            return StreamingResponse(
                output_buffer,
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )

    except pikepdf.PasswordError:
        raise HTTPException(status_code=401, detail="Senha incorreta para o PDF.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar PDF: {str(e)}")
    finally:
        await file.close()


@router.post("/analyze-pdf")
async def analyze_pdf(
    file: UploadFile = File(...),
):
    """
    Recebe um PDF já descriptografado, envia para o Claude Haiku
    e retorna as transações extraídas em JSON.
    """
    pdf_content = await file.read()
    pdf_base64 = base64.standard_b64encode(pdf_content).decode("utf-8")

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY não configurada.")

    client = anthropic.Anthropic(api_key=api_key)

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=4096,
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
                            "Extraia todas as transações deste extrato bancário. "
                            "Retorne SOMENTE um JSON válido, sem texto adicional, "
                            "no formato: "
                            '{\"transacoes\": [{\"data\": \"DD/MM/AAAA\", '
                            '"descricao\": \"...\", \"valor\": 0.00, '
                            '"tipo\": \"debito\" ou \"credito\"}]}'
                        ),
                    },
                ],
            }
        ],
    )

    return {"result": message.content[0].text}
