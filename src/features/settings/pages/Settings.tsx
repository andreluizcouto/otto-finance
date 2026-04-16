import { useEffect, useState, useRef } from 'react';
import {
  User,
  Lock,
  Shield,
  Smartphone,
  ChevronRight,
  Fingerprint,
  Monitor,
  Bell,
  Wallet,
  Globe,
  UploadCloud,
  Moon,
  Loader2,
} from 'lucide-react';
import { apiGet } from '@/shared/lib/api';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'perfil', label: 'Wealth Identity', icon: User },
  { id: 'seguranca', label: 'Security Protocol', icon: Shield },
  { id: 'links', label: 'Institutional Links', icon: Wallet },
  { id: 'alertas', label: 'Alert Management', icon: Bell },
  { id: 'global', label: 'Global Settings', icon: Globe },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavItem({ icon: Icon, label, active, onClick }: { icon: any; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group whitespace-nowrap",
        active
          ? "bg-white/[0.06] text-white font-medium border-l-4 border-white shadow-xl"
          : "text-white/30 hover:text-white/60 hover:bg-white/[0.02] border-l-4 border-transparent"
      )}
    >
      <div className="flex items-center gap-4">
        <Icon className={cn("w-4.5 h-4.5 transition-colors", active ? "text-white" : "text-white/20 group-hover:text-white/40")} />
        <span className="text-[10px] font-bold uppercase tracking-[0.15em]">{label}</span>
      </div>
      {active && <ChevronRight className="w-4 h-4 opacity-40 hidden md:block" />}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Settings() {
  const [activeTab, setActiveTab] = useState('perfil');
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiGet('/api/auth/me')
      .then(res => {
        const u = res.user ?? res;
        setProfileForm({
          name: u.email?.split('@')[0] ?? 'Usuário',
          email: u.email ?? '',
          phone: '',
        });
      })
      .catch(() => toast.error('Erro ao sincronizar identidade.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulating save
    await new Promise(r => setTimeout(r, 1200));
    setIsSaving(false);
    toast.success('Protocolos de identidade atualizados.');
  };

  return (
    <div className="w-full relative z-10 animate-in fade-in duration-700 max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-8 md:mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl md:text-2xl tracking-[0.2em] font-medium">OTTO</span>
            <div className="h-4 w-px bg-white/20"></div>
            <h1 className="text-xs font-medium tracking-widest text-white/40 uppercase">Configurações</h1>
          </div>
          <p className="text-white/40 text-sm italic">Gestão de identidade digital e protocolos de segurança.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-10 lg:gap-16">
        
        {/* Sidebar Nav */}
        <aside className="w-full md:w-72 shrink-0 relative">
          <div className="absolute top-0 -left-20 w-[150%] h-full bg-white/[0.01] blur-[100px] pointer-events-none rounded-r-full -z-10" />
          
          <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 no-scrollbar">
            {TABS.map(tab => (
              <NavItem
                key={tab.id}
                icon={tab.icon}
                label={tab.label}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              />
            ))}
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          
          {activeTab === 'perfil' && (
            <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
              
              {/* Identity Card */}
              <div className="bg-gradient-to-br from-white/[0.04] to-transparent border border-white/[0.08] backdrop-blur-2xl rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/[0.02] blur-[80px] rounded-full pointer-events-none" />
                
                <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] mb-12 pl-1">Identidade Digital</h2>

                <div className="flex flex-col sm:flex-row items-center gap-10 mb-12">
                  <div className="relative group">
                    <div className="h-32 w-32 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-white/30 transition-all duration-500 shadow-2xl relative">
                      <img
                        src={`https://ui-avatars.com/api/?name=${profileForm.name}&background=0a0a0a&color=fff&bold=true&size=128`}
                        alt="Profile"
                        className="h-full w-full object-cover grayscale opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <UploadCloud className="w-8 h-8 text-white/80" />
                      </div>
                    </div>
                    <button
                      className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black shadow-2xl transition-all hover:scale-110 active:scale-95"
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      <UploadCloud className="h-5 w-5" />
                    </button>
                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" />
                  </div>

                  <div className="text-center sm:text-left">
                    <h3 className="text-3xl font-light text-white tracking-tight mb-2">
                      {isLoading ? <div className="h-8 w-48 bg-white/5 animate-pulse rounded-lg" /> : profileForm.name}
                    </h3>
                    <div className="flex items-center justify-center sm:justify-start gap-3">
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-3 py-1 bg-white/[0.03] border border-white/[0.06] rounded-lg">Private Member</span>
                      <span className="text-[10px] font-bold text-white/10 uppercase tracking-[0.2em]">Since 2026</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSave} className="space-y-8">
                  <div className="grid gap-8 sm:grid-cols-2">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">Full Name</label>
                      <input
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-sm text-white focus:outline-none focus:border-white/30 focus:bg-white/[0.06] transition-all"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm(p => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">Digital Signature (Email)</label>
                      <input
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-sm text-white focus:outline-none focus:border-white/30 focus:bg-white/[0.06] transition-all"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm(p => ({ ...p, email: e.target.value }))}
                        type="email"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">Secure Phone</label>
                      <input
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-sm text-white focus:outline-none focus:border-white/30 focus:bg-white/[0.06] transition-all"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                        type="tel"
                        placeholder="+55 00 00000-0000"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">Tax ID / Registro</label>
                      <input 
                        defaultValue="***.***.***-**" 
                        disabled 
                        className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl py-4 px-5 text-sm text-white/20 cursor-not-allowed" 
                      />
                    </div>
                  </div>

                  <div className="mt-12 flex justify-end gap-6 pt-10 border-t border-white/5">
                    <button
                      type="button"
                      className="px-8 h-14 rounded-2xl text-[10px] font-bold text-white/30 uppercase tracking-widest hover:text-white transition-all"
                      onClick={() => window.location.reload()}
                    >
                      Reset
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSaving} 
                      className="px-10 h-14 bg-white text-black rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-30"
                    >
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Update Protocols'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Preferences */}
              <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl rounded-[2.5rem] p-10">
                <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] mb-8 pl-1">Private Interface</h2>
                <div className="flex items-center justify-between rounded-[2rem] border border-white/[0.06] bg-black/40 p-8 group hover:bg-white/[0.02] transition-all">
                  <div className="flex items-center gap-8">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-white/[0.03] border border-white/[0.08] text-white/60 shadow-inner group-hover:scale-105 transition-transform duration-500">
                      <Moon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white tracking-tight">Absolute Dark Mode</h3>
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mt-1">Protocolo Estético Ativo</p>
                    </div>
                  </div>
                  <div className="h-10 w-16 rounded-full bg-white flex items-center px-1 shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                    <div className="h-8 w-8 rounded-full bg-black shadow-2xl" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'seguranca' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              {/* Security Status */}
              <div className="bg-gradient-to-br from-white/[0.04] to-transparent border border-white/[0.08] rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/[0.03] blur-[50px] rounded-full pointer-events-none" />
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="p-4 bg-white/[0.04] rounded-2xl border border-white/[0.08] shadow-inner">
                      <Shield className="w-8 h-8 text-white/40" />
                    </div>
                    <div>
                      <h2 className="text-xl font-light text-white mb-1">Segurança da Conta</h2>
                      <p className="text-sm text-white/40">Configurações de blindagem do seu OTTO ID.</p>   
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/20 px-3 py-1.5 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                    Nível 01
                  </span>
                </div>
              </div>

              {/* Authentication Options */}
              <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl rounded-[2.5rem] p-10 space-y-6">
                <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] mb-10 pl-1 border-b border-white/5 pb-6">Autenticação</h3>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 rounded-2xl hover:bg-white/[0.02] border border-transparent hover:border-white/[0.05] transition-all group">
                  <div className="flex items-center gap-6">
                    <Fingerprint className="w-6 h-6 text-white/20 group-hover:text-white/40 transition-colors" />
                    <div>
                      <h4 className="text-sm font-medium text-white">Login Biométrico</h4>
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">FaceID ou TouchID</p>        
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-12 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white/[0.3] border border-white/20 shadow-xl"></div>
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 rounded-2xl hover:bg-white/[0.02] border border-transparent hover:border-white/[0.05] transition-all group">
                  <div className="flex items-center gap-6">
                    <Smartphone className="w-6 h-6 text-white/20 group-hover:text-white/40 transition-colors" />
                    <div>
                      <h4 className="text-sm font-medium text-white">Fator Duplo (2FA)</h4>
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">App Autenticador</p>
                    </div>
                  </div>
                  <button className="px-6 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white/60 hover:text-white text-[10px] font-bold uppercase tracking-widest rounded-xl">
                    Configurar
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 rounded-2xl hover:bg-white/[0.02] border border-transparent hover:border-white/[0.05] transition-all group">
                  <div className="flex items-center gap-6">
                    <Lock className="w-6 h-6 text-white/20 group-hover:text-white/40 transition-colors" />
                    <div>
                      <h4 className="text-sm font-medium text-white">Chave Mestra</h4>
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">Alterar senha de acesso</p>
                    </div>
                  </div>
                  <button className="px-6 py-2.5 border border-white/10 hover:bg-white/5 transition-all text-white/60 hover:text-white text-[10px] font-bold uppercase tracking-widest rounded-xl">
                    Redefinir
                  </button>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl rounded-[2.5rem] p-10">
                <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] mb-10 pl-1 border-b border-white/5 pb-6">Sessões Ativas</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-6">
                      <Monitor className="w-6 h-6 text-white/20" />
                      <div>
                        <div className="text-sm font-medium text-white">Web Interface (Atual)</div>
                        <div className="text-[10px] font-bold text-emerald-400/60 uppercase tracking-widest mt-1 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" /> Sincronizado
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">ID-7724</span>
                  </div>
                  <div className="pt-6 border-t border-white/5 text-center">
                    <p className="text-[10px] font-bold text-white/10 uppercase tracking-[0.2em]">Nenhum outro dispositivo vinculado.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'perfil' && activeTab !== 'seguranca' && (
            <div className="flex flex-col items-center justify-center py-40 text-center text-white/20 animate-in fade-in duration-500">
              {(() => {
                const TabIcon = TABS.find(t => t.id === activeTab)?.icon || Globe;
                return <TabIcon className="w-16 h-16 mb-8 opacity-5" />;
              })()}
              <h3 className="text-2xl font-light text-white/60 mb-2 tracking-tight">{TABS.find(t => t.id === activeTab)?.label}</h3>
              <p className="max-w-xs text-xs uppercase tracking-widest font-medium">Este protocolo está sendo otimizado para o seu ecossistema e estará disponível em breve.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
