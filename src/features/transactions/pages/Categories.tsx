import { useState, useEffect } from "react";
import { Card, Button } from "@/shared/components/ui";
import { Plus, MoreVertical } from "lucide-react";
import { apiGet, apiPost, apiFetch } from "@/shared/lib/api";
import { toast } from "sonner";

export function Categories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', color_hex: '#aa68ff', emoji: '📂' });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});

  const loadCategories = () => {
    apiGet('/api/categories')
      .then(res => setCategories(res.categories ?? []))
      .catch(console.error);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleDelete = async (id: string) => {
    if (isDeleting[id]) return;
    setIsDeleting(p => ({ ...p, [id]: true }));
    try {
      await apiFetch(`/api/categories/${id}`, { method: 'DELETE' });
      loadCategories();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir categoria');
    } finally {
      setIsDeleting(p => ({ ...p, [id]: false }));
    }
  };

  return (
    <div className="flex flex-col gap-8 pt-4">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#F4F5F8]">Categorias</h1>
          <p className="mt-1 text-sm text-[#8B949E]">Gerencie limites, personalize ícones e crie regras automáticas.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nova Categoria
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map((cat) => (
          <Card
            key={cat.id}
            className={`p-6 transition-all hover:bg-[rgba(255,255,255,0.06)] ${cat.spent > cat.budget ? 'border-[rgba(239,68,68,0.3)]' : ''}`}
          >
            <div className="mb-4 flex items-start justify-between">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                style={{ backgroundColor: `${cat.color_hex}22` }}
              >
                {cat.emoji || '📂'}
              </div>
              <div className="relative group/menu">
                <button className="text-[#8B949E] hover:text-[#F4F5F8]">
                  <MoreVertical className="h-5 w-5" />
                </button>
                <div className="absolute right-0 top-6 z-10 hidden group-hover/menu:flex flex-col rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#0D1526] shadow-xl min-w-[120px]">
                  <button
                    className="px-4 py-2 text-sm text-left text-[#8B949E] hover:text-[#F4F5F8] hover:bg-[rgba(255,255,255,0.05)] disabled:opacity-50"
                    onClick={() => handleDelete(cat.id)}
                    disabled={isDeleting[cat.id]}
                  >
                    {isDeleting[cat.id] ? 'Excluindo...' : 'Excluir'}
                  </button>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold text-[#F4F5F8]">{cat.name}</h3>
            </div>
          </Card>
        ))}

        <Card
          className="flex h-full min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 border-dashed border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.01)] transition-all hover:border-[#aa68ff] hover:bg-[rgba(170,104,255,0.02)]"
          onClick={() => setIsModalOpen(true)}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)] text-[#8B949E]">
            <Plus className="h-6 w-6" />
          </div>
          <span className="text-sm font-medium text-[#8B949E]">Criar nova categoria</span>
        </Card>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#0D1526] p-8 shadow-2xl">
            <h2 className="mb-6 text-xl font-bold text-[#F4F5F8]">Nova Categoria</h2>
            <div className="space-y-4">
              <input
                placeholder="Nome"
                value={newCat.name}
                onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))}
                className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] px-4 py-2.5 text-[#F4F5F8] outline-none focus:border-[#aa68ff]"
              />
              <input
                placeholder="Emoji (ex: 🏠)"
                value={newCat.emoji}
                onChange={e => setNewCat(p => ({ ...p, emoji: e.target.value }))}
                className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] px-4 py-2.5 text-[#F4F5F8] outline-none focus:border-[#aa68ff]"
              />
              <input
                placeholder="Cor hex (#aa68ff)"
                value={newCat.color_hex}
                onChange={e => setNewCat(p => ({ ...p, color_hex: e.target.value }))}
                className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] px-4 py-2.5 text-[#F4F5F8] outline-none focus:border-[#aa68ff]"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg px-4 py-2 text-sm text-[#8B949E] hover:text-[#F4F5F8]"
              >
                Cancelar
              </button>
              <button
                disabled={isSaving}
                onClick={async () => {
                  setIsSaving(true);
                  try {
                    await apiPost('/api/categories', newCat);
                    const res = await apiGet('/api/categories');
                    setCategories(res.categories ?? []);
                    setIsModalOpen(false);
                    setNewCat({ name: '', color_hex: '#aa68ff', emoji: '📂' });
                  } catch (e: any) {
                    toast.error(e.message || 'Erro ao criar categoria');
                  } finally {
                    setIsSaving(false);
                  }
                }}
                className="rounded-lg bg-[#aa68ff] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
