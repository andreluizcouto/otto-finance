import { useEffect, useState } from 'react';
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
import { apiGet, apiPost, apiDelete, formatBRL } from '@/shared/lib/api';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import { EmojiPickerGrid } from '@/shared/components/EmojiPickerGrid';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiCategory {
  id: string;
  name: string;
  emoji: string;
  color_hex: string | null;
  transactionCount?: number;
  totalSpent?: number;
  totalIncome?: number;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CategoryCard({ cat, maxSpent, onDelete }: { cat: ApiCategory; maxSpent: number; onDelete: (id: string) => void }) {
  const accentColor = cat.color_hex ?? '#ffffff';
  const totalSpent = cat.totalSpent ?? 0;
  const progress    = maxSpent > 0 ? (totalSpent / maxSpent) * 100 : 0;
  const transactionCount = cat.transactionCount ?? 0;
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="group bg-gradient-to-br from-white/[0.04] to-transparent border border-white/[0.08] hover:border-white/[0.18] transition-all duration-500 rounded-[2rem] p-8 relative overflow-hidden backdrop-blur-xl">

      {/* Background Glow with category color */}
      <div
        className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[80px] pointer-events-none opacity-5 group-hover:opacity-15 transition-opacity duration-700"
        style={{ backgroundColor: accentColor }}
      />

      {/* Top: emoji + menu */}
      <div className="flex items-start justify-between mb-8 relative z-10">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
          style={{ backgroundColor: `${accentColor}10`, borderColor: `${accentColor}25` }}
        >
          {cat.emoji ?? '📂'}
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-white/20 hover:text-white hover:bg-white/5 rounded-full transition-all"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          {showMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-10 w-40 bg-[#0a0a0a] border border-white/10 rounded-xl py-2 z-30 shadow-2xl backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-200">
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

      {/* Name */}
      <h3 className="text-xl font-light text-white mb-6 relative z-10 truncate tracking-tight">{cat.name}</h3>

      {/* Metrics */}
      <div className="relative z-10 space-y-3 mb-8">
        {totalSpent > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/30 text-[10px] font-bold uppercase tracking-widest">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Fluxo Saída</span>
            </div>
            <span className="text-white/80 tabular-nums font-medium text-sm">-{formatBRL(totalSpent)}</span>
          </div>
        )}
        {(cat.totalIncome ?? 0) > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/30 text-[10px] font-bold uppercase tracking-widest">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Fluxo Entrada</span>
            </div>
            <span className="text-white tabular-nums font-medium text-sm">+{formatBRL(cat.totalIncome ?? 0)}</span>
          </div>
        )}
        {transactionCount === 0 && (
          <p className="text-xs text-white/20 italic">Sem atividade recente.</p>
        )}
      </div>

      {/* Progress Bar */}
      {transactionCount > 0 && totalSpent > 0 && (
        <div className="mb-6 relative z-10">
          <div className="h-1 w-full bg-white/[0.05] rounded-full overflow-hidden border border-white/[0.02]">     
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: accentColor,
                boxShadow: progress > 80 ? `0 0 12px ${accentColor}80` : 'none',
              }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
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

// ─── Main Component ───────────────────────────────────────────────────────────

export function Categories() {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', color_hex: '#FFFFFF', emoji: '📂' });
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use dashboard stats for enrichment if available, otherwise just use categories
      const [catsRes, dashRes] = await Promise.all([
        apiGet('/api/categories'),
        apiGet('/api/dashboard?period=Ultimos 3 meses'), // Get stats from dashboard
      ]);

      const allCats: ApiCategory[] = catsRes.categories ?? [];
      const dashCats: any[] = dashRes.categories ?? [];

      // Enrich categories with stats from dashboard
      const enriched = allCats.map(c => {
        const stats = dashCats.find(dc => dc.category_id === c.id);
        return {
          ...c,
          totalSpent: stats?.amount ?? 0,
          transactionCount: 0, // Not provided by this endpoint currently
        };
      });

      setCategories(enriched);
    } catch (err: any) {
      console.error('Categories fetch error:', err);
      setError(err.message ?? 'Erro ao carregar taxonomia.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id: string) => {
    try {
      await apiDelete(`/api/categories/${id}`);
      toast.success('Categoria removida.');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover.');
    }
  };

  const handleCreate = async () => {
    if (!newCat.name.trim()) return;
    setIsSaving(true);
    try {
      await apiPost('/api/categories', newCat);
      toast.success('Categoria definida.');
      setIsModalOpen(false);
      setNewCat({ name: '', color_hex: '#FFFFFF', emoji: '📂' });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar.');
    } finally {
      setIsSaving(false);
    }
  };

  const maxSpent     = Math.max(...categories.map(c => c.totalSpent ?? 0), 0);
  const totalSpent   = categories.reduce((s, c) => s + (c.totalSpent ?? 0), 0);
  return (
    <div className="w-full relative z-10 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-8 md:mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl md:text-2xl tracking-[0.2em] font-medium">OTTO</span>
            <div className="h-4 w-px bg-white/20"></div>
            <h1 className="text-xs font-medium tracking-widest text-white/40 uppercase">Taxonomia</h1>
          </div>
          <p className="text-white/40 text-sm italic">Categorização estruturada de ativos e fluxos.</p>
        </div>
        
        <div className="flex gap-4 self-stretch sm:self-start md:self-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] bg-white/[0.04] border border-white/[0.08] text-white/60 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/[0.08] hover:text-white transition-all">
            <Settings2 className="w-4 h-4" />
            <span>Regras IA</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 min-h-[48px] bg-white text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            <Plus className="w-4 h-4" />
            <span>Definir Nova</span>
          </button>
        </div>
      </div>

      {/* ── Summary Stats ──────────────────────────────────────────────── */}
      {!loading && !error && categories.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 md:mb-12">
          <div className="p-5 md:p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl relative overflow-hidden">
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Classes</p>
            <p className="text-xl md:text-2xl font-light">{categories.length}</p>
          </div>
          <div className="p-5 md:p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl relative overflow-hidden">
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Engajamento IA</p>
            <p className="text-xl md:text-2xl font-light">100%</p>
          </div>
          <div className="p-5 md:p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl relative overflow-hidden">
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Total Consolidado</p>
            <p className="text-xl md:text-2xl font-light text-white/70">-{formatBRL(totalSpent)}</p>
          </div>
          <div className="p-5 md:p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl relative overflow-hidden">
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Período</p>
            <p className="text-xl md:text-2xl font-light text-white/50">90 dias</p>
          </div>
        </div>
      )}

      {/* ── Grid ──────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
          <AlertCircle className="w-12 h-12 text-white/10" />
          <p className="text-white/40 text-sm">{error}</p>
          <button
            onClick={fetchData}
            className="text-xs border border-white/10 hover:border-white/30 text-white/60 hover:text-white px-6 py-3 min-h-[44px] flex items-center justify-center rounded-xl transition-all bg-white/5 uppercase tracking-widest font-bold"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
          {categories.length === 0 && (
            <div className="col-span-full py-32 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-2xl md:rounded-[2.5rem]">
              <p className="text-white/20 text-sm tracking-widest uppercase px-4">Nenhuma categoria registrada no sistema.</p>
            </div>
          )}
          
          {categories
            .sort((a, b) => (b.totalSpent ?? 0) - (a.totalSpent ?? 0))
            .map(cat => (
              <CategoryCard key={cat.id} cat={cat} maxSpent={maxSpent} onDelete={handleDelete} />
            ))
          }
          
          {/* Empty Add Card */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex h-full min-h-[250px] md:min-h-[300px] cursor-pointer flex-col items-center justify-center gap-6 border-2 border-dashed border-white/[0.06] bg-transparent rounded-2xl md:rounded-[2.5rem] transition-all hover:border-white/20 hover:bg-white/[0.02] group"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.03] border border-white/[0.06] text-white/20 transition-all group-hover:bg-white/[0.08] group-hover:text-white group-hover:scale-110">
              <Plus className="h-8 w-8" />
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-white/20 group-hover:text-white/60 transition-all">Definir Nova Categoria</span>
          </button>
        </div>
      )}

      {/* ── New Category Modal ────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl md:rounded-[2.5rem] p-8 md:p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-white/20 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="mb-8 md:mb-10 text-center">
              <h2 className="text-2xl font-light text-white mb-2 tracking-tight">Nova Classe</h2>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Estruturação de dados</p>
            </div>

            <div className="space-y-6 md:space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">Identificação</label>
                <input
                  placeholder="Nome da Categoria"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 min-h-[48px] text-sm text-white focus:outline-none focus:border-white/30 focus:bg-white/[0.06] transition-all"
                  value={newCat.name}
                  onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">Símbolo</label>
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                    <div className="text-center text-3xl mb-4">{newCat.emoji}</div>
                    <EmojiPickerGrid selected={newCat.emoji} onSelect={(emoji) => setNewCat((prev) => ({ ...prev, emoji }))} />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">Acento</label>
                  <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-2xl p-2.5 min-h-[48px]">
                    <input
                      type="color"
                      className="w-8 h-8 md:w-10 md:h-10 rounded-lg border-none bg-transparent cursor-pointer"
                      value={newCat.color_hex}
                      onChange={e => setNewCat(p => ({ ...p, color_hex: e.target.value }))}
                    />
                    <span className="text-[10px] text-white/40 tabular-nums uppercase font-mono">{newCat.color_hex}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 md:mt-12 space-y-4">
              <button
                disabled={isSaving || !newCat.name}
                onClick={handleCreate}
                className="w-full h-14 min-h-[48px] rounded-2xl bg-white text-black font-bold text-xs uppercase tracking-[0.2em] transition-all hover:bg-white/90 disabled:opacity-30 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Confirmar Categoria'}
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full h-12 min-h-[44px] rounded-2xl text-white/40 hover:text-white text-[10px] font-bold uppercase tracking-[0.2em] transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
