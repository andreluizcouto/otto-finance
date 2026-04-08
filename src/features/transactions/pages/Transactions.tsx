import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, Button, Input, Badge } from "@/shared/components/ui";
import { Download, Plus, ArrowDown, ArrowUp, SlidersHorizontal, MoreHorizontal, Loader2 } from "lucide-react";
import { apiGet } from "@/shared/lib/api";
import { toast } from "sonner";

export function Transactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setIsFetching(true);
    apiGet('/api/transactions?limit=200')
      .then(res => {
        const all: any[] = res.transactions ?? [];
        const filtered = debouncedSearch
          ? all.filter(tx =>
              (tx.merchant_name || tx.description || '')
                .toLowerCase()
                .includes(debouncedSearch.toLowerCase())
            )
          : all;
        setTransactions(filtered);
      })
      .catch(() => toast.error('Erro ao carregar transações'))
      .finally(() => setIsFetching(false));
  }, [debouncedSearch]);

  const totalIn = transactions
    .filter(t => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions
    .filter(t => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  const fmt = (n: number) =>
    'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  return (
    <div className="flex flex-col gap-10 pt-6 max-w-7xl mx-auto px-6">
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-4xl otto-title text-white">Transações</h1>
          <p className="mt-2 otto-label text-xs">Quietly Wealthy</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="secondary" className="bg-white/5 text-white border-white/10 hover:bg-white/10 rounded-xl px-6 py-6 text-[10px] otto-label transition-all">
            <Download className="mr-3 h-4 w-4" /> Importar
          </Button>
          <Button className="bg-white text-black hover:bg-white/90 rounded-xl px-6 py-6 text-[10px] otto-label transition-all">
            <Plus className="mr-3 h-4 w-4" /> Adicionar
          </Button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3 otto-label text-[10px]">
              <ArrowDown className="h-4 w-4 text-white/40" /> Total de Entradas
            </div>
          </div>
          <div className="text-4xl font-light tracking-tight text-white otto-title">{fmt(totalIn)}</div>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-white/20 text-[10px] uppercase tracking-widest font-medium">Fluxo Mensal</span>
          </div>
        </Card>

        <Card className="p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3 otto-label text-[10px]">
              <ArrowUp className="h-4 w-4 text-white/40" /> Total de Saídas
            </div>
          </div>
          <div className="text-4xl font-light tracking-tight text-white otto-title">{fmt(totalOut)}</div>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-white/20 text-[10px] uppercase tracking-widest font-medium">Fluxo Mensal</span>
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        <div className="flex-1">
          <Input
            icon={isFetching
              ? <Loader2 className="h-4 w-4 animate-spin text-white/40" />
              : <SlidersHorizontal className="h-4 w-4 text-white/40" />}
            placeholder="Buscar movimentações..."
            className="max-w-md bg-white/5 border-white/10 rounded-xl py-6 px-4 text-xs font-medium focus:border-white/20 transition-all shadow-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="overflow-hidden border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-white">
            <thead className="bg-white/[0.02] text-[9px] otto-label text-white/40 border-b border-white/5">
              <tr>
                <th className="px-8 py-5">Entidade</th>
                <th className="px-8 py-5">Data</th>
                <th className="px-8 py-5">Categoria</th>
                <th className="px-8 py-5 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map((tx) => {
                const isPositive = tx.amount >= 0;
                const name = tx.merchant_name || tx.description || 'Transação';
                const category = tx.category_name || 'Outros';
                const date = tx.date ? tx.date.slice(0, 10) : '';
                const amountStr = isPositive
                  ? `+ R$ ${tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : `- R$ ${Math.abs(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

                return (
                  <tr
                    key={tx.id}
                    onClick={() => navigate(`/transactions/${tx.id}`)}
                    className="group transition-all hover:bg-white/[0.02] cursor-pointer"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-white transition-all group-hover:bg-white/10 ${isPositive ? 'text-white' : 'text-white/60'}`}>
                          {isPositive
                            ? <ArrowDown className="h-4 w-4" />
                            : <ArrowUp className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="font-medium text-white tracking-tight">{name}</div>
                          <div className="text-[10px] otto-label mt-1">{tx.category_id ? '' : 'Uncategorized'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-white/40 text-[10px] otto-label">{date}</td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] otto-label px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                        {category}
                      </span>
                    </td>
                    <td className={`px-8 py-6 text-right font-medium tracking-tight ${isPositive ? 'text-white' : 'text-white/60'}`}>
                      {amountStr}
                    </td>
                  </tr>
                );
              })}
              {!isFetching && transactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-[10px] otto-label text-white/20">
                    Nenhuma movimentação identificada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 px-8 py-6">
          <span className="text-[10px] otto-label text-white/20">{transactions.length} Entradas</span>
          <div className="flex items-center gap-3">
            <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/5">&lt;</button>
            <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-white text-black text-[10px] otto-label">1</button>
            <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/5">&gt;</button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function FilterSelect({ defaultValue }: { defaultValue: string }) {
  return (
    <select className="h-10 rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] px-3 text-sm text-[#F4F5F8] outline-none hover:bg-[rgba(255,255,255,0.05)] transition-colors">
      <option>{defaultValue}</option>
    </select>
  );
}
