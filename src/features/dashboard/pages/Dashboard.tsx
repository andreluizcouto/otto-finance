import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, Button } from "@/shared/components/ui";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Wallet, CreditCard, Sparkles, DollarSign, List, TrendingUp, Plus, Settings, Target } from "lucide-react";
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
  const hasDashboardData = Boolean(
    data && !data?.empty_state && (data?.kpis?.txn_count ?? 0) > 0,
  );
  const deltaLabel =
    data?.kpis?.delta_pct != null
      ? `${data.kpis.delta_pct >= 0 ? "+" : ""}${data.kpis.delta_pct}%`
      : "—";

  return (
    <div className="flex flex-col gap-8 pt-6 max-w-7xl mx-auto px-6">
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="text-4xl otto-title text-foreground">Patrimônio Líquido</h1>
          <p className="mt-2 otto-serif text-sm text-muted-foreground">Quietly wealthy.</p>
        </div>
        <div className="flex rounded-full bg-secondary p-1 border border-border backdrop-blur-xl">
          {PERIOD_LABELS.map((period) => (
            <button
              key={period}
              onClick={() => setActivePeriod(PERIOD_API[period])}
              className={`rounded-full px-6 py-2 text-[10px] font-medium uppercase tracking-widest transition-all ${
                PERIOD_API[period] === activePeriod
                  ? 'bg-white/10 text-foreground shadow-lg'
                  : 'text-muted-foreground hover:text-foreground'
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
                <div className="animate-pulse h-12 rounded-xl bg-secondary"></div>
              ) : (
                <>
                  <div className="text-5xl font-light tracking-tight text-foreground otto-title">
                    {data?.kpis?.total_spent_label ?? '—'}
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="text-[10px] font-bold text-primary-foreground bg-primary px-2 py-1 rounded">
                      {deltaLabel}
                    </div>
                    <span className="text-muted-foreground text-[10px] uppercase tracking-widest font-medium">vs. mês anterior</span>
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
                <div className="animate-pulse h-12 rounded-xl bg-secondary"></div>
              ) : (
                <>
                  <div className="text-5xl font-light tracking-tight text-foreground otto-title">
                    {data?.kpis?.total_spent_label ?? '—'}
                  </div>
                  <div className="mt-6 space-y-1 text-[10px] otto-label text-muted-foreground">
                    <p>{data?.kpis?.txn_count ?? 0} transações no período</p>
                    <p>Média diária: {data?.kpis?.daily_avg_label ?? "—"}</p>
                  </div>
                </>
              )}
            </Card>
          </div>

          <Card className="flex h-[450px] flex-col p-8">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3 otto-label text-[10px] text-foreground">
                <TrendingUp className="h-4 w-4" /> Tendência de Patrimônio
              </div>
            </div>
            {isLoading ? (
              <div className="animate-pulse h-full rounded-xl bg-secondary" />
            ) : chartData.length === 0 ? (
              <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border text-[10px] otto-label text-muted-foreground">
                Sem dados reais suficientes para tendência no período selecionado.
              </div>
            ) : (
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAtual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-foreground)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="var(--color-foreground)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="0" vertical={false} stroke="var(--color-border)" />
                    <XAxis dataKey="period_label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-text-secondary)', fontWeight: 500 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-text-secondary)', fontWeight: 500 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '12px', color: 'var(--color-foreground)' }}
                      itemStyle={{ color: 'var(--color-foreground)' }}
                      cursor={{ stroke: 'var(--color-border)', strokeWidth: 1 }}
                    />
                    <Area type="monotone" dataKey="total_amount" stroke="var(--color-foreground)" strokeWidth={2} fillOpacity={1} fill="url(#colorAtual)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          <Card className="relative overflow-hidden p-8 border-border bg-secondary">
            <div className="relative h-full">
              <div className="mb-6 flex items-center gap-3 otto-label text-[10px] text-foreground">
                <Sparkles className="h-4 w-4" /> INSIGHTS DA CONTA
              </div>
              {isLoading ? (
                <div className="animate-pulse h-32 rounded-xl bg-background/50" />
              ) : hasDashboardData ? (
                <>
                  <h3 className="mb-4 text-xl otto-title text-foreground">Resumo do período</h3>
                  <p className="mb-8 text-sm text-muted-foreground leading-relaxed font-medium">
                    Categoria de maior impacto: <strong className="text-foreground">{data?.kpis?.top_category ?? "—"}</strong>.
                    Total da categoria: <strong className="text-foreground">{data?.kpis?.top_category_total_label ?? "—"}</strong>.
                  </p>
                  <Button className="w-full font-medium tracking-tight" onClick={() => navigate('/transactions')}>
                    Ver Transações
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="mb-4 text-xl otto-title text-foreground">Sem dados financeiros reais</h3>
                  <p className="mb-8 text-sm text-muted-foreground leading-relaxed font-medium">
                    Assim que houver transações reais importadas, esta área mostrará insights automaticamente.
                  </p>
                  <Button className="w-full font-medium tracking-tight" onClick={() => navigate('/transactions')}>
                    Importar Transações
                  </Button>
                </>
              )}
            </div>
          </Card>

          <Card className="p-8">
            <div className="mb-8 flex items-center gap-3 otto-label text-[10px] text-foreground">
              <CreditCard className="h-4 w-4" /> Indicadores do Período
            </div>
            {isLoading ? (
              <div className="animate-pulse h-24 rounded-xl bg-secondary" />
            ) : (
              <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-5 text-[10px] otto-label">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Transações</span>
                  <span className="text-foreground">{data?.kpis?.txn_count ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Média diária</span>
                  <span className="text-foreground">{data?.kpis?.daily_avg_label ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Período</span>
                  <span className="text-foreground">
                    {data?.start_date && data?.end_date ? `${data.start_date} a ${data.end_date}` : "—"}
                  </span>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-8">
            <div className="mb-8 flex items-center justify-between">
              <h3 className="text-[10px] otto-label text-foreground">Últimas Transações</h3>
              <button
                onClick={() => navigate('/transactions')}
                className="text-[10px] otto-label text-muted-foreground hover:text-foreground transition-colors"
              >
                View All
              </button>
            </div>
            {isLoading ? (
              <div className="flex flex-col gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse h-12 rounded-xl bg-secondary"></div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {recentTxs.length === 0 ? (
                  <p className="text-[10px] otto-label text-muted-foreground">Nenhuma transação recente.</p>
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
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-foreground transition-colors group-hover:bg-muted [&>svg]:h-5 [&>svg]:w-5">
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-medium text-foreground tracking-tight">{name}</h4>
          <p className="text-[10px] otto-label mt-0.5">{category} • {time}</p>
        </div>
      </div>
      <span className={`text-sm font-medium tracking-tight ${isPositive ? 'text-foreground' : 'text-muted-foreground'}`}>{amount}</span>
    </div>
  );
}

function QuickActionButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-secondary/50 border border-border p-6 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground hover:border-white/10 group"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background text-foreground transition-colors group-hover:bg-muted [&>svg]:h-6 [&>svg]:w-6">
        {icon}
      </div>
      <span className="text-[10px] otto-label">{label}</span>
    </button>
  );
}
