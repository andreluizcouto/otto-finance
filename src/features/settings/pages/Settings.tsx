import { useState, useEffect, useRef } from "react";
import { Card, Button, Input } from "@/shared/components/ui";
import { User, Bell, Shield, Wallet, Smartphone, Globe, UploadCloud, Moon } from "lucide-react";
import { apiGet } from "@/shared/lib/api";
import { toast } from "sonner";


export function Settings() {
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' });
  const [originalProfile, setOriginalProfile] = useState({ name: '', email: '', phone: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('wealth');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiGet('/api/auth/me')
      .then(res => {
        const u = res.user;
        const profile = {
          name: u.email?.split('@')[0] ?? '',
          email: u.email ?? '',
          phone: '',
        };
        setProfileForm(profile);
        setOriginalProfile(profile);
      })
      .catch(() => toast.error('Erro ao carregar perfil'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setOriginalProfile(profileForm);
    setIsSaving(false);
    toast.success('Configurações atualizadas');
  };

  return (
    <div className="flex flex-col gap-10 pt-6 max-w-7xl mx-auto px-6">
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-4xl otto-title text-white">Configurações</h1>
          <p className="mt-2 otto-label text-xs">Gestão de Identidade e Segurança</p>
        </div>
      </div>

      <div className="flex flex-col gap-12 md:flex-row">
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className="flex flex-col gap-2">
            <NavItem icon={<User />} label="Wealth Identity" active={activeSection === 'wealth'} onClick={() => setActiveSection('wealth')} />
            <NavItem icon={<Shield />} label="Security Protocol" active={activeSection === 'security'} onClick={() => setActiveSection('security')} />
            <NavItem icon={<Wallet />} label="Institutional Links" active={activeSection === 'institutions'} onClick={() => setActiveSection('institutions')} />
            <NavItem icon={<Bell />} label="Alert Management" active={activeSection === 'alerts'} onClick={() => setActiveSection('alerts')} />
            <NavItem icon={<Globe />} label="Global Settings" active={activeSection === 'global'} onClick={() => setActiveSection('global')} />
          </nav>
        </aside>

        <div className="flex-1 space-y-10">
          <Card className="p-10 border-white/5 bg-white/[0.02]">
            <h2 className="mb-10 text-xl otto-title text-white uppercase tracking-widest text-[10px]">Identidade Digital</h2>

            <div className="mb-12 flex items-center gap-8">
              <div className="relative group cursor-pointer">
                <img
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop"
                  alt="Profile"
                  className="h-28 w-28 rounded-full object-cover grayscale border-2 border-white/10 group-hover:border-white/20 transition-all"
                />
                <button
                  className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-2xl transition-all hover:scale-105"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <UploadCloud className="h-5 w-5" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) toast.success('Upload de identidade em processamento');
                  }}
                />
              </div>
              <div>
                <h3 className="text-2xl font-light text-white otto-title">
                  {isLoading ? (
                    <span className="inline-block animate-pulse h-6 w-48 rounded bg-white/5"></span>
                  ) : (
                    profileForm.name || 'John Doe'
                  )}
                </h3>
                <p className="text-[10px] otto-label text-white/40 mt-1 uppercase tracking-[0.2em]">Private Member • Since 2026</p>
              </div>
            </div>

            <form onSubmit={handleSave}>
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-3">
                  <label className="text-[10px] otto-label text-white/40">Full Name</label>
                  <Input
                    className="bg-white/5 border-white/10 rounded-xl py-6 px-4 text-xs font-medium focus:border-white/20 transition-all shadow-none"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] otto-label text-white/40">Digital Signature (Email)</label>
                  <Input
                    className="bg-white/5 border-white/10 rounded-xl py-6 px-4 text-xs font-medium focus:border-white/20 transition-all shadow-none"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(p => ({ ...p, email: e.target.value }))}
                    type="email"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] otto-label text-white/40">Secure Phone</label>
                  <Input
                    className="bg-white/5 border-white/10 rounded-xl py-6 px-4 text-xs font-medium focus:border-white/20 transition-all shadow-none"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                    type="tel"
                    placeholder="+00 00 00000-0000"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] otto-label text-white/40">Tax ID</label>
                  <Input defaultValue="***.***.***-**" disabled className="bg-white/5 border-white/10 rounded-xl py-6 px-4 text-xs font-medium opacity-20" />
                </div>
              </div>

              <div className="mt-12 flex justify-end gap-6 border-t border-white/5 pt-10">
                <Button
                  variant="ghost"
                  type="button"
                  className="px-8"
                  onClick={() => setProfileForm(originalProfile)}
                >
                  CANCEL
                </Button>
                <Button type="submit" disabled={isSaving} className="bg-white text-black hover:bg-white/90 rounded-xl px-10 py-8 text-[10px] otto-label">
                  {isSaving ? 'UPDATING...' : 'UPDATE SETTINGS'}
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-10 border-white/5 bg-white/[0.02]">
            <h2 className="mb-4 text-xl otto-title text-white uppercase tracking-widest text-[10px]">Private Interface</h2>
            <p className="mb-8 text-sm text-white/40 font-medium">Personalize a experiência visual do seu ecossistema OTTO.</p>

            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-6">
              <div className="flex items-center gap-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-white">
                  <Moon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white tracking-tight">Absolute Dark Mode</h3>
                  <p className="text-[10px] otto-label text-white/40 mt-0.5">ESTÉTICA PADRÃO ATIVADA</p>
                </div>
              </div>
              <div className="h-8 w-14 rounded-full bg-white flex items-center px-1">
                <div className="h-6 w-6 rounded-full bg-black shadow-lg" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 rounded-xl px-6 py-4 text-[10px] otto-label transition-all duration-300 group cursor-pointer ${
        active
          ? 'bg-white/10 text-white'
          : 'text-white/20 hover:bg-white/5 hover:text-white'
      }`}
    >
      <div className={`transition-all duration-300 ${active ? 'text-white' : 'text-white/20 group-hover:text-white'} [&>svg]:h-5 [&>svg]:w-5`}>{icon}</div>
      {label}
    </button>
  );
}
  );
}

