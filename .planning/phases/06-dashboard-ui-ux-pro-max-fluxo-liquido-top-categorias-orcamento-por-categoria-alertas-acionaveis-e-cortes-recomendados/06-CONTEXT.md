# Phase 6: Dashboard UI/UX pro max - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Redesenhar o dashboard para responder claramente 3 perguntas de decisao financeira:
1) "Estou melhorando ou piorando?"
2) "Onde estou exagerando?"
3) "O que cortar primeiro?"

Sem transformar o produto em app de saldo bancario. O foco e orientar decisao de gasto usando fluxo no periodo.

</domain>

<decisions>
## Implementation Decisions

### Linguagem financeira e semantica
- **D-01:** Separar explicitamente "fluxo" de "saldo". Dashboard deve mostrar fluxo do periodo e nao saldo de conta.
- **D-02:** Renomear metricas para reduzir ambiguidade: "Entradas no periodo", "Saidas no periodo", "Fluxo liquido".
- **D-03:** Sempre mostrar microcopy explicita: "Nao inclui saldo anterior da conta."

### Estrutura de decisao (3 perguntas)
- **D-04:** Bloco principal de topo: `Fluxo liquido` com estado visual forte (`positivo` ou `negativo`) e comparacao com periodo anterior.
- **D-05:** Segundo bloco: `Top categorias de gasto` com valor absoluto, participacao percentual e variacao vs periodo anterior.
- **D-06:** Terceiro bloco: `Onde cortar primeiro` com 3 recomendacoes concretas em BRL (economia estimada).

### Orcamento e alertas
- **D-07:** Mostrar progresso de orcamento por categoria com barra (gasto atual / limite mensal), destacando categorias acima de 100%.
- **D-08:** Quando nao houver limite definido para uma categoria, exibir estado "Sem limite definido" + CTA para configurar.
- **D-09:** Exibir alertas acionaveis em linguagem direta (ex.: "Delivery +32% vs media 3 meses"), evitando texto generico.

### Resumo orientado a acao
- **D-10:** Incluir resumo final em linguagem natural: "Voce gastou mais em X e Y; para fechar no azul, reduza R$ Z."
- **D-11:** Resumo deve usar somente dados reais do periodo atual e comparativos calculados, sem heuristica opaca.

### the agent's Discretion
- Hierarquia visual exata entre cards (tipografia, densidade e grid responsivo)
- Thresholds de severidade para cores e badges de alerta
- Formula exata para sugestao de corte quando nao houver orcamento explicito

</decisions>

<specifics>
## Specific Ideas

- "A melhor forma e organizar o dashboard para responder 3 perguntas direto."
- "Entradas e saidas sozinhas deixam o usuario perdido sobre estar no positivo ou negativo."
- "Transformar fluxo em linguagem pratica de decisao: onde cortar e quanto."

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Produto e requisitos
- `.planning/ROADMAP.md` — definicao da Phase 6 e dependencias.
- `.planning/REQUIREMENTS.md` — requisitos DASH-01..04 e BUDG-02 relevantes para visualizacao.
- `.planning/STATE.md` — contexto acumulado e decisoes anteriores.

### Implementacao atual (fonte da verdade)
- `src/features/dashboard/pages/Dashboard.tsx` — UI atual do dashboard (estado inicial a ser evoluido).
- `backend/modules/dashboard/services.py` — contrato de dados e calculos do dashboard.
- `backend/modules/dashboard/router.py` — endpoint `/api/dashboard`.
- `supabase/schema.sql` — estrutura da tabela `budgets` (`monthly_limit`) e tabelas relacionadas.

### Design system
- `src/shared/styles/theme.css` — tokens atuais de cores, fontes e estilos base.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `backend/modules/dashboard/services.py` ja entrega `kpis`, `trend`, `category_totals`, `comparison`, `recent_transactions`.
- `src/features/dashboard/pages/Dashboard.tsx` ja implementa filtros de periodo e renderizacao com Recharts.
- `src/shared/components/ui/*` ja tem Card, Button e padrao visual reutilizavel.

### Established Patterns
- Frontend React + Vite + Tailwind utilities.
- Backend FastAPI + services por modulo.
- Formato monetario em BRL vindo do backend (`format_brl`) e exibido no frontend.

### Integration Points
- O redesign de UI depende de ampliar payload em `/api/dashboard` para expor metricas orientadas a decisao (fluxo liquido, deltas por categoria, alertas e recomendacoes).
- Barra de orcamento depende de leitura da tabela `budgets` e cruzamento com gastos por categoria no periodo.

</code_context>

<deferred>
## Deferred Ideas

- Reconciliacao de saldo bancario de conta corrente (saldo anterior/saldo final do extrato) como produto separado de fluxo.
- Alertas WhatsApp proativos (ficam na trilha de fases de budget/coach).

</deferred>

---

*Phase: 06-dashboard-ui-ux-pro-max-fluxo-liquido-top-categorias-orcamento-por-categoria-alertas-acionaveis-e-cortes-recomendados*
*Context gathered: 2026-04-11*
