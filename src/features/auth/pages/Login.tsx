import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Fingerprint, Lock, Mail, Loader2 } from "lucide-react";
import { apiPost } from "@/shared/lib/api";
import { setToken } from "@/shared/lib/auth";
import { toast } from "sonner";

export function Login() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const data = await apiPost('/api/auth/login', credentials);
      if (data?.session?.access_token) {
        setToken(data.session.access_token);
        toast.success('Acesso autorizado.');
        navigate('/dashboard');
      } else {
        throw new Error('Token não recebido.');
      }
    } catch (err: any) {
      setError(err.message || 'Acesso negado.');
      toast.error('Erro na autenticação');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[800px] bg-white/[0.03] blur-[150px] rounded-full"></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-6 py-6 md:py-10">
        <div className="flex flex-col items-center mb-8 md:mb-12">
          <span className="text-3xl md:text-4xl tracking-[0.3em] font-medium mb-4">OTTO</span>
          <h1 className="text-xs font-medium tracking-[0.2em] text-white/40 uppercase">
            Quietly wealthy
          </h1>
        </div>

        {/* Glassmorphism Card */}
        <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/[0.02] blur-[40px] rounded-full pointer-events-none" />
          
          <div className="text-center mb-8">
            <h2 className="text-xl md:text-2xl font-light mb-2">Bem-vindo de volta</h2>
            <p className="text-white/40 text-sm">Digite suas credenciais para acessar sua conta.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium tracking-widest text-white/40 uppercase pl-1">Identidade</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="E-mail ou ID OTTO"
                    value={credentials.email}
                    onChange={(e) => setCredentials(p => ({ ...p, email: e.target.value }))}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 min-h-[48px] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/[0.06] transition-all"
                  />
                  <Mail className="w-4 h-4 text-white/20 absolute right-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center pl-1">
                  <label className="text-xs font-medium tracking-widest text-white/40 uppercase">Segredo</label>
                  <button 
                    type="button" 
                    onClick={() => toast.info('Protocolo de recuperação em desenvolvimento')}
                    className="text-[10px] font-medium tracking-widest text-white/20 uppercase hover:text-white transition-colors min-h-[44px]"
                  >
                    Esqueceu?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={credentials.password}
                    onChange={(e) => setCredentials(p => ({ ...p, password: e.target.value }))}
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

            <div className="flex items-center justify-between text-sm px-1">
              <label className="flex items-center gap-2 cursor-pointer group py-2">
                <div className="w-4 h-4 rounded border border-white/20 flex items-center justify-center group-hover:border-white/40 transition-colors">
                  <div className="w-2 h-2 bg-white rounded-sm opacity-0 group-hover:opacity-40 transition-opacity"></div>
                </div>
                <span className="text-white/40 group-hover:text-white/60 transition-colors text-xs uppercase tracking-wider">Lembrar acesso</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 min-h-[48px] rounded-xl bg-white text-black font-medium flex items-center justify-center gap-2 hover:bg-white/90 transition-all group disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Entrar
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="relative flex items-center justify-center pt-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative bg-transparent px-4">
                <span className="text-[10px] text-white/20 uppercase tracking-[0.2em]">ou</span>
              </div>
            </div>

            <button
              type="button"
              className="w-full h-14 rounded-xl bg-white/[0.03] border border-white/10 text-white/60 font-medium flex items-center justify-center gap-3 hover:bg-white/[0.08] hover:text-white transition-all"
            >
              <Fingerprint className="w-5 h-5 text-white/40" />
              <span className="text-xs uppercase tracking-widest">Biometria</span>
            </button>
          </form>
        </div>
        
        <p className="text-center mt-10 text-white/30 text-xs tracking-wide">
          Novo no OTTO? <button onClick={() => navigate('/signup')} className="text-white/60 hover:text-white transition-all font-medium border-b border-white/20 hover:border-white pb-0.5">Solicitar Acesso</button>
        </p>
      </div>
    </div>
  );
}
