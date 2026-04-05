---
phase: 01-foundation
plan: 02
subsystem: ui, auth
tags: [streamlit, streamlit-option-menu, css, navigation, login, signup, dark-theme, portuguese]

# Dependency graph
requires:
  - phase: 01-01
    provides: "Supabase auth module (sign_up, sign_in, sign_out, is_authenticated, get_current_user) and config module"
provides:
  - "Streamlit app entry point with auth-gated routing and page config"
  - "Login/signup page with form validation, mode toggling, and Portuguese copy"
  - "Sidebar navigation via streamlit-option-menu with Dashboard and Configuracoes"
  - "Dashboard placeholder page with styled card"
  - "Settings page with account info display and logout"
  - "Custom CSS module with Inter font, dark theme overrides, and component styles"
affects: [02-dashboard, 03-ai-classification, 04-budgets, 05-goals]

# Tech tracking
tech-stack:
  added: [streamlit-option-menu]
  patterns: [auth-gate-with-st-stop, sidebar-navigation-routing, css-injection-via-st-markdown, form-based-auth-ui]

key-files:
  created:
    - app.py
    - src/ui/__init__.py
    - src/ui/styles.py
    - src/pages/__init__.py
    - src/pages/login.py
    - src/pages/dashboard.py
    - src/pages/settings.py
    - src/navigation.py
  modified:
    - src/auth.py

key-decisions:
  - "Auth gate uses st.stop() after login page to prevent sidebar and protected content from rendering for unauthenticated users"
  - "Navigation uses streamlit-option-menu for professional sidebar with icons, matching dark theme colors"
  - "Login and signup share one page with mode toggling via st.session_state['auth_mode']"
  - "sign_up handles Supabase email confirmation flow (needs_confirmation flag) instead of silently failing"
  - "All user-facing copy in Portuguese (pt-BR) matching UI-SPEC Copywriting Contract"

patterns-established:
  - "Auth gate pattern: is_authenticated() check at top of app.py, show_login_page() + st.stop() for unauthenticated users"
  - "Page routing pattern: show_sidebar() returns selected page name, app.py routes via if/elif"
  - "CSS injection pattern: inject_custom_css() called once at app entry point, all styles in src/ui/styles.py"
  - "Form pattern: st.form() groups inputs and submit button to prevent re-runs on keystroke"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, DATA-01]

# Metrics
duration: ~30min
completed: 2026-04-05
---

# Phase 1 Plan 2: App Shell Summary

**Streamlit app shell with login/signup flow, sidebar navigation via streamlit-option-menu, dashboard placeholder, and settings page -- all with dark theme and Portuguese copy**

## Performance

- **Duration:** ~30 min (across multiple sessions including human verification)
- **Started:** 2026-04-05
- **Completed:** 2026-04-05
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 9

## Accomplishments
- Complete login/signup page with form validation, mode toggling, spinners, and Portuguese error messages -- integrates with Supabase Auth via the auth module from Plan 01
- Sidebar navigation using streamlit-option-menu with Dashboard and Configuracoes items, app branding, user email display, and logout button
- Auth-gated app entry point (app.py) where unauthenticated users see only the login page (no sidebar) and authenticated users get full navigation
- Custom CSS module with Inter font, dark theme component styles (.login-container, .placeholder-card, .sidebar-brand, .logout-btn)
- Settings page showing user email, membership date, and red-outlined logout button
- Dashboard placeholder with styled card ready for Phase 2 chart content
- Signup flow handles Supabase email confirmation (returns needs_confirmation flag)

## Task Commits

Each task was committed atomically:

1. **Task 1: Custom CSS, login/signup page, and navigation module** - `d5e0c13` (feat)
2. **Task 2: Dashboard page, settings page, and app entry point with auth routing** - `f89eecf` (feat)
3. **Task 3: Verify complete auth flow and app navigation** - human-verify checkpoint (approved)

**Additional fix:** `1ed2227` (fix) - Handle Supabase email confirmation in signup flow

## Files Created/Modified
- `app.py` - Streamlit entry point with st.set_page_config, CSS injection, auth gate, and page routing
- `src/ui/__init__.py` - Package marker (empty)
- `src/ui/styles.py` - inject_custom_css() with Inter font, dark theme colors, component styles
- `src/pages/__init__.py` - Package marker (empty)
- `src/pages/login.py` - show_login_page() with login/signup form toggling, validation, and auth calls
- `src/pages/dashboard.py` - show_dashboard() with placeholder card in Portuguese
- `src/pages/settings.py` - show_settings() with account info, membership date, and logout
- `src/navigation.py` - show_sidebar() with streamlit-option-menu, branding, email, and logout
- `src/auth.py` - Modified sign_up() to handle email confirmation flow (needs_confirmation flag)

## Decisions Made
- Auth gate uses st.stop() after login page -- prevents sidebar and all protected content from rendering for unauthenticated users
- Navigation uses streamlit-option-menu for professional icon-based sidebar matching the dark theme
- Login and signup share a single page with mode toggling via st.session_state["auth_mode"] -- simpler than separate pages
- sign_up() handles Supabase email confirmation (when enabled) by returning needs_confirmation instead of silently failing
- All visible text in Portuguese (pt-BR): "Entrar", "Criar conta", "Sair", "Configuracoes", "Seus dados financeiros aparecerao aqui"

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Handle Supabase email confirmation in signup flow**
- **Found during:** Task 3 (human verification)
- **Issue:** When Supabase has email confirmation enabled, sign_up() returned a user object but no session -- the app would silently fail to log in after signup
- **Fix:** Modified sign_up() to detect the confirmation-required case and return a needs_confirmation flag with appropriate success message
- **Files modified:** src/auth.py, src/pages/login.py
- **Verification:** User confirmed signup works correctly with confirmation flow
- **Committed in:** 1ed2227

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Essential fix for Supabase email confirmation compatibility. No scope creep.

## Issues Encountered

None beyond the email confirmation fix documented above.

## User Setup Required

**External services configured during Plan 01.** No additional setup required for this plan. The user already has:
- Supabase project with schema and seed data
- .env file with SUPABASE_URL and SUPABASE_ANON_KEY
- requirements.txt installed

## Next Phase Readiness
- Complete app shell ready for Phase 2 dashboard content (charts, data visualization)
- Dashboard placeholder card can be replaced with Plotly charts and spending summaries
- Navigation already includes the two main sections (Dashboard, Configuracoes)
- Auth flow fully functional -- new features just need to be added as pages or dashboard content
- Settings page has "Mais opcoes em breve" placeholder for future settings

## Known Stubs
- `src/pages/dashboard.py` line ~8: Placeholder card with text "Seus dados financeiros aparecerao aqui" -- intentional, will be replaced in Phase 2 (Data & Dashboard) with actual charts and spending data
- `src/pages/settings.py` line ~26: "Mais opcoes em breve" text -- intentional placeholder for future settings options

These stubs are intentional design decisions for the MVP app shell. The dashboard placeholder is explicitly the goal of this plan (create the skeleton), and Phase 2 will populate it with real content.

## Self-Check: PASSED

All 9 files verified present. All 3 task commits (d5e0c13, f89eecf, 1ed2227) verified in git log.

---
*Phase: 01-foundation*
*Completed: 2026-04-05*
