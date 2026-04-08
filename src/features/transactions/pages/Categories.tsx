import { useState, useEffect } from "react";
import { Card, Button, Input } from "@/shared/components/ui";
import { Plus, MoreVertical } from "lucide-react";
import { apiGet, apiPost, apiDelete } from "@/shared/lib/api";
import { toast } from "sonner";

export function Categories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', color_hex: '#FFFFFF', emoji: '📂' });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});

  const loadCategories = () => {
    apiGet('/api/categories')
      .then(res => setCategories(res.categories ?? []))
      .catch(() => toast.error('Erro ao carregar categorias'));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleDelete = async (id: string) => {
    if (isDeleting[id]) return;
    setIsDeleting(p => ({ ...p, [id]: true }));
    try {
      await apiDelete(`/api/categories/${id}`);
      loadCategories();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir categoria');
    } finally {
      setIsDeleting(p => ({ ...p, [id]: false }));
    }
  };

  return (
    <div className="flex flex-col gap-10 pt-6 max-w-7xl mx-auto px-6">
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-4xl otto-title text-foreground">Taxonomia</h1>
          <p className="mt-2 otto-serif text-sm text-muted-foreground">Categorização de ativos e fluxos.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="px-6 py-6 text-[10px] otto-label transition-all">
          <Plus className="mr-3 h-4 w-4" /> Definir Categoria
        </Button>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map((cat) => (
          <Card
            key={cat.id}
            className="p-8 group cursor-pointer transition-all hover:bg-secondary/20 border-border"
          >
            <div className="mb-8 flex items-start justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-foreground transition-all group-hover:bg-muted text-2xl grayscale">
                {cat.emoji || '📂'}
              </div>
              <div className="relative group/menu">
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <MoreVertical className="h-5 w-5" />
                </button>
                <div className="absolute right-0 top-8 z-10 hidden group-hover/menu:flex flex-col rounded-xl border border-border bg-card shadow-2xl min-w-[140px] overflow-hidden backdrop-blur-3xl">
                  <button
                    className="px-4 py-3 text-[10px] otto-label text-left text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-50 transition-all"
                    onClick={() => handleDelete(cat.id)}
                    disabled={isDeleting[cat.id]}
                  >
                    {isDeleting[cat.id] ? 'ELIMINATING...' : 'ELIMINATE'}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-foreground tracking-tight uppercase mb-1">{cat.name}</h3>
              <p className="text-[10px] otto-label text-muted-foreground/40 uppercase tracking-widest">Active Class</p>
            </div>
          </Card>
        ))}

        <Card
          className="flex h-full min-h-[240px] cursor-pointer flex-col items-center justify-center gap-4 border-dashed border-border bg-transparent transition-all hover:border-muted-foreground/40 hover:bg-secondary/20 group"
          onClick={() => setIsModalOpen(true)}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground/40 transition-all group-hover:bg-muted group-hover:text-foreground">
            <Plus className="h-6 w-6" />
          </div>
          <span className="text-[10px] otto-label text-muted-foreground/40 group-hover:text-foreground transition-all">Definir Nova Categoria</span>
        </Card>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xl p-6">
          <Card className="w-full max-w-md p-10 border-border shadow-2xl bg-card">
            <div className="mb-10 text-center">
              <h2 className="text-2xl otto-title text-foreground mb-2">Nova Categoria</h2>
              <p className="text-[10px] otto-label text-muted-foreground tracking-[0.2em]">Asset Classification</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="otto-label text-[9px] text-muted-foreground">Denominação</label>
                <Input
                  placeholder="Nome da Categoria"
                  className="bg-background border-border rounded-xl py-6 px-4 text-xs font-medium focus:border-white/20 transition-all shadow-none"
                  value={newCat.name}
                  onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="otto-label text-[9px] text-muted-foreground">Símbolo Visual (Emoji)</label>
                <Input
                  placeholder="ex: 🏠"
                  className="bg-background border-border rounded-xl py-6 px-4 text-xs font-medium focus:border-white/20 transition-all shadow-none"
                  value={newCat.emoji}
                  onChange={e => setNewCat(p => ({ ...p, emoji: e.target.value }))}
                />
              </div>
            </div>

            <div className="mt-12 flex flex-col gap-4">
              <Button
                disabled={isSaving}
                className="w-full rounded-xl py-8 text-xs otto-label tracking-[0.2em] disabled:opacity-50"
                onClick={async () => {
                  setIsSaving(true);
                  try {
                    await apiPost('/api/categories', newCat);
                    const res = await apiGet('/api/categories');
                    setCategories(res.categories ?? []);
                    setIsModalOpen(false);
                    setNewCat({ name: '', color_hex: '#FFFFFF', emoji: '📂' });
                  } catch (e: any) {
                    toast.error(e.message || 'Erro ao criar categoria');
                  } finally {
                    setIsSaving(false);
                  }
                }}
              >
                {isSaving ? 'DEFINING...' : 'CONFIRM DEFINITION'}
              </Button>
              <Button
                variant="ghost"
                className="w-full py-6"
                onClick={() => setIsModalOpen(false)}
              >
                CANCEL
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
