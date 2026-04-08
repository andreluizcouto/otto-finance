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
          <h1 className="text-4xl otto-title text-foreground">Configurações</h1>
          <p className="mt-2 otto-serif text-sm text-muted-foreground">Gestão de identidade e segurança.</p>
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
          <Card className="p-10 border-border bg-secondary/20">
            <h2 className="mb-10 text-xl otto-title text-foreground uppercase tracking-widest text-[10px]">Identidade Digital</h2>

            <div className="mb-12 flex items-center gap-8">
              <div className="relative group cursor-pointer">
                <img
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop"
                  alt="Profile"
                  className="h-28 w-28 rounded-full object-cover grayscale border-2 border-border group-hover:border-primary/20 transition-all"
                />
                <button
                  className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl transition-all hover:scale-105"
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
                <h3 className="text-2xl font-light text-foreground otto-title">
                  {isLoading ? (
                    <span className="inline-block animate-pulse h-6 w-48 rounded bg-secondary"></span>
                  ) : (
                    profileForm.name || 'John Doe'
                  )}
                </h3>
                <p className="text-[10px] otto-label text-muted-foreground/40 mt-1 uppercase tracking-[0.2em]">Private Member • Since 2026</p>
              </div>
            </div>

            <form onSubmit={handleSave}>
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-3">
                  <label className="text-[10px] otto-label text-muted-foreground">Full Name</label>
                  <Input
                    className="bg-background border-border rounded-xl py-6 px-4 text-xs font-medium focus:border-primary/20 transition-all shadow-none"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] otto-label text-muted-foreground">Digital Signature (Email)</label>
                  <Input
                    className="bg-background border-border rounded-xl py-6 px-4 text-xs font-medium focus:border-primary/20 transition-all shadow-none"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(p => ({ ...p, email: e.target.value }))}
                    type="email"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] otto-label text-muted-foreground">Secure Phone</label>
                  <Input
                    className="bg-background border-border rounded-xl py-6 px-4 text-xs font-medium focus:border-primary/20 transition-all shadow-none"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                    type="tel"
                    placeholder="+00 00 00000-0000"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] otto-label text-muted-foreground">Tax ID</label>
                  <Input defaultValue="***.***.***-**" disabled className="bg-background border-border rounded-xl py-6 px-4 text-xs font-medium opacity-20" />
                </div>
              </div>

              <div className="mt-12 flex justify-end gap-6 border-t border-border pt-10">
                <Button
                  variant="ghost"
                  type="button"
                  className="px-8"
                  onClick={() => setProfileForm(originalProfile)}
                >
                  CANCEL
                </Button>
                <Button type="submit" disabled={isSaving} className="px-10 py-8 text-[10px] otto-label">
                  {isSaving ? 'UPDATING...' : 'UPDATE SETTINGS'}
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-10 border-border bg-secondary/20">
            <h2 className="mb-4 text-xl otto-title text-foreground uppercase tracking-widest text-[10px]">Private Interface</h2>
            <p className="mb-8 text-sm text-muted-foreground font-medium">Personalize a experiência visual do seu ecossistema OTTO.</p>

            <div className="flex items-center justify-between rounded-xl border border-border bg-background/50 p-6">
              <div className="flex items-center gap-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-foreground">
                  <Moon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground tracking-tight">Absolute Dark Mode</h3>
                  <p className="text-[10px] otto-label text-muted-foreground/40 mt-0.5">ESTÉTICA PADRÃO ATIVADA</p>
                </div>
              </div>
              <div className="h-8 w-14 rounded-full bg-foreground flex items-center px-1">
                <div className="h-6 w-6 rounded-full bg-background shadow-lg" />
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
          ? 'bg-secondary text-foreground'
          : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
      }`}
    >
      <div className={`transition-all duration-300 ${active ? 'text-foreground' : 'text-muted-foreground/40 group-hover:text-foreground'} [&>svg]:h-5 [&>svg]:w-5`}>{icon}</div>
      {label}
    </button>
  );
}


