# FinCoach AI

## What This Is

Um assistente financeiro pessoal com IA que automatiza o controle de gastos, classifica transações inteligentemente, gera insights sobre hábitos de consumo e atua como um coach financeiro proativo — enviando lembretes e cutucadas via WhatsApp para ajudar o usuário a atingir suas metas. Diferente de planilhas e apps genéricos, o objetivo é ser um "Pierre" acessível para amigos, família e, eventualmente, um público maior.

## Core Value

Classificação automática de gastos com IA + coach financeiro proativo que cutuca o usuário via WhatsApp para atingir metas — sem esforço manual.

## Requirements

### Validated

- [x] PDF import flow on Transactions page with modal upload UX and import feedback toast (validated in Phase 03.1: PDF Import)
- [x] Authenticated backend ingestion for PDF extraction + transaction import endpoints (validated in Phase 03.1: PDF Import)
- [x] Duplicate transaction protection during PDF imports with imported/skipped counters (validated in Phase 03.1: PDF Import)

### Active

- [ ] Autenticação individual via Supabase Auth (cada usuário vê só seus dados)
- [ ] Dados de transações simulados por IA para testes do MVP (custo zero)
- [ ] Classificação automática de gastos usando OpenAI via Make.com
- [ ] Dashboard Streamlit com visão de gastos por categoria, período e tendências
- [ ] Insights mensais gerados por IA ("você gastou 30% mais em delivery este mês")
- [ ] Sistema de orçamento por categoria com acompanhamento visual
- [ ] Alertas quando o usuário ultrapassa limites de gasto por categoria
- [ ] Metas/planos financeiros (ex: viagem) com lembretes proativos via WhatsApp
- [ ] Lembretes contextuais via Z-API/WhatsApp em horários estratégicos (ex: quinta/sexta à noite)
- [ ] Integração Make.com como backend de orquestração (webhooks, chamadas OpenAI, processamento)

### Out of Scope

- Integração Open Finance / Pluggy — adiada para v2 após validação do conceito com dados simulados
- App mobile nativo — Streamlit web é suficiente para o MVP
- Entrada manual de gastos — o diferencial é automação, não "mais uma planilha"
- Múltiplos idiomas — MVP somente em português
- Sistema de pagamentos/assinaturas — MVP gratuito para teste

## Context

- O usuário já possui um projeto no Make.com que vasculha emails de fatura, desbloqueia PDFs com senha e traduz os dados para uma planilha Google Sheets. Esse fluxo será substituído pelo novo sistema com Supabase como destino.
- Z-API será usada para envio de mensagens WhatsApp (API brasileira, boa integração com Make.com).
- Supabase será usado tanto para banco de dados (PostgreSQL) quanto para autenticação (Auth).
- O MVP usará dados simulados/fake gerados por IA para testar todas as funcionalidades sem custo de integração bancária.
- O app precisa ter qualidade de demo para apresentação a potenciais investidores.

## Constraints

- **Tech Stack**: Python (Streamlit) + Make.com (webhooks/automação) + Supabase (DB/Auth) + Z-API (WhatsApp) + OpenAI (IA) — escolha do usuário, não negociável
- **Custo**: MVP deve ter custo mínimo — dados simulados, sem APIs pagas de Open Finance
- **Experiência Supabase**: Usuário tem conhecimento mínimo — setup deve ser guiado e simples
- **Público MVP**: 5-10 pessoas (usuário + amigos + família)
- **Qualidade demo**: Precisa estar apresentável para potenciais investidores

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Streamlit como interface | Mais rápido para prototipar dashboard com Python, amigável para não-devs | — Pending |
| Dados simulados no MVP | Custo zero, permite testar toda a experiência sem depender de Open Finance | — Pending |
| Z-API para WhatsApp | API brasileira confiável, boa integração com Make.com, custo acessível | — Pending |
| Make.com como backend | Usuário já conhece e tem projeto existente, evita backend server tradicional | — Pending |
| Substituir planilha pelo Supabase | App é o destino final dos dados, planilha fica obsoleta | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

## Current State

Phase 03.1 complete: PDF import is available from the Transactions page, integrated with authenticated backend extraction/import endpoints, and refreshes the list after successful import.

---
*Last updated: 2026-04-09 after Phase 03.1 completion*
