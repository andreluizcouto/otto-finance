# Phase 2: Data & Dashboard - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-05
**Phase:** 02-data-dashboard
**Areas discussed:** Dados simulados, Layout do dashboard, Graficos de categoria, Filtros e comparacao

---

## Dados simulados

| Option | Description | Selected |
|--------|-------------|----------|
| Botao no app (Recomendado) | Botao na pagina de Configuracoes que gera dados fake com um clique | :heavy_check_mark: |
| Script Python separado | Rodar `python seed_data.py` no terminal | |
| Automatico no primeiro login | Detecta usuario sem transacoes e popula automaticamente | |

**User's choice:** Botao no app
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| 3 meses (Recomendado) | Suficiente para tendencias e comparacao mensal | :heavy_check_mark: |
| 6 meses | Mais historico para graficos de tendencia | |
| 1 mes | Minimo viavel, sem tendencias | |

**User's choice:** 3 meses
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Alto realismo (Recomendado) | Merchants brasileiros reais, valores coerentes por categoria | :heavy_check_mark: |
| Realismo basico | Nomes genericos do Faker pt_BR, valores aleatorios | |

**User's choice:** Alto realismo
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Sim, botao de limpar + gerar (Recomendado) | Botao 'Limpar dados' nas Configuracoes, permite regerar | :heavy_check_mark: |
| Gerar apenas uma vez | Botao desabilitado apos uso | |
| Voce decide | Claude escolhe | |

**User's choice:** Botao de limpar + gerar
**Notes:** —

---

## Layout do dashboard

| Option | Description | Selected |
|--------|-------------|----------|
| Sim, 3-4 KPI cards (Recomendado) | Total gasto, No transacoes, Categoria mais cara, Gasto medio/dia | :heavy_check_mark: |
| Sem KPI cards | Direto pros graficos | |
| Voce decide | Claude define | |

**User's choice:** 3-4 KPI cards
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Tudo em uma pagina com scroll (Recomendado) | KPIs -> Categorias -> Tendencia -> Comparacao -> Tabela | :heavy_check_mark: |
| Tabs por secao | Abas: Visao Geral, Tendencias, Transacoes | |
| Apenas graficos, sem tabela | Foco visual, transacoes em pagina separada | |

**User's choice:** Tudo em uma pagina com scroll
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Sim, ultimas 10-20 transacoes (Recomendado) | Tabela com data, merchant, categoria, valor | :heavy_check_mark: |
| Nao, so graficos | Transacoes individuais em pagina futura | |
| Voce decide | Claude define | |

**User's choice:** Ultimas 10-20 transacoes
**Notes:** —

---

## Graficos de categoria

| Option | Description | Selected |
|--------|-------------|----------|
| Donut chart (Recomendado) | Anel com total no centro, cores hex da Phase 1 | :heavy_check_mark: |
| Barras horizontais | Barra por categoria, ordenado do maior gasto | |
| Treemap | Retangulos proporcionais ao valor | |

**User's choice:** Donut chart
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Grafico de linha (Recomendado) | Linha de gastos totais por semana/mes | :heavy_check_mark: |
| Barras empilhadas | Barras por mes com cores das categorias | |
| Area chart | Area preenchida por categoria, empilhada | |

**User's choice:** Grafico de linha
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Barras lado a lado (Recomendado) | Azul (atual) vs cinza (anterior), agrupadas por categoria | :heavy_check_mark: |
| KPI cards com setas | Valor + seta + % de mudanca nos cards | |
| Tabela comparativa | Colunas: Categoria, Mes anterior, Mes atual, Variacao % | |

**User's choice:** Barras lado a lado
**Notes:** —

---

## Filtros e comparacao

| Option | Description | Selected |
|--------|-------------|----------|
| Selectbox com periodos fixos (Recomendado) | Dropdown: Esta semana, Este mes, Ultimos 3 meses | :heavy_check_mark: |
| Tabs de periodo | Abas clicaveis: Semana, Mes, 3 Meses | |
| Date picker customizado | Usuario escolhe data inicio/fim | |

**User's choice:** Selectbox com periodos fixos
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Filtro global no topo (Recomendado) | Um unico selectbox controla todos os graficos e KPIs | :heavy_check_mark: |
| Filtro por grafico | Cada secao tem seu proprio filtro | |

**User's choice:** Filtro global no topo
**Notes:** —

---

## Claude's Discretion

- Design exato dos KPI cards
- Formatacao de valores monetarios
- Quantidade exata de transacoes por mes no gerador
- Loading states
- Paleta de cores dos graficos de tendencia e comparacao

## Deferred Ideas

None — discussion stayed within phase scope
