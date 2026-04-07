# Phase 3: AI Classification - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Classificação automática de transações em categorias de gastos via pipeline Make.com → OpenAI. Inclui mapeamento de merchants brasileiros crípticos (RCHLO, Pag*), score de confiança por classificação, fila de revisão inline para itens de baixa confiança, e gerenciamento de categorias customizadas. Integração com WhatsApp e orçamentos são fases separadas.

</domain>

<decisions>
## Implementation Decisions

### Trigger de Classificação
- **D-01:** Comportamento híbrido: classificação automática roda para transações recém-criadas/importadas no fluxo de criação ao vivo; o botão manual na página de Transações ("Classificar transações não classificadas") permanece disponível como fallback/retry explícito sob controle do usuário.
- **D-02:** Classifica apenas transações sem categoria ou com confidence_score = null (idempotente — não sobrescreve correções manuais do usuário).

### Review Queue (Confiança Baixa)
- **D-03:** Revisão inline na tabela de transações — linhas de baixa confiança exibem badge de aviso (ex: ícone "?"). Ao clicar, abre dropdown para o usuário selecionar a categoria correta.
- **D-04:** Não há página de revisão separada — mantém tudo na tabela de transações, evita nova página.

### Gerenciamento de Categorias
- **D-05:** Seção "Categorias" na página de Configurações existente (Settings) — CRUD de categorias customizadas (criar, renomear, deletar).
- **D-06:** Categorias pré-populadas (Phase 1: D-07) são visíveis mas não deletáveis — usuário pode adicionar as suas.

### Integração Make.com
- **D-07:** Streamlit envia IDs das transações não classificadas para webhook Make.com via httpx.post. Make.com lê os dados do Supabase, chama OpenAI com Structured Outputs, e escreve category_id + confidence_score de volta.
- **D-08:** Structured Outputs (JSON Schema) para garantir resposta confiável da OpenAI — conforme AICL-06.
- **D-09:** Modelo: gpt-4o-mini para classificação (custo baixo, rápido, suficientemente preciso).

### Níveis de Confiança
- **D-10:** Três níveis fixos: high (≥0.8), medium (0.5–0.79), low (<0.5). Threshold não configurável pelo usuário no MVP.
- **D-11:** Somente low-confidence são flagadas para revisão — medium e high ficam sem badge.

### Claude's Discretion
- Design do badge de low-confidence (ícone, cor — manter tema dark da Phase 1)
- Prompt exato enviado ao OpenAI (merchant name mapping interno)
- Estrutura do payload webhook Make.com → Supabase write-back
- Mensagem de feedback após classificação (sucesso/erro toast)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project requirements
- `.planning/REQUIREMENTS.md` — AICL-01 through AICL-06 e INTG-01 (requisitos desta fase)
- `.planning/PROJECT.md` — Constraints (tech stack não negociável: Make.com, OpenAI, Supabase)

### Prior phase context
- `.planning/phases/01-foundation/01-CONTEXT.md` — Schema (D-04: campos de transactions incl. confidence_score), taxonomia de categorias brasileiras (D-07/D-08: slugs, cores hex, emojis)
- `.planning/phases/02-data-dashboard/02-CONTEXT.md` — Merchants existentes no generator (MERCHANTS dict), padrões de query Supabase, Settings page como ponto de extensão

### Stack reference
- `CLAUDE.md` — Stack patterns: Write via Make.com webhook, Read via supabase-py; OpenAI Structured Outputs com Pydantic; httpx para chamadas de webhook do Streamlit

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/config.py`: `get_authenticated_client()` — cliente Supabase com JWT para queries RLS-safe
- `src/config.py`: `get_supabase_url()` / `get_supabase_anon_key()` — acesso a secrets
- `src/pages/settings.py` — página de Configurações existente onde a seção de Categorias será adicionada
- `src/data/generator.py`: `MERCHANTS` dict — mapping de categoria→lista de merchants (ponto de extensão para mapeamento críptico)
- `src/ui/styles.py` — CSS dark theme (#1E293B, #2563EB) para badge de confiança

### Established Patterns
- Dark theme: bg #1E293B, borders #334155, accent #2563EB, text #94A3B8
- Navigation via streamlit-option-menu — páginas existentes: Dashboard, Settings
- Supabase queries: `client.table("transactions").select("*").eq("user_id", uid).execute()`
- Webhook call pattern: `httpx.post(MAKE_WEBHOOK_URL, json=payload)` (documentado em CLAUDE.md)
- Auth gate via `st.stop()` — todas as páginas exigem autenticação

### Integration Points
- Tabela `transactions` no Supabase: campos `category_id`, `confidence_score` já existem (Phase 1 schema)
- Tabela `categories` no Supabase: categorias pré-populadas com slug, cor hex, emoji
- Make.com webhook URL precisa ser adicionado a `.env` / `st.secrets`
- Nova seção "Transações" no nav (ou extensão do Dashboard) para exibir a tabela com revisão inline

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-ai-classification*
*Context gathered: 2026-04-07*
