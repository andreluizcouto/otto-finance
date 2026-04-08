import { useState } from "react";
import { useNavigate } from "react-router";
import { Button, Card } from "@/shared/components/ui";
import { ArrowLeft, PiggyBank, Scissors, TrendingUp, Sparkles } from "lucide-react";

export function Onboarding1() {
  const navigate = useNavigate();
  const [selectedGoal, setSelectedGoal] = useState<string | null>("economizar");
  const [frequency, setFrequency] = useState("diario");
  const [aiEnabled, setAiEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    localStorage.setItem('onboarding_step1', JSON.stringify({ selectedGoal, frequency, aiEnabled }));
    navigate('/onboarding/2');
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

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 rounded-full border border-[rgba(170,104,255,0.2)] bg-[rgba(170,104,255,0.05)] px-3 py-1 text-xs font-semibold tracking-widest text-[#aa68ff] uppercase">
          PASSO 01 DE 03
        </div>

        <h1 className="mb-3 text-center text-3xl font-bold tracking-tight text-[#F4F5F8] md:text-4xl">
          Qual o seu objetivo principal?
        </h1>
        <p className="mb-12 text-center text-[#8B949E]">
          Isso nos ajuda a personalizar as recomendações da<br />inteligência artificial para o seu momento financeiro.
        </p>

        <div className="flex w-full flex-col gap-4">
          <GoalCard
            title="Economizar"
            description="Criar reserva de emergência e cortar gastos desnecessários."
            icon={<PiggyBank className="h-6 w-6" />}
            selected={selectedGoal === "economizar"}
            onClick={() => setSelectedGoal("economizar")}
          />
          <GoalCard
            title="Quitar Dívidas"
            description="Organizar pendências e renegociar taxas de juros."
            icon={<Scissors className="h-6 w-6" />}
            selected={selectedGoal === "dividas"}
            onClick={() => setSelectedGoal("dividas")}
          />
          <GoalCard
            title="Investir & Multiplicar"
            description="Aumentar patrimônio e buscar melhores rentabilidades no mercado."
            icon={<TrendingUp className="h-6 w-6" />}
            selected={selectedGoal === "investir"}
            onClick={() => setSelectedGoal("investir")}
          />
        </div>

        <Card className="mt-8 w-full p-6">
          <h3 className="mb-4 text-sm font-semibold text-[#F4F5F8]">Nível de acompanhamento desejado</h3>
          <div className="flex flex-wrap gap-3">
            {['Resumo Semanal', 'Diário (Recomendado)', 'Micro-gestão'].map((freq) => {
              const value = freq.split(' ')[0].toLowerCase();
              return (
                <button
                  key={value}
                  onClick={() => setFrequency(value)}
                  className={`rounded-full px-4 py-2 text-sm transition-all ${
                    frequency === value
                      ? 'border border-[#aa68ff] bg-[rgba(170,104,255,0.1)] text-[#F4F5F8]'
                      : 'border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] text-[#8B949E] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#F4F5F8]'
                  }`}
                >
                  {freq}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="mt-6 flex w-full items-center justify-between p-6">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(170,104,255,0.1)] text-[#aa68ff]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#F4F5F8]">Recomendações com IA</h3>
              <p className="mt-1 text-xs text-[#8B949E]">Permitir que a FinCoach analise seus padrões para sugerir ações proativas.</p>
            </div>
          </div>
          <button
            onClick={() => setAiEnabled(!aiEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              aiEnabled ? 'bg-[#aa68ff]' : 'bg-[rgba(255,255,255,0.1)]'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                aiEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </Card>

        <div className="mt-12 flex w-full justify-end">
          <Button
            size="lg"
            onClick={handleNext}
            disabled={isSubmitting}
            className="disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próximo Passo →
          </Button>
        </div>
      </main>
    </div>
  );
}

function GoalCard({ title, description, icon, selected, onClick }: { title: string; description: string; icon: React.ReactNode; selected: boolean; onClick: () => void }) {
  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer p-6 transition-all hover:border-[rgba(170,104,255,0.5)] ${
        selected ? 'border-[#aa68ff] bg-[rgba(170,104,255,0.05)] shadow-[0_0_20px_rgba(170,104,255,0.15)]' : ''
      }`}
    >
      <div className="flex items-start gap-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[rgba(255,255,255,0.05)] text-[#F4F5F8]">
          {icon}
        </div>
        <div>
          <h3 className="text-base font-semibold text-[#F4F5F8]">{title}</h3>
          <p className="mt-1 text-sm text-[#8B949E]">{description}</p>
        </div>
      </div>
    </Card>
  );
}
