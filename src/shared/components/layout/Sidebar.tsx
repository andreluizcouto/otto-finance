import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { LayoutDashboard, ArrowRightLeft, Grid, Target, Settings, LogOut } from 'lucide-react';
import { cn } from '../ui';
import { apiFetch } from "@/shared/lib/api";
import { clearToken } from "@/shared/lib/auth";

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transações', icon: ArrowRightLeft },
  { path: '/categories', label: 'Categorias', icon: Grid },
  { path: '/goals', label: 'Metas', icon: Target },
  { path: '/settings', label: 'Configurações', icon: Settings },
];

export function Sidebar() {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore errors — always clear token and redirect
    }
    clearToken();
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 glass-panel border-y-0 border-l-0 border-r border-[rgba(255,255,255,0.05)] bg-[rgba(10,15,28,0.5)]">
      <div className="flex h-full flex-col px-4 py-8">
        <div className="mb-10 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#aa68ff] to-[#820ad1] shadow-[0_0_15px_rgba(170,104,255,0.3)]">
              <span className="text-xl font-bold text-white">F</span>
            </div>
            <span className="text-2xl font-bold tracking-tight text-white" style={{ textShadow: '0 0 10px rgba(170,104,255,0.5)' }}>
              FinCoach<span className="text-[#aa68ff]">.AI</span>
            </span>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[rgba(255,255,255,0.05)] text-[#F4F5F8] border-l-[3px] border-[#74ee15] rounded-l-none pl-[13px]"
                    : "text-[#8B949E] hover:bg-[rgba(255,255,255,0.02)] hover:text-[#F4F5F8]"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-[#8B949E] transition-colors hover:bg-[rgba(255,255,255,0.02)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className="h-5 w-5" />
            {isLoggingOut ? 'Saindo...' : 'Sair'}
          </button>
        </div>
      </div>
    </aside>
  );
}
