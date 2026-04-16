import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router';
import { Bell, ChevronDown, Settings, LogOut, Search, Menu, X } from 'lucide-react';
import { cn } from '../ui';
import { apiFetch } from "@/shared/lib/api";
import { clearToken } from "@/shared/lib/auth";

const navItems = [
  { path: '/dashboard', label: 'Painel' },
  { path: '/transactions', label: 'Transações' },
  { path: '/categories', label: 'Categorias' },
  { path: '/goals', label: 'Metas' },
];

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    apiFetch('/api/auth/me')
      .then((data) => setUser(data.user ?? data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

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
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 md:h-20 bg-black/80 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="flex items-center justify-between px-4 md:px-10 h-full max-w-[1440px] mx-auto">

          {/* Left: Logo & Manifesto */}
          <div className="flex items-center gap-6 md:gap-12 flex-shrink-0">
            <div 
              onClick={() => navigate('/dashboard')} 
              className="flex items-center gap-4 group cursor-pointer"
            >
              <span className="text-xl md:text-2xl tracking-[0.2em] text-white font-medium">OTTO</span>
              <div className="h-5 w-px bg-white/20"></div>
              <span className="text-sm font-medium tracking-widest text-white/50 uppercase hidden sm:inline">
                Quietly wealthy
              </span>
            </div>

            {/* Center: Nav links */}
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      "text-sm font-medium transition-all duration-300",
                      isActive 
                        ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" 
                        : "text-white/40 hover:text-white/80"
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-6 flex-shrink-0">
            <button className="text-white/40 hover:text-white transition-colors hidden md:block">
              <Search className="w-5 h-5" />
            </button>
            <button className="relative text-white/40 hover:text-white transition-colors hidden md:block">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-white rounded-full drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]"></span>
            </button>
            
            <div className="relative hidden md:block" ref={dropdownRef}>
              <div
                className="flex items-center gap-3 pl-6 border-l border-white/10 cursor-pointer group"
                onClick={() => setDropdownOpen((prev) => !prev)}
              >
                <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center transition-all group-hover:border-white/20">
                  <span className="text-xs text-white/50 font-medium">
                    {user?.email ? user.email.slice(0, 1).toUpperCase() : 'U'}
                  </span>
                </div>
                <ChevronDown size={14} className="text-white/40 group-hover:text-white transition-colors" />
              </div>

              {dropdownOpen && (
                <div className="absolute top-[52px] right-0 w-48 bg-[#0a0a0a] border border-white/[0.08] rounded-xl py-3 z-50 shadow-2xl backdrop-blur-3xl overflow-hidden">
                  <div className="px-4 py-2 mb-2 border-b border-white/10">
                    <p className="text-[10px] font-medium tracking-widest text-white/40 uppercase truncate">
                      {user?.email ? user.email.split('@')[0] : '...'}
                    </p>
                    <p className="text-[9px] text-white/20 truncate">{user?.email ?? '...'}</p>
                  </div>
                  <NavLink
                    to="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-xs text-white/60 hover:text-white hover:bg-white/5 w-full transition-all"
                  >
                    <Settings size={14} />
                    Configurações
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex items-center gap-3 px-4 py-2.5 text-xs text-white/60 hover:text-white hover:bg-white/5 w-full transition-all disabled:opacity-50"
                  >
                    <LogOut size={14} />
                    {isLoggingOut ? 'Saindo...' : 'Sair'}
                  </button>
                </div>
              )}
            </div>

            {/* Hamburger - Mobile Only */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center w-11 h-11 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.06] transition-all"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute top-16 left-0 right-0 bg-black/95 backdrop-blur-2xl border-b border-white/[0.08] shadow-2xl animate-in slide-in-from-top-2 duration-200 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="px-6 py-6 space-y-2">
              {/* User info */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-4">
                <div className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center">
                  <span className="text-sm text-white/50 font-medium">
                    {user?.email ? user.email.slice(0, 1).toUpperCase() : 'U'}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">
                    {user?.email ? user.email.split('@')[0] : 'Usuário'}
                  </p>
                  <p className="text-[10px] text-white/30 truncate">{user?.email ?? '...'}</p>
                </div>
              </div>

              {/* Nav Items */}
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-medium transition-all min-h-[48px]",
                      isActive
                        ? "text-white bg-white/[0.08] border border-white/[0.12]"
                        : "text-white/50 hover:text-white hover:bg-white/[0.04] border border-transparent"
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}

              <div className="h-px bg-white/[0.06] my-4" />

              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-medium transition-all min-h-[48px]",
                    isActive
                      ? "text-white bg-white/[0.08] border border-white/[0.12]"
                      : "text-white/50 hover:text-white hover:bg-white/[0.04] border border-transparent"
                  )
                }
              >
                <Settings className="w-4 h-4" />
                Configurações
              </NavLink>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/[0.04] transition-all w-full min-h-[48px] disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                {isLoggingOut ? 'Saindo...' : 'Sair'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
