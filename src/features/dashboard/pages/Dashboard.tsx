import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, Button, Badge } from "@/shared/components/ui";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Wallet, CreditCard, Sparkles, HeartPulse, DollarSign, TrendingUp, Plus, List, Settings, Target } from "lucide-react";
import { apiGet } from "@/shared/lib/api";
import { toast } from "sonner";

const PERIOD_LABELS = ['Este Mês', 'Esta Semana', 'Últimos 3 Meses'];
const PERIOD_API: Record<string, string> = {
  'Este Mês': 'Este mes',
  'Esta Semana': 'Esta semana',
  'Últimos 3 Meses': 'Ultimos 3 meses',
};

export function Dashboard() {
  const navigate = useNavigate();
  const [activePeriod, setActivePeriod] = useState<string>('Este mes');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    apiGet(`/api/dashboard?period=${encodeURIComponent(activePeriod)}`)
      .then(setData)
      .catch(() => toast.error('Erro ao carregar dashboard'))
      .finally(() => setIsLoading(false));
  }, [activePeriod]);

  const chartData = data?.trend ?? [];
  const recentTxs = data?.recent_transactions?.slice(0, 3) ?? [];

  return (
    <div className="flex flex-col gap-8 pt-6 max-w-7xl mx-auto px-6">
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="text-4xl otto-title text-white">Patrimônio Líquido</h1>
          <p className="mt-2 otto-label text-xs">Quietly Wealthy</p>
        </div>
        <div className="flex rounded-full bg-white/5 p-1 border border-white/10 backdrop-blur-xl">
          {PERIOD_LABELS.map((period) => (
            <button
              key={period}
              onClick={() => setActivePeriod(PERIOD_API[period])}
              className={`rounded-full px-6 py-2 text-[10px] font-medium uppercase tracking-widest transition-all ${
                PERIOD_API[period] === activePeriod
                  ? 'bg-white/10 text-white shadow-lg'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (Chart and Main KPIs) */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="grid gap-6 sm:grid-cols-2">
            <Card className="relative overflow-hidden p-8">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3 otto-label text-[10px]">
                  <Wallet className="h-4 w-4" /> Saldo Disponível
                </div>
              </div>
              {isLoading ? (
                <div className="animate-pulse h-12 rounded-xl bg-white/5"></div>
              ) : (
                <>
                  <div className="text-5xl font-light tracking-tight text-white otto-title">
                    {data?.kpis?.total_spent_label ?? '—'}
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="text-[10px] font-bold text-white bg-white/10 px-2 py-1 rounded">
                      {data?.kpis?.delta_pct != null
                        ? `${data.kpis.delta_pct >= 0 ? '+' : ''}${data.kpis.delta_pct}%`
                        : '+0%'}
                    </div>
                    <span className="text-white/40 text-[10px] uppercase tracking-widest font-medium">vs. mês anterior</span>
                  </div>
                </>
              )}
            </Card>

            <Card className="p-8">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3 otto-label text-[10px]">
                  <CreditCard className="h-4 w-4" /> Gastos do Mês
                </div>
              </div>
              {isLoading ? (
                <div className="animate-pulse h-12 rounded-xl bg-white/5"></div>
              ) : (
                <>
                  <div className="text-5xl font-light tracking-tight text-white otto-title">
                    {data?.kpis?.total_spent_label ?? '—'}
                  </div>
                  <div className="mt-6 w-full">
                    <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full w-[65%] rounded-full bg-white"></div>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </div>

          <Card className="flex h-[450px] flex-col p-8">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3 otto-label text-[10px] text-white">
                <TrendingUp className="h-4 w-4" /> Tendência de Patrimônio
              </div>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAtual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="period_label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontWeight: 500 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontWeight: 500 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#000000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#FFFFFF' }}
                    itemStyle={{ color: '#FFFFFF' }}
                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                  />
                  <Area type="monotone" dataKey="total_amount" stroke="#FFFFFF" strokeWidth={2} fillOpacity={1} fill="url(#colorAtual)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          <Card className="relative overflow-hidden p-8 border-white/5 bg-white/5">
            <div className="relative h-full">
              <div className="mb-6 flex items-center gap-3 otto-label text-[10px] text-white">
                <Sparkles className="h-4 w-4" /> FINCOACH AI
              </div>
              <h3 className="mb-4 text-xl otto-title text-white">Oportunidade de Patrimônio</h3>
              <p className="mb-8 text-sm text-white/40 leading-relaxed font-medium">
                Notamos ativos com performance abaixo do esperado. Recomendamos uma rebalanceamento estratégico para otimização de liquidez.
              </p>
              <div className="mb-8 flex items-center justify-between rounded-xl bg-white/5 p-5 border border-white/5">
                <span className="text-[10px] otto-label">Otimização</span>
                <span className="text-lg font-light text-white otto-title">+ R$ 12.450<span className="text-[10px] font-medium ml-1">EST.</span></span>
              </div>
              <Button className="w-full bg-white text-black hover:bg-white/90 rounded-xl py-6 font-medium tracking-tight" onClick={() => toast.info('Insights personalizados em breve')}>
                Analisar Portfólio
              </Button>
            </div>
          </Card>

          <Card className="p-8">
            <div className="mb-8 flex items-center gap-3 otto-label text-[10px] text-white">
              <HeartPulse className="h-4 w-4" /> Health Score
            </div>

            <div className="flex flex-col items-center justify-center py-6 relative">
              <svg width="160" height="160" viewBox="0 0 140 140" className="relative z-10">
                <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
                <circle cx="70" cy="70" r="60" fill="none" stroke="white" strokeWidth="8" strokeDasharray="377" strokeDashoffset="67" strokeLinecap="round" transform="rotate(-90 70 70)" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <span className="text-4xl font-light text-white otto-title">82</span>
                <span className="text-[9px] otto-label mt-1">OPTIMIZED</span>
              </div>
            </div>
          </Card>

          <Card className="p-8">
            <div className="mb-8 flex items-center justify-between">
              <h3 className="text-[10px] otto-label text-white">Últimas Transações</h3>
              <button
                onClick={() => navigate('/transactions')}
                className="text-[10px] otto-label text-white/40 hover:text-white transition-colors"
              >
                View All
              </button>
            </div>
            {isLoading ? (
              <div className="flex flex-col gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse h-12 rounded-xl bg-white/5"></div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {recentTxs.length === 0 ? (
                  <p className="text-[10px] otto-label text-white/40">Nenhuma transação recente.</p>
                ) : (
                  recentTxs.map((tx: any) => (
                    <TransactionRow
                      key={tx.id}
                      icon={<DollarSign />}
                      name={tx.description}
                      category={tx.category_name}
                      time={tx.date_label}
                      amount={tx.amount_label}
                      isPositive={tx.amount >= 0}
                    />
                  ))
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 mt-4 pb-12">
        <QuickActionButton icon={<Plus />} label="Transação" onClick={() => toast.info('Adicionar transação em breve')} />
        <QuickActionButton icon={<List />} label="Histórico" onClick={() => navigate('/transactions')} />
        <QuickActionButton icon={<Settings />} label="Categorias" onClick={() => navigate('/categories')} />
        <QuickActionButton icon={<Target />} label="Objetivos" onClick={() => navigate('/goals')} />
      </div>
    </div>
  );
}

function TransactionRow({ icon, name, category, time, amount, isPositive = false }: any) {
  return (
    <div className="flex items-center justify-between group cursor-pointer">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white transition-colors group-hover:bg-white/10 [&>svg]:h-5 [&>svg]:w-5">
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-medium text-white tracking-tight">{name}</h4>
          <p className="text-[10px] otto-label mt-0.5">{category} • {time}</p>
        </div>
      </div>
      <span className={`text-sm font-medium tracking-tight ${isPositive ? 'text-white' : 'text-white/60'}`}>{amount}</span>
    </div>
  );
}

function QuickActionButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-white/[0.02] border border-white/5 p-6 text-white/40 transition-all hover:bg-white/[0.05] hover:text-white hover:border-white/10 group"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white transition-colors group-hover:bg-white/10 [&>svg]:h-6 [&>svg]:w-6">
        {icon}
      </div>
      <span className="text-[10px] otto-label">{label}</span>
    </button>
  );
}
