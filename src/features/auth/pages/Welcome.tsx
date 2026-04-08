import { useState } from "react";
import { useNavigate } from "react-router";
import { Button, Card } from "@/shared/components/ui";
import { CheckCircle2, Shield, BrainCircuit, Play, Apple } from "lucide-react";
import { toast } from "sonner";

export function Welcome() {
  const navigate = useNavigate();
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const handleSocialLogin = (provider: string) => {
    if (socialLoading !== null) return;
    setSocialLoading(provider);
    toast.info('Em breve — OAuth com ' + provider + ' não implementado ainda');
    setTimeout(() => setSocialLoading(null), 500);
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-2 lg:items-center">
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#aa68ff] to-[#820ad1] shadow-[0_0_15px_rgba(170,104,255,0.3)]">
            <span className="text-lg font-bold text-white">F</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white" style={{ textShadow: '0 0 10px rgba(170,104,255,0.5)' }}>
            FinCoach<span className="text-[#aa68ff]">.AI</span>
          </span>
        </div>

        <div className="space-y-4">
          <h1 className="text-5xl font-bold leading-[1.1] tracking-[-0.02em] text-[#F4F5F8] lg:text-6xl">
            Controle financeiro<br />com IA
          </h1>
        </div>

        <ul className="space-y-4 text-sm font-medium text-[#8B949E]">
          <li className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-[#74ee15]" />
            Análise inteligente de gastos em tempo real
          </li>
          <li className="flex items-center gap-3">
            <BrainCircuit className="h-5 w-5 text-[#aa68ff]" />
            Metas automáticas baseadas no seu perfil
          </li>
          <li className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-[#F4F5F8]" />
            Segurança bancária de nível militar
          </li>
        </ul>

        <div className="mt-4 flex items-center gap-4 rounded-xl bg-[rgba(255,255,255,0.02)] p-4 border border-[rgba(255,255,255,0.05)] w-fit">
          <div className="flex -space-x-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 w-10 rounded-full border-2 border-[#0A0F1C] bg-[rgba(170,104,255,0.2)]" />
            ))}
          </div>
          <div className="flex flex-col">
            <div className="flex text-[#74ee15]">
              {'★★★★★'.split('').map((star, i) => (
                <span key={i} className="text-sm">{star}</span>
              ))}
            </div>
            <span className="text-xs text-[#8B949E]">+50k usuários ativos</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <Card className="flex flex-col gap-6 p-8">
          <div>
            <h2 className="text-2xl font-bold tracking-[-0.02em] text-[#F4F5F8]">Comece agora</h2>
            <p className="mt-1 text-sm text-[#8B949E]">Junte-se à revolução financeira com IA.</p>
          </div>

          <Button size="lg" className="w-full bg-white text-black hover:bg-gray-100 shadow-none border border-transparent hover:transform-none" onClick={() => navigate('/onboarding/1')}>
            Criar conta / Continuar →
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[rgba(255,255,255,0.1)]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0A0F1C] px-2 text-[#8B949E]">ou</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => handleSocialLogin('Google')}
              disabled={!!socialLoading}
            >
              <Play className="mr-2 h-4 w-4" />
              {socialLoading === 'Google' ? 'Carregando...' : 'Continuar com Google'}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => handleSocialLogin('Apple')}
              disabled={!!socialLoading}
            >
              <Apple className="mr-2 h-4 w-4" />
              {socialLoading === 'Apple' ? 'Carregando...' : 'Continuar com Apple'}
            </Button>
          </div>

          <p className="text-center text-xs text-[#8B949E]">
            Já tem uma conta? <button onClick={() => navigate('/login')} className="font-semibold text-white hover:underline">Entrar</button>
          </p>
        </Card>

        <div className="grid grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="mb-4 inline-flex rounded-lg bg-[rgba(170,104,255,0.1)] p-2 text-[#aa68ff]">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-[#F4F5F8]">Insights IA</h3>
            <p className="mt-1 text-xs text-[#8B949E]">Previsões exatas</p>
            <div className="mt-4 flex items-end gap-1 h-8">
              <div className="w-full bg-[rgba(255,255,255,0.1)] h-1/3 rounded-sm"></div>
              <div className="w-full bg-[rgba(255,255,255,0.15)] h-2/3 rounded-sm"></div>
              <div className="w-full bg-[rgba(255,255,255,0.2)] h-full rounded-sm"></div>
              <div className="w-full bg-[#aa68ff] h-[120%] rounded-sm"></div>
            </div>
          </Card>
          <Card className="p-6 relative overflow-hidden border-[rgba(116,238,21,0.2)]">
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[rgba(116,238,21,0.1)] blur-2xl"></div>
            <div className="mb-4 inline-flex rounded-lg bg-[rgba(116,238,21,0.1)] p-2 text-[#74ee15]">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-[#F4F5F8]">Segurança</h3>
            <p className="mt-1 text-xs text-[#8B949E]">Criptografia 256-bit</p>
            <div className="mt-4 h-1.5 w-full rounded-full bg-[rgba(255,255,255,0.1)] overflow-hidden">
              <div className="h-full w-[80%] rounded-full bg-[#74ee15]"></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
