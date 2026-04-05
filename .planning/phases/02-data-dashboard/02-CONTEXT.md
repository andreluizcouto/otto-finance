# Phase 2: Data & Dashboard - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Gerar transacoes simuladas realistas com merchants brasileiros e visualizar os dados em um dashboard interativo com graficos Plotly. Usuarios podem ver breakdown por categoria, tendencias ao longo do tempo e comparacao mes a mes. Classificacao por IA e orcamentos sao fases separadas.

</domain>

<decisions>
## Implementation Decisions

### Dados simulados
- **D-01:** Botao na pagina de Configuracoes para gerar transacoes fake com um clique — mais intuitivo para usuarios MVP
- **D-02:** 3 meses de historico simulado — suficiente para tendencias e comparacao mensal sem poluir dados
- **D-03:** Alto realismo: merchants brasileiros reais (Carrefour, iFood, Uber, 99, Riachuelo), valores coerentes por categoria (delivery R$25-60, supermercado R$150-400), distribuicao realista ao longo do mes
- **D-04:** Botao de limpar + regerar dados nas Configuracoes — permite testar cenarios diferentes, util para demo

### Layout do dashboard
- **D-05:** 3-4 KPI cards no topo: Total gasto no mes, No de transacoes, Categoria mais cara, Gasto medio por dia
- **D-06:** Pagina unica com scroll: KPIs -> Grafico de categorias -> Tendencia mensal -> Comparacao mes anterior -> Tabela de transacoes recentes
- **D-07:** Tabela com ultimas 10-20 transacoes: data, merchant, categoria (com emoji/cor), valor — da contexto concreto aos graficos

### Graficos de categoria
- **D-08:** Donut chart para divisao de gastos por categoria com total no centro (ex: "R$ 4.230"). Usa cores hex ja definidas na Phase 1
- **D-09:** Grafico de linha para tendencia de gastos ao longo do tempo (gastos totais por semana/mes)
- **D-10:** Barras lado a lado para comparacao mes atual vs anterior: azul (atual) vs cinza (anterior), agrupadas por categoria

### Filtros e comparacao
- **D-11:** Selectbox no topo com periodos fixos: "Esta semana" | "Este mes" | "Ultimos 3 meses" — Streamlit st.selectbox nativo
- **D-12:** Filtro global unico que controla todos os graficos e KPIs de uma vez — consistencia, UX padrao de dashboards

### Claude's Discretion
- Design exato dos KPI cards (cores, icones, layout)
- Formatacao de valores monetarios (R$ com separadores brasileiros)
- Quantidade exata de transacoes por mes no gerador
- Loading states durante geracao de dados e carregamento do dashboard
- Paleta de cores dos graficos de tendencia e comparacao (alem das cores de categoria ja definidas)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above and in:

### Project requirements
- `.planning/REQUIREMENTS.md` — DATA-02, DASH-01, DASH-02, DASH-03, DASH-04 requirements for this phase
- `.planning/PROJECT.md` — Constraints (tech stack, demo quality, custo minimo)

### Prior phase context
- `.planning/phases/01-foundation/01-CONTEXT.md` — Schema decisions (D-04 through D-08): campos de transactions, taxonomia de categorias brasileiras com cores hex e emojis

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/config.py`: `get_supabase_client()` — conexao Supabase pronta para queries
- `src/auth.py`: `get_current_user()` — retorna user dict com id para filtrar transacoes por user_id
- `src/pages/settings.py` — pagina de configuracoes onde o botao de gerar dados sera adicionado
- `src/pages/dashboard.py` — placeholder atual que sera substituido pelo dashboard real
- `src/ui/styles.py` — CSS customizado com tema dark, pode ser estendido para KPI cards e graficos

### Established Patterns
- Dark theme: bg #1E293B, borders #334155, accent #2563EB, text #94A3B8/#64748B
- Font Inter via Google Fonts
- Navigation via streamlit-option-menu na sidebar
- Auth gate com st.stop() em app.py
- Supabase queries via `client.table("x").select("*").eq("user_id", uid).execute()`

### Integration Points
- `app.py` roteia para `show_dashboard()` — precisa receber o dashboard real
- Supabase ja tem tabelas transactions, categories com RLS por user_id
- Categories pre-populadas com cores hex e emojis (Phase 1 schema)
- Faker pt_BR no requirements.txt para geracao de dados

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

*Phase: 02-data-dashboard*
*Context gathered: 2026-04-05*
