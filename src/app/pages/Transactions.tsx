import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, Button, Input, Badge } from "../components/ui";
import { Download, Plus, ArrowDown, ArrowUp, SlidersHorizontal, MoreHorizontal, Loader2 } from "lucide-react";
import { apiGet } from "../../lib/api";

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
      .catch(console.error)
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
    <div className="flex flex-col gap-8 pt-4">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#F4F5F8]">Transações</h1>
          <p className="mt-1 text-sm text-[#8B949E]">Gerencie, filtre e analise todas as suas movimentações.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary">
            <Download className="mr-2 h-4 w-4" /> Importar OFX
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Adicionar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-[#8B949E]">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-[rgba(116,238,21,0.1)] text-[#74ee15]">
                <ArrowDown className="h-3 w-3" />
              </div>
              Total de Entradas
            </div>
            <button className="text-[#8B949E] hover:text-[#F4F5F8]">•••</button>
          </div>
          <div className="text-3xl font-bold tracking-tight text-[#F4F5F8]">{fmt(totalIn)}</div>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <Badge variant="success" className="px-2 py-0.5 rounded-md text-xs font-bold border-none">
              neste período
            </Badge>
            <span className="text-[#8B949E] text-xs">neste mês</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-[#8B949E]">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-[rgba(255,255,255,0.1)] text-[#F4F5F8]">
                <ArrowUp className="h-3 w-3" />
              </div>
              Total de Saídas
            </div>
            <button className="text-[#8B949E] hover:text-[#F4F5F8]">•••</button>
          </div>
          <div className="text-3xl font-bold tracking-tight text-[#F4F5F8]">{fmt(totalOut)}</div>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <Badge variant="default" className="px-2 py-0.5 rounded-md text-xs font-bold border-none text-[#8B949E]">
              neste período
            </Badge>
            <span className="text-[#8B949E] text-xs">neste mês</span>
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex-1">
          <Input
            icon={isFetching
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <ArrowDown className="h-4 w-4 opacity-0" />}
            placeholder="Buscar transações..."
            className="max-w-md bg-[rgba(255,255,255,0.02)]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect defaultValue="Este Mês" />
          <FilterSelect defaultValue="Todas Categorias" />
          <FilterSelect defaultValue="Todas Contas" />
          <FilterSelect defaultValue="Todos Tipos" />
          <Button variant="secondary" className="px-3" aria-label="Filters">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#F4F5F8]">
            <thead className="bg-[rgba(255,255,255,0.02)] text-xs font-semibold text-[#8B949E] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Transação</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Conta</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
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
                    className="group transition-colors hover:bg-[rgba(255,255,255,0.03)] cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)] ${isPositive ? 'text-[#74ee15]' : 'text-[#F4F5F8]'}`}>
                          {isPositive
                            ? <ArrowDown className="h-4 w-4" />
                            : <ArrowUp className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="font-medium text-[#F4F5F8]">{name}</div>
                          <div className="text-xs text-[#8B949E]">{tx.category_id ? '' : 'Sem categoria'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#8B949E]">{date}</td>
                    <td className="px-6 py-4">
                      <Badge variant="default" className="pl-1.5 pr-2.5">
                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current"></span>
                        {category}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-[#8B949E]">
                        N/A
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-right font-medium ${isPositive ? 'text-[#74ee15]' : 'text-[#F4F5F8]'}`}>
                      {amountStr}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-[#8B949E] opacity-0 transition-opacity hover:text-[#F4F5F8] group-hover:opacity-100">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!isFetching && transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-[#8B949E]">
                    Nenhuma transação encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[rgba(255,255,255,0.05)] px-6 py-4">
          <span className="text-xs text-[#8B949E]">Mostrando {transactions.length} transações</span>
          <div className="flex items-center gap-1">
            <button className="flex h-8 w-8 items-center justify-center rounded-md bg-[rgba(255,255,255,0.05)] text-[#8B949E] hover:bg-[rgba(255,255,255,0.1)] hover:text-[#F4F5F8]">&lt;</button>
            <button className="flex h-8 w-8 items-center justify-center rounded-md bg-[#aa68ff] text-white">1</button>
            <button className="flex h-8 w-8 items-center justify-center rounded-md bg-[rgba(255,255,255,0.05)] text-[#8B949E] hover:bg-[rgba(255,255,255,0.1)] hover:text-[#F4F5F8]">&gt;</button>
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
