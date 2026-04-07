---
phase: quick-260407-jxx-implementar-testes-de-categorias-e-class
plan: "01"
type: execute
wave: 1
depends_on: []
files_modified:
  - tests/test_classifier.py
  - tests/test_categories.py
  - tests/test_transactions.py
  - src/data/classifier.py
  - src/data/categories.py
  - src/pages/transactions.py
autonomous: true
requirements:
  - AICL-01
  - AICL-02
  - AICL-03
  - AICL-04
  - AICL-05
  - AICL-06
  - INTG-01
must_haves:
  truths:
    - "Suite de classifier/categories/transactions roda sem skip e sem flaky."
    - "Comportamentos de classificacao, baixa confianca e CRUD de categorias ficam cobertos por testes automatizados."
    - "Se houver ajuste de codigo, ele e minimo e restrito ao que quebra os testes."
  artifacts:
    - path: "tests/test_classifier.py"
      provides: "Cobertura de payload, lookup, confidence, query e schema"
    - path: "tests/test_categories.py"
      provides: "Cobertura de add/rename/delete com regras de categoria padrao"
    - path: "tests/test_transactions.py"
      provides: "Cobertura do fluxo de CTA de classificacao e correcao inline"
  key_links:
    - from: "tests/test_transactions.py"
      to: "src/pages/transactions.py"
      via: "show_transactions() com mocks de Streamlit/Supabase"
      pattern: "show_transactions"
    - from: "tests/test_classifier.py"
      to: "src/data/classifier.py"
      via: "helpers e contrato de query idempotente"
      pattern: "category_id.is.null,confidence_score.is.null"
---

<objective>
Fechar coerencia de cobertura da fase 03 para classifier/categories/transactions e manter a suite verde.

Purpose: garantir que os comportamentos definidos nos planos 03-01/03-02/03-03 estejam protegidos por testes.
Output: testes reforcados + eventuais fixes minimos e acoplados.
</objective>

<execution_context>
@~/.copilot/get-shit-done/workflows/execute-plan.md
@~/.copilot/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/todos/completed/2026-04-07-implementar-testes-de-categorias-e-classificacao.md
@.planning/phases/03-ai-classification/03-01-PLAN.md
@.planning/phases/03-ai-classification/03-02-PLAN.md
@.planning/phases/03-ai-classification/03-03-PLAN.md
@src/data/classifier.py
@src/data/categories.py
@src/pages/transactions.py
@tests/test_classifier.py
@tests/test_categories.py
@tests/test_transactions.py
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Consolidar cobertura de classifier para contratos da fase 03</name>
  <files>tests/test_classifier.py, src/data/classifier.py</files>
  <behavior>
    - Trigger de classificacao cobre sucesso, timeout e erro generico.
    - Query de nao classificados preserva regra idempotente (per D-02).
    - Schema OpenAI e mapeamentos continuam com slugs e thresholds esperados (per D-10).
  </behavior>
  <action>Expandir `tests/test_classifier.py` com cenarios faltantes de `trigger_classification()` (httpx/post, classified_count fallback e mensagens de erro). Se algum teste novo falhar, ajustar somente `src/data/classifier.py` no menor diff possivel, mantendo decisao de disparo manual via botao (per D-01) e sem adicionar novas features.</action>
  <verify>
    <automated>python -m pytest tests/test_classifier.py -q</automated>
  </verify>
  <done>Classifier coberto ponta-a-ponta no nivel de unidade e arquivo segue verde.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Completar cobertura de categorias para regras de protecao e CRUD</name>
  <files>tests/test_categories.py, src/data/categories.py</files>
  <behavior>
    - Rename/delete validam escopo do usuario e bloqueio de default (per D-06).
    - Duplicidade e mensagens de erro permanecem consistentes.
  </behavior>
  <action>Adicionar testes para `rename_category` e `delete_category` cobrindo filtros esperados (`user_id`, `is_default=False`) e fluxos de erro. Se necessario, corrigir `src/data/categories.py` apenas para alinhar com o contrato existente da fase 03, sem ampliar escopo para UI.</action>
  <verify>
    <automated>python -m pytest tests/test_categories.py -q</automated>
  </verify>
  <done>Categorias possui cobertura de add/rename/delete coerente com regras da fase.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Fechar lacunas de transacoes e validar suite integrada</name>
  <files>tests/test_transactions.py, src/pages/transactions.py</files>
  <behavior>
    - Fluxo de feedback em session_state apos classificar esta coberto.
    - Correcao inline nao duplica update e ignora selecao invalida (per D-03 e D-11).
  </behavior>
  <action>Adicionar testes focados em comportamento de `show_transactions()` ainda nao exercitado (flash messages, guard de duplicidade e selecao invalida). Ajustar `src/pages/transactions.py` somente se algum teste revelar inconsistencia real. Finalizar com rodada conjunta dos tres arquivos de teste.</action>
  <verify>
    <automated>python -m pytest tests/test_classifier.py tests/test_categories.py tests/test_transactions.py -q</automated>
  </verify>
  <done>Suite alvo da fase 03 fica coerente e verde em execucao unica.</done>
</task>

</tasks>

<verification>
- `python -m pytest tests/test_classifier.py tests/test_categories.py tests/test_transactions.py -q` passa.
- Nenhum skip novo introduzido.
- Mudancas em codigo de producao (se houver) ficam restritas aos 3 modulos alvo.
</verification>

<success_criteria>
- Cobertura de comportamentos da fase 03 (classifier/categories/transactions) fica consistente com os planos 03-01/02/03.
- Suite alvo permanece green de forma repetivel.
- Escopo respeitado: testes + fixes estritamente acoplados.
</success_criteria>

<output>
After completion, create `.planning/quick/260407-jxx-implementar-testes-de-categorias-e-class/260407-jxx-SUMMARY.md`
</output>
