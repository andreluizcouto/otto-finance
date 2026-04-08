# Coding Conventions
_Last updated: 2026-04-08_

## Summary

The React/TypeScript frontend uses a dark-themed glassmorphism design system with hardcoded color tokens via inline Tailwind arbitrary values. Components follow a named-export function pattern, with small internal helper components co-located inside the same page file. TypeScript is used loosely — `any` types are common in feature components.

---

## File Naming

- **Page components:** PascalCase, single word or compound — `Dashboard.tsx`, `TransactionDetail.tsx`, `Onboarding1.tsx`
- **Shared components:** PascalCase — `Sidebar.tsx`, `ImageWithFallback.tsx`
- **Utility files:** camelCase — `utils.ts`, `api.ts`, `auth.ts`
- **Style files:** kebab-case — `theme.css`, `fonts.css`, `tailwind.css`, `index.css`
- **Config files:** kebab-case or conventional — `vite.config.ts`, `postcss.config.mjs`

## Directory Structure Pattern

Features live under `src/features/{domain}/pages/`. Shared code goes under `src/shared/`. There are no `hooks/`, `contexts/`, or `stores/` directories yet.

```
src/
├── app/           # App entry, router
├── features/      # Domain feature pages
│   ├── auth/pages/
│   ├── dashboard/pages/
│   ├── goals/pages/
│   ├── onboarding/pages/
│   ├── settings/pages/
│   └── transactions/pages/
└── shared/
    ├── components/
    │   ├── figma/    # Figma-generated utility components
    │   ├── layout/   # App shell (Sidebar, MainLayout, AuthLayout)
    │   └── ui/       # shadcn-style primitives + custom ui
    ├── lib/          # Utility modules (api.ts, auth.ts)
    └── styles/       # CSS files
```

---

## Component Patterns

### Named Exports (mandatory)
All page and shared components use named exports, never default exports for components.

```tsx
// Correct
export function Dashboard() { ... }
export function Sidebar() { ... }

// App.tsx is the only default export (entry point)
export default function App() { ... }
```

### Internal Helper Components
Small private sub-components are defined at the bottom of the same file, not extracted:

```tsx
// src/features/dashboard/pages/Dashboard.tsx
function TransactionRow({ icon, name, category, time, amount, isPositive = false }: any) { ... }
function QuickActionButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) { ... }
function LineChartIcon(props: any) { ... }
```

### forwardRef Pattern (shared/ui only)
Components in `src/shared/components/ui/index.tsx` use `React.forwardRef`:

```tsx
export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ... }>(
  ({ className, variant = 'primary', ...props }, ref) => { ... }
);
Button.displayName = "Button";
```

### CVA Pattern (shadcn primitives)
Components in `src/shared/components/ui/button.tsx` (the shadcn version) use `class-variance-authority`:

```tsx
const buttonVariants = cva("inline-flex items-center ...", {
  variants: { variant: { default: "...", destructive: "..." }, size: { ... } },
  defaultVariants: { variant: "default", size: "default" },
});
```

**Note:** There are two Button implementations — `src/shared/components/ui/index.tsx` (custom) and `src/shared/components/ui/button.tsx` (shadcn). Feature pages import from `@/shared/components/ui` (the custom one).

---

## TypeScript Usage

TypeScript is used but loosely typed in feature pages:
- State holding API responses: `useState<any>(null)` or `useState<any[]>([])`
- Event handlers: typed as `React.FormEvent`, `React.ChangeEvent<HTMLInputElement>` where explicit
- Props for internal helpers: typed inline (`{ icon: React.ReactNode; label: string; onClick?: () => void }`) or untyped (`props: any`)
- No separate `types/` or `interfaces/` directories exist

Use explicit types on `useState` for primitive values:
```tsx
const [isLoading, setIsLoading] = useState(true);           // boolean inferred
const [error, setError] = useState<string | null>(null);    // explicit nullable
const [data, setData] = useState<any>(null);                // any for API data
```

---

## Import Organization

Imports follow this implicit order (not enforced by a linter, but consistent across files):

1. React and React hooks — `import { useState, useEffect } from "react"`
2. Router — `import { useNavigate } from "react-router"`
3. Shared UI components — `import { Card, Button, Input } from "@/shared/components/ui"`
4. Third-party chart/UI libs — `import { AreaChart, ... } from "recharts"`
5. Icons — `import { Wallet, CreditCard, ... } from "lucide-react"`
6. Internal lib utilities — `import { apiGet } from "@/shared/lib/api"`
7. Toast — `import { toast } from "sonner"`

**Path alias:** `@` maps to `src/`. Always use `@/` for non-relative imports.

```tsx
import { apiGet } from "@/shared/lib/api";    // correct
import { apiGet } from "../../shared/lib/api"; // never use
```

---

## Tailwind CSS Usage

**Version:** Tailwind CSS v4 via `@tailwindcss/vite` plugin. Config is CSS-first (`@theme` block in `src/shared/styles/theme.css`), no `tailwind.config.js` file.

**Pattern: Inline arbitrary values for brand colors** (no utility class aliases):
```tsx
// Colors are hardcoded as arbitrary values throughout the codebase
className="text-[#F4F5F8]"           // text primary
className="text-[#8B949E]"           // text secondary
className="text-[#aa68ff]"           // neon purple
className="text-[#74ee15]"           // neon green
className="bg-[rgba(255,255,255,0.05)]" // glass surface
className="border-[rgba(255,255,255,0.1)]" // glass border
```

**Design tokens defined in `src/shared/styles/theme.css`:**
| Token | Value | Usage |
|-------|-------|-------|
| `#0A0F1C` | Background | Page/layout bg |
| `#F4F5F8` | Text primary | Headings, values |
| `#8B949E` | Text secondary | Labels, meta |
| `#aa68ff` | Neon purple | Brand accent, active states |
| `#820ad1` | Purple dark | Gradient end |
| `#74ee15` | Neon green | Positive values, success |

**Glassmorphism utilities (defined in `theme.css`, used via class):**
- `.glass-card` — white 5% bg, blur-16, 1px border, border-radius 16px
- `.glass-panel` — white 3% bg, blur-20, used in Sidebar

**`cn()` utility** for conditional class merging:
```tsx
import { cn } from '../ui'; // or from '@/shared/components/ui'

className={cn(
  "base classes",
  isActive ? "active classes" : "inactive classes",
  className  // always spread prop className last
)}
```

**Responsive breakpoints** used: `sm:`, `md:`, `lg:` — mobile-first.

---

## State Management

No global state library (no Redux, Zustand, Jotai). Patterns in use:
- `useState` for local component state
- `useEffect` for data fetching on mount or dependency change
- `localStorage` for onboarding persistence (`onboarding_step1`, `fincoach_access_token`)
- No React Context used yet

**Loading skeleton pattern:**
```tsx
{isLoading ? (
  <div className="animate-pulse h-10 rounded-xl bg-[rgba(255,255,255,0.05)]"></div>
) : (
  <div>{data?.value ?? '—'}</div>
)}
```

---

## API Communication

All API calls go through `src/shared/lib/api.ts`. Never use raw `fetch` in components.

```tsx
// Read data
const data = await apiGet('/api/dashboard?period=Este+mes');

// Write data
const result = await apiPost('/api/auth/login', { email, password });

// Custom method
await apiFetch('/api/auth/logout', { method: 'POST' });
```

Base URL is hardcoded to `http://localhost:8000` in `src/shared/lib/api.ts` — no env var.

---

## Error Handling

- Async errors in `useEffect`: `.catch(console.error)` (silent, no user-facing error)
- Form submission errors: `catch (err: any)` → `setError(err.message)`
- Error display: inline `<div>` with red semi-transparent bg, not a toast
- Toast (`sonner`) used for success/info notifications: `toast.success(...)`, `toast.info(...)`

---

## Routing

React Router v7 (`react-router` package, not `react-router-dom`).

```tsx
// Navigation
const navigate = useNavigate();
navigate('/dashboard');

// Active link detection
import { NavLink } from 'react-router';
<NavLink to="/dashboard" className={({ isActive }) => isActive ? "..." : "..."} />
```

---

## Comments

- Comments appear only on non-obvious logic — "ignore errors — always clear token and redirect"
- JSDoc not used in frontend
- Inline `// PUT /api/users/me does not exist yet` for known stubs

---

## Gaps / Unknowns

- No ESLint or Prettier config found — formatting is not enforced by tooling
- TypeScript strict mode settings unknown (no `tsconfig.json` found in root)
- No path alias for feature-specific shared code (no `@/features` pattern)
- `any` typing in feature pages may indicate intentional or accidental looseness — unclear policy
- Two conflicting `Button` implementations exist (`ui/index.tsx` vs `ui/button.tsx`) — unclear which is canonical long-term
