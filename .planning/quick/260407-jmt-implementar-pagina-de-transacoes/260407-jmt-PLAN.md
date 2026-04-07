---
phase: quick-260407-jmt-implementar-pagina-de-transacoes
plan: "01"
type: execute
wave: 1
depends_on: []
files_modified:
  - src/pages/transactions.py
  - src/navigation.py
  - src/ui/styles.py
  - app.py
autonomous: true
requirements:
  - AICL-01
  - AICL-03
  - AICL-04
  - INTG-01
must_haves:
  truths:
    - "Usuario ve a pagina 'Transacoes' no menu lateral entre Dashboard e Configuracoes."
    - "Usuario consegue clicar em 'Classificar transacoes nao classificadas' e disparar classificacao via Make.com."
    - "Tabela exibe coluna de confianca e permite correcao inline apenas para linhas de baixa confianca."
    - "Ao corrigir uma linha, categoria e estado de revisao sao persistidos e a linha deixa de aparecer como baixa confianca."
  artifacts:
    - path: "src/pages/transactions.py"
      provides: "Pagina de transacoes com CTA de classificacao, tabela e revisao inline"
      exports: ["show_transactions"]
    - path: "src/navigation.py"
      provides: "Item Transacoes no sidebar"
      contains: "Transacoes"
    - path: "app.py"
      provides: "Roteamento para show_transactions()"
      contains: "elif selected == \"Transacoes\""
    - path: "src/ui/styles.py"
      provides: "Estilos da pagina de transacoes"
      contains: ".classify-btn, .confidence-badge-low, .transactions-container"
  key_links:
    - from: "src/pages/transactions.py"
      to: "src/data/classifier.py"
      via: "trigger_classification(client, user_id)"
      pattern: "trigger_classification"
    - from: "src/pages/transactions.py"
      to: "Supabase transactions table"
      via: "update de category_id/confidence_score/manually_reviewed"
      pattern: "table\\(\"transactions\"\\)\\.update"
    - from: "src/navigation.py"
      to: "app.py"
      via: "valor selecionado no sidebar"
      pattern: "selected == \"Transacoes\""
---

<objective>
Implementar a pagina de transacoes completa (UI + integracao + navegacao) no padrao existente de Streamlit.

Purpose: Entregar o fluxo principal da fase 03-02 para classificacao AI e revisao manual.
Output: pagina funcional em `src/pages/transactions.py`, com estilos e roteamento ativos.
</objective>

<execution_context>
@~/.copilot/get-shit-done/workflows/execute-plan.md
@~/.copilot/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/todos/completed/2026-04-07-implementar-pagina-de-transacoes.md
@.planning/phases/03-ai-classification/03-02-PLAN.md
@.planning/phases/03-ai-classification/03-UI-SPEC.md
@src/navigation.py
@src/pages/dashboard.py
@src/data/classifier.py
@tests/test_classifier.py
@src/ui/styles.py
@app.py

<interfaces>
From src/data/classifier.py:
```python
def trigger_classification(client: Any, user_id: str) -> dict[str, Any]
def get_unclassified_transactions(client: Any, user_id: str) -> list[dict[str, Any]]
```

From src/navigation.py:
```python
def show_sidebar() -> str
```

From src/pages/dashboard.py pattern:
```python
user = get_current_user()
if not user:
    st.error(...)
    return
client = get_authenticated_client()
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Criar pagina base de Transacoes com CTA de classificacao</name>
  <files>src/pages/transactions.py</files>
  <behavior>
    - Teste 1: Botao "Classificar transacoes nao classificadas" aparece e fica desabilitado quando nao ha itens pendentes (per D-01 e D-02).
    - Teste 2: Clique no botao chama `trigger_classification`, mostra spinner e feedback de sucesso/erro com copy do UI-SPEC (per AICL-01 e INTG-01).
    - Teste 3: Empty state mostra "Nenhuma transacao encontrada" quando nao existem transacoes.
  </behavior>
  <action>Implementar `show_transactions()` seguindo o fluxo de `src/pages/dashboard.py`: carregar user/client, buscar contagem de pendentes com filtro `.or_("category_id.is.null,confidence_score.is.null").eq("manually_reviewed", False)` (per D-02), renderizar CTA com texto exato do UI-SPEC (per D-01), chamar `trigger_classification()` e persistir mensagem em `st.session_state` antes de `st.rerun()`. Nao criar pagina separada de revisao (per D-04).</action>
  <verify>
    <automated>python -m pytest tests/test_classifier.py -q</automated>
  </verify>
  <done>`src/pages/transactions.py` existe com `show_transactions`, CTA funcional e integracao com classificador ativa.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Implementar tabela de transacoes com confianca e correcao inline</name>
  <files>src/pages/transactions.py</files>
  <behavior>
    - Teste 1: Tabela exibe colunas Data, Descricao, Merchant, Categoria, Valor, Confianca, Corrigir (per AICL-03).
    - Teste 2: Apenas linhas low confidence mostram "? Baixa" e campo de correcao (per D-10 e D-11).
    - Teste 3: Ao corrigir, aplica update em `transactions` com `category_id`, `confidence_score="high"` e `manually_reviewed=True` (per AICL-04 e D-03).
  </behavior>
  <action>Na mesma pagina, carregar transacoes + categorias, montar DataFrame para `st.data_editor` com `SelectboxColumn` na coluna Corrigir só para linhas low-confidence, e aplicar PATCH na Supabase na mudanca. Incluir guard `st.session_state["corrected_ids"]` para evitar updates duplicados em reruns (per 03-02). Manter copy do UI-SPEC para aviso/correcao.</action>
  <verify>
    <automated>python -m pytest tests/test_classifier.py -q && python -m pytest tests -q -k classifier</automated>
  </verify>
  <done>Revisao inline de baixa confianca funciona e altera estado da transacao para revisada.</done>
</task>

<task type="auto">
  <name>Task 3: Conectar navegacao e estilos da pagina de Transacoes</name>
  <files>src/navigation.py, app.py, src/ui/styles.py</files>
  <action>Atualizar sidebar para incluir "Transacoes" entre Dashboard e Configuracoes com icone `bi-list-ul` (per UI-SPEC). Em `app.py`, importar e rotear `show_transactions()` nesse novo branch. Em `src/ui/styles.py`, adicionar classes `.classify-btn`, `.confidence-badge-low` e `.transactions-container` conforme contrato visual de 03-UI-SPEC.</action>
  <verify>
    <automated>python -m pytest tests -q</automated>
  </verify>
  <done>Pagina Transacoes aparece no app com roteamento e estilos aplicados corretamente.</done>
</task>

</tasks>

<verification>
- `python -m pytest tests -q` passa sem regressao.
- Inspecao de codigo confirma textos/copys obrigatorios do UI-SPEC na pagina de transacoes.
- Navegacao mostra "Transacoes" no lugar definido.
</verification>

<success_criteria>
- Requisitos AICL-01, AICL-03, AICL-04 e INTG-01 cobertos no mesmo fluxo de tela.
- Classificacao e revisao manual ocorrem na pagina `Transacoes`, sem pagina extra.
- Correcao manual impede reprocessamento da mesma linha como baixa confianca.
</success_criteria>

<output>
After completion, create `.planning/quick/260407-jmt-implementar-pagina-de-transacoes/260407-jmt-SUMMARY.md`
</output>
