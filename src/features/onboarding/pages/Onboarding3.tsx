import { useState } from "react";
import { useNavigate } from "react-router";
import { Button, Card, Badge } from "@/shared/components/ui";
import { ArrowLeft, Home, Coffee, BellRing, Check, PiggyBank } from "lucide-react";
import { toast } from "sonner";

export function Onboarding3() {
  const navigate = useNavigate();
  const [essentials, setEssentials] = useState(3500);
  const [leisure, setLeisure] = useState(1200);
  const [alertEssentials, setAlertEssentials] = useState(true);
  const [alertLeisure, setAlertLeisure] = useState(true);

  const handleFinish = () => {
    const step1 = JSON.parse(localStorage.getItem('onboarding_step1') || '{}');
    localStorage.setItem('onboarding_complete', JSON.stringify({
      ...step1,
      budgets: { essentials, leisure },
      alerts: { essentials: alertEssentials, leisure: alertLeisure },
    }));
    navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-black">
      <header className="flex w-full items-center justify-between px-10 py-10">
        <button onClick={() => navigate(-1)} className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white transition-all hover:bg-white/10 border border-white/5">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button onClick={() => navigate('/dashboard')} className="text-[10px] otto-label text-white/40 transition-all hover:text-white">
          SKIP PROTOCOL
        </button>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-12">
        <div className="mb-16 flex flex-col items-center">
          <div className="mb-10 text-[9px] otto-label text-white/40 tracking-[0.4em]">
            PROTOCOL 03 / 03
          </div>

          <h1 className="mb-4 text-center text-4xl font-light text-white otto-title">
            Parametrização de Fluxos
          </h1>
          <p className="text-center text-sm text-white/40 font-medium leading-relaxed">
            Ajuste os limites de alocação e confirme as projeções estratégicas<br />sugeridas pela inteligência OTTO para o seu perfil.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-5">
          <div className="flex flex-col gap-8 lg:col-span-3">
            <h2 className="flex items-center gap-4 text-[10px] otto-label text-white/40 tracking-widest uppercase">
              Alocação por Categoria
            </h2>

            <Card className="p-8 border-white/5 bg-white/[0.02]">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-white border border-white/10">
                    <Home className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white tracking-tight uppercase">Custodian Essentials</h3>
                    <p className="text-[10px] otto-label text-white/20 mt-0.5">ESTRUTURA, SUBSISTÊNCIA, LOGÍSTICA</p>
                  </div>
                </div>
                <select className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[10px] otto-label text-white outline-none cursor-pointer hover:border-white/20 transition-all">
                  <option>MONTHLY</option>
                  <option>QUARTERLY</option>
                </select>
              </div>

              <div className="mb-8">
                <div className="mb-4 flex items-end justify-between">
                  <span className="text-[10px] otto-label text-white/40">SUGGESTED LIMIT</span>
                  <span className="text-2xl font-light text-white otto-title">R$ {essentials.toLocaleString('pt-BR')}</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="6000"
                  step="100"
                  value={essentials}
                  onChange={(e) => setEssentials(Number(e.target.value))}
                  className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-white"
                />
                <div className="mt-3 flex justify-between text-[9px] otto-label text-white/20">
                  <span>R$ 1.000</span>
                  <span>R$ 6.000</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-6">
                <div className="flex items-center gap-3 text-[10px] otto-label text-white/40">
                  <BellRing className="h-4 w-4" /> NOTIFICAÇÃO AOS 80%
                </div>
                <button
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-500 ${alertEssentials ? 'bg-white' : 'bg-white/10'}`}
                  onClick={() => setAlertEssentials(p => !p)}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform duration-500 ${alertEssentials ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </Card>

            <Card className="p-8 border-white/5 bg-white/[0.02]">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-white border border-white/10">
                    <Coffee className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white tracking-tight uppercase">Lifestyle & Alpha</h3>
                    <p className="text-[10px] otto-label text-white/20 mt-0.5">EXPERIÊNCIAS, CONSUMO, LAZER</p>
                  </div>
                </div>
                <select className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[10px] otto-label text-white outline-none cursor-pointer hover:border-white/20 transition-all">
                  <option>MONTHLY</option>
                  <option>QUARTERLY</option>
                </select>
              </div>

              <div className="mb-8">
                <div className="mb-4 flex items-end justify-between">
                  <span className="text-[10px] otto-label text-white/40">SUGGESTED LIMIT</span>
                  <span className="text-2xl font-light text-white otto-title">R$ {leisure.toLocaleString('pt-BR')}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="3000"
                  step="50"
                  value={leisure}
                  onChange={(e) => setLeisure(Number(e.target.value))}
                  className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-white"
                />
                <div className="mt-3 flex justify-between text-[9px] otto-label text-white/20">
                  <span>R$ 500</span>
                  <span>R$ 3.000</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-6">
                <div className="flex items-center gap-3 text-[10px] otto-label text-white/40">
                  <BellRing className="h-4 w-4" /> NOTIFICAÇÃO AOS 80%
                </div>
                <button
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-500 ${alertLeisure ? 'bg-white' : 'bg-white/10'}`}
                  onClick={() => setAlertLeisure(p => !p)}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform duration-500 ${alertLeisure ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </Card>
          </div>

          <div className="flex flex-col gap-8 lg:col-span-2">
            <h2 className="flex items-center gap-4 text-[10px] otto-label text-white/40 tracking-widest uppercase">
              Estratégia OTTO
            </h2>

            <Card className="relative overflow-hidden border-white/10 bg-white/5 p-1">
              <div className="relative h-full rounded-xl bg-black/40 p-8 backdrop-blur-3xl">
                <div className="mb-8 flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5 border border-white/10">
                    <PiggyBank className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-[8px] otto-label text-white bg-white/10 px-2 py-1 rounded tracking-widest">RECOMMENDED</span>
                </div>

                <h3 className="mb-4 text-xl font-light text-white otto-title">Capital Buffer</h3>
                <p className="mb-10 text-sm leading-relaxed text-white/40 font-medium">
                  Com base na sua liquidez conectada, projetamos um fundo de segurança equivalente a 3 ciclos de gastos essenciais.
                </p>

                <div className="mb-10 space-y-4 border-y border-white/5 py-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] otto-label text-white/40">TOTAL TARGET</span>
                    <span className="text-lg font-light text-white otto-title">R$ 10.500</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] otto-label text-white/40">MONTHLY FLOW</span>
                    <span className="text-lg font-light text-white otto-title">R$ 500</span>
                  </div>
                </div>

                <Button
                  className="w-full bg-white text-black hover:bg-white/90 rounded-xl py-8 text-[10px] otto-label tracking-[0.2em]"
                  onClick={() => toast.success('Estratégia consolidada')}
                >
                  <Check className="mr-3 h-4 w-4" /> DEPLOY STRATEGY
                </Button>
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-16 flex w-full justify-end pb-12">
          <Button
            size="lg"
            onClick={handleFinish}
            className="w-full md:w-auto bg-white text-black hover:bg-white/90 rounded-xl px-12 py-8 text-[10px] otto-label tracking-[0.2em]"
          >
            INITIALIZE DASHBOARD →
          </Button>
        </div>
      </main>
    </div>
  );
}

function SparklesIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}
