# TODO — Débito Técnico

Items identificados durante análise de characterização. Todos são pós-Fase-0.

---

## TODO-CL-01 — Exceções silenciadas em `_load_learned_category_map` (prioridade: média)

**Arquivo:** `backend/modules/transactions/services.py`  
**Função:** `_load_learned_category_map()`

Quando o SELECT no Supabase falha (ex.: timeout, erro de rede), a exceção é capturada,
logada, e a função retorna `{}`. O caller (`_fallback_local_classification`) continua sem
aprendizado — classificando por hints em vez de histórico do usuário — sem nenhum campo
no retorno indicando que o aprendizado foi degradado. O usuário recebe classificações de
menor qualidade sem aviso.

---

## TODO-CL-02 — `merchant_name` None usa description como input de `resolve_merchant_name` (prioridade: alta)

**Arquivo:** `backend/modules/transactions/services.py`  
**Função:** `_fallback_local_classification()`

Quando `merchant_name` é `None` ou vazio, o código faz:

```python
resolved_merchant = resolve_merchant_name(str(transaction.get("merchant_name") or raw_description))
```

A description entra no lookup de merchant codes. Exemplo real: `"NF COMPRA ONLINE LIVRARIA"`
(onde "NF" = Nota Fiscal) bate no prefixo `"NF"` de `_MERCHANT_PREFIX_LOOKUP`, produzindo
`merchant_name = "Netflix"` e categoria `"assinaturas"` com `confidence = "high"` — incorreto.

Prefixos de risco em `_MERCHANT_PREFIX_LOOKUP`: `"NF"`, `"BK"`, `"ML"`, `"PAG"`, `"AMZ"`.

---

## TODO-CL-03 — `confidence="high"` emitido para keyword match simples (prioridade: baixa)

**Arquivo:** `backend/modules/transactions/services.py`  
**Função:** `_infer_category_slug()`

Os slugs `"delivery"`, `"assinaturas"` e `"compras"` retornam `confidence = "high"` mesmo
sendo apenas substring match em `_CATEGORY_HINTS`. `"high"` deveria ser reservado para
classificação por IA ou revisão humana (`manually_reviewed = True`). O campo está
semanticamente inflacionado para essas três categorias.

---

## TODO-CL-04 — Inconsistência estrutural no retorno de "zero classificações" (prioridade: baixa)

**Arquivo:** `backend/modules/transactions/services.py`  
**Funções:** `trigger_classification()` e `_fallback_local_classification()`

Três caminhos de "zero classificações" retornam estruturas diferentes:

- `trigger_classification()` early return, sem transações não classificadas → `{"success": True, ..., "fallback_used": ausente}`
- `_fallback_local_classification()` com lista de transações vazia → `{"success": True, ..., "fallback_used": True}`
- `_fallback_local_classification()` com categorias vazias (sem `fallback_category_id`) → `{"success": False, ..., "fallback_used": ausente}`

O campo `fallback_used` deveria ter semântica e presença uniformes para que o caller possa
tratar os casos de forma previsível.
