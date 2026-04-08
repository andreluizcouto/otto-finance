---
phase: quick
plan: 260408-dk2
subsystem: backend-python
tags: [refactor, cleanup, consolidation, schemas, pydantic]
key-files:
  created:
    - backend/schemas.py
  modified:
    - backend/core.py
    - backend/modules/auth/router.py
    - backend/modules/categories/router.py
    - backend/modules/transactions/router.py
    - backend/modules/dashboard/services.py
  deleted:
    - backend/modules/auth/schemas.py
    - backend/modules/categories/schemas.py
    - backend/modules/transactions/schemas.py
    - backend/modules/shared/utils.py
decisions:
  - Todos os schemas Pydantic consolidados em backend/schemas.py (único ponto de verdade)
  - format_brl movida para backend/core.py (junto com outras utilidades de infraestrutura)
  - Pasta backend/modules/shared/ deletada por ficar vazia após migração
metrics:
  duration: ~8min
  completed: 2026-04-08
  tasks: 3
  files_changed: 9
---

# Quick Task 260408-dk2: Limpeza e Consolidação do Backend Python — Summary

**One-liner:** Schemas Pydantic dispersos (3 módulos, 22 linhas) e utilitário isolado `format_brl` (3 linhas) consolidados em `backend/schemas.py` e `backend/core.py`, eliminando 4 arquivos tiny e a pasta `shared/`.

## O que foi feito

### Contexto
O backend tinha 4 arquivos de baixa densidade que causavam fragmentação desnecessária:
- `auth/schemas.py`, `categories/schemas.py`, `transactions/schemas.py` — 3 arquivos schemas com ~22 linhas no total
- `shared/utils.py` — 1 função (`format_brl`) em 3 linhas, acessada de `dashboard/services.py`

### Consolidação realizada

| Item | Antes | Depois |
|------|-------|--------|
| Schemas Pydantic | 3 arquivos dispersos nos módulos | `backend/schemas.py` (32 linhas, 5 models) |
| `format_brl` | `backend/modules/shared/utils.py` | `backend/core.py` (final do arquivo) |
| Pasta `shared/` | Existia com `utils.py` | **Deletada** |

### Arquivos criados
- **`backend/schemas.py`** — `LoginRequest`, `SignUpRequest`, `CreateCategoryRequest`, `RenameCategoryRequest`, `CorrectTransactionRequest`

### Imports atualizados (zero lógica alterada)
| Arquivo | Import antigo | Import novo |
|---------|--------------|-------------|
| `auth/router.py` | `from .schemas import LoginRequest, SignUpRequest` | `from backend.schemas import LoginRequest, SignUpRequest` |
| `categories/router.py` | `from .schemas import CreateCategoryRequest, RenameCategoryRequest` | `from backend.schemas import CreateCategoryRequest, RenameCategoryRequest` |
| `transactions/router.py` | `from .schemas import CorrectTransactionRequest` | `from backend.schemas import CorrectTransactionRequest` |
| `dashboard/services.py` | `from ..shared.utils import format_brl` | `from backend.core import format_brl` |

### Arquivos deletados
1. `backend/modules/auth/schemas.py`
2. `backend/modules/categories/schemas.py`
3. `backend/modules/transactions/schemas.py`
4. `backend/modules/shared/utils.py`
5. Pasta `backend/modules/shared/` (vazia após deleção)

## Commits

| Task | Hash | Mensagem |
|------|------|----------|
| Task 1 — criar schemas.py | `091cdc9` | `feat(260408-dk2): criar backend/schemas.py com todos os modelos Pydantic centralizados` |
| Task 2 — format_brl + imports | `2eec4c7` | `feat(260408-dk2): mover format_brl para core.py e atualizar imports de schemas` |
| Task 3 — deletar obsoletos | `f771dec` | `refactor(260408-dk2): deletar arquivos de schemas e shared/utils obsoletos` |

## Verificação Final

- ✅ `backend/schemas.py` existe com 5 models
- ✅ `backend/core.py` contém `format_brl` no final
- ✅ `backend/modules/auth/schemas.py` NÃO existe
- ✅ `backend/modules/categories/schemas.py` NÃO existe
- ✅ `backend/modules/transactions/schemas.py` NÃO existe
- ✅ `backend/modules/shared/utils.py` NÃO existe
- ✅ `python -c "import backend.main"` sem erros
- ✅ `uvicorn backend.main:app --port 8099` → `Application startup complete.`
- ✅ `format_brl(1234.56)` → `R$ 1.234,56`

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — refactoring puro, sem lógica de negócio alterada.

## Self-Check: PASSED
- `backend/schemas.py` → FOUND
- `backend/core.py` com `format_brl` → FOUND
- Commits `091cdc9`, `2eec4c7`, `f771dec` → FOUND
- 4 arquivos obsoletos → DELETED (confirmed)
