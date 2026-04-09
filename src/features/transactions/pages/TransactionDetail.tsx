import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Card, Button, Input } from "@/shared/components/ui";
import { ArrowLeft, Edit2, Share2, FileText, ShoppingCart, Calendar, CreditCard, Tag } from "lucide-react";
import { apiGet } from "@/shared/lib/api";
import { toast } from "sonner";

export function TransactionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("ID de transação inválido.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    apiGet("/api/transactions?limit=1000")
      .then((res) => {
        const found = (res?.transactions ?? []).find((item: any) => item.id === id);
        if (!found) {
          setError("Transação não encontrada.");
          return;
        }
        setTransaction(found);
        setError(null);
      })
      .catch(() => {
        setError("Erro ao carregar detalhes da transação.");
        toast.error("Erro ao carregar detalhes da transação");
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const amountLabel = useMemo(() => {
    if (!transaction) {
      return "—";
    }
    const abs = Math.abs(Number(transaction.amount ?? 0));
    const signal = Number(transaction.amount ?? 0) >= 0 ? "+" : "-";
    return `${signal} R$ ${abs.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  }, [transaction]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-10 pt-6 max-w-4xl mx-auto px-6">
        <Card className="p-10 border-border bg-secondary/20">
          <div className="animate-pulse h-8 w-64 rounded bg-secondary mb-6" />
          <div className="animate-pulse h-6 w-48 rounded bg-secondary mb-4" />
          <div className="animate-pulse h-20 w-full rounded bg-secondary" />
        </Card>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="flex flex-col gap-10 pt-6 max-w-4xl mx-auto px-6">
        <Card className="p-10 border-border bg-secondary/20">
          <h1 className="text-2xl otto-title text-foreground mb-3">Detalhe indisponível</h1>
          <p className="text-sm text-muted-foreground mb-6">{error ?? "Transação não encontrada."}</p>
          <Button onClick={() => navigate("/transactions")}>Voltar para Transações</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 pt-6 max-w-4xl mx-auto px-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-foreground transition-all hover:bg-muted border border-border">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex gap-4">
          <Button variant="secondary" className="px-6 py-6">
            <Share2 className="mr-3 h-4 w-4" /> Compartilhar
          </Button>
          <Button variant="outline" className="px-6 py-6">
            <Edit2 className="mr-3 h-4 w-4" /> Editar
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-border bg-secondary/20">
        <div className="border-b border-border bg-secondary/10 p-12 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-background text-foreground border border-border transition-all hover:scale-105">
            <ShoppingCart className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-light text-foreground otto-title tracking-tight uppercase">
            {transaction.merchant_name || transaction.description || "Transação"}
          </h1>
          <p className="mt-2 text-[10px] otto-label text-muted-foreground/40 tracking-[0.2em] uppercase">
            Dado real carregado da API
          </p>
          <div className="mt-10 text-5xl font-light text-foreground otto-title">
            {amountLabel}
          </div>
          <div className="mt-6 flex items-center justify-center gap-3">
            <span className="text-[9px] otto-label px-3 py-1.5 rounded-full bg-secondary text-muted-foreground border border-border">
              {transaction.amount >= 0 ? "CRÉDITO" : "DÉBITO"}
            </span>
          </div>
        </div>

        <div className="grid gap-12 p-12 md:grid-cols-2">
          <div className="space-y-10">
            <div>
              <h3 className="text-[10px] otto-label text-muted-foreground tracking-widest uppercase mb-6">Detalhes</h3>
              <div className="flex flex-col gap-6 rounded-2xl border border-border bg-secondary/20 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-[10px] otto-label text-muted-foreground/40">
                    <Calendar className="h-4 w-4" /> DATA
                  </div>
                  <span className="text-xs font-medium text-foreground">
                    {transaction.date ?? "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-6">
                  <div className="flex items-center gap-4 text-[10px] otto-label text-muted-foreground/40">
                    <CreditCard className="h-4 w-4" /> FONTE
                  </div>
                  <span className="text-xs font-medium text-foreground">Não informado</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-6">
                  <div className="flex items-center gap-4 text-[10px] otto-label text-muted-foreground/40">
                    <Tag className="h-4 w-4" /> CATEGORIA
                  </div>
                  <span className="text-xs font-medium text-foreground">
                    {transaction.category_name || "Outros"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-[10px] otto-label text-muted-foreground tracking-widest uppercase mb-6">Notas</h3>
              <Input
                placeholder="Anotações internas (opcional)..."
                className="h-auto min-h-[120px] items-start p-4 py-4 text-muted-foreground focus:text-foreground bg-secondary/20"
              />
            </div>
          </div>

          <div className="space-y-10">
            <Card className="border-border bg-secondary/30 p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <FileText className="h-12 w-12 text-foreground" />
              </div>
              <div className="mb-6 flex items-center gap-3 text-[10px] otto-label text-foreground tracking-widest uppercase">
                <SparklesIcon className="h-4 w-4" /> INSIGHT
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                Sem análise estatística automática disponível para esta tela no momento. O conteúdo acima reflete apenas dados reais da API.
              </p>
            </Card>

            <div>
              <h3 className="text-[10px] otto-label text-muted-foreground tracking-widest uppercase mb-6">Comprovante</h3>
              <div className="flex h-48 cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-transparent transition-all hover:border-muted-foreground/40 hover:bg-secondary/20 group">
                <div className="h-12 w-12 flex items-center justify-center rounded-full bg-secondary text-muted-foreground/40 transition-all group-hover:bg-muted group-hover:text-foreground">
                  <FileText className="h-6 w-6" />
                </div>
                <span className="text-[10px] otto-label text-muted-foreground/40 uppercase tracking-widest group-hover:text-foreground transition-all">Upload Document</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SparklesIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}

