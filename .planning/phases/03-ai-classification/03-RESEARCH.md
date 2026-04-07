# Phase 3: AI Classification - Research

**Researched:** 2026-04-07
**Domain:** OpenAI Structured Outputs + Make.com webhook orchestration + Streamlit inline review UI
**Confidence:** HIGH

## Summary

Phase 3 wires an existing Streamlit+Supabase app to OpenAI via Make.com for automatic transaction classification. The database schema already has `confidence_score` (VARCHAR 'high'/'medium'/'low') and `category_id` on the `transactions` table — no schema migration is needed for classification. The `categories` table already has all 10 Brazilian categories seeded with RLS policies that correctly isolate user-created vs. default categories.

The core technical challenge is the Make.com write-back: Make.com must call the Supabase PostgREST REST API (HTTP PATCH) using the `service_role` key to bypass RLS, because Make.com does not have access to a user JWT. This is the single most important architectural decision to nail in the plan. The Streamlit side sends a payload of unclassified transaction IDs + user_id + categories list to the Make.com webhook, Make.com iterates each transaction, calls OpenAI per item with the prompt, and PATCHes `category_id` + `confidence_score` back to Supabase.

For the UI, `st.data_editor` with `st.column_config.SelectboxColumn` is the right tool for inline correction of low-confidence rows — it renders a native selectbox inside a table cell without requiring custom HTML. The category CRUD section inserts into the Settings page between the existing "Dados de Teste" and "Sessao" dividers.

**Primary recommendation:** Plan three focused plans: (1) Make.com scenario + OpenAI prompt + Supabase write-back + Streamlit trigger button, (2) Transactions page with `st.data_editor` and inline low-confidence correction, (3) Category CRUD in Settings page. Test with mocked OpenAI responses — no real API calls in CI.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Botao manual na pagina de Transacoes: "Classificar transacoes nao classificadas" — o usuario controla quando roda. Simples, previsivel, sem complexidade de background.
- **D-02:** Classifica apenas transacoes sem categoria ou com confidence_score = null (idempotente — nao sobrescreve correcoes manuais do usuario).
- **D-03:** Revisao inline na tabela de transacoes — linhas de baixa confianca exibem badge de aviso (ex: icone "?"). Ao clicar, abre dropdown para o usuario selecionar a categoria correta.
- **D-04:** Nao ha pagina de revisao separada — mantem tudo na tabela de transacoes, evita nova pagina.
- **D-05:** Secao "Categorias" na pagina de Configuracoes existente (Settings) — CRUD de categorias customizadas (criar, renomear, deletar).
- **D-06:** Categorias pre-populadas (Phase 1: D-07) sao visiveis mas nao deletaveis — usuario pode adicionar as suas.
- **D-07:** Streamlit envia IDs das transacoes nao classificadas para webhook Make.com via httpx.post. Make.com le os dados do Supabase, chama OpenAI com Structured Outputs, e escreve category_id + confidence_score de volta.
- **D-08:** Structured Outputs (JSON Schema) para garantir resposta confiavel da OpenAI — conforme AICL-06.
- **D-09:** Modelo: gpt-4o-mini para classificacao (custo baixo, rapido, suficientemente preciso).
- **D-10:** Tres niveis fixos: high (>=0.8), medium (0.5-0.79), low (<0.5). Threshold nao configuravel pelo usuario no MVP.
- **D-11:** Somente low-confidence sao flagadas para revisao — medium e high ficam sem badge.

### Claude's Discretion
- Design do badge de low-confidence (icone, cor — manter tema dark da Phase 1)
- Prompt exato enviado ao OpenAI (merchant name mapping interno)
- Estrutura do payload webhook Make.com → Supabase write-back
- Mensagem de feedback apos classificacao (sucesso/erro toast)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AICL-01 | Transactions are automatically classified into categories via OpenAI through Make.com | Make.com Watch Webhooks trigger → HTTP module to OpenAI chat/completions → Iterator pattern → HTTP PATCH to Supabase PostgREST |
| AICL-02 | System includes Brazilian merchant name mapping (RCHLO → Riachuelo, Pag* → PagSeguro, etc.) | Lookup table in the OpenAI prompt system message (hardcoded dict in prompt, not a separate service); LLM resolves unrecognized names with fallback |
| AICL-03 | Each classification includes a confidence score (high/medium/low) | Model-stated confidence field in Structured Output JSON schema (number 0.0-1.0); mapped to 3-tier enum on write-back |
| AICL-04 | Low-confidence classifications are flagged for user review | Query filter `confidence_score = 'low'`; inline row styling via CSS + `st.data_editor` SelectboxColumn |
| AICL-05 | Users can create and manage custom categories | Supabase `categories` table with RLS (already exists); CRUD functions via supabase-py; Settings page extension |
| AICL-06 | Classification uses structured outputs (JSON schema) for reliability | OpenAI `response_format: {type: "json_schema", json_schema: {..., strict: true}}`; gpt-4o-mini supported |
| INTG-01 | Make.com receives webhook calls and orchestrates AI classification flow | Make.com Custom Webhook (Watch Webhooks) trigger; HTTP module to OpenAI; HTTP module to Supabase REST API |
</phase_requirements>

---

## Standard Stack

### Core (already installed — no new packages needed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| openai | >=2.30.0 | Structured Outputs | Already in requirements.txt. v2 SDK required for json_schema response_format. [VERIFIED: requirements.txt] |
| httpx | >=0.28.1 | Webhook call from Streamlit | Already in requirements.txt as supabase-py dep. Used for `httpx.post(MAKE_WEBHOOK_URL, ...)`. [VERIFIED: requirements.txt] |
| supabase-py | >=2.28.3 | Reading/writing categories and transactions | Already in requirements.txt. All DB reads and UI-triggered writes. [VERIFIED: requirements.txt] |
| pydantic | >=2.12.5 | Structured Output schema definition (if calling OpenAI from Python) | Already installed. Phase 3 calls OpenAI from Make.com, but Pydantic useful for validating incoming webhook responses. [VERIFIED: requirements.txt] |

### No New Dependencies
All required libraries are already in `requirements.txt`. Phase 3 adds no new Python packages.

**SaaS services required (existing accounts needed):**
- Make.com account with active scenario (webhook URL to be added to `.env` / `st.secrets`)
- OpenAI API key (for Make.com to call — not called from Python)
- Supabase `service_role` key (needed by Make.com for PATCH write-back — already available in Supabase dashboard)

---

## Architecture Patterns

### Recommended Project Structure Additions
```
src/
├── pages/
│   ├── transactions.py    # NEW: Transactions page with classify button + review table
│   └── settings.py        # EXTENDED: Add Categorias section
├── data/
│   ├── classifier.py      # NEW: build_classification_payload(), handle_classification_response()
│   └── generator.py       # existing — unchanged
└── ui/
    └── styles.py          # EXTENDED: add .classify-btn, .confidence-badge-low, .transactions-container, .category-row, .category-swatch
```

### Pattern 1: Streamlit → Make.com Webhook Trigger

**What:** Streamlit fetches unclassified transaction IDs + their descriptions from Supabase, then POSTs them to a Make.com webhook URL. Make.com does the AI work and writes results back directly to Supabase.

**When to use:** Any time user clicks "Classificar transacoes nao classificadas"

**Unclassified query (from Streamlit):**
```python
# Source: supabase-py established pattern from Phase 1/2
# Fetch transactions with no category OR no confidence_score
resp = client.table("transactions") \
    .select("id, description, merchant_name, amount") \
    .eq("user_id", user["id"]) \
    .or_("category_id.is.null,confidence_score.is.null") \
    .execute()
unclassified = resp.data
```

**Webhook payload from Streamlit:**
```python
# Source: CLAUDE.md webhook call pattern + CONTEXT.md D-07
import httpx, os

MAKE_WEBHOOK_URL = os.getenv("MAKE_WEBHOOK_URL")  # or st.secrets["MAKE_WEBHOOK_URL"]

payload = {
    "user_id": user["id"],
    "transactions": [
        {"id": t["id"], "description": t["description"], "merchant_name": t["merchant_name"], "amount": t["amount"]}
        for t in unclassified
    ],
    "categories": [
        {"id": c["id"], "name": c["name"], "slug": c["slug"]}
        for c in all_categories  # pre-fetched from Supabase
    ]
}

with st.spinner("Classificando... Isso pode levar alguns segundos."):
    try:
        r = httpx.post(MAKE_WEBHOOK_URL, json=payload, timeout=60.0)
        r.raise_for_status()
        result = r.json()
        count = result.get("classified_count", len(unclassified))
        st.toast(f"{count} transacoes classificadas com sucesso!")
    except httpx.TimeoutException:
        st.error("O servico de classificacao nao respondeu. Tente novamente em alguns minutos.")
    except Exception:
        st.error("Erro ao conectar com o servico de classificacao. Tente novamente.")
```

**Critical note:** `httpx.post()` default timeout is 5 seconds. With 40-60 transactions and Make.com + OpenAI latency, set `timeout=60.0` explicitly.

### Pattern 2: Make.com Scenario Structure

**What:** Make.com receives the webhook, iterates each transaction, calls OpenAI per item, writes results back to Supabase REST API.

**Make.com module sequence:**
```
[1] Webhooks > Watch Webhooks (Custom)
    - URL: auto-generated by Make.com
    - Receives: JSON body with user_id, transactions[], categories[]

[2] Tools > Set Variable
    - Store categories list for reuse in each iteration

[3] Tools > Iterator
    - Array: {{1.transactions}}
    - Outputs one bundle per transaction

[4] HTTP > Make a request (OpenAI call)
    - URL: https://api.openai.com/v1/chat/completions
    - Method: POST
    - Headers: Authorization: Bearer {{OPENAI_API_KEY}}, Content-Type: application/json
    - Body (JSON):
      {
        "model": "gpt-4o-mini",
        "messages": [
          {"role": "system", "content": "...system prompt with categories list..."},
          {"role": "user", "content": "{{3.description}} | {{3.merchant_name}} | R$ {{3.amount}}"}
        ],
        "response_format": {
          "type": "json_schema",
          "json_schema": {
            "name": "classification_result",
            "strict": true,
            "schema": {
              "type": "object",
              "properties": {
                "category_slug": {"type": "string", "enum": ["alimentacao","transporte","moradia","saude","lazer","educacao","compras","assinaturas","delivery","outros"]},
                "confidence": {"type": "number"}
              },
              "required": ["category_slug", "confidence"],
              "additionalProperties": false
            }
          }
        }
      }

[5] JSON > Parse JSON
    - String: {{4.data.choices[].message.content}}
    - Extracts category_slug and confidence as variables

[6] HTTP > Make a request (Supabase PATCH)
    - URL: https://<project_ref>.supabase.co/rest/v1/transactions?id=eq.{{3.id}}
    - Method: PATCH
    - Headers:
        apikey: {{SERVICE_ROLE_KEY}}
        Authorization: Bearer {{SERVICE_ROLE_KEY}}
        Content-Type: application/json
        Prefer: return=minimal
    - Body (JSON):
      {
        "category_id": "{{lookup category_slug in categories list → id}}",
        "confidence_score": "{{if confidence >= 0.8 then 'high' else if >= 0.5 then 'medium' else 'low'}}"
      }

[7] Webhooks > Webhook Response
    - Status: 200
    - Body: {"classified_count": {{total count from aggregator}}}
```

**CRITICAL — service_role key:** Make.com must use the Supabase `service_role` key (not anon key) in the Authorization header for PATCH to work, because RLS `transactions_update_own` checks `auth.uid() = user_id`. The anon key has no user JWT, so the PATCH would fail silently (0 rows updated) or return 403. [VERIFIED: Supabase docs + community discussion]

**CRITICAL — enum in JSON schema:** The `category_slug` field uses an `enum` constraint listing all 10 default slugs. If user creates custom categories, the enum must include them OR use a string type with the prompt constraining to valid values. For MVP (10 default + few custom), include defaults in enum and rely on prompt for custom category handling.

### Pattern 3: Inline Correction with st.data_editor

**What:** Display all transactions in an editable table where low-confidence rows show a SelectboxColumn for category correction.

**When to use:** Transactions page rendering

```python
# Source: Streamlit docs for st.data_editor + st.column_config.SelectboxColumn
# [VERIFIED: Streamlit docs confirmed SelectboxColumn exists in Streamlit >= 1.26]

import streamlit as st
import pandas as pd

# Build category options for SelectboxColumn
category_options = [""] + [f"{c['emoji']} {c['name']}" for c in categories]
category_name_to_id = {f"{c['emoji']} {c['name']}": c["id"] for c in categories}

# Filter: only show low-confidence rows in the editable column
df = pd.DataFrame(transactions_data)

edited_df = st.data_editor(
    df,
    column_config={
        "Data": st.column_config.DateColumn("Data", format="DD/MM/YYYY"),
        "Valor": st.column_config.NumberColumn("Valor", format="R$ %.2f"),
        "Categoria": st.column_config.TextColumn("Categoria", disabled=True),
        "Confianca": st.column_config.TextColumn("Confianca", disabled=True),
        "Corrigir": st.column_config.SelectboxColumn(
            "Corrigir",
            options=category_options,
            required=False,
        ),
    },
    disabled=["Data", "Valor", "Categoria", "Confianca"],
    hide_index=True,
    use_container_width=True,
)

# Detect edits and write back
for idx, row in edited_df.iterrows():
    if row["Corrigir"] and row["Corrigir"] != "":
        new_cat_id = category_name_to_id[row["Corrigir"]]
        txn_id = df.at[idx, "id"]
        client.table("transactions").update({
            "category_id": new_cat_id,
            "confidence_score": "high",
            "manually_reviewed": True
        }).eq("id", txn_id).execute()
```

**Caveat:** `st.data_editor` triggers a full rerun on each edit. The correction loop runs on every rerun but only executes updates when a non-empty Corrigir value is present. Use `st.session_state` to track which rows have already been corrected to avoid duplicate updates.

**Alternative approach (simpler):** Instead of `st.data_editor`, render low-confidence rows as `st.columns(...)` with `st.selectbox` per row. More code but more predictable behavior. Both approaches are valid — `st.data_editor` is cleaner for dense tables.

### Pattern 4: Category CRUD in Settings

**What:** Insert/Update/Delete operations on the `categories` table using supabase-py, following the RLS policies already in place.

```python
# CREATE custom category
# Source: schema.sql RLS — categories_insert_own requires auth.uid() = user_id AND is_default = false
client.table("categories").insert({
    "name": name,
    "slug": name.lower().replace(" ", "_"),
    "emoji": emoji or "🏷️",
    "color_hex": color_hex,
    "user_id": user["id"],
    "is_default": False,
}).execute()

# RENAME custom category
client.table("categories").update({"name": new_name}) \
    .eq("id", cat_id) \
    .eq("user_id", user["id"]) \
    .execute()

# DELETE custom category — RLS ensures only user's own non-default categories are deletable
client.table("categories").delete() \
    .eq("id", cat_id) \
    .eq("user_id", user["id"]) \
    .execute()

# READ all visible categories (default + user's own)
client.table("categories").select("*") \
    .order("is_default", desc=True) \
    .order("name") \
    .execute()
```

**Schema note:** `slug` on categories has a UNIQUE constraint. For custom categories, generate slug from name (`name.lower().replace(" ", "_")`). If user creates "Pets" twice, the second insert fails with a unique constraint violation — catch this as a duplicate name error.

### Anti-Patterns to Avoid
- **Calling OpenAI from Python (Streamlit):** The architecture is Make.com→OpenAI, not Python→OpenAI. Never add direct OpenAI calls in Streamlit for classification — defeats the serverless pattern.
- **Using anon key in Make.com PATCH:** The anon key will fail RLS on updates. Must use service_role key in Make.com HTTP headers.
- **Embedding user JWT in webhook payload for Make.com to use:** JWTs expire. Use service_role key in Make.com for all write operations, and include user_id in the payload for data scoping.
- **Blocking UI during Make.com call without spinner:** Make.com + OpenAI latency for 50 transactions can be 10-30 seconds. Always use `st.spinner()`.
- **Storing service_role key anywhere in Streamlit code or .env committed to git:** service_role key stays in Make.com scenario configuration only.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON schema enforcement | Custom parser / regex | OpenAI `response_format: {type: "json_schema", strict: true}` | Guaranteed schema conformance — model literally cannot produce non-conforming response [VERIFIED: OpenAI docs] |
| Confidence computation | Logprobs post-processing | Model-stated confidence field in JSON schema | Logprobs require additional API response configuration and parsing complexity; model-stated confidence is simpler and sufficient for 3-tier MVP bucketing |
| Transaction batch iteration in Make.com | Custom code module | Tools > Iterator module | Native Make.com primitive; no coding required |
| Merchant name lookup | Separate microservice or DB table | System prompt with embedded lookup table | At MVP scale (<20 cryptic names), a hardcoded lookup in the prompt is simpler and requires no extra infrastructure |
| Category selectbox in table | Custom HTML/JS component | `st.data_editor` + `st.column_config.SelectboxColumn` | Native Streamlit; accessibility-compliant; no unsafe HTML needed |
| Slug uniqueness validation | Manual query before insert | Catch PostgREST unique constraint error (status 409 / code "23505") | The DB already enforces it — catch and translate to user-facing message |

**Key insight:** The entire classification pipeline (OpenAI call, JSON parsing, DB write) lives in Make.com, not Python. Python only fires the trigger and reads results. This keeps Streamlit stateless and the expensive logic in the automation layer.

---

## Common Pitfalls

### Pitfall 1: Make.com PATCH fails silently with anon key
**What goes wrong:** Make.com sends PATCH to Supabase PostgREST with anon key. Supabase returns HTTP 200 but updates 0 rows because RLS `transactions_update_own` requires `auth.uid() = user_id`, and the anon key has no user JWT.
**Why it happens:** The anon key is a "no-auth" key — PostgREST treats it as the `anon` role, not a specific user. Update policies fail the `auth.uid()` check.
**How to avoid:** Use `service_role` key in Make.com HTTP headers: `Authorization: Bearer <service_role_key>` AND `apikey: <service_role_key>`. Both headers are required by PostgREST.
**Warning signs:** Make.com scenario shows success (200) but `confidence_score` stays null in Supabase after execution.

### Pitfall 2: OpenAI confidence scores skewed high
**What goes wrong:** Model returns confidence 0.9-1.0 for nearly all transactions, even ambiguous ones. The "low confidence" queue is always empty.
**Why it happens:** LLMs tend to be overconfident in self-reported scores — the model has been trained to sound certain. This is a documented community finding [CITED: community.openai.com/t/structured-output-confidence-score/1050232].
**How to avoid:** In the system prompt, explicitly instruct the model: "Return confidence < 0.5 if the merchant name is cryptic, abbreviated, or does not match any known merchant." Also lower the 'low' threshold to 0.6 initially and tune from real data.
**Warning signs:** After classifying 100+ transactions, confidence_score = 'low' appears in 0-2 rows.

### Pitfall 3: httpx.post timeout on large batches
**What goes wrong:** Streamlit button click fires webhook; Make.com processes 50 transactions (each with an OpenAI call); total time exceeds httpx default 5-second timeout. User sees error even though classification eventually succeeds in Make.com.
**Why it happens:** httpx default timeout is 5 seconds. Make.com + 50 × gpt-4o-mini calls ≈ 15-40 seconds.
**How to avoid:** Set `timeout=60.0` in httpx.post(). For very large batches, consider Make.com responding immediately (202 Accepted) and Streamlit polling Supabase for completion instead.
**Warning signs:** `httpx.TimeoutException` in logs; but transactions actually get classified when you refresh the page.

### Pitfall 4: st.data_editor correction loop fires on every rerun
**What goes wrong:** The correction-detection loop (iterate edited_df, check Corrigir column) fires every rerun of the Streamlit page, not just after a user edit. This causes repeated Supabase PATCH calls for already-corrected rows.
**Why it happens:** Streamlit reruns the entire script on every interaction. A previously-saved "Corrigir" value in the dataframe will re-trigger the update check.
**How to avoid:** Track corrected row IDs in `st.session_state["corrected_ids"]`. Skip PATCH if `txn_id in st.session_state["corrected_ids"]`. Alternatively, after correction, set `confidence_score = 'high'` in the DB — the next page load won't show that row in the "Corrigir" column at all (since it filters on low-confidence only).
**Warning signs:** Supabase logs show repeated identical PATCH requests for the same transaction ID.

### Pitfall 5: Category slug uniqueness breaks on custom categories
**What goes wrong:** User creates a custom category named "Pets". Later creates another named "pets" (lowercase). Second insert fails with a unique constraint violation on the `slug` field.
**Why it happens:** Slug is generated as `name.lower().replace(" ", "_")` — "Pets" and "pets" produce identical slugs.
**How to avoid:** Before insert, query for duplicate name (case-insensitive): `.ilike("name", name).execute()`. Show user "Ja existe uma categoria com esse nome." if count > 0.
**Warning signs:** HTTP 409 conflict error from supabase-py on category insert.

### Pitfall 6: Make.com free tier (1,000 ops/month) exhausted quickly
**What goes wrong:** Each classification of 50 transactions consumes: 1 (webhook) + 1 (iterator setup) + 50 (OpenAI calls) + 50 (Supabase PATCHes) = ~103 operations. 10 classification runs per month = ~1,030 ops — exceeds the free tier.
**Why it happens:** Make.com counts each module execution as an operation.
**How to avoid:** Budget for Make.com Pro ($9/month) before deploying to 5-10 users. This was already flagged in STATE.md as a known concern.
**Warning signs:** Make.com scenario deactivates mid-month; dashboard shows "Operations exceeded."

---

## Code Examples

### OpenAI JSON Schema for Classification (Make.com HTTP body)
```json
{
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "system",
      "content": "Voce e um classificador de transacoes financeiras brasileiras. Retorne SOMENTE um JSON com category_slug e confidence.\n\nCategories disponiveis:\n- alimentacao: supermercado, padaria, acougue\n- transporte: uber, 99, gasolina, pedagio, metro, onibus\n- moradia: aluguel, condominio, luz, agua, gas\n- saude: farmacia, consulta, plano de saude, exame\n- lazer: cinema, parque, shows, games, academia\n- educacao: cursos, livros, faculdade, assinaturas educacionais\n- compras: roupas, calcados, eletronicos, moveis\n- assinaturas: netflix, spotify, amazon prime, servicos recorrentes\n- delivery: ifood, rappi, uber eats, ze delivery\n- outros: tudo que nao se encaixa nas categorias acima\n\nMapeamento de merchants crípticos:\n- RCHLO, RCHLO* = Riachuelo (compras)\n- Pag*, PAG* = PagSeguro (outros - servico de pagamento)\n- MELI, ML = Mercado Livre (compras)\n- AMZ*, AMZN = Amazon (compras ou assinaturas)\n- NF*, NETFLIX = Netflix (assinaturas)\n- SPT*, SPOTIFY = Spotify (assinaturas)\n- MCF, MCDONALD = McDonald's (alimentacao)\n- BK*, BURGER = Burger King (alimentacao)\n- IFOOD* = iFood (delivery)\n- VTEX*, LOJA* = loja virtual (compras)\n\nRetorne confidence < 0.5 se o nome do merchant for ambiguo, abreviado ou desconhecido."
    },
    {
      "role": "user",
      "content": "Merchant: {{3.merchant_name}} | Descricao: {{3.description}} | Valor: R$ {{3.amount}}"
    }
  ],
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "classification_result",
      "strict": true,
      "schema": {
        "type": "object",
        "properties": {
          "category_slug": {
            "type": "string",
            "enum": ["alimentacao", "transporte", "moradia", "saude", "lazer", "educacao", "compras", "assinaturas", "delivery", "outros"]
          },
          "confidence": {
            "type": "number",
            "description": "Confidence score from 0.0 to 1.0. Use < 0.5 for ambiguous merchants."
          }
        },
        "required": ["category_slug", "confidence"],
        "additionalProperties": false
      }
    }
  }
}
```
Source: OpenAI Structured Outputs docs pattern [CITED: platform.openai.com/docs/guides/structured-outputs] + CONTEXT.md D-08/D-09

### Supabase PATCH via PostgREST (Make.com HTTP module config)
```
URL: https://<project_ref>.supabase.co/rest/v1/transactions?id=eq.{{3.id}}
Method: PATCH
Headers:
  apikey: <service_role_key>
  Authorization: Bearer <service_role_key>
  Content-Type: application/json
  Prefer: return=minimal
Body:
{
  "category_id": "{{lookup_result.category_id}}",
  "confidence_score": "{{if(5.confidence >= 0.8; 'high'; if(5.confidence >= 0.5; 'medium'; 'low'))}}"
}
```
Source: Supabase REST API docs pattern [CITED: supabase.com/docs/guides/api] + RLS analysis from schema.sql

### Transactions Page: Classify Button with State
```python
# Source: CONTEXT.md D-01 + established httpx pattern from CLAUDE.md
def show_transactions():
    st.title("Transacoes")
    client = get_authenticated_client()
    user = get_current_user()

    # Fetch unclassified count for button state
    unclassified_resp = client.table("transactions") \
        .select("id", count="exact") \
        .eq("user_id", user["id"]) \
        .or_("category_id.is.null,confidence_score.is.null") \
        .execute()
    unclassified_count = unclassified_resp.count or 0

    # CTA button
    st.markdown('<div class="classify-btn">', unsafe_allow_html=True)
    classify_clicked = st.button(
        "Classificar transacoes nao classificadas",
        disabled=(unclassified_count == 0),
        use_container_width=True,
    )
    st.markdown("</div>", unsafe_allow_html=True)
    if unclassified_count == 0:
        st.caption("Todas as transacoes ja foram classificadas")
```

### Category CRUD: Duplicate Check Pattern
```python
# Source: Supabase RLS schema analysis + PostgREST ilike filter
def add_category(client, user_id: str, name: str, color_hex: str, emoji: str):
    # Case-insensitive duplicate check
    existing = client.table("categories") \
        .select("id") \
        .ilike("name", name.strip()) \
        .execute()
    if existing.data:
        return {"success": False, "error": "Ja existe uma categoria com esse nome."}

    slug = name.strip().lower().replace(" ", "_").replace("-", "_")
    try:
        client.table("categories").insert({
            "name": name.strip(),
            "slug": slug,
            "emoji": emoji or "🏷️",
            "color_hex": color_hex,
            "user_id": user_id,
            "is_default": False,
        }).execute()
        return {"success": True}
    except Exception as e:
        if "23505" in str(e):  # unique constraint violation
            return {"success": False, "error": "Ja existe uma categoria com esse nome."}
        return {"success": False, "error": "Erro ao criar categoria."}
```

---

## Schema Analysis

### Existing Schema — No Migration Needed
The `transactions` table already has all required fields [VERIFIED: supabase/schema.sql]:
- `category_id UUID REFERENCES categories(id) ON DELETE SET NULL` — nullable, FK to categories
- `confidence_score VARCHAR(10) CHECK (confidence_score IN ('high', 'medium', 'low'))` — 3-tier enum
- RLS policy `transactions_update_own` exists for user-scoped updates

The `categories` table already has:
- `user_id UUID` — nullable for default categories
- `is_default BOOLEAN` — guards against deletion of defaults
- RLS: `categories_select_visible`: `is_default = true OR auth.uid() = user_id`
- RLS: `categories_delete_own`: `auth.uid() = user_id AND is_default = false` — prevents default category deletion
- `slug VARCHAR(50) UNIQUE` — enforced at DB level

**One gap:** The `transactions_update_own` RLS policy requires `auth.uid() = user_id`. Make.com using `service_role` key bypasses RLS entirely — so PATCH will succeed. But if the plan considers using a user JWT in Make.com, this becomes more complex. **Confirmed approach: service_role key in Make.com.**

**Optional field to add:** A `manually_reviewed BOOLEAN DEFAULT false` column on transactions to mark user-corrected rows (prevents AI from re-classifying them on the next classification run per D-02). This is a schema addition the plan must include.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest 9.0.2 |
| Config file | `pyproject.toml` (`[tool.pytest.ini_options]`) |
| Quick run command | `python -m pytest tests/ -x -q` |
| Full suite command | `python -m pytest tests/ -v` |

Current suite: 14 tests, all passing [VERIFIED: local run].

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AICL-01 | `build_classification_payload()` constructs correct webhook body | unit | `python -m pytest tests/test_classifier.py::test_build_payload -x` | Wave 0 |
| AICL-02 | Merchant names (RCHLO, Pag*) present in system prompt lookup table | unit | `python -m pytest tests/test_classifier.py::test_merchant_lookup_table -x` | Wave 0 |
| AICL-03 | `map_confidence_to_tier()` maps 0.82→'high', 0.61→'medium', 0.3→'low' | unit | `python -m pytest tests/test_classifier.py::test_confidence_mapping -x` | Wave 0 |
| AICL-04 | Transactions query with `or_("category_id.is.null,confidence_score.is.null")` — mock Supabase | unit | `python -m pytest tests/test_classifier.py::test_unclassified_query -x` | Wave 0 |
| AICL-05 | `add_category()` returns error on duplicate name | unit | `python -m pytest tests/test_categories.py::test_add_duplicate -x` | Wave 0 |
| AICL-05 | `add_category()` creates category with correct fields | unit | `python -m pytest tests/test_categories.py::test_add_category -x` | Wave 0 |
| AICL-06 | JSON schema has `strict: true` and correct enum values | unit | `python -m pytest tests/test_classifier.py::test_json_schema_structure -x` | Wave 0 |
| INTG-01 | Make.com scenario — manual E2E smoke test | manual | Run Make.com scenario with test payload | N/A |

**Mocking strategy for OpenAI:** Phase 3 never calls OpenAI from Python — the call lives in Make.com. Unit tests for classification logic test the Python helper functions (payload builder, confidence mapper) only. Use `unittest.mock.patch` to mock supabase-py client for category CRUD tests.

### Sampling Rate
- **Per task commit:** `python -m pytest tests/ -x -q`
- **Per wave merge:** `python -m pytest tests/ -v`
- **Phase gate:** Full suite green + manual Make.com E2E smoke test before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/test_classifier.py` — covers AICL-01, AICL-02, AICL-03, AICL-04, AICL-06
- [ ] `tests/test_categories.py` — covers AICL-05

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Auth already established in Phase 1 |
| V3 Session Management | no | Session management established in Phase 1 |
| V4 Access Control | yes | RLS policies on categories table; service_role key scoped to Make.com only |
| V5 Input Validation | yes | Category name: max 50 chars (DB constraint); emoji: single char validation; color_hex: 7-char hex pattern |
| V6 Cryptography | no | No new crypto; service_role key stored in Make.com scenario config, not in code |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| service_role key exposure | Information Disclosure | Store only in Make.com scenario config; never in .env committed to git, Streamlit code, or webhook payloads |
| User spoofing in webhook payload | Tampering | Make.com uses service_role + payload `user_id` for data scoping; Supabase UPDATE where clause includes `user_id` in URL filter (belt-and-suspenders) |
| Injection via merchant_name in OpenAI prompt | Tampering | merchant_name sanitized before prompt insertion: strip HTML, limit to 100 chars (matches DB constraint); OpenAI Structured Outputs constrains output regardless of input |
| Unlimited category creation (DoS) | Denial of Service | MVP scope: no hard limit enforced. Acceptable for 5-10 users. Note for v2. |
| Webhook URL enumeration | Tampering | Make.com generates a unique random webhook URL. Not guessable. Acceptable for MVP. |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python 3.11 | All Streamlit code | Yes | 3.11.9 [VERIFIED: local] | — |
| pytest | Test suite | Yes | 9.0.2 [VERIFIED: local] | — |
| openai SDK | requirements.txt (installed) | Yes | >=2.30.0 [VERIFIED: requirements.txt] | — |
| httpx | Webhook call from Streamlit | Yes | >=0.28.1 [VERIFIED: requirements.txt] | — |
| Make.com account | INTG-01 | Unknown | — | Cannot substitute — required by locked architecture |
| OpenAI API key | AICL-01 (via Make.com) | Unknown | — | Cannot substitute — required by D-09 |
| Supabase service_role key | Make.com PATCH write-back | Available in Supabase dashboard | — | Cannot substitute |
| MAKE_WEBHOOK_URL env var | Streamlit → Make.com call | Not yet set | — | Add to .env and st.secrets before testing |

**Missing dependencies with no fallback:**
- Make.com scenario must be created and activated before E2E testing of AICL-01
- MAKE_WEBHOOK_URL must be added to `.env` and `st.secrets` before Streamlit trigger button works

**Missing dependencies with fallback:**
- None — all Python dependencies are installed

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| json_mode (response_format: json_object) | json_schema with strict: true | Aug 2024 (gpt-4o-2024-08-06) | 100% schema conformance; no need for try/except JSON parse |
| openai v1.x SDK | openai v2.x SDK | 2024 | response_format, Pydantic integration, typed responses |
| Manual prompt engineering for JSON | Structured Outputs | Aug 2024 | Eliminates regex/parse fallbacks |

**Deprecated:**
- `response_format: {"type": "json_object"}` (json_mode): Still works but does NOT guarantee schema — model can return any valid JSON. Use `json_schema` with `strict: true` instead per AICL-06.
- openai v1 `ChatCompletion.create()`: Removed in v2 SDK. Use `client.chat.completions.create()`.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Make.com scenario can be built without additional paid modules (uses only Watch Webhooks + HTTP + Iterator + JSON) | Architecture Patterns / Make.com Pattern | If Make.com requires paid OpenAI native module for Structured Outputs, workflow needs adjustment; HTTP module approach still works |
| A2 | Make.com HTTP module supports arbitrary JSON body with `response_format` nested object | Architecture Patterns / Make.com Pattern | If Make.com escapes or flattens nested JSON in body, the Structured Outputs schema may not reach OpenAI correctly; test with simple payload first |
| A3 | Supabase PostgREST PATCH with `?id=eq.{{transaction_id}}` filters correctly in Make.com URL | Architecture Patterns / Make.com Pattern | If Make.com URL-encodes the filter parameter incorrectly, updates will fail silently; test with a single-transaction payload first |
| A4 | `manually_reviewed` field does not yet exist on transactions table | Schema Analysis | If it does exist (added in Phase 1 or 2 outside of documented schema), the migration task is unnecessary |
| A5 | gpt-4o-mini processes 50 transactions via Iterator within Make.com's 5-minute scenario execution limit | Architecture Patterns | If batch size hits timeout, must reduce batch size or switch to async/webhook-response pattern |

---

## Open Questions

1. **Make.com category lookup in scenario**
   - What we know: Make.com receives categories[] array in webhook payload; needs to map category_slug (from OpenAI) to category_id (UUID) for the Supabase PATCH
   - What's unclear: Best Make.com module for array lookup — whether to use a Tools > Array Aggregator to build a lookup table, or use a custom function
   - Recommendation: Include `categories` as a flat object `{slug: id}` in the webhook payload from Streamlit for easy lookup in Make.com; e.g., `"category_index": {"alimentacao": "uuid-1", "transporte": "uuid-2", ...}`

2. **Make.com response to Streamlit: count of classified transactions**
   - What we know: The Webhook Response module in Make.com can return a JSON body
   - What's unclear: Whether Make.com can count the number of successfully processed bundles from the Iterator and include that in the webhook response (requires an Array Aggregator before the response)
   - Recommendation: Use Array Aggregator after the PATCH step to collect results, then Webhook Response with `{"classified_count": {{count(aggregator.results)}}}`. If complex, return `{"status": "ok"}` and let Streamlit count from a fresh Supabase query.

3. **manually_reviewed field — schema migration required?**
   - What we know: schema.sql does not include `manually_reviewed` column on transactions
   - What's unclear: Whether Phase 1/2 execution added any unreported columns
   - Recommendation: Plan must include a Wave 0 task to run `ALTER TABLE transactions ADD COLUMN manually_reviewed BOOLEAN DEFAULT false;` in Supabase SQL editor.

---

## Sources

### Primary (HIGH confidence)
- `supabase/schema.sql` (local file) — confirmed transactions fields, categories structure, RLS policies
- `requirements.txt` (local file) — confirmed all installed package versions
- `src/` codebase — confirmed established patterns: get_authenticated_client(), httpx.post pattern, settings.py structure, navigation.py sidebar
- `pytest --collect` + local run — confirmed 14 tests passing, test infrastructure healthy

### Secondary (MEDIUM confidence)
- [OpenAI Structured Outputs guide](https://platform.openai.com/docs/guides/structured-outputs) — gpt-4o-mini support, strict mode, json_schema response_format [CITED]
- [Supabase REST API docs](https://supabase.com/docs/guides/api) — PATCH URL format, service_role key bypass behavior [CITED]
- [Streamlit st.data_editor docs](https://docs.streamlit.io/develop/api-reference/data/st.data_editor) — SelectboxColumn existence and behavior [CITED]
- [Streamlit SelectboxColumn docs](https://docs.streamlit.io/develop/api-reference/data/st.column_config/st.column_config.selectboxcolumn) — column config API [CITED]
- Supabase community discussions on service_role + RLS bypass [CITED: github.com/orgs/supabase/discussions]

### Tertiary (LOW confidence)
- Make.com Iterator module behavior with OpenAI [ASSUMED — not directly verified from Make.com official docs]
- Make.com Webhook Response with aggregated count [ASSUMED — architecture pattern from community examples]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified locally from requirements.txt
- Architecture: HIGH (Streamlit patterns) / MEDIUM (Make.com specifics — assumed from community knowledge)
- Pitfalls: HIGH — service_role issue verified from Supabase docs; others from direct analysis of existing code patterns
- Schema: HIGH — verified from schema.sql directly

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (stable stack; Make.com and OpenAI API patterns may shift faster)
