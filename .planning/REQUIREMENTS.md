# Requirements: FinCoach AI

**Defined:** 2026-04-05
**Core Value:** Classificação automática de gastos com IA + coach financeiro proativo que cutuca o usuário via WhatsApp para atingir metas

## v1 Requirements

### Authentication

- [x] **AUTH-01**: User can sign up with email and password
- [x] **AUTH-02**: User can log in and stay logged in across browser refresh
- [x] **AUTH-03**: User can log out from any page
- [x] **AUTH-04**: Each user can only see their own data (RLS enforced)

### Data Model

- [x] **DATA-01**: Database schema supports users, transactions, categories, budgets, and goals
- [ ] **DATA-02**: AI-generated simulated transactions populate the system for testing (realistic Brazilian merchant names)
- [x] **DATA-03**: Transactions have fields: amount, date, description, category, confidence_score, user_id

### AI Classification

- [ ] **AICL-01**: Transactions are automatically classified into categories via OpenAI through Make.com
- [ ] **AICL-02**: System includes Brazilian merchant name mapping (RCHLO → Riachuelo, Pag* → PagSeguro, etc.)
- [ ] **AICL-03**: Each classification includes a confidence score (high/medium/low)
- [ ] **AICL-04**: Low-confidence classifications are flagged for user review
- [ ] **AICL-05**: Users can create and manage custom categories
- [ ] **AICL-06**: Classification uses structured outputs (JSON schema) for reliability

### Dashboard

- [ ] **DASH-01**: User can view spending breakdown by category with charts
- [ ] **DASH-02**: User can view spending by time period (week, month)
- [ ] **DASH-03**: User can see spending trend charts over time
- [ ] **DASH-04**: User can compare current month vs previous month

### Budget and Alerts

- [ ] **BUDG-01**: User can set a spending limit per category
- [ ] **BUDG-02**: Dashboard shows visual progress of spending vs limit per category
- [ ] **BUDG-03**: User receives WhatsApp alert when spending exceeds category limit
- [ ] **BUDG-04**: User receives preventive WhatsApp alert at 80% of category limit

### AI Coach (WhatsApp)

- [ ] **COACH-01**: System generates monthly AI-powered spending insights in Portuguese
- [ ] **COACH-02**: User can create financial goals/plans (e.g., trip, emergency fund)
- [ ] **COACH-03**: System sends proactive WhatsApp reminders about goals at strategic times (Thu/Fri evening)
- [ ] **COACH-04**: Reminders are contextual and personalized (mention goal name, amount needed, deadline)
- [ ] **COACH-05**: Monthly insight summary sent via WhatsApp with key findings

### Integration

- [ ] **INTG-01**: Make.com receives webhook calls and orchestrates AI classification flow
- [ ] **INTG-02**: Make.com scheduled scenarios generate monthly insights
- [ ] **INTG-03**: Z-API integration sends WhatsApp messages for alerts and coaching
- [ ] **INTG-04**: Z-API health check before sending messages (detect disconnections)

## v2 Requirements

### Open Finance

- **OPEN-01**: Integration with Pluggy API to pull real bank transactions
- **OPEN-02**: Automatic daily sync of transactions from connected banks
- **OPEN-03**: Support for multiple bank accounts per user

### Advanced Auth

- **AAUTH-01**: Magic link login (passwordless)
- **AAUTH-02**: OAuth login with Google

### Social/Family

- **FAM-01**: Shared family dashboard view
- **FAM-02**: Household budget tracking

### Advanced Analytics

- **ANLYT-01**: Spending prediction based on historical patterns
- **ANLYT-02**: Anomaly detection (unusual spending flagged)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Manual transaction entry | Core value is automation, not "another spreadsheet" |
| Mobile native app | Streamlit web is sufficient for MVP validation |
| Multi-currency support | MVP is Brazil-only, BRL only |
| Investment tracking | Different domain, adds complexity without validating core hypothesis |
| Bill payments | Not a finance management feature, it's a banking feature |
| Gamification (badges, streaks) | Adds development time without validating the AI coaching hypothesis |
| Credit score integration | Requires partnerships and certifications beyond MVP scope |
| Social features (sharing, leaderboards) | Privacy-sensitive financial data shouldn't be social in v1 |
| Multiple languages | MVP is Portuguese-only for Brazilian market |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| DATA-01 | Phase 1 | Complete |
| DATA-02 | Phase 2 | Pending |
| DATA-03 | Phase 1 | Complete |
| AICL-01 | Phase 3 | Pending |
| AICL-02 | Phase 3 | Pending |
| AICL-03 | Phase 3 | Pending |
| AICL-04 | Phase 3 | Pending |
| AICL-05 | Phase 3 | Pending |
| AICL-06 | Phase 3 | Pending |
| DASH-01 | Phase 2 | Pending |
| DASH-02 | Phase 2 | Pending |
| DASH-03 | Phase 2 | Pending |
| DASH-04 | Phase 2 | Pending |
| BUDG-01 | Phase 4 | Pending |
| BUDG-02 | Phase 4 | Pending |
| BUDG-03 | Phase 4 | Pending |
| BUDG-04 | Phase 4 | Pending |
| COACH-01 | Phase 5 | Pending |
| COACH-02 | Phase 5 | Pending |
| COACH-03 | Phase 5 | Pending |
| COACH-04 | Phase 5 | Pending |
| COACH-05 | Phase 5 | Pending |
| INTG-01 | Phase 3 | Pending |
| INTG-02 | Phase 5 | Pending |
| INTG-03 | Phase 4 | Pending |
| INTG-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 30 total
- Mapped to phases: 30
- Unmapped: 0

---
*Requirements defined: 2026-04-05*
*Last updated: 2026-04-05 after roadmap creation*
