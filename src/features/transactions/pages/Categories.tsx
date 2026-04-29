import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Settings2,
  MoreVertical,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Loader2,
  Hash,
  X,
  Trash2,
} from 'lucide-react';
import { apiDelete, apiGet, apiPatch, apiPost, formatBRL } from '@/shared/lib/api';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import { EmojiPickerGrid } from '@/shared/components/EmojiPickerGrid';

interface ApiCategory {
  id: string;
  name: string;
  emoji: string;
  color_hex: string | null;
  is_default?: boolean;
}

interface ApiTransaction {
  id: string;
  date: string;
  amount: number;
  category_id?: string | null;
  category_name?: string;
  category_emoji?: string;
}

interface EnrichedCategory extends ApiCategory {
  transactionCount: number;
  totalSpent: number;
  totalIncome: number;
}

type PeriodOption = 'Esta semana' | 'Este mês' | 'Últimos 3 meses';

function isTransactionInPeriod(dateStr: string, period: PeriodOption) {
  if (!dateStr) return false;
  const txDate = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  const start = new Date(today);

  if (period === 'Esta semana') {
    const day = start.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diff);
    start.setHours(0, 0, 0, 0);
    return txDate >= start;
  }

  if (period === 'Este mês') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return txDate >= start;
  }

  start.setMonth(start.getMonth() - 3);
  start.setHours(0, 0, 0, 0);
  return txDate >= start;
}

function CategoryCard({
  cat,
  maxSpent,
  onDelete,
  onEdit,
}: {
  cat: EnrichedCategory;
  maxSpent: number;
  onDelete: (id: string) => void;
  onEdit: (cat: EnrichedCategory) => void;
}) {
  const accentColor = cat.color_hex ?? '#ffffff';
  const totalSpent = cat.totalSpent ?? 0;
  const progress = maxSpent > 0 ? (totalSpent / maxSpent) * 100 : 0;
  const transactionCount = cat.transactionCount ?? 0;
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="group bg-gradient-to-br from-white/[0.04] to-transparent border border-white/[0.08] hover:border-white/[0.18] transition-all duration-500 rounded-[2rem] p-8 relative overflow-hidden backdrop-blur-xl">
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[80px] pointer-events-none opacity-5 group-hover:opacity-15 transition-opacity duration-700" style={{ backgroundColor: accentColor }} />

      <div className="flex items-start justify-between mb-8 relative z-10">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3" style={{ backgroundColor: `${accentColor}10`, borderColor: `${accentColor}25` }}>
          {cat.emoji ?? '📂'}
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-white/20 hover:text-white hover:bg-white/5 rounded-full transition-all">
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-10 w-40 bg-[#0a0a0a] border border-white/10 rounded-xl py-2 z-30 shadow-2xl backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-200">
                <button
                  onClick={() => {
                    onEdit(cat);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-white/70 hover:bg-white/5 hover:text-white transition-colors uppercase tracking-widest"
                >
                  <Settings2 className="w-3.5 h-3.5" /> Editar
                </button>
                <button
                  onClick={() => {
                    onDelete(cat.id);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-400/80 hover:bg-red-500/5 transition-colors uppercase tracking-widest"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <h3 className="text-xl font-light text-white mb-6 relative z-10 truncate tracking-tight">{cat.name}</h3>

      <div className="relative z-10 space-y-3 mb-8">
        {totalSpent > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/30 text-[10px] font-bold uppercase tracking-widest">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Fluxo Saída</span>
            </div>
            <span className="text-rose-400 tabular-nums font-medium text-sm">-{formatBRL(totalSpent)}</span>
          </div>
        )}
        {cat.totalIncome > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/30 text-[10px] font-bold uppercase tracking-widest">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Fluxo Entrada</span>
            </div>
            <span className="text-emerald-400 tabular-nums font-medium text-sm">+{formatBRL(cat.totalIncome)}</span>
          </div>
        )}
        {transactionCount === 0 && <p className="text-xs text-white/20 italic">Sem atividade recente.</p>}
      </div>

      {transactionCount > 0 && totalSpent > 0 && (
        <div className="mb-6 relative z-10">
          <div className="h-1 w-full bg-white/[0.05] rounded-full overflow-hidden border border-white/[0.02]">
            <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: accentColor, boxShadow: progress > 80 ? `0 0 12px ${accentColor}80` : 'none' }} />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-[10px] font-bold text-white/20 group-hover:text-white/40 transition-colors relative z-10 pt-5 border-t border-white/[0.05] uppercase tracking-[0.2em]">
        <Hash className="w-3 h-3" />
        <span>{transactionCount} registros</span>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-[2rem] bg-white/[0.03] border border-white/[0.06] p-8 animate-pulse">
      <div className="flex items-start justify-between mb-10">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.06]" />
        <div className="w-6 h-6 rounded bg-white/[0.04]" />
      </div>
      <div className="space-y-4">
        <div className="h-6 w-48 bg-white/[0.06] rounded-lg" />
        <div className="h-4 w-32 bg-white/[0.04] rounded-md" />
        <div className="h-1 w-full bg-white/[0.04] rounded-full mt-6" />
      </div>
    </div>
  );
}

export function Categories() {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<EnrichedCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', color_hex: '#FFFFFF', emoji: '📂' });
  const [isSaving, setIsSaving] = useState(false);
  const [period, setPeriod] = useState<PeriodOption>('Este mês');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [catsRes, txRes] = await Promise.all([
        apiGet('/api/categories'),
        apiGet('/api/transactions?limit=1000'),
      ]);
      setCategories(catsRes.categories ?? []);
      setTransactions(txRes.transactions ?? []);
    } catch (err: any) {
      console.error('Categories fetch error:', err);
      setError(err.message ?? 'Erro ao carregar taxonomia.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const enrichedCategories = useMemo<EnrichedCategory[]>(() => {
    const filteredTransactions = transactions.filter((tx) => isTransactionInPeriod(tx.date, period));

    return categories.map((category) => {
      const categoryTransactions = filteredTransactions.filter((tx) => tx.category_id === category.id);
      const totalSpent = categoryTransactions.filter((tx) => tx.amount < 0).reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      const totalIncome = categoryTransactions.filter((tx) => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);

      return {
        ...category,
        transactionCount: categoryTransactions.length,
        totalSpent,
        totalIncome,
      };
    });
  }, [categories, transactions, period]);

  const handleDelete = async (id: string) => {
    try {
      await apiDelete(`/api/categories/${id}`);
      toast.success('Categoria removida.');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover.');
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', color_hex: '#FFFFFF', emoji: '📂' });
    setIsModalOpen(true);
  };

  const openEditModal = (category: EnrichedCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      color_hex: category.color_hex ?? '#FFFFFF',
      emoji: category.emoji ?? '📂',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setCategoryForm({ name: '', color_hex: '#FFFFFF', emoji: '📂' });
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) return;
    setIsSaving(true);
    try {
      if (editingCategory) {
        await apiPatch(`/api/categories/${editingCategory.id}`, categoryForm);
        toast.success('Categoria atualizada.');
      } else {
        await apiPost('/api/categories', categoryForm);
        toast.success('Categoria definida.');
      }
      closeModal();
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar.');
    } finally {
      setIsSaving(false);
    }
  };

  const maxSpent = Math.max(...enrichedCategories.map((cat) => cat.totalSpent), 0);

  return (
    <div className="w-full relative z-10 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-8 md:mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl md:text-2xl tracking-[0.2em] font-medium">OTTO</span>
            <div className="h-4 w-px bg-white/20" />
            <h1 className="text-xs font-medium tracking-widest text-white/40 uppercase">Taxonomia</h1>
          </div>
          <p className="text-white/40 text-sm italic">Categorização estruturada de ativos e fluxos.</p>
        </div>

        <div className="flex gap-4 self-stretch sm:self-start md:self-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] bg-white/[0.04] border border-white/[0.08] text-white/60 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/[0.08] hover:text-white transition-all">
            <Settings2 className="w-4 h-4" />
            <span>Regras IA</span>
          </button>
          <button onClick={openCreateModal} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 min-h-[48px] bg-white text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            <Plus className="w-4 h-4" />
            <span>Definir Nova</span>
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-8 flex-wrap">
        {(['Esta semana', 'Este mês', 'Últimos 3 meses'] as PeriodOption[]).map((label) => (
          <button
            key={label}
            onClick={() => setPeriod(label)}
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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
          <AlertCircle className="w-12 h-12 text-white/10" />
          <p className="text-white/40 text-sm">{error}</p>
          <button onClick={fetchData} className="text-xs border border-white/10 hover:border-white/30 text-white/60 hover:text-white px-6 py-3 min-h-[44px] flex items-center justify-center rounded-xl transition-all bg-white/5 uppercase tracking-widest font-bold">
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
          {enrichedCategories.length === 0 && (
            <div className="col-span-full py-32 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-2xl md:rounded-[2.5rem]">
              <p className="text-white/20 text-sm tracking-widest uppercase px-4">Nenhuma categoria registrada no sistema.</p>
            </div>
          )}

          {enrichedCategories
            .sort((a, b) => (b.totalSpent ?? 0) - (a.totalSpent ?? 0))
            .map((cat) => (
              <CategoryCard key={cat.id} cat={cat} maxSpent={maxSpent} onDelete={handleDelete} onEdit={openEditModal} />
            ))}

          <button onClick={openCreateModal} className="flex h-full min-h-[250px] md:min-h-[300px] cursor-pointer flex-col items-center justify-center gap-6 border-2 border-dashed border-white/[0.06] bg-transparent rounded-2xl md:rounded-[2.5rem] transition-all hover:border-white/20 hover:bg-white/[0.02] group">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.03] border border-white/[0.06] text-white/20 transition-all group-hover:bg-white/[0.08] group-hover:text-white group-hover:scale-110">
              <Plus className="h-8 w-8" />
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-white/20 group-hover:text-white/60 transition-all">Definir Nova Categoria</span>
          </button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={closeModal} />
          <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <button onClick={closeModal} className="absolute top-6 right-6 p-2 text-white/20 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>

            <div className="mb-8 md:mb-10 text-center">
              <h2 className="text-2xl font-light text-white mb-2 tracking-tight">{editingCategory ? 'Editar Classe' : 'Nova Classe'}</h2>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">{editingCategory ? 'Ajustar nome, cor e símbolo' : 'Estruturação de dados'}</p>
            </div>

            <div className="space-y-6 md:space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">Identificação</label>
                <input
                  placeholder="Nome da Categoria"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 min-h-[48px] text-sm text-white focus:outline-none focus:border-white/30 focus:bg-white/[0.06] transition-all"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_180px] gap-5 md:gap-6 items-start">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">Símbolo</label>
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 md:p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] border border-white/10 text-2xl">
                        {categoryForm.emoji}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Escolha um ícone</span>
                    </div>
                    <EmojiPickerGrid selected={categoryForm.emoji} onSelect={(emoji) => setCategoryForm((prev) => ({ ...prev, emoji }))} />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">Acento</label>
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 min-h-[104px]">
                    <div className="flex items-center gap-3">
                      <input type="color" className="w-12 h-12 rounded-xl border-none bg-transparent cursor-pointer" value={categoryForm.color_hex} onChange={(e) => setCategoryForm((prev) => ({ ...prev, color_hex: e.target.value }))} />
                      <span className="text-[10px] text-white/40 tabular-nums uppercase font-mono">{categoryForm.color_hex}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 md:mt-12 space-y-4">
              <button disabled={isSaving || !categoryForm.name} onClick={handleSaveCategory} className="w-full h-14 min-h-[48px] rounded-2xl bg-white text-black font-bold text-xs uppercase tracking-[0.2em] transition-all hover:bg-white/90 disabled:opacity-30 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : editingCategory ? 'Salvar Categoria' : 'Confirmar Categoria'}
              </button>
              <button onClick={closeModal} className="w-full h-12 min-h-[44px] rounded-2xl text-white/40 hover:text-white text-[10px] font-bold uppercase tracking-[0.2em] transition-all">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
