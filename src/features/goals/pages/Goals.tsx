import { useState } from "react";
import { Card, Button, Badge } from "@/shared/components/ui";
import { Target, TrendingUp, Car, Sparkles, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function Goals() {
  const [goals, setGoals] = useState([
    { id: '1', name: 'Reserva de Emergência', current: 6500, target: 10000, priority: 'PRIORITY: HIGH', status: 'on_track' },
    { id: '2', name: 'Wealth Expansion', current: 16000, target: 50000, status: 'on_track' },
    { id: '3', name: 'Strategic Asset', current: 6400, target: 80000, status: 'delayed' },
  ]);

  const goalIcons: Record<string, React.ReactNode> = {
    '1': <Target className="h-5 w-5" />,
    '2': <TrendingUp className="h-5 w-5" />,
    '3': <Car className="h-5 w-5" />,
  };

  return (
    <div className="flex flex-col gap-10 pt-6 max-w-7xl mx-auto px-6">
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-4xl otto-title text-white">Objetivos</h1>
          <p className="mt-2 otto-label text-xs">Planejamento Estratégico de Patrimônio</p>
        </div>
        <Button onClick={() => toast.info('Criar nova meta em breve')} className="bg-white text-black hover:bg-white/90 rounded-xl px-6 py-6 text-[10px] otto-label transition-all">
          <Target className="mr-3 h-4 w-4" /> Definir Objetivo
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {goals.map((goal) => {
          const pct = Math.min((goal.current / goal.target) * 100, 100);
          const isDelayed = goal.status === 'delayed';

          return (
            <Card key={goal.id} className="relative overflow-hidden p-8 border-white/5 bg-white/[0.02]">
              <div className="mb-8 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-white border border-white/10">
                    {goalIcons[goal.id]}
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-white tracking-tight uppercase">{goal.name}</h2>
                    <div className="flex gap-2 mt-1.5">
                      {goal.priority && (
                        <span className="text-[9px] otto-label text-white/40 tracking-widest">{goal.priority}</span>
                      )}
                      {isDelayed && (
                        <span className="text-[9px] otto-label text-red-400/60 tracking-widest">DELAYED</span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-3xl font-light text-white otto-title">{pct.toFixed(0)}%</span>
              </div>

              <div className="mb-8 relative z-10">
                <div className="mb-3 flex items-end justify-between">
                  <span className="text-[11px] otto-label text-white">
                    R$ {goal.current.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-[9px] otto-label text-white/20">
                    TARGET: R$ {goal.target.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-1000"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {goal.status === 'on_track' && (
                <div className="flex flex-col gap-4 rounded-xl bg-white/[0.03] p-6 border border-white/5 relative z-10">
                  <div className="flex items-center gap-3 text-[10px] otto-label text-white">
                    <Sparkles className="h-4 w-4" /> AI STRATEGY
                  </div>
                  <p className="text-sm text-white/40 leading-relaxed font-medium">
                    Projeção favorável. Mantendo a cadência atual de aportes, a meta será consolidada dentro do horizonte planejado.
                  </p>
                  <div className="flex gap-4 mt-2">
                    <Button
                      size="sm"
                      className="bg-white text-black hover:bg-white/90 rounded-lg px-4"
                      onClick={() => toast.info('Otimização em breve')}
                    >
                      OPTIMIZE
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="px-4"
                    >
                      IGNORE
                    </Button>
                  </div>
                </div>
              )}

              {isDelayed && (
                <div className="flex flex-col gap-4 rounded-xl bg-red-500/5 p-6 border border-red-500/10 relative z-10">
                  <div className="flex items-center gap-3 text-[10px] otto-label text-red-400/60">
                    <AlertCircle className="h-4 w-4" /> ATTENTION REQUIRED
                  </div>
                  <p className="text-sm text-white/40 leading-relaxed font-medium">
                    Fluxo de capital interrompido. Rebalanceamento necessário de <strong className="text-white">R$ 180,00/mês</strong> para manter o deadline (Dez / 2026).
                  </p>
                </div>
              )}
            </Card>
          );
        })}

        <Card
          className="flex h-full min-h-[300px] cursor-pointer flex-col items-center justify-center gap-6 border-dashed border-white/10 bg-transparent transition-all hover:border-white/40 hover:bg-white/[0.02] group"
          onClick={() => toast.info('Definição de meta em breve')}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-white/20 transition-all group-hover:bg-white/10 group-hover:text-white">
            <Plus className="h-8 w-8" />
          </div>
          <div className="text-center px-8">
            <h3 className="text-sm font-medium text-white tracking-tight uppercase mb-2">Novo Objetivo Estratégico</h3>
            <p className="text-[10px] otto-label text-white/20 leading-loose uppercase tracking-[0.2em]">Deixe a inteligência OTTO traçar a rota para sua próxima conquista.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

