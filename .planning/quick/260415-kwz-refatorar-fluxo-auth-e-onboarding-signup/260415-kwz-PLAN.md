---
phase: quick-260415-kwz
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/routes.tsx
  - src/shared/components/layout/index.tsx
  - src/features/auth/pages/Welcome.tsx
  - src/features/auth/pages/Login.tsx
  - src/features/auth/pages/Signup.tsx
  - src/features/onboarding/pages/Onboarding1.tsx
  - src/features/onboarding/pages/Onboarding2.tsx
  - src/features/onboarding/pages/Onboarding3.tsx
  - src/shared/components/layout/Navbar.tsx
autonomous: true
requirements: [AUTH-FLOW-01]

must_haves:
  truths:
    - "Welcome 'Secure Access' button navigates to /signup"
    - "Login 'Request Access' link navigates to /signup"
    - "Signup on success with session navigates to /onboarding/1"
    - "Onboarding routes require authentication (redirect to /login if no token)"
    - "Onboarding screens have zero localStorage writes"
    - "Onboarding3 still navigates to /dashboard on finish"
    - "Navbar shows real user email and initials fetched from /api/auth/me"
  artifacts:
    - path: "src/shared/components/layout/index.tsx"
      provides: "ProtectedAuthLayout for onboarding routes"
      contains: "ProtectedAuthLayout"
    - path: "src/features/onboarding/pages/Onboarding1.tsx"
      provides: "Static onboarding step 1 with no localStorage writes"
    - path: "src/features/onboarding/pages/Onboarding2.tsx"
      provides: "Static onboarding step 2 with no localStorage writes"
    - path: "src/features/onboarding/pages/Onboarding3.tsx"
      provides: "Static onboarding step 3 with no localStorage writes, navigates to /dashboard"
  key_links:
    - from: "src/app/routes.tsx"
      to: "src/shared/components/layout/index.tsx"
      via: "ProtectedAuthLayout wrapping onboarding routes"
      pattern: "ProtectedAuthLayout"
    - from: "src/shared/components/layout/Navbar.tsx"
      to: "/api/auth/me"
      via: "useEffect fetch on mount"
      pattern: "apiFetch.*auth/me"
---

<objective>
Refactor the auth and onboarding flow to follow the correct sequence: Signup -> Login -> (protected) Onboarding 1/2/3 -> Dashboard.

Purpose: Fix the broken onboarding flow that (a) runs before auth causing API errors, (b) pollutes localStorage with stale state, and (c) uses hardcoded user data in the Navbar. After this plan, the entire auth+onboarding path is clean, sequential, and production-ready.

Output: Updated routes, layouts, auth pages, onboarding pages (static), and Navbar with real user data.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/shared/lib/auth.ts
@src/shared/lib/api.ts
</context>

<interfaces>
<!-- Key contracts the executor needs. Extracted from codebase. -->

From src/shared/lib/auth.ts (existing):
```typescript
export function getToken(): string | null;
export function setToken(token: string): void;
export function clearToken(): void;
export function isAuthenticated(): boolean;
```

From src/shared/lib/api.ts (existing):
```typescript
export async function apiFetch(path: string, options?: RequestInit): Promise<any>;
export async function apiPost(path: string, body: unknown): Promise<any>;
```

Backend endpoint already exists:
GET /api/auth/me → returns { id, email } (authenticated, requires Authorization: Bearer <token>)
POST /api/auth/signup → body: { email, password } → returns { session: { access_token } } OR { needs_confirmation: true }
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Add ProtectedAuthLayout, wire /signup route, fix Welcome + Login nav targets</name>
  <files>
    src/shared/components/layout/index.tsx
    src/app/routes.tsx
    src/features/auth/pages/Welcome.tsx
    src/features/auth/pages/Login.tsx
    src/features/auth/pages/Signup.tsx
  </files>
  <action>
**src/shared/components/layout/index.tsx** — Add `ProtectedAuthLayout` export alongside existing `MainLayout` and `AuthLayout`. `ProtectedAuthLayout` checks `isAuthenticated()` on mount; if false, redirects to `/login` with `replace: true`. Has no Navbar — renders bare `<Outlet />` inside a full-screen background div identical to `AuthLayout`'s outer wrapper. Keep `MainLayout` and `AuthLayout` exactly as-is.

```tsx
export function ProtectedAuthLayout() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col justify-center bg-background px-4 py-12 lg:px-8">
      <div className="z-10 w-full max-w-7xl mx-auto relative">
        <Outlet />
      </div>
    </div>
  );
}
```

**src/app/routes.tsx** — Three changes:
1. Import `Signup` from `@/features/auth/pages/Signup` and `ProtectedAuthLayout` from layout.
2. Add `{ path: "signup", Component: Signup }` as a child of the `AuthLayout` route group.
3. Move `onboarding/1`, `onboarding/2`, `onboarding/3` routes OUT of `AuthLayout` and into a NEW route object using `ProtectedAuthLayout` as the Component. The new route object has `path: "/"` and its children are the three onboarding routes.

**src/features/auth/pages/Welcome.tsx** — Change `navigate('/onboarding/1')` to `navigate('/signup')` on the "Secure Access" button `onClick`.

**src/features/auth/pages/Login.tsx** — Change `navigate('/onboarding/1')` to `navigate('/signup')` in the "Request Access" button `onClick`.

**src/features/auth/pages/Signup.tsx** — Change `navigate('/onboarding/1')` (after successful signup with session) to `navigate('/onboarding/1')` — this is CORRECT, keep it. Verify the existing file already has this path; if it navigates elsewhere, correct it to `/onboarding/1`.
  </action>
  <verify>
    <automated>cd /c/Users/andre/Documents/GitHub/OTTO && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>TypeScript compiles clean. routes.tsx has ProtectedAuthLayout wrapping onboarding routes. Welcome and Login both navigate to /signup. Signup navigates to /onboarding/1 on success.</done>
</task>

<task type="auto">
  <name>Task 2: Remove all localStorage writes from Onboarding 1/2/3</name>
  <files>
    src/features/onboarding/pages/Onboarding1.tsx
    src/features/onboarding/pages/Onboarding2.tsx
    src/features/onboarding/pages/Onboarding3.tsx
  </files>
  <action>
These three files become purely visual "showcase" screens. All UI interactions (selects, sliders, toggles) stay functional as local React state — they just don't persist anywhere.

**Onboarding1.tsx** — In `handleNext`: remove the `localStorage.setItem('onboarding_step1', ...)` line entirely. Keep `navigate('/onboarding/2')`. Remove `isSubmitting` state and related disabled logic (it was only needed to prevent double-write). The button simply calls `navigate('/onboarding/2')` directly.

**Onboarding2.tsx** — In `handleNext`: remove the `localStorage.setItem('onboarding_step', '2')` line entirely. Keep `navigate('/onboarding/3')`. Simplify to inline `onClick={() => navigate('/onboarding/3')}` on the button.

**Onboarding3.tsx** — In `handleFinish`: remove the `const step1 = JSON.parse(localStorage.getItem('onboarding_step1') || '{}')` line and remove the entire `localStorage.setItem('onboarding_complete', ...)` call. Keep `navigate('/dashboard')` as the sole statement in the function body. No other changes to Onboarding3.

Do NOT change any JSX, styling, icon imports, or UI behavior. Only remove the localStorage side effects.
  </action>
  <verify>
    <automated>cd /c/Users/andre/Documents/GitHub/OTTO && grep -rn "localStorage" src/features/onboarding/ 2>&1</automated>
  </verify>
  <done>grep returns zero matches for localStorage in src/features/onboarding/. TypeScript still compiles clean. Navigation flow Onboarding1 → 2 → 3 → /dashboard is intact.</done>
</task>

<task type="auto">
  <name>Task 3: Navbar — fetch real user data from /api/auth/me on mount</name>
  <files>src/shared/components/layout/Navbar.tsx</files>
  <action>
Replace the hardcoded "John Doe" / "john@otto.private" / "JD" with real data fetched from `GET /api/auth/me`.

Add state and effect to `Navbar`:

```tsx
const [user, setUser] = useState<{ email: string } | null>(null);

useEffect(() => {
  apiFetch('/api/auth/me')
    .then((data) => setUser(data))
    .catch(() => {
      // silently fail — clearToken not called here, MainLayout handles redirect
    });
}, []);
```

Derive display values:
```tsx
const displayEmail = user?.email ?? '...';
const displayName = user?.email ? user.email.split('@')[0] : '...';
const initials = user?.email
  ? user.email.slice(0, 2).toUpperCase()
  : '..';
```

Replace in JSX:
- Avatar circle text: `{initials}` (was `JD`)
- Dropdown name line: `{displayName}` (was `John Doe`)
- Dropdown email line: `{displayEmail}` (was `john@otto.private`)

Keep all other Navbar logic, styling, nav items, logout handler, and dropdown behavior exactly as-is. Do NOT add loading spinners or skeleton states — the `...` fallback is sufficient.
  </action>
  <verify>
    <automated>cd /c/Users/andre/Documents/GitHub/OTTO && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>TypeScript compiles clean. Navbar.tsx has no hardcoded "John Doe" or "john@otto.private" strings. User data is fetched from /api/auth/me on mount with silent error handling.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Browser → /api/auth/me | Authenticated endpoint — token must be sent, response must not be trusted for auth decisions |
| Browser → /api/auth/signup | Unauthenticated endpoint — email/password submitted over HTTPS |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-kwz-01 | Spoofing | ProtectedAuthLayout | mitigate | isAuthenticated() checks token presence before rendering onboarding routes; redirects to /login if absent |
| T-kwz-02 | Information Disclosure | Navbar /api/auth/me | accept | Email displayed only to authenticated user; token required by backend; low risk for MVP |
| T-kwz-03 | Tampering | localStorage removal | mitigate | Removing localStorage writes eliminates client-side state tampering vector for onboarding data |
</threat_model>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. `grep -rn "localStorage" src/features/onboarding/` returns zero matches
3. `grep -n "onboarding/1" src/features/auth/pages/Welcome.tsx src/features/auth/pages/Login.tsx` returns zero matches
4. `grep -n "ProtectedAuthLayout" src/app/routes.tsx` returns a match
5. `grep -n "john@otto.private\|John Doe\|JD" src/shared/components/layout/Navbar.tsx` returns zero matches
</verification>

<success_criteria>
- Welcome "Secure Access" → /signup (not /onboarding/1)
- Login "Request Access" → /signup (not /onboarding/1)
- Signup success with session → /onboarding/1 (correct, unchanged)
- Visiting /onboarding/* without a token redirects to /login
- Onboarding 1/2/3 have zero localStorage reads or writes
- Onboarding3 "INITIALIZE DASHBOARD" → navigates to /dashboard
- Navbar avatar, name, and email reflect the authenticated user's real data from /api/auth/me
- TypeScript compiles with zero errors
</success_criteria>

<output>
After completion, create `.planning/quick/260415-kwz-refatorar-fluxo-auth-e-onboarding-signup/260415-kwz-SUMMARY.md`
</output>
