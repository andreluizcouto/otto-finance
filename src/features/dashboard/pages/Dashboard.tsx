import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router';
import { cn } from '@/shared/lib/utils';
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowDown,
  ArrowUp,
  Scale,
  AlertCircle,
  Upload,
  Sparkles,
  Loader2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { toast } from 'sonner';
import { apiGet, apiPost, formatBRL, formatDate } from '@/shared/lib/api';
import { ImportPdfModal } from '@/features/transactions/components/ImportPdfModal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiTransaction {
  id: string;
  date: string;
  description: string;
  merchant_name?: string;
  amount: number;
  categories: { name: string; emoji: string } | null;
}

interface MonthlySummary {
  income: number;
  expenses: number;
  balance: number;
}

interface SpendingCategory {
  name: string;
  emoji: string;
  color: string;
  total: number;
}

interface CategoryRow {
  category_id: string;
  category_name: string;
  emoji: string;
  amount: number;
  amount_label: string;
  share_pct: number;
}

interface ComparisonRow {
  category_id: string;
  category_name: string;
  emoji: string;
  current_amount: number;
  prev_amount: number;
  delta_pct: number;
  trend: 'up' | 'down' | 'flat';
}

interface SavingTip {
  id: string;
  title: string;
  description: string;
  potential_saving_label: string;
  priority: number;
}

interface DashboardPayload {
  categories?: CategoryRow[];
  classification?: { pending_count: number };
  comparison?: ComparisonRow[];
  saving_tips?: SavingTip[];
}

const CHART_COLORS = [
  '#FFFFFF', // White
  '#A3A3A3', // Neutral 400
  '#525252', // Neutral 600
  '#262626', // Neutral 800
  '#404040', // Neutral 700
  '#737373', // Neutral 500
  '#D4D4D4', // Neutral 300
];

const PERIODS = [
  { label: 'Este Mês', api: 'Este mes' },
  { label: 'Esta Semana', api: 'Esta semana' },
  { label: 'Últimos 3 Meses', api: 'Ultimos 3 meses' },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TxSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-white/[0.05]" />
        <div className="space-y-2">
          <div className="h-3 w-36 bg-white/[0.06] rounded" />
          <div className="h-2.5 w-20 bg-white/[0.04] rounded" />
        </div>
      </div>
      <div className="space-y-2 text-right">
        <div className="h-3 w-20 bg-white/[0.06] rounded ml-auto" />
        <div className="h-2.5 w-14 bg-white/[0.04] rounded ml-auto" />
      </div>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload as SpendingCategory;
  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm shadow-2xl backdrop-blur-xl">
      <span className="mr-1.5">{d.emoji}</span>
      <span className="text-white/80">{d.name}</span>
      <span className="ml-2 font-medium text-white">{formatBRL(d.total)}</span>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function Dashboard() {
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [activePeriod, setActivePeriod] = useState(PERIODS[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [txRes, dashRes] = await Promise.all([
          apiGet('/api/transactions?limit=10'),
          apiGet(`/api/dashboard?period=${encodeURIComponent(activePeriod.api)}`),
        ]);

        setTransactions(txRes?.transactions ?? []);
        setData(dashRes);
      } catch (err: any) {
        console.error('Dashboard fetch error:', err);
        setError(err.message ?? 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    })();
  }, [reloadTick, activePeriod]);

  const summary = useMemo(() => {
    if (!transactions.length) return { income: 0, expenses: 0, balance: 0 };
    const income = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expenses = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    return { income, expenses, balance: income - expenses };
  }, [transactions]);

  const spending = useMemo(() => {
    const cats = data?.categories ?? [];
    return cats.map((c, i) => ({
      name: c.category_name,
      emoji: c.emoji ?? '📂',
      color: CHART_COLORS[i % CHART_COLORS.length],
      total: c.amount,
    }));
  }, [data]);

  const totalSpending = spending.reduce((s, c) => s + c.total, 0);
  const monthName = new Date().toLocaleDateString('pt-BR', { month: 'long' });

  const handleClassify = async () => {
    setIsClassifying(true);
    try {
      const result = await apiPost('/api/transactions/classify');
      const classified = Number(result?.classified_count ?? 0);
      const skipped = Number(result?.skipped_count ?? 0);
      toast.success(`${classified} classificadas, ${skipped} ignoradas.`);
      if (typeof result?.warning === 'string' && result.warning.trim()) {
        toast.warning(result.warning);
      }
      setReloadTick((prev) => prev + 1);
    } catch (err: any) {
      toast.error(err?.message ?? 'Falha ao classificar.');
    } finally {
      setIsClassifying(false);
    }
  };

  const pendingCount = data?.classification?.pending_count ?? 0;

  return (
    <div className="w-full relative z-10 animate-in fade-in duration-500">

      {/* ── Header Area ────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl tracking-[0.2em] font-medium">OTTO</span>
            <div className="h-4 w-px bg-white/20"></div>
            <h1 className="text-xs font-medium tracking-widest text-white/40 uppercase">Dashboard</h1>
          </div>
          <p className="text-white/40 text-sm">Visão geral do seu ecossistema financeiro.</p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Period Selector Pills */}
          <div className="flex bg-white/[0.04] border border-white/[0.08] p-1 rounded-xl">
            {PERIODS.map((p) => (
              <button
                key={p.api}
                onClick={() => setActivePeriod(p)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-medium transition-all",
                  activePeriod.api === p.api 
                    ? "bg-white text-black shadow-lg" 
                    : "text-white/40 hover:text-white/60"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleClassify}
            disabled={isClassifying || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] text-white/70 hover:text-white"
          >
            {isClassifying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>
              {isClassifying ? 'Classificando...' : `Classificar com IA${pendingCount > 0 ? ` (${pendingCount})` : ''}`}
            </span>
          </button>
        </div>
      </div>

      {/* ── Hero: Summary Cards ────────────────────────────────────────── */}
      <div className="mb-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse bg-white/[0.03] rounded-2xl border border-white/[0.06]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Card 1: Pending/Income */}
            <div className="group relative p-6 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08] hover:border-white/[0.15] transition-colors overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/[0.03] blur-[40px] rounded-full pointer-events-none" />
              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-colors">
                  <Sparkles className="w-5 h-5 text-white/70" />
                </div>
                <span className="text-xs font-medium text-white/40 uppercase tracking-widest">IA Pendente</span>
              </div>
              <h3 className="text-white/50 text-sm font-medium mb-1 relative z-10">Transações</h3>
              <div className="text-3xl font-light relative z-10">{pendingCount}</div>
            </div>

            {/* Card 2: Categories Count */}
            <div className="group relative p-6 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08] hover:border-white/[0.15] transition-colors overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/[0.03] blur-[40px] rounded-full pointer-events-none" />
              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-colors">
                  <ArrowUp className="w-5 h-5 text-white/70" />
                </div>
                <span className="text-xs font-medium text-white/40 uppercase tracking-widest">Categorias</span>
              </div>
              <h3 className="text-white/50 text-sm font-medium mb-1 relative z-10">Ativas este período</h3>
              <div className="text-3xl font-light relative z-10">{(data?.categories ?? []).length}</div>
            </div>

            {/* Card 3: Tips Count */}
            <div className="group relative p-6 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08] hover:border-white/[0.15] transition-colors overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/[0.03] blur-[40px] rounded-full pointer-events-none" />
              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-colors">
                  <Scale className="w-5 h-5 text-white/70" />
                </div>
                <span className="text-xs font-medium text-white/40 uppercase tracking-widest">Insights</span>
              </div>
              <h3 className="text-white/50 text-sm font-medium mb-1 relative z-10">Dicas de economia</h3>
              <div className="text-3xl font-light relative z-10">{(data?.saving_tips ?? []).length}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Main Content Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Column 1 & 2: Recent Activity & Categories List */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Gastos por Categoria (List Style) */}
          <div className="rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08] p-8 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-medium text-white/90">Distribuição de Gastos</h3>
              <Link to="/categories" className="text-sm text-white/40 hover:text-white transition-colors flex items-center gap-1">
                Ver Tudo <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-6">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse bg-white/[0.02] rounded-xl" />
                ))
              ) : spending.length === 0 ? (
                <div className="py-12 text-center text-white/20">Nenhum gasto categorizado neste período.</div>
              ) : (
                spending.map((cat) => (
                  <div key={cat.name} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{cat.emoji}</span>
                        <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">{cat.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-white">{formatBRL(cat.total)}</div>
                        <div className="text-[10px] text-white/30 uppercase tracking-widest">
                          {totalSpending > 0 ? ((cat.total / totalSpending) * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                    </div>
                    <div className="h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white/40 rounded-full transition-all duration-1000"
                        style={{ width: `${totalSpending > 0 ? (cat.total / totalSpending) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="h-px w-full bg-white/[0.03] mt-6" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Atividade Recente */}
          <div className="rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08] p-8 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-medium text-white/90">Atividade Recente</h3>
              <Link to="/transactions" className="text-sm text-white/40 hover:text-white transition-colors">
                Explorar Tudo
              </Link>
            </div>

            <div className="space-y-1">
              {loading && Array.from({ length: 5 }).map((_, i) => <TxSkeleton key={i} />)}

              {!loading && transactions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <p className="text-sm text-white/30">Seu dashboard ainda está vazio...</p>
                  <button
                    onClick={() => setIsImportOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.06] border border-white/10 text-white/70 rounded-xl text-sm font-medium hover:bg-white/[0.1] hover:text-white transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    Importar extrato
                  </button>
                </div>
              )}

              {!loading && transactions.map((tx) => {
                const isIncome = tx.amount > 0;
                return (
                  <Link
                    key={tx.id}
                    to={`/transactions/${tx.id}`}
                    className="group flex items-center justify-between p-4 rounded-xl hover:bg-white/[0.03] border border-transparent hover:border-white/[0.08] transition-all"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center group-hover:bg-white/[0.06] transition-colors shrink-0 text-base shadow-inner">
                        {tx.categories?.emoji ?? (isIncome ? '💰' : '💳')}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-white/90 text-sm group-hover:text-white transition-colors truncate">
                          {tx.merchant_name || tx.description}
                        </div>
                        <div className="text-[10px] text-white/30 mt-0.5 uppercase tracking-widest truncate">
                          {tx.categories?.name ?? 'Sem categoria'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <div className={cn(
                        "font-medium text-sm tabular-nums",
                        isIncome ? "text-white" : "text-white/60"
                      )}>
                        {isIncome ? '+' : '-'}{formatBRL(Math.abs(tx.amount))}
                      </div>
                      <div className="text-[10px] text-white/20 mt-0.5">{formatDate(tx.date)}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Column 3: Stats & Tips */}
        <div className="space-y-8">
          
          {/* Pie Chart Card */}
          <div className="rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08] p-8 backdrop-blur-xl">
            <h3 className="text-sm font-medium tracking-widest text-white/40 uppercase mb-8">Composição</h3>
            
            {loading ? (
              <div className="h-48 animate-pulse bg-white/[0.03] rounded-full mx-auto w-48" />
            ) : spending.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-white/10 italic text-sm">Sem dados</div>
            ) : (
              <div className="h-56 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spending}
                      cx="50%" cy="50%"
                      innerRadius={65} outerRadius={85}
                      paddingAngle={4} dataKey="total" stroke="none"
                    >
                      {spending.map((cat, i) => (
                        <Cell key={cat.name} fill={cat.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-light text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                    {formatBRL(totalSpending)}
                  </span>
                  <span className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Total Gasto</span>
                </div>
              </div>
            )}
          </div>

          {/* Comparativo de Tendências */}
          <div className="rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08] p-8 backdrop-blur-xl">
            <h3 className="text-sm font-medium tracking-widest text-white/40 uppercase mb-6">Comparativo</h3>
            <div className="space-y-5">
              {!loading && (data?.comparison ?? []).map((item) => (
                <div key={item.category_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{item.emoji}</span>
                    <span className="text-sm text-white/70">{item.category_name}</span>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border",
                    item.trend === 'up' ? "text-red-400/80 border-red-500/10 bg-red-500/5" :
                    item.trend === 'down' ? "text-emerald-400/80 border-emerald-500/10 bg-emerald-500/5" :
                    "text-white/40 border-white/5 bg-white/5"
                  )}>
                    {item.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : 
                     item.trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
                    {Math.abs(item.delta_pct).toFixed(0)}%
                  </div>
                </div>
              ))}
              {!loading && (!data?.comparison || data.comparison.length === 0) && (
                <div className="text-xs text-white/20 italic">Dados comparativos insuficientes.</div>
              )}
            </div>
          </div>

          {/* Dicas para Economizar */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium tracking-widest text-white/40 uppercase pl-2">Oportunidades</h3>
            {!loading && (data?.saving_tips ?? []).map((tip) => (
              <div key={tip.id} className="group relative p-6 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08] hover:border-white/[0.15] transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold tracking-widest text-white/20 uppercase">Prioridade {tip.priority}</span>
                  <div className="p-1.5 bg-white/5 rounded-lg">
                    <Sparkles className="w-3.5 h-3.5 text-white/40" />
                  </div>
                </div>
                <h4 className="text-sm font-medium text-white mb-1">{tip.title}</h4>
                <p className="text-xs text-white/40 leading-relaxed mb-4">{tip.description}</p>
                <div className="text-xl font-light text-white group-hover:text-emerald-400 transition-colors">
                  {tip.potential_saving_label}
                </div>
                <div className="text-[10px] text-white/20 uppercase tracking-widest mt-1">Potencial de economia</div>
              </div>
            ))}
            {!loading && (!data?.saving_tips || data.saving_tips.length === 0) && (
              <div className="p-6 rounded-2xl border border-dashed border-white/10 text-center">
                <p className="text-xs text-white/20">Nenhuma dica no momento.</p>
              </div>
            )}
          </div>

        </div>
      </div>

      <ImportPdfModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSuccess={() => setReloadTick((prev) => prev + 1)}
      />
    </div>
  );
}
