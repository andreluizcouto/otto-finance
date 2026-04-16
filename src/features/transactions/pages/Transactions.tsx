import { useEffect, useState, useMemo } from 'react';
import {
  Search,
  Plus,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Loader2,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { apiGet, formatBRL, formatDate } from '@/shared/lib/api';
import { toast } from 'sonner';
import { ImportPdfModal } from '../components/ImportPdfModal';
import { cn } from '@/shared/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiTransaction {
  id: string;
  date: string;
  description: string;
  merchant_name?: string;
  amount: number;
  confidence_score: number | null;
  manually_reviewed: boolean;
  categories: { name: string; emoji: string } | null;
}

type FilterKey = 'Todos' | 'Receitas' | 'Despesas' | 'Não Revisadas';
const FILTERS: FilterKey[] = ['Todos', 'Receitas', 'Despesas', 'Não Revisadas'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConfidenceBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  const pct = score > 1 ? Math.round(score) : Math.round(score * 100);
  const color =
    pct >= 90 ? 'text-white/70 border-white/20'  :
    pct >= 70 ? 'text-white/50 border-white/10'  :
                'text-white/40 border-white/[0.08]';
  return (
    <span className={cn(
      "hidden lg:inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border tabular-nums uppercase tracking-widest font-medium",
      color
    )}>
      {pct}%
    </span>
  );
}

function TxRowSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-4 items-center p-6 animate-pulse border-b border-white/[0.04]">
      <div className="col-span-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-white/[0.04] shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-3 w-40 bg-white/[0.06] rounded" />
          <div className="h-2.5 w-24 bg-white/[0.04] rounded" />
        </div>
      </div>
      <div className="col-span-3"><div className="h-6 w-28 bg-white/[0.04] rounded-md" /></div>
      <div className="col-span-2"><div className="h-2.5 w-16 bg-white/[0.04] rounded" /></div>
      <div className="col-span-2 flex justify-end"><div className="h-3 w-20 bg-white/[0.06] rounded" /></div>        
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Transactions() {
  const navigate = useNavigate();
  const [allTransactions, setAllTransactions] = useState<ApiTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiGet('/api/transactions?limit=200');
        setAllTransactions(res.transactions ?? []);
      } catch (err: any) {
        console.error('Transactions fetch error:', err);
        setError(err.message ?? 'Erro ao buscar transações');
        toast.error('Falha ao carregar movimentações');
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshKey]);

  const filtered = useMemo(() => {
    let list = allTransactions;
    
    // Filter by type
    if (activeFilter === 'Receitas') list = list.filter(t => t.amount > 0);
    if (activeFilter === 'Despesas') list = list.filter(t => t.amount < 0);
    if (activeFilter === 'Não Revisadas') list = list.filter(t => !t.manually_reviewed);

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => 
        (t.description?.toLowerCase().includes(q)) || 
        (t.merchant_name?.toLowerCase().includes(q)) ||
        (t.categories?.name?.toLowerCase().includes(q))
      );
    }
    
    return list;
  }, [allTransactions, activeFilter, searchQuery]);

  const totalIn = useMemo(() => filtered.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0), [filtered]);
  const totalOut = useMemo(() => filtered.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0), [filtered]);

  return (
    <div className="w-full relative z-10 animate-in fade-in duration-500 max-w-6xl mx-auto px-6 py-10">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl tracking-[0.2em] font-medium">OTTO</span>
            <div className="h-4 w-px bg-white/20"></div>
            <h1 className="text-xs font-medium tracking-widest text-white/40 uppercase">Transações</h1>
          </div>
          <p className="text-white/40 text-sm italic">Quietly wealthy.</p>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium border transition-all bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] text-white/70 hover:text-white"
          >
            <Download className="w-4 h-4" />
            Importar Extrato
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-black rounded-xl text-xs font-medium hover:bg-white/90 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            <Plus className="w-4 h-4" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* ── Quick Stats ───────────────────────────────────────────────── */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/[0.02] blur-3xl rounded-full" />
            <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2 font-medium">Movimentações</p>
            <p className="text-2xl font-light">{filtered.length}</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/[0.02] blur-3xl rounded-full" />
            <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2 font-medium">Entradas</p>
            <p className="text-2xl font-light text-white">+{formatBRL(totalIn)}</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/[0.02] blur-3xl rounded-full" />
            <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2 font-medium">Saídas</p>
            <p className="text-2xl font-light text-white/60">-{formatBRL(totalOut)}</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/[0.02] blur-3xl rounded-full" />
            <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2 font-medium">Saldo Líquido</p>
            <p className={cn("text-2xl font-light", totalIn - totalOut >= 0 ? 'text-white' : 'text-red-400/80')}>
              {totalIn - totalOut >= 0 ? '+' : '-'}{formatBRL(totalIn - totalOut)}
            </p>
          </div>
        </div>
      )}

      {/* ── Filters & Search ──────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 w-full lg:w-auto no-scrollbar">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                "whitespace-nowrap px-4 py-2 rounded-xl text-xs font-medium transition-all border",
                activeFilter === f
                  ? 'bg-white text-black border-white'
                  : 'text-white/40 hover:text-white hover:bg-white/[0.04] border-white/[0.08]'
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full lg:w-80 group">
            <Search className="w-4 h-4 text-white/20 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-white/60 transition-colors" />
            <input
              type="text"
              placeholder="Pesquisar histórico..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all"
            />
          </div>
          <button className="p-3 bg-white/[0.02] border border-white/10 rounded-xl hover:bg-white/[0.08] hover:border-white/30 transition-all text-white/40 hover:text-white">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── List ──────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08] rounded-3xl overflow-hidden backdrop-blur-2xl shadow-2xl">

        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-5 border-b border-white/[0.05] text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
          <div className="col-span-5">Entidade / Descrição</div>
          <div className="col-span-3">Categoria</div>
          <div className="col-span-2">Data</div>
          <div className="col-span-2 text-right">Montante</div>
        </div>

        <div className="flex flex-col divide-y divide-white/[0.04]">
          {loading && Array.from({ length: 8 }).map((_, i) => <TxRowSkeleton key={i} />)}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <AlertCircle className="w-10 h-10 text-white/10" />
              <p className="text-sm text-white/40">{error}</p>
              <button
                onClick={() => setRefreshKey(k => k + 1)}
                className="text-xs border border-white/10 hover:border-white/30 text-white/60 hover:text-white px-5 py-2.5 rounded-xl transition-all bg-white/5"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="py-24 text-center flex flex-col items-center gap-4 text-white/20">
              <Search className="w-12 h-12 opacity-10" />
              <p className="text-sm font-medium tracking-wide">Nenhuma transação identificada com este filtro.</p>
            </div>
          )}

          {!loading && !error && filtered.map(tx => {
            const isIncome = tx.amount > 0;
            const label = tx.merchant_name || tx.description || 'Transação';
            return (
              <Link
                key={tx.id}
                to={`/transactions/${tx.id}`}
                className="group grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-8 py-5 hover:bg-white/[0.02] transition-all relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div className="col-span-1 md:col-span-5 flex items-center gap-5 relative z-10">
                  <div className={cn(
                    "w-11 h-11 rounded-full border flex items-center justify-center shrink-0 text-base shadow-inner transition-colors",
                    "bg-white/[0.02] border-white/[0.06] group-hover:border-white/15",
                    isIncome ? 'text-white' : 'text-white/40'
                  )}>
                    {tx.categories?.emoji 
                      ? <span>{tx.categories.emoji}</span>
                      : isIncome 
                        ? <ArrowDownRight className="w-5 h-5" /> 
                        : <ArrowUpRight className="w-5 h-5" />
                    }
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-white/90 text-sm group-hover:text-white transition-colors truncate">
                      {label}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-white/30 md:hidden uppercase tracking-widest">
                        {tx.categories?.name ?? 'Sem categoria'} · {formatDate(tx.date)}
                      </span>
                      {tx.manually_reviewed 
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-white/30 shrink-0" /> 
                        : <Sparkles className="w-3.5 h-3.5 text-white/20 shrink-0" />
                      }
                      <ConfidenceBadge score={tx.confidence_score} />
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex col-span-3 items-center relative z-10">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-[10px] font-bold text-white/40 uppercase tracking-widest group-hover:bg-white/[0.08] group-hover:text-white/60 transition-all">
                    {tx.categories?.emoji && <span>{tx.categories.emoji}</span>}
                    <span className="truncate">{tx.categories?.name ?? 'Outros'}</span>
                  </span>
                </div>

                <div className="hidden md:block col-span-2 text-[10px] font-bold text-white/30 relative z-10 tabular-nums uppercase tracking-widest">
                  {formatDate(tx.date)}
                </div>

                <div className="col-span-1 md:col-span-2 flex justify-end relative z-10">
                  <span className={cn(
                    "font-medium text-sm tabular-nums tracking-tight",
                    isIncome ? "text-white" : "text-white/60"
                  )}>
                    {isIncome ? '+' : '-'}{formatBRL(Math.abs(tx.amount))}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <ImportPdfModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={() => setRefreshKey(k => k + 1)}
      />
    </div>
  );
}
