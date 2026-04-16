import { useEffect, useMemo, useState } from 'react';
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
  X,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { apiGet, apiPatch, formatBRL, formatDateOnly } from '@/shared/lib/api';
import { toast } from 'sonner';
import { ImportPdfModal } from '../components/ImportPdfModal';
import { cn } from '@/shared/lib/utils';

interface ApiTransaction {
  id: string;
  date: string;
  description: string;
  merchant_name?: string;
  amount: number;
  confidence_score: string | number | null;
  manually_reviewed: boolean;
  categories: { name: string; emoji: string } | null;
  category_id?: string | null;
  category_name?: string;
  category_emoji?: string;
}

interface ApiCategory {
  id: string;
  name: string;
  emoji: string;
}

type FilterKey = 'Todos' | 'Receitas' | 'Despesas' | 'Não Revisadas';
type PeriodFilter = 'Esta semana' | 'Este mês' | 'Últimos 3 meses' | 'Personalizado';
const FILTERS: FilterKey[] = ['Todos', 'Receitas', 'Despesas', 'Não Revisadas'];
const PERIOD_OPTIONS: PeriodFilter[] = ['Esta semana', 'Este mês', 'Últimos 3 meses', 'Personalizado'];

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function parseLocalDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function isDateInRange(dateStr: string, period: PeriodFilter, customFrom: string, customTo: string) {
  const txDate = parseLocalDate(dateStr);
  const today = startOfToday();
  const start = new Date(today);

  if (period === 'Esta semana') {
    const day = start.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diff);
    return txDate >= start && txDate <= today;
  }

  if (period === 'Este mês') {
    start.setDate(1);
    return txDate >= start && txDate <= today;
  }

  if (period === 'Últimos 3 meses') {
    start.setMonth(start.getMonth() - 3);
    return txDate >= start && txDate <= today;
  }

  if (customFrom && txDate < parseLocalDate(customFrom)) return false;
  if (customTo && txDate > parseLocalDate(customTo)) return false;
  return true;
}

function ConfidenceBadge({ score }: { score: string | number | null }) {
  if (score === null) return null;
  const normalizedScore =
    score === 'high' ? 95 :
    score === 'medium' ? 75 :
    score === 'low' ? 40 :
    score;
  const pct = normalizedScore > 1 ? Math.round(normalizedScore) : Math.round(normalizedScore * 100);
  const color =
    pct >= 90 ? 'text-white/70 border-white/20' :
    pct >= 70 ? 'text-white/50 border-white/10' :
    'text-white/40 border-white/[0.08]';
  return (
    <span className={cn("hidden lg:inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border tabular-nums uppercase tracking-widest font-medium", color)}>
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

function CategoryPickerModal({
  open,
  categories,
  saving,
  onClose,
  onSelect,
}: {
  open: boolean;
  categories: ApiCategory[];
  saving: boolean;
  onClose: () => void;
  onSelect: (category: ApiCategory) => Promise<void>;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl md:rounded-[2.5rem] bg-[#0a0a0a] border border-white/10 p-8 md:p-10 shadow-2xl animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-white/20 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-light text-white mb-2 tracking-tight">Alterar categoria</h2>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Selecione uma categoria existente</p>
        </div>
        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => void onSelect(category)}
              disabled={saving}
              className="w-full flex items-center gap-3 px-4 py-3 min-h-[48px] rounded-2xl border border-white/[0.08] bg-white/[0.03] text-white/70 hover:text-white hover:bg-white/[0.08] hover:border-white/20 transition-all disabled:opacity-40"
            >
              <span className="text-xl">{category.emoji}</span>
              <span className="text-sm font-medium">{category.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterDrawer({
  open,
  categories,
  period,
  activeFilter,
  selectedCategoryIds,
  customFrom,
  customTo,
  onClose,
  onPeriodChange,
  onTypeChange,
  onCategoryToggle,
  onCustomFromChange,
  onCustomToChange,
  onClear,
}: {
  open: boolean;
  categories: ApiCategory[];
  period: PeriodFilter;
  activeFilter: FilterKey;
  selectedCategoryIds: string[];
  customFrom: string;
  customTo: string;
  onClose: () => void;
  onPeriodChange: (period: PeriodFilter) => void;
  onTypeChange: (type: FilterKey) => void;
  onCategoryToggle: (categoryId: string) => void;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
  onClear: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[105]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-[#0a0a0a] border-l border-white/10 p-6 md:p-8 shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-light text-white">Filtros</h2>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mt-2">Filtre o histórico em memória</p>
          </div>
          <button onClick={onClose} className="p-2 text-white/20 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">Período</h3>
            <div className="flex gap-2 flex-wrap">
              {PERIOD_OPTIONS.map((label) => (
                <button
                  key={label}
                  onClick={() => onPeriodChange(label)}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border transition-all",
                    period === label
                      ? "bg-white/10 border-white/30 text-white"
                      : "bg-white/[0.02] border-white/10 text-white/40 hover:text-white/60 hover:border-white/20"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {period === 'Personalizado' && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <input type="date" value={customFrom} onChange={(e) => onCustomFromChange(e.target.value)} className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 min-h-[44px] text-xs text-white focus:outline-none focus:border-white/30" />
                <input type="date" value={customTo} onChange={(e) => onCustomToChange(e.target.value)} className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 min-h-[44px] text-xs text-white focus:outline-none focus:border-white/30" />
              </div>
            )}
          </div>

          <div>
            <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">Tipo</h3>
            <div className="flex gap-2 flex-wrap">
              {FILTERS.map((type) => (
                <button
                  key={type}
                  onClick={() => onTypeChange(type)}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border transition-all",
                    activeFilter === type
                      ? "bg-white/10 border-white/30 text-white"
                      : "bg-white/[0.02] border-white/10 text-white/40 hover:text-white/60 hover:border-white/20"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">Categoria</h3>
            <div className="space-y-3">
              {categories.map((category) => (
                <label key={category.id} className="flex items-center gap-3 text-sm text-white/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategoryIds.includes(category.id)}
                    onChange={() => onCategoryToggle(category.id)}
                    className="w-4 h-4 rounded border-white/20 bg-transparent"
                  />
                  <span className="text-lg">{category.emoji}</span>
                  <span>{category.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="flex-1 px-4 py-3 min-h-[44px] rounded-xl bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-all">
              Aplicar filtros
            </button>
            <button onClick={onClear} className="px-4 py-3 min-h-[44px] rounded-xl border border-white/10 bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.08] transition-all text-xs font-bold uppercase tracking-widest">
              Limpar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Transactions() {
  const navigate = useNavigate();
  const [allTransactions, setAllTransactions] = useState<ApiTransaction[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingCategoryTxId, setEditingCategoryTxId] = useState<string | null>(null);
  const [savingCategory, setSavingCategory] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [period, setPeriod] = useState<PeriodFilter>('Este mês');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [txRes, catRes] = await Promise.all([
          apiGet('/api/transactions?limit=200'),
          apiGet('/api/categories'),
        ]);
        setAllTransactions(txRes.transactions ?? []);
        setCategories(catRes.categories ?? []);
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
    let list = allTransactions.filter((tx) => isDateInRange(tx.date, period, customFrom, customTo));

    if (activeFilter === 'Receitas') list = list.filter((tx) => tx.amount > 0);
    if (activeFilter === 'Despesas') list = list.filter((tx) => tx.amount < 0);
    if (activeFilter === 'Não Revisadas') list = list.filter((tx) => !tx.manually_reviewed);

    if (selectedCategoryIds.length > 0) {
      list = list.filter((tx) => tx.category_id && selectedCategoryIds.includes(tx.category_id));
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((tx) =>
        (tx.description?.toLowerCase().includes(q)) ||
        (tx.merchant_name?.toLowerCase().includes(q)) ||
        (tx.categories?.name?.toLowerCase().includes(q)) ||
        (tx.category_name?.toLowerCase().includes(q))
      );
    }

    return list;
  }, [allTransactions, activeFilter, searchQuery, period, selectedCategoryIds, customFrom, customTo]);

  const totalIn = useMemo(() => filtered.filter((tx) => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0), [filtered]);
  const totalOut = useMemo(() => filtered.filter((tx) => tx.amount < 0).reduce((sum, tx) => sum + Math.abs(tx.amount), 0), [filtered]);
  const hasActiveAdvancedFilters = period !== 'Este mês' || selectedCategoryIds.length > 0 || customFrom !== '' || customTo !== '' || activeFilter !== 'Todos';

  const openCategoryPicker = (transactionId: string) => {
    setEditingCategoryTxId(transactionId);
  };

  const handleCategorySelect = async (category: ApiCategory) => {
    if (!editingCategoryTxId) return;
    setSavingCategory(true);
    try {
      await apiPatch(`/api/transactions/${editingCategoryTxId}`, { category_id: category.id });
      setAllTransactions((prev) =>
        prev.map((tx) =>
          tx.id === editingCategoryTxId
            ? {
                ...tx,
                category_id: category.id,
                category_name: category.name,
                category_emoji: category.emoji,
                categories: { name: category.name, emoji: category.emoji },
                manually_reviewed: true,
                confidence_score: 'high',
              }
            : tx
        )
      );
      toast.success('Categoria atualizada.');
      setEditingCategoryTxId(null);
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao atualizar categoria.');
    } finally {
      setSavingCategory(false);
    }
  };

  const clearAdvancedFilters = () => {
    setPeriod('Este mês');
    setActiveFilter('Todos');
    setSelectedCategoryIds([]);
    setCustomFrom('');
    setCustomTo('');
  };

  return (
    <div className="w-full relative z-10 animate-in fade-in duration-500 max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-8 md:mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl md:text-2xl tracking-[0.2em] font-medium">OTTO</span>
            <div className="h-4 w-px bg-white/20" />
            <h1 className="text-xs font-medium tracking-widest text-white/40 uppercase">Transações</h1>
          </div>
          <p className="text-white/40 text-sm italic">Quietly wealthy.</p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={() => setImportOpen(true)} className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-medium border transition-all bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] text-white/70 hover:text-white">
            <Download className="w-4 h-4" />
            Importar Extrato
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 min-h-[48px] bg-white text-black rounded-xl text-xs font-medium hover:bg-white/90 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            <Plus className="w-4 h-4" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 md:mb-10">
          <div className="p-5 md:p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/[0.02] blur-3xl rounded-full" />
            <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2 font-medium">Movimentações</p>
            <p className="text-xl md:text-2xl font-light">{filtered.length}</p>
          </div>
          <div className="p-5 md:p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/[0.02] blur-3xl rounded-full" />
            <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2 font-medium">Entradas</p>
            <p className="text-xl md:text-2xl font-light text-emerald-400">+{formatBRL(totalIn)}</p>
          </div>
          <div className="p-5 md:p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/[0.02] blur-3xl rounded-full" />
            <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2 font-medium">Saídas</p>
            <p className="text-xl md:text-2xl font-light text-rose-400">-{formatBRL(totalOut)}</p>
          </div>
          <div className="p-5 md:p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/[0.02] blur-3xl rounded-full" />
            <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2 font-medium">Saldo Líquido</p>
            <p className={cn("text-xl md:text-2xl font-light", totalIn - totalOut >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
              {totalIn - totalOut >= 0 ? '+' : '-'}{formatBRL(totalIn - totalOut)}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row items-center justify-between gap-5 md:gap-6 mb-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 w-full lg:w-auto no-scrollbar">
          {FILTERS.map((filterItem) => (
            <button
              key={filterItem}
              onClick={() => setActiveFilter(filterItem)}
              className={cn(
                "whitespace-nowrap px-4 py-2 min-h-[44px] rounded-xl text-xs font-medium transition-all border",
                activeFilter === filterItem
                  ? 'bg-white text-black border-white'
                  : 'text-white/40 hover:text-white hover:bg-white/[0.04] border-white/[0.08]'
              )}
            >
              {filterItem}
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
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-11 pr-4 py-3 min-h-[48px] text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all"
            />
          </div>
          <button onClick={() => setFilterOpen(true)} className="relative p-3 bg-white/[0.02] border border-white/10 rounded-xl hover:bg-white/[0.08] hover:border-white/30 transition-all text-white/40 hover:text-white min-h-[48px]">
            <SlidersHorizontal className="w-4 h-4" />
            {hasActiveAdvancedFilters && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-400" />}
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08] rounded-2xl md:rounded-3xl overflow-hidden backdrop-blur-2xl shadow-2xl">
        <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-5 border-b border-white/[0.05] text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
          <div className="col-span-5">Entidade / Descrição</div>
          <div className="col-span-3">Categoria</div>
          <div className="col-span-2">Data</div>
          <div className="col-span-2 text-right">Valor</div>
        </div>

        <div className="flex flex-col divide-y divide-white/[0.04]">
          {loading && Array.from({ length: 8 }).map((_, index) => <TxRowSkeleton key={index} />)}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <AlertCircle className="w-10 h-10 text-white/10" />
              <p className="text-sm text-white/40">{error}</p>
              <button onClick={() => setRefreshKey((key) => key + 1)} className="text-xs border border-white/10 hover:border-white/30 text-white/60 hover:text-white px-5 py-2.5 min-h-[44px] rounded-xl transition-all bg-white/5">
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

          {!loading && !error && filtered.map((tx) => {
            const isIncome = tx.amount > 0;
            const label = tx.merchant_name || tx.description || 'Transação';

            return (
              <Link key={tx.id} to={`/transactions/${tx.id}`} className="group grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-4 md:px-8 py-5 min-h-[56px] hover:bg-white/[0.02] transition-all relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div className="col-span-1 md:col-span-5 flex items-center gap-5 relative z-10">
                  <div className={cn("w-11 h-11 rounded-full border flex items-center justify-center shrink-0 text-base shadow-inner transition-colors", "bg-white/[0.02] border-white/[0.06] group-hover:border-white/15", isIncome ? 'text-white' : 'text-white/40')}>
                    {(tx.categories?.emoji ?? tx.category_emoji)
                      ? <span>{tx.categories?.emoji ?? tx.category_emoji}</span>
                      : isIncome
                        ? <ArrowDownRight className="w-5 h-5" />
                        : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-white/90 text-sm group-hover:text-white transition-colors truncate">{label}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-white/30 md:hidden uppercase tracking-widest">
                        {tx.categories?.name ?? tx.category_name ?? 'Sem categoria'} · {formatDateOnly(tx.date)}
                      </span>
                      {tx.manually_reviewed
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-white/30 shrink-0" />
                        : <Sparkles className="w-3.5 h-3.5 text-white/20 shrink-0" />}
                      <ConfidenceBadge score={tx.confidence_score} />
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex col-span-3 items-center relative z-10">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openCategoryPicker(tx.id);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-[10px] font-bold text-white/40 uppercase tracking-widest group-hover:bg-white/[0.08] group-hover:text-white/60 transition-all cursor-pointer hover:border-white/30 hover:text-white/80"
                  >
                    {(tx.categories?.emoji ?? tx.category_emoji) && <span>{tx.categories?.emoji ?? tx.category_emoji}</span>}
                    <span className="truncate">{tx.categories?.name ?? tx.category_name ?? 'Sem categoria'}</span>
                  </button>
                </div>

                <div className="hidden md:block col-span-2 text-[10px] font-bold text-white/30 relative z-10 tabular-nums uppercase tracking-widest">
                  {formatDateOnly(tx.date)}
                </div>

                <div className="col-span-1 md:col-span-2 flex justify-end relative z-10">
                  <span className={cn("font-medium text-sm tabular-nums tracking-tight", isIncome ? 'text-emerald-400' : 'text-rose-400')}>
                    {isIncome ? '+' : '-'}{formatBRL(Math.abs(tx.amount))}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <ImportPdfModal open={importOpen} onOpenChange={setImportOpen} onSuccess={() => setRefreshKey((key) => key + 1)} />
      <CategoryPickerModal open={editingCategoryTxId !== null} categories={categories} saving={savingCategory} onClose={() => setEditingCategoryTxId(null)} onSelect={handleCategorySelect} />
      <FilterDrawer
        open={filterOpen}
        categories={categories}
        period={period}
        activeFilter={activeFilter}
        selectedCategoryIds={selectedCategoryIds}
        customFrom={customFrom}
        customTo={customTo}
        onClose={() => setFilterOpen(false)}
        onPeriodChange={setPeriod}
        onTypeChange={setActiveFilter}
        onCategoryToggle={(categoryId) => setSelectedCategoryIds((prev) => prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId])}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
        onClear={clearAdvancedFilters}
      />
    </div>
  );
}
