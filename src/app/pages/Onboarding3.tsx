import { useState } from "react";
import { useNavigate } from "react-router";
import { Button, Card, Badge } from "../components/ui";
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
    <div className="flex min-h-screen w-full flex-col">
      <header className="flex w-full items-center justify-between px-6 py-6 md:px-12">
        <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)] text-[#F4F5F8] transition-colors hover:bg-[rgba(255,255,255,0.1)]">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button onClick={() => navigate('/dashboard')} className="text-sm font-medium text-[#8B949E] transition-colors hover:text-[#F4F5F8]">
          Pular
        </button>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-12">
        <div className="mb-12 flex flex-col items-center">
          <div className="mb-8 rounded-full border border-[rgba(170,104,255,0.2)] bg-[rgba(170,104,255,0.05)] px-3 py-1 text-xs font-semibold tracking-widest text-[#aa68ff] uppercase">
            PASSO 03 DE 03
          </div>

          <h1 className="mb-3 text-center text-3xl font-bold tracking-tight text-[#F4F5F8] md:text-4xl">
            Defina seu orçamento
          </h1>
          <p className="text-center text-[#8B949E]">
            Ajuste os limites iniciais por categoria e confirme a primeira meta<br />sugerida pela IA baseada no seu perfil.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-5">
          <div className="flex flex-col gap-6 lg:col-span-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[#F4F5F8]">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[rgba(170,104,255,0.1)] text-[#aa68ff]">
                <Home className="h-3 w-3" />
              </span>
              Categorias de Gasto
            </h2>

            <Card className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(170,104,255,0.1)] text-[#aa68ff]">
                    <Home className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#F4F5F8]">Essenciais</h3>
                    <p className="text-xs text-[#8B949E]">Moradia, contas, mercado</p>
                  </div>
                </div>
                <select className="rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-3 py-1.5 text-xs text-[#F4F5F8] outline-none">
                  <option>Mensal</option>
                  <option>Semanal</option>
                </select>
              </div>

              <div className="mb-6">
                <div className="mb-2 flex items-end justify-between">
                  <span className="text-xs text-[#8B949E]">Limite sugerido</span>
                  <span className="text-xl font-bold text-[#F4F5F8]">R$ {essentials.toLocaleString('pt-BR')}</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="6000"
                  step="100"
                  value={essentials}
                  onChange={(e) => setEssentials(Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[rgba(255,255,255,0.1)] accent-[#aa68ff]"
                  style={{
                    background: `linear-gradient(to right, #aa68ff ${(essentials - 1000) / 50}%, rgba(255,255,255,0.1) ${(essentials - 1000) / 50}%)`
                  }}
                />
                <div className="mt-1 flex justify-between text-[10px] text-[#8B949E]">
                  <span>R$ 1k</span>
                  <span>R$ 6k</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[rgba(255,255,255,0.05)] pt-4">
                <div className="flex items-center gap-2 text-xs text-[#8B949E]">
                  <BellRing className="h-4 w-4" /> Alerta aos 80%
                </div>
                <button
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${alertEssentials ? 'bg-[#aa68ff]' : 'bg-[rgba(255,255,255,0.1)]'}`}
                  onClick={() => setAlertEssentials(p => !p)}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${alertEssentials ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(116,238,21,0.1)] text-[#74ee15]">
                    <Coffee className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#F4F5F8]">Lazer & Estilo</h3>
                    <p className="text-xs text-[#8B949E]">Restaurantes, assinaturas, compras</p>
                  </div>
                </div>
                <select className="rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-3 py-1.5 text-xs text-[#F4F5F8] outline-none">
                  <option>Mensal</option>
                  <option>Semanal</option>
                </select>
              </div>

              <div className="mb-6">
                <div className="mb-2 flex items-end justify-between">
                  <span className="text-xs text-[#8B949E]">Limite sugerido</span>
                  <span className="text-xl font-bold text-[#F4F5F8]">R$ {leisure.toLocaleString('pt-BR')}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="3000"
                  step="50"
                  value={leisure}
                  onChange={(e) => setLeisure(Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[rgba(255,255,255,0.1)] accent-[#aa68ff]"
                  style={{
                    background: `linear-gradient(to right, #aa68ff ${(leisure - 500) / 25}%, rgba(255,255,255,0.1) ${(leisure - 500) / 25}%)`
                  }}
                />
                <div className="mt-1 flex justify-between text-[10px] text-[#8B949E]">
                  <span>R$ 500</span>
                  <span>R$ 3k</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[rgba(255,255,255,0.05)] pt-4">
                <div className="flex items-center gap-2 text-xs text-[#8B949E]">
                  <BellRing className="h-4 w-4" /> Alerta aos 80%
                </div>
                <button
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${alertLeisure ? 'bg-[#aa68ff]' : 'bg-[rgba(255,255,255,0.1)]'}`}
                  onClick={() => setAlertLeisure(p => !p)}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${alertLeisure ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
            </Card>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-2">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[#F4F5F8]">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[rgba(116,238,21,0.1)] text-[#74ee15]">
                <SparklesIcon className="h-3 w-3" />
              </span>
              Sugestão da IA
            </h2>

            <Card className="relative overflow-hidden border border-[#74ee15] border-opacity-30 p-1">
              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[rgba(116,238,21,0.15)] blur-2xl"></div>
              <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-[rgba(116,238,21,0.15)] blur-2xl"></div>

              <div className="relative h-full rounded-xl bg-[rgba(10,15,28,0.8)] p-6 backdrop-blur-md">
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)]">
                    <PiggyBank className="h-6 w-6 text-[#F4F5F8]" />
                  </div>
                  <Badge variant="success" className="text-[10px]">RECOMENDADO</Badge>
                </div>

                <h3 className="mb-3 text-xl font-bold text-[#F4F5F8]">Reserva de Emergência</h3>
                <p className="mb-8 text-sm leading-relaxed text-[#8B949E]">
                  Com base na sua renda conectada, sugerimos criar um fundo de segurança equivalente a 3 meses dos seus gastos essenciais.
                </p>

                <div className="mb-6 space-y-3 border-y border-[rgba(255,255,255,0.05)] py-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8B949E]">Meta Total</span>
                    <span className="font-semibold text-[#74ee15]">R$ 10.500</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8B949E]">Depósito Mensal</span>
                    <span className="font-semibold text-[#F4F5F8]">R$ 500</span>
                  </div>
                </div>

                <Button
                  className="w-full bg-[rgba(116,238,21,0.1)] text-[#74ee15] border border-[rgba(116,238,21,0.2)] hover:bg-[rgba(116,238,21,0.2)] shadow-none"
                  onClick={() => toast.success('Meta adicionada ao seu perfil em breve')}
                >
                  <Check className="mr-2 h-4 w-4" /> Aceitar Meta
                </Button>
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-12 flex w-full justify-end">
          <Button size="lg" onClick={handleFinish} className="px-8">
            Ir para o Dashboard
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
