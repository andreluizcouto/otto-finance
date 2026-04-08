from io import BytesIO
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
import pikepdf

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
        # Lê o conteúdo do arquivo enviado
        pdf_content = await file.read()
        
        # Tenta abrir o PDF com a senha
        with pikepdf.open(BytesIO(pdf_content), password=password) as pdf:
            # Cria um buffer para salvar o PDF descriptografado
            output_buffer = BytesIO()
            pdf.save(output_buffer)
            output_buffer.seek(0)
            
            # Define o nome do arquivo de saída
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
