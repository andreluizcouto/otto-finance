---
phase: quick-260407-jai-implementar-modulo-de-categorias
plan: "01"
type: execute
wave: 1
depends_on: []
files_modified:
  - src/data/categories.py
  - src/pages/settings.py
  - tests/test_categories.py
autonomous: true
requirements:
  - AICL-05
must_haves:
  truths:
    - "Usuario consegue ver a secao 'Categorias' em Configuracoes, entre 'Dados de Teste' e 'Sessao'."
    - "Usuario consegue adicionar categoria customizada com nome, cor e emoji."
    - "Usuario consegue renomear e excluir apenas categorias customizadas; categoria padrao nao pode ser excluida."
    - "Tentativa de adicionar nome duplicado retorna erro e nao grava no banco."
  artifacts:
    - path: "src/data/categories.py"
      provides: "CRUD de categorias com validacao de duplicidade e regra de padrao"
      exports: ["get_all_categories", "add_category", "rename_category", "delete_category"]
    - path: "src/pages/settings.py"
      provides: "UI de categorias no Settings conforme 03-UI-SPEC"
      contains: "st.header(\"Categorias\")"
    - path: "tests/test_categories.py"
      provides: "Cobertura automatizada de add_category"
      contains: "test_add_duplicate, test_add_category"
  key_links:
    - from: "src/pages/settings.py"
      to: "src/data/categories.py"
      via: "imports e chamadas add/rename/delete/get"
      pattern: "from src.data.categories import"
    - from: "src/data/categories.py"
      to: "Supabase categories table"
      via: "client.table(\"categories\")"
      pattern: "table\\(\"categories\"\\)"
---

<objective>
Implementar o modulo de categorias de forma atomica para satisfazer AICL-05 no escopo rapido.

Purpose: Habilitar CRUD de categorias no Settings com regras de categoria padrao e validacao de nome duplicado.
Output: modulo `src/data/categories.py`, secao `Categorias` em `settings.py`, e testes de categorias ativos e verdes.
</objective>

<execution_context>
@~/.copilot/get-shit-done/workflows/execute-plan.md
@~/.copilot/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/todos/completed/2026-04-07-implementar-modulo-de-categorias.md
@.planning/phases/03-ai-classification/03-03-PLAN.md
@.planning/phases/03-ai-classification/03-UI-SPEC.md
@src/pages/settings.py
@tests/test_categories.py
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Implementar contrato de dados de categorias (AICL-05)</name>
  <files>src/data/categories.py, tests/test_categories.py</files>
  <behavior>
    - Teste 1: add_category retorna success=False e nao chama insert quando nome duplicado (case-insensitive).
    - Teste 2: add_category gera slug com underscore, define is_default=False, preserva user_id e aplica emoji fallback "🏷️".
    - Teste 3: rename/delete devem operar somente em categorias do usuario (filtro user_id) e nunca em categoria padrao por regra de negocio.
  </behavior>
  <action>Criar `src/data/categories.py` com `get_all_categories`, `add_category`, `rename_category`, `delete_category` usando `client.table("categories")`. Em `add_category`, aplicar `strip`, validar vazio, checar duplicidade com `ilike`, gerar slug, fallback de emoji e retorno padrao `{success, error}` no estilo do projeto. Em `tests/test_categories.py`, remover `skip` dos testes existentes e ajustar apenas o minimo necessario para refletir o contrato final per AICL-05.</action>
  <verify>
    <automated>python -m pytest tests/test_categories.py -q</automated>
  </verify>
  <done>Modulo de dados existe com funcoes exportadas, testes de categorias executam sem skip e passam.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Integrar CRUD de categorias na pagina de configuracoes</name>
  <files>src/pages/settings.py</files>
  <behavior>
    - Secao "Categorias" aparece entre "Dados de Teste" e "Sessao" (per UI-SPEC e plano 03-03).
    - Categorias padrao exibem botao Excluir desabilitado com tooltip "Categoria padrao — nao pode ser removida".
    - Fluxo de exclusao de categoria customizada exige confirmacao antes de deletar.
    - Fluxo de renomear e adicionar mostra feedback de sucesso/erro em pt-BR.
  </behavior>
  <action>Importar funcoes de `src.data.categories` e inserir secao de UI de categorias em `show_settings()` exatamente no bloco esperado pelo 03-UI-SPEC: listagem (emoji/nome/cor), adicionar, renomear inline e excluir com confirmacao. Reutilizar padrao de session_state + rerun ja usado na tela (per D-06/AICL-05), sem alterar os fluxos existentes de Conta, Dados de Teste e Sessao.</action>
  <verify>
    <automated>python -m pytest tests/test_categories.py -q && python -m pytest tests -q -k categories</automated>
  </verify>
  <done>Settings possui secao Categorias funcional, conectada ao modulo de dados e alinhada aos textos/estados definidos no 03-UI-SPEC.</done>
</task>

</tasks>

<verification>
- `python -m pytest tests/test_categories.py -q` passa.
- `python -m pytest tests -q -k categories` passa.
- Revisao de codigo confirma strings obrigatorias do UI-SPEC na secao Categorias.
</verification>

<success_criteria>
- AICL-05 coberto com CRUD de categorias no Settings.
- Nao existe exclusao de categoria padrao via UI.
- Duplicidade de nome e nome vazio retornam erro amigavel.
- Testes de categorias estao ativos (sem skip) e verdes.
</success_criteria>

<output>
After completion, create `.planning/quick/260407-jai-implementar-modulo-de-categorias/260407-jai-SUMMARY.md`
</output>
