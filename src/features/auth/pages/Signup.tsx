import { useState } from "react";
import { useNavigate } from "react-router";
import { Input } from "@/shared/components/ui";
import { Mail, Lock } from "lucide-react";
import { apiPost } from "@/shared/lib/api";
import { setToken } from "@/shared/lib/auth";

export function Signup() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: '', password: '', confirm: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (credentials.password !== credentials.confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const data = await apiPost('/api/auth/signup', {
        email: credentials.email,
        password: credentials.password,
      });
      if (data.needs_confirmation) {
        setNeedsConfirmation(true);
      } else if (data.session) {
        setToken(data.session.access_token);
        navigate('/onboarding/1');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (needsConfirmation) {
    return (
      <div className="flex w-full flex-col items-center justify-center min-h-[80vh]">
        <div className="w-full max-w-sm flex flex-col gap-10 text-center">
          <span className="text-4xl font-light tracking-[0.3em] text-foreground otto-title">OTTO</span>
          <div className="rounded-xl bg-secondary border border-border px-6 py-8 flex flex-col gap-4">
            <p className="text-sm font-medium text-foreground">Verifique seu e-mail</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enviamos um link de confirmação para <span className="text-foreground">{credentials.email}</span>.<br />
              Clique no link para ativar sua conta.
            </p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="text-[10px] otto-label text-muted-foreground hover:text-foreground transition-all"
          >
            Voltar ao login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center justify-center min-h-[80vh] py-6 md:py-10">
      <div className="w-full max-w-sm flex flex-col gap-8 md:gap-12">
        <div className="flex flex-col items-center text-center gap-4">
          <span className="text-3xl md:text-4xl font-light tracking-[0.3em] text-foreground otto-title">OTTO</span>
          <p className="otto-label text-[10px] text-muted-foreground tracking-[0.2em]">Criar Conta</p>
        </div>

        <form className="space-y-6 md:space-y-8" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="otto-label text-[9px] text-muted-foreground pl-1">Email</label>
              <Input
                placeholder="Endereço de e-mail"
                type="email"
                required
                className="bg-card border-border rounded-xl py-4 md:py-6 px-4 min-h-[48px] text-xs font-medium focus:border-white/20 transition-all shadow-none"
                value={credentials.email}
                onChange={(e) => setCredentials(p => ({ ...p, email: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="otto-label text-[9px] text-muted-foreground pl-1">Senha</label>
              <Input
                placeholder="••••••••"
                type="password"
                required
                minLength={6}
                className="bg-card border-border rounded-xl py-4 md:py-6 px-4 min-h-[48px] text-xs font-medium focus:border-white/20 transition-all shadow-none"
                value={credentials.password}
                onChange={(e) => setCredentials(p => ({ ...p, password: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="otto-label text-[9px] text-muted-foreground pl-1">Confirmar Senha</label>
              <Input
                placeholder="••••••••"
                type="password"
                required
                className="bg-card border-border rounded-xl py-4 md:py-6 px-4 min-h-[48px] text-xs font-medium focus:border-white/20 transition-all shadow-none"
                value={credentials.confirm}
                onChange={(e) => setCredentials(p => ({ ...p, confirm: e.target.value }))}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-[10px] otto-label text-red-400 text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 min-h-[48px] rounded-xl bg-white text-black font-medium flex items-center justify-center gap-2 hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.15)] text-sm tracking-widest uppercase"
          >
            {isSubmitting ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        <p className="text-center text-[10px] otto-label text-muted-foreground">
          Já tem conta?{' '}
          <button onClick={() => navigate('/login')} className="text-foreground hover:underline transition-all font-medium">
            Entrar
          </button>
        </p>
      </div>
    </div>
  );
}
