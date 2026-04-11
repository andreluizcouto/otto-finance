# Roadmap: FinCoach AI

## Overview

FinCoach AI progresses from secure foundation through data and AI capabilities to proactive WhatsApp coaching. Phase 1 establishes authentication and database schema with RLS. Phase 2 populates simulated data and delivers the visual dashboard. Phase 3 integrates AI-powered transaction classification via Make.com and OpenAI. Phase 4 adds budget management with WhatsApp alerts, proving the messaging pipeline. Phase 5 layers on AI-generated insights and financial goal coaching via WhatsApp -- the core product differentiator.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Supabase Auth, database schema with RLS, and Streamlit app skeleton
- [ ] **Phase 2: Data & Dashboard** - Simulated transactions and interactive spending dashboard
- [ ] **Phase 3: AI Classification** - Automatic transaction categorization via OpenAI and Make.com
- [ ] **Phase 4: Budgets & WhatsApp Alerts** - Category budget tracking with WhatsApp overspending alerts
- [ ] **Phase 5: AI Coach & Goals** - AI-generated insights and proactive goal coaching via WhatsApp

## Phase Details

### Phase 1: Foundation
**Goal**: Users can securely access their own data in a functional app shell
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, DATA-01, DATA-03
**Success Criteria** (what must be TRUE):
  1. User can create an account with email and password and land on a dashboard page
  2. User can log in, close the browser, reopen it, and still be logged in
  3. User can log out from any page in the app
  4. Two different users each see only their own data (verified with test accounts)
  5. Database tables for transactions, categories, budgets, and goals exist with correct fields
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md -- Database schema with RLS, auth module, project scaffolding
- [x] 01-02-PLAN.md -- Streamlit app shell with login, navigation, dashboard, settings
**UI hint**: yes

### Phase 2: Data & Dashboard
**Goal**: Users can see realistic spending data visualized in an interactive dashboard
**Depends on**: Phase 1
**Requirements**: DATA-02, DASH-01, DASH-02, DASH-03, DASH-04
**Success Criteria** (what must be TRUE):
  1. User can generate simulated transactions with realistic Brazilian merchant names and amounts
  2. User can view a spending breakdown by category as a chart (pie or bar)
  3. User can filter spending view by time period (this week, this month)
  4. User can see spending trend lines over multiple months
  5. User can compare current month vs previous month spending side by side
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md -- Authenticated Supabase client, Plotly chart builders, Wave 0 test infrastructure
- [x] 02-02-PLAN.md -- Transaction generator with Brazilian merchants, Settings page data management UI
- [x] 02-03-PLAN.md -- Full interactive dashboard (KPIs, donut, trend, comparison, table, filter)
**UI hint**: yes

### Phase 3: AI Classification
**Goal**: Transactions are automatically and reliably classified into spending categories by AI
**Depends on**: Phase 2
**Requirements**: AICL-01, AICL-02, AICL-03, AICL-04, AICL-05, AICL-06, INTG-01
**Success Criteria** (what must be TRUE):
  1. New transactions are automatically classified into categories via the Make.com-to-OpenAI pipeline
  2. Cryptic Brazilian merchant names (e.g., RCHLO, Pag*) are correctly mapped and classified
  3. Each classified transaction shows a confidence indicator (high/medium/low) in the UI
  4. Low-confidence classifications appear in a review queue where the user can correct them
  5. User can create, rename, and delete custom spending categories
**Plans**: 4 plans

Plans:
- [x] 03-00-PLAN.md -- Wave 0: test stubs (test_classifier.py, test_categories.py) + manually_reviewed schema step
- [x] 03-01-PLAN.md -- Wave 1: classifier.py helpers + config.get_make_webhook_url() + Make.com setup docs
- [x] 03-02-PLAN.md -- Wave 2a: Transactions page (classify CTA + inline low-confidence correction + nav wiring)
- [x] 03-03-PLAN.md -- Wave 2b: Category CRUD (categories.py + Settings Categorias section)
**UI hint**: yes

### Phase 03.1: PDF Import (INSERTED)

**Goal:** Users can upload a bank statement PDF from the Transactions page and have transactions extracted by AI and saved automatically to their account
**Requirements**: PDF-01, PDF-02, PDF-03
**Depends on:** Phase 3
**Plans:** 2/2 plans complete

Plans:
- [x] 03.1-01-PLAN.md -- Backend: auth on analyze-pdf + /api/transactions/import endpoint with deduplication
- [x] 03.1-02-PLAN.md -- Frontend: ImportPdfModal component + wire Importar button in Transactions page

### Phase 4: Budgets & WhatsApp Alerts
**Goal**: Users can set spending limits and receive WhatsApp alerts when approaching or exceeding them
**Depends on**: Phase 3
**Requirements**: BUDG-01, BUDG-02, BUDG-03, BUDG-04, INTG-03, INTG-04
**Success Criteria** (what must be TRUE):
  1. User can set a monthly spending limit for any category
  2. Dashboard shows a visual progress bar (green/yellow/red) for each budget category
  3. User receives a WhatsApp message when spending reaches 80% of a category limit
  4. User receives a WhatsApp message when spending exceeds a category limit
  5. System checks Z-API connection health before attempting to send messages
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
**UI hint**: yes

### Phase 5: AI Coach & Goals
**Goal**: Users receive proactive AI-powered financial coaching and goal reminders via WhatsApp
**Depends on**: Phase 4
**Requirements**: COACH-01, COACH-02, COACH-03, COACH-04, COACH-05, INTG-02
**Success Criteria** (what must be TRUE):
  1. User receives a monthly AI-generated spending insight summary via WhatsApp in Portuguese (e.g., "Voce gastou 30% mais em delivery este mes")
  2. User can create a financial goal with name, target amount, and deadline in the app
  3. User receives WhatsApp reminders about their goals at strategic times (Thursday/Friday evenings)
  4. Goal reminders are personalized -- they mention the goal name, progress, amount remaining, and deadline
  5. Monthly insight summary sent via WhatsApp with key findings
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/2 | Planning complete | - |
| 2. Data & Dashboard | 0/3 | Planning complete | - |
| 3. AI Classification | 0/4 | Planning complete | - |
| 3.1. PDF Import | 0/2 | Planning complete | - |
| 4. Budgets & WhatsApp Alerts | 0/0 | Not started | - |
| 5. AI Coach & Goals | 0/0 | Not started | - |

### Phase 6: Dashboard UI/UX pro max: fluxo liquido, top categorias, orcamento por categoria, alertas acionaveis e cortes recomendados

**Goal:** Dashboard orientado a decisao financeira, deixando claro se o usuario melhora ou piora no periodo, onde exagera e quais cortes priorizar
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, BUDG-02, COACH-01
**Depends on:** Phase 5
**Plans:** 2 plans

Plans:
- [x] 06-01-PLAN.md -- Backend: contrato analitico de fluxo, exageros por categoria, progresso de orcamento, alertas e cortes recomendados
- [x] 06-02-PLAN.md -- Frontend: redesign do dashboard para responder 3 perguntas de decisao com linguagem acionavel
