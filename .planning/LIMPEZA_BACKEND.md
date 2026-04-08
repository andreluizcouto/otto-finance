# Plano de Limpeza: Desfragmentação do Back-end

## 1. O Problema
A pasta `backend/` possui muitos arquivos `.py` com 1 a 5 linhas de código (excesso de granularidade em `schemas`, `services` e `core`). Isso dificulta a manutenção e a legibilidade.

## 2. A Solução (Consolidação)
O objetivo é agrupar lógicas pequenas e correlatas em arquivos maiores e mais coesos, eliminando as "cascas vazias".

**Regras de Consolidação:**
* **Schemas:** Se os arquivos em `backend/api/schemas/` (como `auth.py`, `categories.py`, etc.) tiverem poucas linhas de Pydantic models, consolide todos eles em um único arquivo `backend/api/schemas.py` (ou `models.py`) e delete a pasta `schemas/` original.
* **Services:** Se os arquivos em `backend/api/services/` forem muito simples (apenas repassando chamadas para o banco), mova a lógica diretamente para as rotas correspondentes em `api/routes/`. Se houver lógica real, consolide os serviços pequenos em um `backend/api/services.py` global.
* **Core:** Verifique `deps.py`, `config.py` e `__init__.py`. Se tiverem apenas uma linha, junte tudo em um arquivo `core/settings.py` (ou dentro do próprio `main.py` se for extremamente simples).

## 3. Fases da Execução
1. **Fase 1 (Auditoria):** Leia todos os arquivos da pasta `backend/` e me mostre uma lista dos arquivos com menos de 10 linhas. Espere minha aprovação.
2. **Fase 2 (Refatoração):** Mova o código dos arquivos pequenos para os arquivos consolidados, conforme as regras acima.
3. **Fase 3 (Correção de Imports):** Ajuste todos os imports no `main.py` e nos arquivos de rotas para apontar para os novos arquivos consolidados.
4. **Fase 4 (Limpeza):** Exclua os arquivos e pastas que ficaram vazios.