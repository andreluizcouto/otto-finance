---
phase: quick
plan: 260407-uvw
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/components/layout/Sidebar.tsx
  - src/app/pages/Login.tsx
  - src/app/pages/Welcome.tsx
  - src/app/pages/Dashboard.tsx
  - src/app/pages/Transactions.tsx
  - src/app/pages/Categories.tsx
  - src/app/pages/Goals.tsx
  - src/app/pages/Settings.tsx
  - src/app/pages/Onboarding1.tsx
  - src/app/pages/Onboarding2.tsx
  - src/app/pages/Onboarding3.tsx
  - src/app/App.tsx
autonomous: true
requirements: []

must_haves:
  truths:
    - "Logout funciona: POST /api/auth/logout com Bearer, limpa token, redireciona /login"
    - "Botoes Google/Apple mostram toast 'Em breve' e estado loading sem duplo clique"
    - "Categories usa apiFetch (porta 8000) para DELETE — nunca mais localhost:8001"
    - "Navegacao Dashboard: 'Ver todas' vai para /transactions, QuickActions navegam para rota correta"
    - "Goals: 'Ignorar' remove do estado local; 'Nova Meta'/'Aceitar Sugestao' via toast 'Em breve'"
    - "Settings: Cancelar restaura form original; upload avatar via input file oculto; nav lateral por activeSection"
    - "Onboarding1/2/3: selecoes persistidas em localStorage antes de navegar pro proximo passo"
  artifacts:
    - path: src/app/components/layout/Sidebar.tsx
      provides: handleLogout com isLoggingOut state
    - path: src/app/pages/Categories.tsx
      provides: handleDelete usando apiFetch + isDeleting[id] por item
    - path: src/app/pages/Onboarding1.tsx
      provides: persistencia localStorage + disabled durante submit
---

<objective>
Adicionar interatividade real em 12 componentes React do FinCoach.

Purpose: Transformar UI estatica em fluxo funcional — logout, navegacao, handlers de acao, fix critico de porta em Categories, e persistencia em Onboarding.
Output: 12 arquivos editados com handlers reais, toasts para funcionalidades futuras, e zero chamadas a localhost:8001.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@src/lib/api.ts
@src/lib/auth.ts
@src/app/routes.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Auth flow — Sidebar logout + Login/Welcome social buttons</name>
  <files>src/app/components/layout/Sidebar.tsx, src/app/pages/Login.tsx, src/app/pages/Welcome.tsx, src/app/App.tsx</files>
  <action>
Read each file before editing.

**src/app/App.tsx:**
- Import `{ Toaster }` from `./components/ui/sonner` and render `<Toaster position="top-right" richColors />` inside the return, wrapping `<RouterProvider>`. This wires toast globally.

**src/app/components/layout/Sidebar.tsx:**
- Add imports: `useNavigate` from `react-router`, `apiFetch` from `../../lib/api`, `clearToken` from `../../lib/auth`
- Convert to function with `const navigate = useNavigate()` and `const [isLoggingOut, setIsLoggingOut] = useState(false)`
- Replace the bottom `<NavLink to="/">Sair</NavLink>` with a `<button>` that calls `handleLogout`
- `handleLogout`: sets `isLoggingOut(true)`, calls `apiFetch('/api/auth/logout', { method: 'POST' })` (fire and ignore errors), calls `clearToken()`, `navigate('/login')`
- While `isLoggingOut`: disable the button, show "Saindo..." text, keep all existing Tailwind classes intact (add `disabled:opacity-50 disabled:cursor-not-allowed`)

**src/app/pages/Login.tsx:**
- Add `{ toast }` import from `sonner`
- Add `const [socialLoading, setSocialLoading] = useState<string | null>(null)` state
- Create `handleSocialLogin(provider: string)`: if `socialLoading` is not null, return early (block double click); `setSocialLoading(provider)`; `toast.info('Em breve — OAuth com ' + provider + ' não implementado ainda')`; after 500ms set `setSocialLoading(null)`
- Wire "Continuar com Google" button: `onClick={() => handleSocialLogin('Google')}`, `disabled={!!socialLoading}`, show `socialLoading === 'Google' ? 'Carregando...' : 'Continuar com Google'`
- Wire "Continuar com Apple" button: same pattern with `'Apple'`
- Replace `<a href="#">Esqueceu a senha?</a>` with `<button type="button" onClick={() => toast.info('Recuperação de senha em breve')} className="text-xs text-[#8B949E] hover:text-[#F4F5F8] hover:underline">Esqueceu a senha?</button>`

**src/app/pages/Welcome.tsx:**
- Same `handleSocialLogin` pattern as Login (copy the logic, same toast messages)
- Add `useState` and `toast` imports
- Wire both social buttons with `disabled` and loading text
  </action>
  <verify>npm run build 2>&1 | tail -5</verify>
  <done>Build passes; Sidebar has no TypeScript errors; logout button visible with isLoggingOut state; social buttons disabled during loading</done>
</task>

<task type="auto">
  <name>Task 2: Dashboard navigation + Categories port fix + Goals interactivity</name>
  <files>src/app/pages/Dashboard.tsx, src/app/pages/Categories.tsx, src/app/pages/Goals.tsx</files>
  <action>
Read each file before editing.

**src/app/pages/Dashboard.tsx:**
- Add `useNavigate` import from `react-router`; add `{ toast }` from `sonner`
- Add `const navigate = useNavigate()` inside component
- Replace `<a href="#">Ver todas</a>` with `<button onClick={() => navigate('/transactions')} className="text-xs text-[#8B949E] hover:text-[#F4F5F8]">Ver todas</button>`
- Replace `<Button className="w-full">Ver recomendação →</Button>` with `<Button className="w-full" onClick={() => toast.info('Insights personalizados em breve')}>Ver recomendação →</Button>`
- Update `QuickActionButton` to accept an `onClick?: () => void` prop and render `<button onClick={onClick} ...>`
- Wire QuickActionButtons with navigate calls:
  - "Adicionar Transação" → `() => toast.info('Adicionar transação em breve')`
  - "Ver Transações" → `() => navigate('/transactions')`
  - "Ajustar Categorias" → `() => navigate('/categories')`
  - "Criar Meta" → `() => navigate('/goals')`

**src/app/pages/Categories.tsx:**
- CRITICAL FIX: Replace the entire `handleDelete` function — remove the raw `fetch('http://localhost:8001/...')` call
- New `handleDelete`:
  ```typescript
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});

  const handleDelete = async (id: string) => {
    if (isDeleting[id]) return;
    setIsDeleting(p => ({ ...p, [id]: true }));
    try {
      await apiFetch(`/api/categories/${id}`, { method: 'DELETE' });
      loadCategories();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir categoria');
    } finally {
      setIsDeleting(p => ({ ...p, [id]: false }));
    }
  };
  ```
- Add `{ toast }` from `sonner` import; add `apiFetch` to existing import from `../../lib/api`; remove `getToken` import (no longer needed)
- Update the "Excluir" button in the dropdown menu: `disabled={isDeleting[cat.id]}` + show `isDeleting[cat.id] ? 'Excluindo...' : 'Excluir'`

**src/app/pages/Goals.tsx:**
- Add `{ toast }` from `sonner` and `useState` already imported
- Change `const [goals] = useState(...)` to `const [goals, setGoals] = useState(...)`
- Replace the fake `setTimeout` in "Aceitar Sugestão" onClick with: `toast.info('Aplicar sugestão de meta em breve')`; remove the `aiInsightsLoading` state entirely (it was only for the fake setTimeout)
- Wire "Ignorar" button: `onClick={() => setGoals(prev => prev.filter(g => g.id !== goal.id))}` — removes from local state, no API call
- Wire "Nova Meta" button (header): `onClick={() => toast.info('Criar nova meta em breve')}`
- Wire "Criar novo objetivo" card: `onClick={() => toast.info('Criar nova meta em breve')}`
  </action>
  <verify>npm run build 2>&1 | tail -5</verify>
  <done>Build passes; no localhost:8001 references anywhere in Categories.tsx; Goals Ignorar removes card from UI; Dashboard navigation links work</done>
</task>

<task type="auto">
  <name>Task 3: Settings interactivity + Onboarding localStorage persistence</name>
  <files>src/app/pages/Settings.tsx, src/app/pages/Onboarding1.tsx, src/app/pages/Onboarding2.tsx, src/app/pages/Onboarding3.tsx</files>
  <action>
Read each file before editing.

**src/app/pages/Settings.tsx:**
- Add `{ toast }` from `sonner`
- Add `const [activeSection, setActiveSection] = useState('conta')` state
- Add `const [originalProfile, setOriginalProfile] = useState({ name: '', email: '', phone: '' })` state
- In the `useEffect`, after setting `profileForm`, also call `setOriginalProfile({ name, email, phone })` with the same values so Cancel can restore them
- Add `const [darkMode, setDarkMode] = useState(true)` state
- Wire "Cancelar" button: `onClick={() => setProfileForm(originalProfile)}`
- Wire dark mode toggle button: `onClick={() => { const next = !darkMode; setDarkMode(next); document.documentElement.classList.toggle('dark', next); }}`; make toggle visual reflect `darkMode` state: `className={\`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${darkMode ? 'bg-[#aa68ff]' : 'bg-[rgba(255,255,255,0.1)]'}\`}`; span `className={\`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}\`}`
- Add `const avatarInputRef = useRef<HTMLInputElement>(null)` (import `useRef`)
- Replace avatar upload `<button>` onClick: `onClick={() => avatarInputRef.current?.click()}`
- Add hidden input after the button: `<input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) toast.success('Avatar selecionado (upload em breve)'); }} />`
- Update `NavItem` component to accept `onClick?: () => void` prop and call it on click
- Wire nav items with `onClick={() => setActiveSection('conta')}` etc., using keys: `conta`, `seguranca`, `bancos`, `notificacoes`, `dispositivos`, `idioma`
- Each NavItem `active` prop becomes: `active={activeSection === key}`

**src/app/pages/Onboarding1.tsx:**
- Add `{ toast }` from `sonner`; add `const [isSubmitting, setIsSubmitting] = useState(false)` state
- On "Próximo Passo" button click: wrap navigation with persistence:
  ```typescript
  const handleNext = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    localStorage.setItem('onboarding_step1', JSON.stringify({ selectedGoal, frequency, aiEnabled }));
    navigate('/onboarding/2');
  };
  ```
- Wire button: `onClick={handleNext}` `disabled={isSubmitting}` `className` already has size="lg" — add `disabled:opacity-50 disabled:cursor-not-allowed` via className prop if needed, or Button already handles disabled

**src/app/pages/Onboarding2.tsx:**
- Add `{ toast }` from `sonner`
- Wire "Adicionar nova conexão" button: `onClick={() => toast.info('Novas integrações bancárias em breve')}`
- Wire each `BankCard` with `onClick` prop — add `onClick?: () => void` to BankCard props, call on Card onClick
- Connected/syncing cards: `onClick={() => toast.info('Gerenciamento de conexão em breve')}`
- Pending cards: `onClick={() => toast.info('Integração com ' + name + ' em breve')}`
- On "Próximo Passo": persist step in localStorage before navigate:
  ```typescript
  const handleNext = () => {
    localStorage.setItem('onboarding_step', '2');
    navigate('/onboarding/3');
  };
  ```
  Replace `onClick={() => navigate('/onboarding/3')}` with `onClick={handleNext}`

**src/app/pages/Onboarding3.tsx:**
- Add `{ toast }` from `sonner`; add `const [alertEssentials, setAlertEssentials] = useState(true)` and `const [alertLeisure, setAlertLeisure] = useState(true)` states
- Wire alert toggle buttons (Alerta aos 80%) with their respective state: `onClick={() => setAlertEssentials(p => !p)}`, visual reflects state same pattern as dark mode toggle
- Wire "Aceitar Meta" button: `onClick={() => toast.success('Meta adicionada ao seu perfil em breve')}`
- On "Ir para o Dashboard" button: persist final onboarding data and navigate:
  ```typescript
  const handleFinish = () => {
    const step1 = JSON.parse(localStorage.getItem('onboarding_step1') || '{}');
    localStorage.setItem('onboarding_complete', JSON.stringify({
      ...step1,
      budgets: { essentials, leisure },
      alerts: { essentials: alertEssentials, leisure: alertLeisure },
    }));
    navigate('/dashboard');
  };
  ```
  Replace `onClick={() => navigate('/dashboard')}` with `onClick={handleFinish}`
  </action>
  <verify>npm run build 2>&1 | tail -5</verify>
  <done>Build passes; Settings Cancelar restores original data; nav lateral changes activeSection; Onboarding data persists to localStorage before each step transition</done>
</task>

</tasks>

<verification>
After all 3 tasks:
1. `npm run build` — zero TypeScript errors
2. `grep -r "localhost:8001" src/` — must return empty (Categories fix verified)
3. Manual smoke: visit /login — social buttons toast "Em breve"; /categories — delete calls port 8000; /goals — Ignorar removes card from UI; /settings — Cancelar restores form
</verification>

<success_criteria>
- Build green with zero errors
- No reference to localhost:8001 in any src/ file
- All 12 components have real handlers (no dead href="#" or empty onClick)
- toast "Em breve" fires for all unimplemented backend features
- Onboarding localStorage keys: onboarding_step1, onboarding_step, onboarding_complete
</success_criteria>

<output>
After completion, create `.planning/quick/260407-uvw-interatividade-real-em-12-componentes-lo/260407-uvw-SUMMARY.md`
</output>
