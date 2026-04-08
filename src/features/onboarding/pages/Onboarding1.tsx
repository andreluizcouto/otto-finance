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
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="flex w-full items-center justify-between px-10 py-10">
        <button onClick={() => navigate(-1)} className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-foreground transition-all hover:bg-muted border border-border">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button onClick={() => navigate('/dashboard')} className="text-[10px] otto-label text-muted-foreground transition-all hover:text-foreground">
          SKIP PROTOCOL
        </button>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="mb-10 text-[9px] otto-label text-muted-foreground tracking-[0.4em]">
          PROTOCOL 01 / 03
        </div>

        <h1 className="mb-4 text-center text-4xl font-light text-foreground otto-title">
          Objetivo Estratégico
        </h1>
        <p className="mb-16 text-center text-sm text-muted-foreground font-medium leading-relaxed">
          Defina o horizonte para a personalização do seu<br />assistente de patrimônio digital.
        </p>

        <div className="flex w-full flex-col gap-6">
          <GoalCard
            title="Capital Preservation"
            description="Consolidação de reserva e otimização de fluxos de saída."
            icon={<PiggyBank className="h-5 w-5" />}
            selected={selectedGoal === "economizar"}
            onClick={() => setSelectedGoal("economizar")}
          />
          <GoalCard
            title="Debt Restructuring"
            description="Organização de passivos e renegociação de alavancagem."
            icon={<Scissors className="h-5 w-5" />}
            selected={selectedGoal === "dividas"}
            onClick={() => setSelectedGoal("dividas")}
          />
          <GoalCard
            title="Wealth Expansion"
            description="Maximização de aportes e busca por rentabilidade superior."
            icon={<TrendingUp className="h-5 w-5" />}
            selected={selectedGoal === "investir"}
            onClick={() => setSelectedGoal("investir")}
          />
        </div>

        <Card className="mt-10 w-full p-8 border-border bg-secondary/20">
          <h3 className="mb-6 text-[10px] otto-label text-muted-foreground tracking-widest">NÍVEL DE MONITORAMENTO</h3>
          <div className="flex flex-wrap gap-4">
            {['Weekly Summary', 'Daily Insights', 'Real-time Pulse'].map((freq) => {
              const value = freq.split(' ')[0].toLowerCase();
              return (
                <button
                  key={value}
                  onClick={() => setFrequency(value)}
                  className={`rounded-xl px-6 py-3 text-[10px] otto-label transition-all border ${
                    frequency === value
                      ? 'border-primary/20 bg-primary/10 text-foreground shadow-xl'
                      : 'border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  {freq}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="mt-8 flex w-full items-center justify-between p-8 border-border bg-secondary/20">
          <div className="flex gap-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-background text-foreground border border-border">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground tracking-tight uppercase">OTTO Intelligent Analysis</h3>
              <p className="mt-1 text-[10px] otto-label text-muted-foreground/40">PROCESSAMENTO PROATIVO DE PADRÕES FINANCEIROS</p>
            </div>
          </div>
          <button
            onClick={() => setAiEnabled(!aiEnabled)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-500 ${
              aiEnabled ? 'bg-primary' : 'bg-secondary'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-primary-foreground transition-transform duration-500 ${
                aiEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </Card>

        <div className="mt-16 flex w-full justify-end">
          <Button
            size="lg"
            onClick={handleNext}
            disabled={isSubmitting}
            className="w-full md:w-auto px-12 py-8 text-[10px] otto-label tracking-[0.2em]"
          >
            CONFIRM & CONTINUE →
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
      className={`cursor-pointer p-8 transition-all duration-500 border-border ${
        selected ? 'bg-secondary border-primary/20 shadow-2xl scale-[1.02]' : 'bg-background hover:bg-secondary/50 hover:border-muted-foreground/20'
      }`}
    >
      <div className="flex items-start gap-6">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-all duration-500 ${selected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
          {icon}
        </div>
        <div>
          <h3 className={`text-sm font-medium tracking-tight uppercase transition-colors ${selected ? 'text-foreground' : 'text-muted-foreground'}`}>{title}</h3>
          <p className="mt-1.5 text-xs text-muted-foreground/40 font-medium leading-relaxed">{description}</p>
        </div>
      </div>
    </Card>
  );
}
