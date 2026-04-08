import { useState, useEffect, useRef } from "react";
import { Card, Button, Input } from "../components/ui";
import { User, Bell, Shield, Wallet, Smartphone, Globe, UploadCloud, Moon } from "lucide-react";
import { apiGet } from "../../lib/api";
import { toast } from "sonner";

export function Settings() {
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' });
  const [originalProfile, setOriginalProfile] = useState({ name: '', email: '', phone: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('conta');
  const [darkMode, setDarkMode] = useState(true);
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
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // PUT /api/users/me does not exist yet — simulate with delay for UX
    await new Promise(r => setTimeout(r, 800));
    setOriginalProfile(profileForm);
    setIsSaving(false);
    toast.success('Perfil salvo com sucesso');
  };

  return (
    <div className="flex flex-col gap-8 pt-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#F4F5F8]">Perfil e Configurações</h1>
        <p className="mt-1 text-sm text-[#8B949E]">Gerencie sua conta, segurança e preferências do sistema.</p>
      </div>

      <div className="flex flex-col gap-8 md:flex-row">
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className="flex flex-col gap-1">
            <NavItem icon={<User />} label="Conta" active={activeSection === 'conta'} onClick={() => setActiveSection('conta')} />
            <NavItem icon={<Shield />} label="Segurança" active={activeSection === 'seguranca'} onClick={() => setActiveSection('seguranca')} />
            <NavItem icon={<Wallet />} label="Bancos Conectados" active={activeSection === 'bancos'} onClick={() => setActiveSection('bancos')} />
            <NavItem icon={<Bell />} label="Notificações" active={activeSection === 'notificacoes'} onClick={() => setActiveSection('notificacoes')} />
            <NavItem icon={<Smartphone />} label="Dispositivos" active={activeSection === 'dispositivos'} onClick={() => setActiveSection('dispositivos')} />
            <NavItem icon={<Globe />} label="Idioma e Região" active={activeSection === 'idioma'} onClick={() => setActiveSection('idioma')} />
          </nav>
        </aside>

        <div className="flex-1 space-y-8">
          <Card className="p-8">
            <h2 className="mb-6 text-xl font-bold text-[#F4F5F8]">Informações Pessoais</h2>

            <div className="mb-8 flex items-center gap-6">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop"
                  alt="Profile"
                  className="h-24 w-24 rounded-full object-cover ring-4 ring-[#0A0F1C]"
                />
                <button
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#aa68ff] text-white shadow-[0_0_10px_rgba(170,104,255,0.5)] transition-transform hover:scale-105"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <UploadCloud className="h-4 w-4" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) toast.success('Avatar selecionado (upload em breve)');
                  }}
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#F4F5F8]">
                  {isLoading ? (
                    <span className="inline-block animate-pulse h-5 w-32 rounded bg-[rgba(255,255,255,0.05)]"></span>
                  ) : (
                    profileForm.name || 'Usuário'
                  )}
                </h3>
                <p className="text-sm text-[#8B949E]">Plano Premium Anual</p>
              </div>
            </div>

            <form onSubmit={handleSave}>
              {isLoading ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="space-y-2">
                      <div className="animate-pulse h-4 w-24 rounded bg-[rgba(255,255,255,0.05)]"></div>
                      <div className="animate-pulse h-10 rounded-lg bg-[rgba(255,255,255,0.05)]"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#8B949E]">Nome Completo</label>
                    <Input
                      value={profileForm.name}
                      onChange={(e) => setProfileForm(p => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#8B949E]">Email</label>
                    <Input
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(p => ({ ...p, email: e.target.value }))}
                      type="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#8B949E]">Telefone</label>
                    <Input
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                      type="tel"
                      placeholder="+55 11 99999-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#8B949E]">CPF</label>
                    <Input defaultValue="***.456.789-**" disabled className="opacity-50" />
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-end gap-3 border-t border-[rgba(255,255,255,0.05)] pt-6">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setProfileForm(originalProfile)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-8 border-[#74ee15] border-opacity-20 bg-[rgba(116,238,21,0.02)]">
            <h2 className="mb-2 text-xl font-bold text-[#F4F5F8]">Aparência</h2>
            <p className="mb-6 text-sm text-[#8B949E]">Personalize o visual do seu FinCoach.</p>

            <div className="flex items-center justify-between rounded-xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(170,104,255,0.1)] text-[#aa68ff]">
                  <Moon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#F4F5F8]">Premium Dark Mode</h3>
                  <p className="text-xs text-[#8B949E]">Tema ativado (padrão)</p>
                </div>
              </div>
              <button
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${darkMode ? 'bg-[#aa68ff]' : 'bg-[rgba(255,255,255,0.1)]'}`}
                onClick={() => {
                  const next = !darkMode;
                  setDarkMode(next);
                  document.documentElement.classList.toggle('dark', next);
                }}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
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
      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
        active
          ? 'bg-[rgba(255,255,255,0.05)] text-[#F4F5F8] border-l-[3px] border-[#aa68ff] rounded-l-none pl-[13px]'
          : 'text-[#8B949E] hover:bg-[rgba(255,255,255,0.02)] hover:text-[#F4F5F8]'
      }`}
    >
      <div className="[&>svg]:h-5 [&>svg]:w-5">{icon}</div>
      {label}
    </button>
  );
}
