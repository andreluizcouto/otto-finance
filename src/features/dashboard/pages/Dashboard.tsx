import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowDown,
  ArrowUp,
  Scale,
  AlertCircle,
  Upload,
  Sparkles,
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

interface DashboardPayload {
  categories?: CategoryRow[];
  classification?: { pending_count: number };
}

const CHART_COLORS = [
  '#38bdf8', // sky
  '#a78bfa', // violet
  '#34d399', // emerald
  '#fb923c', // orange
  '#f472b6', // pink
  '#facc15', // yellow
  '#60a5fa', // blue
  '#f87171', // red
  '#4ade80', // green
  '#e879f9', // fuchsia
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
    <div className="bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm">
      <span className="mr-1.5">{d.emoji}</span>
      <span className="text-white/80">{d.name}</span>
      <span className="ml-2 font-medium text-white">{formatBRL(d.total)}</span>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function Dashboard() {
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [spending, setSpending] = useState<SpendingCategory[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
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
          apiGet('/api/transactions?limit=200'),
          apiGet('/api/dashboard?period=Este%20mes'),
        ]);

        const allTx: ApiTransaction[] = txRes?.transactions ?? [];
        setTransactions(allTx.slice(0, 10));

        // Compute monthly summary from transactions
        const income = allTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
        const expenses = allTx.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
        setSummary({ income, expenses, balance: income - expenses });

        // Build spending chart from dashboard categories
        const cats: CategoryRow[] = Array.isArray((dashRes as DashboardPayload)?.categories)
          ? (dashRes as DashboardPayload).categories!
          : [];
        setSpending(
          cats.map((c, i) => ({
            name: c.category_name,
            emoji: c.emoji ?? '',
            color: CHART_COLORS[i % CHART_COLORS.length],
            total: c.amount,
          }))
        );

        setPendingCount(Number((dashRes as DashboardPayload)?.classification?.pending_count ?? 0));
      } catch (err: any) {
        console.error('Dashboard fetch error:', err);
        setError(err.message ?? 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    })();
  }, [reloadTick]);

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

  return (
    <div className="w-full max-w-6xl mx-auto px-6 pb-10 pt-6 relative z-10">

      {/* ── Ações rápidas ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-10 flex-wrap">
        <button
          onClick={() => setIsImportOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.15] transition-all text-sm text-white/60 hover:text-white"
        >
          <Upload className="w-4 h-4" />
          Importar extrato
        </button>
        <button
          onClick={handleClassify}
          disabled={isClassifying}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.15] transition-all text-sm text-white/60 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-4 h-4" />
          {isClassifying ? 'Classificando...' : `Classificar com IA${pendingCount > 0 ? ` (${pendingCount})` : ''}`}
        </button>
      </div>

      {/* ── Hero: Resumo do Mês ──────────────────────────────────────────── */}
      <div className="mb-12">
        <h2 className="text-sm font-medium tracking-widest text-white/40 uppercase mb-3">
          Resumo de {monthName}
        </h2>

        {loading ? (
          <div className="h-36 animate-pulse bg-white/[0.03] rounded-2xl" />
        ) : error ? (
          <div className="flex items-center gap-3 p-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        ) : summary ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Entradas */}
            <div className="group relative p-6 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08] hover:border-white/[0.15] transition-colors overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/[0.03] blur-[40px] rounded-full pointer-events-none" />
              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-colors">
                  <ArrowDown className="w-5 h-5 text-white/70" />
                </div>
                <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Entradas</span>
              </div>
              <h3 className="text-white/50 text-sm font-medium mb-1 relative z-10">Recebi</h3>
              <div className="text-3xl font-light relative z-10">{formatBRL(summary.income)}</div>
            </div>

            {/* Saídas */}
            <div className="group relative p-6 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08] hover:border-white/[0.15] transition-colors overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/[0.03] blur-[40px] rounded-full pointer-events-none" />
              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-colors">
                  <ArrowUp className="w-5 h-5 text-white/70" />
                </div>
                <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Saídas</span>
              </div>
              <h3 className="text-white/50 text-sm font-medium mb-1 relative z-10">Gastei</h3>
              <div className="text-3xl font-light relative z-10">{formatBRL(summary.expenses)}</div>
            </div>

            {/* Saldo */}
            <div className="group relative p-6 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08] hover:border-white/[0.15] transition-colors overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/[0.03] blur-[40px] rounded-full pointer-events-none" />
              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-colors">
                  <Scale className="w-5 h-5 text-white/70" />
                </div>
                <span className={`text-xs font-medium uppercase tracking-wider ${summary.balance >= 0 ? 'text-white/60' : 'text-red-400/80'}`}>
                  {summary.balance >= 0 ? 'Positivo' : 'Negativo'}
                </span>
              </div>
              <h3 className="text-white/50 text-sm font-medium mb-1 relative z-10">Saldo</h3>
              <div className={`text-3xl font-light relative z-10 ${summary.balance < 0 ? 'text-red-400/80' : ''}`}>
                {formatBRL(summary.balance)}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* ── Transações + Gastos por Categoria ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Atividade Recente */}
        <div className="lg:col-span-2 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08] p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-medium text-white/90">Atividade Recente</h3>
            <Link to="/transactions" className="text-sm text-white/40 hover:text-white transition-colors">
              Ver Tudo
            </Link>
          </div>

          <div className="space-y-1">
            {loading && Array.from({ length: 5 }).map((_, i) => <TxSkeleton key={i} />)}

            {!loading && error && (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <AlertCircle className="w-8 h-8 text-white/20" />
                <p className="text-sm text-white/40">{error}</p>
                <button
                  onClick={() => setReloadTick((t) => t + 1)}
                  className="text-xs text-white/60 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {!loading && !error && transactions.length === 0 && (
              <p className="py-12 text-center text-white/30 text-sm">
                Nenhuma transação ainda. Importe um extrato para começar.
              </p>
            )}

            {!loading && !error && transactions.map((tx) => {
              const isIncome = tx.amount > 0;
              const label = tx.merchant_name || tx.description;
              return (
                <Link
                  key={tx.id}
                  to={`/transactions/${tx.id}`}
                  className="group flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] border border-transparent hover:border-white/[0.05] transition-all"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center group-hover:bg-white/[0.06] transition-colors shrink-0 text-base">
                      {tx.categories?.emoji ?? (
                        isIncome
                          ? <ArrowDownRight className="w-4 h-4 text-white/80" />
                          : <ArrowUpRight className="w-4 h-4 text-white/40" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-white/90 text-sm group-hover:text-white transition-colors truncate">
                        {label}
                      </div>
                      <div className="text-xs text-white/40 mt-0.5 truncate">
                        {tx.categories?.name ?? 'Sem categoria'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <div className={`font-medium text-sm tabular-nums ${isIncome ? 'text-white' : 'text-white/60'}`}>
                      {isIncome ? '+' : '-'}{formatBRL(Math.abs(tx.amount))}
                    </div>
                    <div className="text-xs text-white/40 mt-0.5">{formatDate(tx.date)}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Gastos por Categoria */}
        <div className="rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08] p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-white/90">Gastos por Categoria</h3>
            <Link to="/categories" className="text-white/40 hover:text-white transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="h-48 animate-pulse bg-white/[0.03] rounded-xl mb-6" />
          ) : spending.length === 0 ? (
            <p className="py-12 text-center text-white/30 text-sm">
              Sem gastos categorizados esse mês.
            </p>
          ) : (
            <>
              <div className="h-48 relative mb-6 min-h-[192px]">
                <ResponsiveContainer width="100%" height={192}>
                  <PieChart>
                    <Pie
                      data={spending}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={80}
                      paddingAngle={2} dataKey="total" stroke="none"
                    >
                      {spending.map((cat, i) => (
                        <Cell key={cat.name} fill={cat.color || CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-light text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                    {formatBRL(totalSpending)}
                  </span>
                  <span className="text-xs text-white/40 uppercase tracking-widest">Total</span>
                </div>
              </div>

              <div className="space-y-3">
                {spending.slice(0, 6).map((cat) => {
                  const pct = totalSpending > 0 ? ((cat.total / totalSpending) * 100).toFixed(0) : '0';
                  return (
                    <div key={cat.name} className="flex items-center justify-between text-sm group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="text-base mr-1">{cat.emoji}</span>
                        <span className="text-white/60 group-hover:text-white transition-colors truncate">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        <span className="text-white/40 text-xs">{pct}%</span>
                        <span className="text-white/90 font-medium tabular-nums">{formatBRL(cat.total)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
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
