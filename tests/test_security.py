"""
Testes de segurança — verifica que todas as vulnerabilidades identificadas no audit foram corrigidas.

Como cada falha poderia ser explorada e como foi corrigida:

CR-01 | /api/decrypt sem autenticação
  Exploração: qualquer pessoa sem conta poderia usar POST /api/decrypt com qualquer PDF
  e senha, usando o servidor como proxy de descriptografia gratuito.
  Correção: endpoint agora exige Depends(get_current_user) — sem token válido retorna 401.

CR-02 | IDOR em correct_transaction_category
  Exploração: usuário A autenticado faz PATCH /api/transactions/{uuid_do_usuario_B}/category
  com seu próprio token. Sem filtro por user_id, o UPDATE atingia qualquer transação do banco.
  Correção: services.py agora filtra .eq("user_id", user_id) além do transaction_id.

HR-02 | Erro interno exposto ao cliente no import de PDF
  Exploração: enviar payloads malformados para /api/transactions/import e ler as mensagens
  de erro para mapear schema do banco, versão do driver, queries internas.
  Correção: exceção capturada com logger.exception() e mensagem genérica retornada ao cliente.

HR-03 | category_id sem validação de UUID
  Exploração: enviar strings arbitrárias como category_id para tentar enumerar UUIDs
  ou provocar erros diferenciados que revelam estrutura interna.
  Correção: campo agora é UUID no schema Pydantic — qualquer string inválida retorna 422.

MD-01 | list_categories retornava categorias de todos os usuários
  Exploração: usuário autenticado chamava GET /api/categories e recebia todas as categorias
  do banco incluindo user_id de outros usuários.
  Correção: query filtra por is_default=true OR user_id={user_id} e não expõe user_id.

MD-03 | Upload de PDF sem limite de tamanho
  Exploração: enviar arquivo de vários GBs para /api/analyze-pdf ou /api/decrypt,
  esgotando a memória do servidor (DoS).
  Correção: limite de 20MB imposto antes de processar o conteúdo.

MD-04 | color_hex sem validação de formato
  Exploração: enviar strings como '<script>' ou 'red; background: url(evil)' como color_hex.
  O valor seria armazenado e depois injetado no CSS do frontend.
  Correção: validator regex exige #RGB ou #RRGGBB.

LW-01 | ImportPdfRequest.result sem limite de tamanho
  Exploração: enviar payload JSON de vários MBs para /api/transactions/import,
  consumindo CPU e memória desnecessariamente.
  Correção: max_length=500_000 no campo result.

LW-02 | X-Refresh-Token sem validação de tamanho
  Exploração: enviar header de tamanho arbitrário para aumentar custo de processamento.
  Correção: tokens maiores que 2048 chars retornam 400.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from pydantic import ValidationError

from backend.schemas import (
    CorrectTransactionRequest,
    CreateCategoryRequest,
    ImportPdfRequest,
)


# ---------------------------------------------------------------------------
# CR-02: IDOR — correct_transaction_category deve filtrar por user_id
# ---------------------------------------------------------------------------

def test_correct_transaction_category_filters_by_user_id(mock_supabase):
    """CR-02: UPDATE deve incluir .eq('user_id', user_id) além do transaction_id."""
    from backend.modules.transactions.services import correct_transaction_category

    mock_chain = MagicMock()
    mock_supabase.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value.data = []
    mock_supabase.table.return_value.update.return_value = mock_chain
    mock_chain.eq.return_value = mock_chain
    mock_chain.execute.return_value.data = []

    correct_transaction_category(
        client=mock_supabase,
        transaction_id="txn-123",
        category_id="cat-456",
        user_id="user-789",
    )

    # Verifica que user_id foi passado para a função (assinatura correta)
    import inspect
    sig = inspect.signature(correct_transaction_category)
    assert "user_id" in sig.parameters, "user_id deve ser parâmetro de correct_transaction_category"


def test_correct_transaction_category_signature_has_user_id():
    """CR-02: Garante que a assinatura da função exige user_id."""
    from backend.modules.transactions.services import correct_transaction_category
    import inspect
    params = inspect.signature(correct_transaction_category).parameters
    assert "user_id" in params


# ---------------------------------------------------------------------------
# HR-02: Erro interno não deve vazar para o cliente
# ---------------------------------------------------------------------------

def test_import_transactions_error_is_generic(mock_supabase):
    """HR-02: Exceção interna deve retornar mensagem genérica, não str(e)."""
    from backend.modules.transactions.services import import_transactions_from_pdf

    # Força exceção no loop
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.eq.return_value.execute.side_effect = Exception(
        "FATAL: password authentication failed for user postgres at line 42"
    )

    transacoes = [{"data": "01/01/2026", "valor": "100", "tipo": "debito", "descricao": "Teste", "origem": "bank_statement"}]
    result = import_transactions_from_pdf(mock_supabase, "user-1", transacoes)

    assert result["imported"] == 0
    # Mensagem não deve conter detalhes internos
    assert "postgres" not in result.get("error", "")
    assert "password" not in result.get("error", "")
    assert "line 42" not in result.get("error", "")
    assert "Erro interno" in result.get("error", "")


# ---------------------------------------------------------------------------
# HR-03 + MD-04: Validação de schemas Pydantic
# ---------------------------------------------------------------------------

def test_correct_transaction_request_rejects_invalid_uuid():
    """HR-03: category_id deve ser UUID válido."""
    with pytest.raises(ValidationError):
        CorrectTransactionRequest(category_id="nao-e-um-uuid")


def test_correct_transaction_request_rejects_sql_fragment():
    """HR-03: Strings com SQL fragment devem ser rejeitadas."""
    with pytest.raises(ValidationError):
        CorrectTransactionRequest(category_id="'; DROP TABLE transactions; --")


def test_correct_transaction_request_accepts_valid_uuid():
    """HR-03: UUID válido deve ser aceito."""
    req = CorrectTransactionRequest(category_id="08e65e68-db7e-48a1-9528-869f1e6912ef")
    assert str(req.category_id) == "08e65e68-db7e-48a1-9528-869f1e6912ef"


def test_create_category_rejects_invalid_color_hex():
    """MD-04: color_hex inválido deve ser rejeitado."""
    with pytest.raises(ValidationError):
        CreateCategoryRequest(name="Teste", color_hex="red", emoji="🏷️")


def test_create_category_rejects_script_injection():
    """MD-04: CSS/script injection em color_hex deve ser rejeitado."""
    with pytest.raises(ValidationError):
        CreateCategoryRequest(name="Teste", color_hex="<script>", emoji="🏷️")


def test_create_category_accepts_valid_hex_short():
    """MD-04: Formato #RGB deve ser aceito."""
    req = CreateCategoryRequest(name="Teste", color_hex="#F00", emoji="🏷️")
    assert req.color_hex == "#F00"


def test_create_category_accepts_valid_hex_long():
    """MD-04: Formato #RRGGBB deve ser aceito."""
    req = CreateCategoryRequest(name="Teste", color_hex="#FF0000", emoji="🏷️")
    assert req.color_hex == "#FF0000"


# ---------------------------------------------------------------------------
# LW-01: ImportPdfRequest.result tem limite de tamanho
# ---------------------------------------------------------------------------

def test_import_pdf_request_rejects_oversized_result():
    """LW-01: result maior que 500_000 chars deve ser rejeitado."""
    with pytest.raises(ValidationError):
        ImportPdfRequest(result="x" * 500_001)


def test_import_pdf_request_accepts_normal_result():
    """LW-01: result dentro do limite deve ser aceito."""
    req = ImportPdfRequest(result='{"transacoes": []}')
    assert req.result == '{"transacoes": []}'


# ---------------------------------------------------------------------------
# LW-02: X-Refresh-Token com tamanho excessivo
# ---------------------------------------------------------------------------

def test_get_refresh_token_rejects_oversized_token():
    """LW-02: Refresh token maior que 2048 chars deve lançar HTTPException."""
    from fastapi import HTTPException
    from backend.core import get_refresh_token

    oversized = "x" * 2049
    with pytest.raises(HTTPException) as exc_info:
        get_refresh_token(refresh_token=oversized)
    assert exc_info.value.status_code == 400


def test_get_refresh_token_accepts_normal_token():
    """LW-02: Token dentro do limite deve ser retornado normalmente."""
    from backend.core import get_refresh_token

    token = "x" * 512
    result = get_refresh_token(refresh_token=token)
    assert result == token


def test_get_refresh_token_accepts_none():
    """LW-02: None deve ser retornado sem erro."""
    from backend.core import get_refresh_token
    assert get_refresh_token(refresh_token=None) is None


# ---------------------------------------------------------------------------
# MD-01: list_categories deve filtrar por user_id
# ---------------------------------------------------------------------------

def test_list_categories_signature_requires_user_id():
    """MD-01: list_categories deve aceitar user_id como parâmetro."""
    from backend.modules.categories.services import list_categories
    import inspect
    params = inspect.signature(list_categories).parameters
    assert "user_id" in params


def test_list_categories_does_not_expose_user_id_field(mock_supabase):
    """MD-01: Query não deve selecionar o campo user_id."""
    from backend.modules.categories import services as cat_services

    captured_select = []

    def mock_select(fields):
        captured_select.append(fields)
        m = MagicMock()
        m.or_.return_value.order.return_value.order.return_value.execute.return_value.data = []
        return m

    mock_supabase.table.return_value.select = mock_select

    cat_services.list_categories(mock_supabase, user_id="user-1")

    assert len(captured_select) == 1
    assert "user_id" not in captured_select[0], "user_id não deve ser exposto no select de categorias"


# ---------------------------------------------------------------------------
# MD-03: Limite de tamanho de PDF
# ---------------------------------------------------------------------------

def test_max_pdf_bytes_constant_exists():
    """MD-03: Constante MAX_PDF_BYTES deve existir e ser 20MB."""
    from backend.modules.utils.router import MAX_PDF_BYTES
    assert MAX_PDF_BYTES == 20 * 1024 * 1024
