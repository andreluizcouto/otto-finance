import { useNavigate } from "react-router";
import { Shield, ArrowRight } from "lucide-react";

export function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[800px] bg-white/[0.03] blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6 flex flex-col items-center gap-20">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-6xl tracking-[0.3em] font-medium">OTTO</span>
          <span className="text-[10px] font-medium tracking-[0.4em] text-white/30 uppercase">
            Gestão Financeira
          </span>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-4">
          <button
            onClick={() => navigate('/signup')}
            className="w-full h-14 rounded-xl bg-white text-black font-medium flex items-center justify-center gap-2 hover:bg-white/90 transition-all group shadow-[0_0_20px_rgba(255,255,255,0.15)] text-sm tracking-widest uppercase"
          >
            Criar Conta
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="text-center text-[10px] text-white/30 tracking-wide uppercase">
            Já tem conta?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-white/60 hover:text-white transition-colors font-medium border-b border-white/20 hover:border-white pb-0.5 normal-case"
            >
              Entrar
            </button>
          </p>
        </div>

        {/* Footer */}
        <div className="absolute bottom-12 flex items-center gap-2">
          <Shield className="h-3 w-3 text-white/20" />
          <span className="text-[9px] text-white/20 uppercase tracking-widest">Segurança Institucional</span>
        </div>
      </div>
    </div>
  );
}
