import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { Bell, ChevronDown, Settings, LogOut } from 'lucide-react';
import { cn } from '../ui';
import { apiFetch } from "@/shared/lib/api";
import { clearToken } from "@/shared/lib/auth";

const centerNavItems = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/transactions', label: 'Transações' },
  { path: '/categories', label: 'Categorias' },
  { path: '/goals', label: 'Metas' },
];

export function Navbar() {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-[60px] bg-[rgba(10,15,28,0.92)] backdrop-blur-md border-b border-[rgba(255,255,255,0.05)]">
      <div className="flex items-center justify-between px-6 h-full">

        {/* Left: Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#aa68ff] to-[#820ad1] shadow-[0_0_12px_rgba(170,104,255,0.3)]">
            <span className="text-sm font-bold text-white">F</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-white" style={{ textShadow: '0 0 10px rgba(170,104,255,0.5)' }}>
            FinCoach<span className="text-[#aa68ff]">.AI</span>
          </span>
        </div>

        {/* Center: Nav links */}
        <div className="flex items-center gap-1 h-full">
          {centerNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "relative flex items-center h-full text-sm font-medium px-3 transition-colors",
                  isActive ? "text-white" : "text-[#8B949E] hover:text-white"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#aa68ff] rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Right: Bell + Avatar dropdown */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Bell size={20} className="text-[#8B949E] hover:text-white cursor-pointer transition-colors" />

          <div className="relative" ref={dropdownRef}>
            <div
              className="flex items-center gap-1 cursor-pointer"
              onClick={() => setDropdownOpen((prev) => !prev)}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#aa68ff] to-[#820ad1] flex items-center justify-center text-xs font-bold text-white">
                A
              </div>
              <ChevronDown size={16} className="text-[#8B949E]" />
            </div>

            {dropdownOpen && (
              <div className="absolute top-[44px] right-0 w-44 glass-panel border border-[rgba(255,255,255,0.08)] rounded-xl py-2 z-50 shadow-xl">
                <NavLink
                  to="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-[#8B949E] hover:text-white hover:bg-[rgba(255,255,255,0.04)] w-full transition-colors"
                >
                  <Settings size={15} />
                  Configurações
                </NavLink>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-[#8B949E] hover:text-white hover:bg-[rgba(255,255,255,0.04)] w-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogOut size={15} />
                  {isLoggingOut ? 'Saindo...' : 'Sair'}
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </nav>
  );
}
