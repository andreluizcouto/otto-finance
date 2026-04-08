import { useState } from "react";
import { Card, Button, Badge } from "@/shared/components/ui";
import { Target, TrendingUp, Car, Sparkles, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function Goals() {
  const [goals, setGoals] = useState([
    { id: '1', name: 'Reserva de Emergência', current: 6500, target: 10000, color: '#aa68ff', priority: 'PRIORIDADE ALTA', status: 'on_track' },
    { id: '2', name: 'Investimento Tesouro', current: 16000, target: 50000, color: '#74ee15', status: 'on_track' },
    { id: '3', name: 'Trocar de Carro', current: 6400, target: 80000, color: '#EF4444', status: 'delayed' },
  ]);

  const goalIcons: Record<string, React.ReactNode> = {
    '1': <Target className="h-6 w-6" />,
    '2': <TrendingUp className="h-6 w-6" />,
    '3': <Car className="h-6 w-6" />,
  };

  return (
    <div className="flex flex-col gap-8 pt-4">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#F4F5F8]">Metas</h1>
          <p className="mt-1 text-sm text-[#8B949E]">Acompanhe o progresso dos seus objetivos e receba insights da IA.</p>
        </div>
        <Button onClick={() => toast.info('Criar nova meta em breve')}>
          <Target className="mr-2 h-4 w-4" /> Nova Meta
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {goals.map((goal) => {
          const pct = Math.min((goal.current / goal.target) * 100, 100);
          const isDelayed = goal.status === 'delayed';
          const borderClass = isDelayed
            ? 'border-red-500 border-opacity-30'
            : goal.color === '#aa68ff'
            ? 'border-[#aa68ff] border-opacity-30'
            : '';

          return (
            <Card key={goal.id} className={`relative overflow-hidden p-6 ${borderClass}`}>
              {goal.color === '#aa68ff' && (
                <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[rgba(170,104,255,0.1)] blur-3xl"></div>
              )}

              <div className="mb-4 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg"
                    style={{ backgroundColor: goal.color, boxShadow: `0 0 15px ${goal.color}66` }}
                  >
                    {goalIcons[goal.id]}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#F4F5F8]">{goal.name}</h2>
                    {goal.priority && (
                      <Badge variant="purple" className="mt-1">{goal.priority}</Badge>
                    )}
                    {isDelayed && !goal.priority && (
                      <Badge variant="danger" className="mt-1">EM ATRASO</Badge>
                    )}
                  </div>
                </div>
                <span className="text-2xl font-bold text-[#F4F5F8]">{pct.toFixed(0)}%</span>
              </div>

              <div className="mb-6 relative z-10">
                <div className="mb-2 flex items-end justify-between">
                  <span className="text-sm font-semibold" style={{ color: goal.color }}>
                    R$ {goal.current.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-xs text-[#8B949E]">
                    Meta: R$ {goal.target.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.1)] shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: goal.color,
                      boxShadow: `0 0 10px ${goal.color}80`,
                    }}
                  />
                </div>
              </div>

              {goal.status === 'on_track' && (
                <div className="flex flex-col gap-3 rounded-lg bg-[rgba(255,255,255,0.02)] p-4 relative z-10">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#74ee15] uppercase tracking-wider">
                    <Sparkles className="h-4 w-4" /> Insight da IA
                  </div>
                  <p className="text-sm text-[#8B949E] leading-relaxed">
                    Você está no caminho certo. Continue mantendo seus aportes regulares para atingir essa meta no prazo.
                  </p>
                  <div className="mt-2 flex gap-3">
                    <Button
                      size="sm"
                      className="bg-[rgba(116,238,21,0.1)] text-[#74ee15] hover:bg-[rgba(116,238,21,0.2)] shadow-none"
                      onClick={() => toast.info('Aplicar sugestão de meta em breve')}
                    >
                      Aceitar Sugestão
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setGoals(prev => prev.filter(g => g.id !== goal.id))}
                    >
                      Ignorar
                    </Button>
                  </div>
                </div>
              )}

              {isDelayed && (
                <div className="flex flex-col gap-3 rounded-lg bg-[rgba(255,255,255,0.02)] p-4 border border-[rgba(239,68,68,0.2)] relative z-10">
                  <div className="flex items-center gap-2 text-xs font-semibold text-red-500 uppercase tracking-wider">
                    <AlertCircle className="h-4 w-4" /> Alerta de Prazo
                  </div>
                  <p className="text-sm text-[#8B949E] leading-relaxed">
                    Você perdeu os últimos 2 aportes programados. Precisará aumentar as parcelas em{' '}
                    <strong className="text-[#F4F5F8]">R$ 180 mensais</strong> para manter o prazo (Dez / 2026).
                  </p>
                </div>
              )}

              {goal.id === '2' && (
                <div className="grid grid-cols-2 gap-4 mt-4 relative z-10">
                  <div className="flex flex-col gap-1 rounded-lg bg-[rgba(255,255,255,0.02)] p-3 border border-[rgba(255,255,255,0.05)]">
                    <span className="flex items-center gap-1.5 text-xs text-[#8B949E]">
                      <Clock className="h-3 w-3" /> Prazo Estimado
                    </span>
                    <span className="font-semibold text-[#F4F5F8]">Dez / 2027</span>
                  </div>
                  <div className="flex flex-col gap-1 rounded-lg bg-[rgba(255,255,255,0.02)] p-3 border border-[rgba(255,255,255,0.05)]">
                    <span className="text-xs text-[#8B949E]">Aporte Mensal</span>
                    <span className="font-semibold text-[#F4F5F8]">R$ 1.500,00</span>
                  </div>
                </div>
              )}
            </Card>
          );
        })}

        <Card
          className="flex h-full min-h-[260px] cursor-pointer flex-col items-center justify-center gap-3 border-dashed border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.01)] transition-all hover:border-[#aa68ff] hover:bg-[rgba(170,104,255,0.02)]"
          onClick={() => toast.info('Criar nova meta em breve')}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)] text-[#8B949E]">
            <Target className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-[#F4F5F8]">Criar novo objetivo</h3>
          <p className="text-sm text-[#8B949E] max-w-xs text-center">Deixe a IA planejar a rota mais rápida para você alcançar seu próximo sonho.</p>
        </Card>
      </div>
    </div>
  );
}
