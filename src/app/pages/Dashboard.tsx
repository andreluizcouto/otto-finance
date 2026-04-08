import { useState, useEffect } from "react";
import { Card, Button, Badge } from "../components/ui";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Wallet, CreditCard, Sparkles, HeartPulse, DollarSign, ArrowDown, Plus, List, Settings, Target } from "lucide-react";
import { apiGet } from "../../lib/api";

const PERIOD_LABELS = ['Este Mês', 'Esta Semana', 'Últimos 3 Meses'];
const PERIOD_API: Record<string, string> = {
  'Este Mês': 'Este mes',
  'Esta Semana': 'Esta semana',
  'Últimos 3 Meses': 'Ultimos 3 meses',
};

export function Dashboard() {
  const [activePeriod, setActivePeriod] = useState<string>('Este mes');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    apiGet(`/api/dashboard?period=${encodeURIComponent(activePeriod)}`)
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [activePeriod]);

  const chartData = data?.trend ?? [];
  const recentTxs = data?.recent_transactions?.slice(0, 3) ?? [];

  return (
    <div className="flex flex-col gap-6 pt-4">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#F4F5F8]">Visão Geral</h1>
          <p className="mt-1 text-sm text-[#8B949E]">Seu resumo financeiro atualizado em tempo real.</p>
        </div>
        <div className="flex rounded-lg bg-[rgba(255,255,255,0.05)] p-1">
          {PERIOD_LABELS.map((period) => (
            <button
              key={period}
              onClick={() => setActivePeriod(PERIOD_API[period])}
              className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
                PERIOD_API[period] === activePeriod
                  ? 'bg-[rgba(255,255,255,0.1)] text-[#F4F5F8]'
                  : 'text-[#8B949E] hover:text-[#F4F5F8]'
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
            <Card className="relative overflow-hidden p-6">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[rgba(170,104,255,0.15)] blur-3xl"></div>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#8B949E]">
                  <Wallet className="h-4 w-4" /> Saldo Disponível
                </div>
                <button className="text-[#8B949E] hover:text-[#F4F5F8]">•••</button>
              </div>
              {isLoading ? (
                <div className="animate-pulse h-10 rounded-xl bg-[rgba(255,255,255,0.05)]"></div>
              ) : (
                <>
                  <div className="text-4xl font-bold tracking-tight text-[#F4F5F8]">
                    {data?.kpis?.total_spent_label ?? '—'}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <Badge variant="success" className="bg-[rgba(116,238,21,0.1)] text-[#74ee15] px-2 py-0.5 rounded-md text-xs font-bold border-none">
                      {data?.kpis?.delta_pct != null
                        ? `${data.kpis.delta_pct >= 0 ? '↗' : '↘'} ${data.kpis.delta_pct}%`
                        : '↗ —'}
                    </Badge>
                    <span className="text-[#8B949E] text-xs">vs. mês anterior</span>
                  </div>
                </>
              )}
            </Card>

            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#8B949E]">
                  <CreditCard className="h-4 w-4" /> Gastos do Mês
                </div>
                <button className="text-[#8B949E] hover:text-[#F4F5F8]">•••</button>
              </div>
              {isLoading ? (
                <div className="animate-pulse h-10 rounded-xl bg-[rgba(255,255,255,0.05)]"></div>
              ) : (
                <>
                  <div className="text-4xl font-bold tracking-tight text-[#F4F5F8]">
                    {data?.kpis?.total_spent_label ?? '—'}
                  </div>
                  <div className="mt-4 w-full">
                    <div className="flex items-center justify-between mb-1">
                      <div className="h-1.5 flex-1 rounded-full bg-[rgba(255,255,255,0.1)] overflow-hidden">
                        <div className="h-full w-[65%] rounded-full bg-[#F4F5F8]"></div>
                      </div>
                      <span className="text-xs text-[#8B949E] ml-4">
                        {data?.kpis?.txn_count ?? '—'} transações
                      </span>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </div>

          <Card className="flex h-[400px] flex-col p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-[#F4F5F8]">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-[rgba(170,104,255,0.1)] text-[#aa68ff]">
                  <LineChartIcon className="h-3 w-3" />
                </div>
                Tendência de Gastos
              </div>
              <div className="flex items-center gap-4 text-xs text-[#8B949E]">
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#aa68ff]"></span> Atual</div>
              </div>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAtual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#aa68ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#aa68ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="period_label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8B949E' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8B949E' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0A0F1C', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#F4F5F8' }}
                    itemStyle={{ color: '#F4F5F8' }}
                  />
                  <Area type="monotone" dataKey="total_amount" stroke="#aa68ff" strokeWidth={3} fillOpacity={1} fill="url(#colorAtual)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          <Card className="relative overflow-hidden border-[#aa68ff] border-opacity-30 p-1">
            <div className="absolute right-0 top-0 h-full w-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50 pointer-events-none"></div>
            <div className="relative h-full rounded-xl bg-[rgba(10,15,28,0.8)] p-6 backdrop-blur-md">
              <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-[#aa68ff] uppercase tracking-wider">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-[rgba(170,104,255,0.1)]">
                  <Sparkles className="h-4 w-4" />
                </div>
                FINCOACH AI
              </div>
              <h3 className="mb-3 text-lg font-bold text-[#F4F5F8]">Oportunidade de Economia</h3>
              <p className="mb-6 text-sm text-[#8B949E] leading-relaxed">
                Notamos um aumento de 15% em "Assinaturas" este mês. Você tem 3 serviços de streaming ativos que não utiliza há mais de 30 dias.
              </p>
              <div className="mb-6 flex items-center justify-between rounded-lg bg-[rgba(255,255,255,0.05)] p-4">
                <span className="text-xs text-[#8B949E]">Economia Potencial</span>
                <span className="font-bold text-[#74ee15]">R$ 89,90<span className="text-xs font-normal">/mês</span></span>
              </div>
              <Button className="w-full">
                Ver recomendação →
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-6 flex items-center gap-2 text-sm text-[#F4F5F8]">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-[rgba(116,238,21,0.1)] text-[#74ee15]">
                <HeartPulse className="h-3 w-3" />
              </div>
              Score de Saúde
            </div>

            <div className="flex flex-col items-center justify-center py-4 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-24 w-24 rounded-full bg-[rgba(116,238,21,0.1)] blur-2xl"></div>
              </div>
              <svg width="140" height="140" viewBox="0 0 140 140" className="relative z-10">
                <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                <circle cx="70" cy="70" r="60" fill="none" stroke="#74ee15" strokeWidth="12" strokeDasharray="377" strokeDashoffset="67" strokeLinecap="round" transform="rotate(-90 70 70)" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <span className="text-3xl font-bold text-[#F4F5F8]">82</span>
                <span className="text-[10px] font-semibold text-[#74ee15] tracking-widest uppercase">BOM</span>
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-[#8B949E] leading-relaxed px-4">
              Seus hábitos de consumo estão equilibrados. Mantenha o foco nas metas de longo prazo.
            </p>
          </Card>

          <Card className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#F4F5F8]">Últimas Transações</h3>
              <a href="#" className="text-xs text-[#8B949E] hover:text-[#F4F5F8]">Ver todas</a>
            </div>
            {isLoading ? (
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse h-10 rounded-xl bg-[rgba(255,255,255,0.05)]"></div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {recentTxs.length === 0 ? (
                  <p className="text-xs text-[#8B949E]">Nenhuma transação recente.</p>
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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mt-2">
        <QuickActionButton icon={<Plus />} label="Adicionar Transação" />
        <QuickActionButton icon={<List />} label="Ver Transações" />
        <QuickActionButton icon={<Settings />} label="Ajustar Categorias" />
        <QuickActionButton icon={<Target />} label="Criar Meta" />
      </div>
    </div>
  );
}

function LineChartIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
}

function TransactionRow({ icon, name, category, time, amount, isPositive = false }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(255,255,255,0.05)] text-[#F4F5F8] [&>svg]:h-4 [&>svg]:w-4">
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-medium text-[#F4F5F8]">{name}</h4>
          <p className="text-xs text-[#8B949E]">{category} • {time}</p>
        </div>
      </div>
      <span className={`text-sm font-bold ${isPositive ? 'text-[#74ee15]' : 'text-[#F4F5F8]'}`}>{amount}</span>
    </div>
  );
}

function QuickActionButton({ icon, label }: any) {
  return (
    <button className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] p-4 text-[#8B949E] transition-all hover:bg-[rgba(255,255,255,0.05)] hover:text-[#F4F5F8]">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)] text-[#F4F5F8] [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </div>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
