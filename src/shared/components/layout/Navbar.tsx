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
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    apiFetch('/api/auth/me')
      .then((data) => setUser(data.user ?? data))
      .catch(() => {});
  }, []);

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
    <nav className="fixed top-0 left-0 right-0 z-50 h-20 bg-background/80 backdrop-blur-[24px] border-b border-border">
      <div className="flex items-center justify-between px-10 h-full max-w-[1440px] mx-auto">

        {/* Left: Logo & Manifesto */}
        <div className="flex items-center gap-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-2xl tracking-[0.2em] text-foreground otto-title">OTTO</span>
            <div className="h-4 w-[1px] bg-border" />
            <span className="text-sm text-muted-foreground otto-serif italic">Quietly wealthy.</span>
          </div>
        </div>

        {/* Center: Nav links */}
        <div className="flex items-center gap-8 h-full">
          {centerNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "relative flex items-center h-full text-[10px] otto-label transition-all duration-300",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-6 flex-shrink-0">
          <div className="relative" ref={dropdownRef}>
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => setDropdownOpen((prev) => !prev)}
            >
              <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] otto-label text-foreground grayscale transition-all group-hover:border-white/20">
                {user?.email ? user.email.slice(0, 2).toUpperCase() : '..'}
              </div>
              <ChevronDown size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>

            {dropdownOpen && (
              <div className="absolute top-[52px] right-0 w-48 glass-card bg-card/90 border border-border rounded-xl py-3 z-50 shadow-2xl backdrop-blur-3xl">
                <div className="px-4 py-2 mb-2 border-b border-border">
                  <p className="text-[10px] otto-label text-muted-foreground">{user?.email ? user.email.split('@')[0] : '...'}</p>
                  <p className="text-[9px] text-muted-foreground/50 truncate">{user?.email ?? '...'}</p>
                </div>
                <NavLink
                  to="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-[10px] otto-label text-muted-foreground hover:text-foreground hover:bg-white/5 w-full transition-all"
                >
                  <Settings size={14} />
                  Settings
                </NavLink>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center gap-3 px-4 py-2.5 text-[10px] otto-label text-muted-foreground hover:text-foreground hover:bg-white/5 w-full transition-all disabled:opacity-50"
                >
                  <LogOut size={14} />
                  {isLoggingOut ? 'Leaving...' : 'Logout'}
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </nav>
  );
}
