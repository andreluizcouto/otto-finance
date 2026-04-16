import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
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
      <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden font-sans">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[800px] h-[800px] bg-white/[0.03] blur-[150px] rounded-full" />
        </div>
        <div className="relative z-10 w-full max-w-md px-6 py-6 md:py-10">
          <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-center">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/[0.02] blur-[40px] rounded-full pointer-events-none" />
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] mx-auto mb-6 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white/70" />
            </div>
            <h2 className="text-2xl font-light mb-3">Verifique seu e-mail</h2>
            <p className="text-sm text-white/40 leading-relaxed">
              Enviamos um link de confirmação para <span className="text-white">{credentials.email}</span>.
              Clique no link para ativar sua conta.
            </p>
            <button onClick={() => navigate('/login')} className="mt-8 min-h-[44px] text-[10px] font-medium tracking-[0.2em] text-white/40 uppercase hover:text-white transition-colors">
              Voltar ao login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden font-sans">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[800px] bg-white/[0.03] blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6 py-6 md:py-10">
        <div className="flex flex-col items-center mb-8 md:mb-12">
          <span className="text-3xl md:text-4xl tracking-[0.3em] font-medium mb-4">OTTO</span>
          <h1 className="text-xs font-medium tracking-[0.2em] text-white/40 uppercase">Criar conta</h1>
        </div>

        <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/[0.02] blur-[40px] rounded-full pointer-events-none" />

          <div className="text-center mb-8">
            <h2 className="text-xl md:text-2xl font-light mb-2">Abra seu acesso</h2>
            <p className="text-white/40 text-sm">Use o mesmo padrão visual do login, mantendo a lógica de cadastro.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium tracking-widest text-white/40 uppercase pl-1">E-mail</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="nome@dominio.com"
                    value={credentials.email}
                    onChange={(e) => setCredentials((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 min-h-[48px] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/[0.06] transition-all"
                  />
                  <Mail className="w-4 h-4 text-white/20 absolute right-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium tracking-widest text-white/40 uppercase pl-1">Senha</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={credentials.password}
                    onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 min-h-[48px] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/[0.06] transition-all pr-10"
                  />
                  <Lock className="w-4 h-4 text-white/20 absolute right-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium tracking-widest text-white/40 uppercase pl-1">Confirmar senha</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={credentials.confirm}
                    onChange={(e) => setCredentials((prev) => ({ ...prev, confirm: e.target.value }))}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 min-h-[48px] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/[0.06] transition-all pr-10"
                  />
                  <Lock className="w-4 h-4 text-white/20 absolute right-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs text-red-400 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 min-h-[48px] rounded-xl bg-white text-black font-medium flex items-center justify-center gap-2 hover:bg-white/90 transition-all group disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>
                Criar conta
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>}
            </button>
          </form>
        </div>

        <p className="text-center mt-10 text-white/30 text-xs tracking-wide">
          Já tem conta? <button onClick={() => navigate('/login')} className="text-white/60 hover:text-white transition-all font-medium border-b border-white/20 hover:border-white pb-0.5">Entrar</button>
        </p>
      </div>
    </div>
  );
}
