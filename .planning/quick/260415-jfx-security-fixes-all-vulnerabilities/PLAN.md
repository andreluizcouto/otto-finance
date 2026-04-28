# Security Fixes — All Vulnerabilities

**Quick ID:** 260415-jfx
**Date:** 2026-04-15

## Objective

Corrigir todas as vulnerabilidades identificadas no security audit (2 CRITICAL, 3 HIGH, 4 MEDIUM, 3 LOW), explicar como cada uma poderia ser explorada, e escrever testes para verificar as correções.

## Tasks

### CRITICAL

- [ ] CR-01: Adicionar autenticação em `/api/decrypt`
- [ ] CR-02: Corrigir IDOR em `correct_transaction_category` (filtrar por user_id)

### HIGH

- [ ] HR-01: Tornar `get_authenticated_client` seguro contra vazamento de sessão
- [ ] HR-02: Remover erro interno bruto do import de PDF
- [ ] HR-03: Validar `category_id` como UUID

### MEDIUM

- [ ] MD-01: Filtrar `list_categories` por user_id (sem cross-tenant)
- [ ] MD-02: Corrigir check de duplicidade de categoria com escopo de tenant
- [ ] MD-03: Limitar tamanho do upload de PDF
- [ ] MD-04: Validar `color_hex` com regex

### LOW

- [ ] LW-01: Limitar tamanho de `ImportPdfRequest.result`
- [ ] LW-02: Validar tamanho do refresh token
- [ ] LW-03: (sem mudança de código — postura de logs)

### Testes

- [ ] Escrever testes para cada correção

## Files

- backend/main.py
- backend/core.py
- backend/schemas.py
- backend/modules/auth/router.py
- backend/modules/categories/services.py
- backend/modules/categories/router.py
- backend/modules/transactions/services.py
- backend/modules/transactions/router.py
- backend/modules/utils/router.py
- tests/test_security.py (novo)
