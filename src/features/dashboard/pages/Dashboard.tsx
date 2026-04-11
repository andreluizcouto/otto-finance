import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button, Card } from "@/shared/components/ui";
import { ImportPdfModal } from "@/features/transactions/components/ImportPdfModal";
import { apiGet, apiPost } from "@/shared/lib/api";

const PERIOD_LABELS = ["Este Mês", "Esta Semana", "Últimos 3 Meses"] as const;
const PERIOD_API: Record<(typeof PERIOD_LABELS)[number], string> = {
  "Este Mês": "Este mes",
  "Esta Semana": "Esta semana",
  "Últimos 3 Meses": "Ultimos 3 meses",
};

type Trend = "up" | "down" | "flat";

interface UploadBlock {
  cta_label: string;
  description: string;
  recommended_first_step: boolean;
}

interface ClassificationBlock {
  cta_label: string;
  description: string;
  pending_count: number;
}

interface CategoryRow {
  category_id: string;
  category_name: string;
  emoji: string;
  amount: number;
  amount_label: string;
  share_pct: number;
}

interface ComparisonRow {
  category_id: string;
  category_name: string;
  emoji: string;
  trend: Trend;
  delta_pct: number | null;
}

interface SavingTipRow {
  category_id: string;
  category_name: string;
  potential_saving: number;
  potential_saving_label: string;
  rationale: string;
}

interface DashboardPayload {
  upload?: UploadBlock;
  classification?: ClassificationBlock;
  categories?: CategoryRow[];
  comparison?: ComparisonRow[];
  saving_tips?: SavingTipRow[];
}

const TREND_LABEL: Record<Trend, string> = {
  up: "Subiu",
  down: "Desceu",
  flat: "Estável",
};

const TREND_CLASS: Record<Trend, string> = {
  up: "border-rose-300 bg-rose-100 text-rose-700",
  down: "border-emerald-300 bg-emerald-100 text-emerald-700",
  flat: "border-slate-300 bg-slate-100 text-slate-700",
};

function formatDelta(deltaPct: number | null): string {
  if (deltaPct === null) {
    return "Sem base comparativa";
  }
  return `${Math.abs(deltaPct).toFixed(1)}%`;
}

export function Dashboard() {
  const [activePeriod, setActivePeriod] = useState<string>(PERIOD_API[PERIOD_LABELS[0]]);
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    setErrorMessage(null);
    apiGet(`/api/dashboard?period=${encodeURIComponent(activePeriod)}`)
      .then((payload) => setData(payload as DashboardPayload))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Erro ao carregar dashboard.";
        setErrorMessage(message);
        toast.error(message);
      })
      .finally(() => setIsLoading(false));
  }, [activePeriod, reloadTick]);

  const categories = data?.categories ?? [];
  const comparison = data?.comparison ?? [];
  const savingTips = (data?.saving_tips ?? []).slice(0, 3);
  const isEmpty = useMemo(
    () => !isLoading && categories.length === 0 && comparison.length === 0 && savingTips.length === 0,
    [isLoading, categories.length, comparison.length, savingTips.length],
  );

  const handleClassify = async () => {
    setIsClassifying(true);
    try {
      const result = await apiPost("/api/transactions/classify", {});
      const classified = Number(result?.classified_count ?? 0);
      const skipped = Number(result?.skipped_count ?? 0);
      toast.success(`Classificação concluída. ${classified} classificadas, ${skipped} ignoradas.`);
      setReloadTick((prev) => prev + 1);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Falha ao classificar transações.";
      toast.error(message);
    } finally {
      setIsClassifying(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pb-10 pt-6">
      <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Dashboard v1</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Suba extrato, rode a IA e aja no que mais pesa no período.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 rounded-full border border-border bg-secondary p-1">
          {PERIOD_LABELS.map((period) => {
            const apiValue = PERIOD_API[period];
            return (
              <button
                key={period}
                onClick={() => setActivePeriod(apiValue)}
                className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                  apiValue === activePeriod
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {period}
              </button>
            );
          })}
        </div>
      </header>

      {errorMessage && (
        <Card className="border-rose-300 bg-rose-50 p-4 text-sm text-rose-700">{errorMessage}</Card>
      )}

      <section>
        <Card className="space-y-4 p-6">
          <h2 className="text-lg font-semibold text-foreground">1) Ações rápidas</h2>
          <p className="text-sm text-muted-foreground">
            {data?.upload?.description ?? "Importe um extrato para alimentar o dashboard."}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setIsImportOpen(true)} disabled={isLoading}>
              {data?.upload?.cta_label ?? "Importar extrato PDF"}
            </Button>
            <Button variant="outline" onClick={handleClassify} disabled={isLoading || isClassifying}>
              {isClassifying ? "Classificando..." : data?.classification?.cta_label ?? "Classificar transações com IA"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Pendentes para classificar: {data?.classification?.pending_count ?? 0}
          </p>
        </Card>
      </section>

      <section>
        <Card className="space-y-4 p-6">
          <h2 className="text-lg font-semibold text-foreground">2) Gastos por categoria</h2>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-12 animate-pulse rounded-md bg-secondary" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum gasto categorizado no período.</p>
          ) : (
            <ul className="space-y-2">
              {categories.map((item) => (
                <li
                  key={item.category_id}
                  className="flex flex-col justify-between gap-2 rounded-lg border border-border p-3 md:flex-row md:items-center"
                >
                  <p className="text-sm font-medium text-foreground">
                    {item.emoji} {item.category_name}
                  </p>
                  <div className="text-left md:text-right">
                    <p className="text-sm font-semibold text-foreground">{item.amount_label}</p>
                    <p className="text-xs text-muted-foreground">{item.share_pct.toFixed(1)}% do total</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section>
        <Card className="space-y-4 p-6">
          <h2 className="text-lg font-semibold text-foreground">3) O que subiu ou desceu</h2>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-12 animate-pulse rounded-md bg-secondary" />
              ))}
            </div>
          ) : comparison.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem base comparativa para este período.</p>
          ) : (
            <ul className="space-y-2">
              {comparison.map((item) => (
                <li
                  key={item.category_id}
                  className="flex flex-col justify-between gap-2 rounded-lg border border-border p-3 md:flex-row md:items-center"
                >
                  <p className="text-sm font-medium text-foreground">
                    {item.emoji} {item.category_name}
                  </p>
                  <span
                    className={`inline-flex w-fit items-center rounded-full border px-2 py-1 text-xs font-medium ${TREND_CLASS[item.trend]}`}
                  >
                    {TREND_LABEL[item.trend]} · {formatDelta(item.delta_pct)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section>
        <Card className="space-y-4 p-6">
          <h2 className="text-lg font-semibold text-foreground">4) Dicas objetivas para economizar</h2>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-14 animate-pulse rounded-md bg-secondary" />
              ))}
            </div>
          ) : savingTips.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem recomendações de corte para este período.</p>
          ) : (
            <ul className="space-y-2">
              {savingTips.map((tip, index) => (
                <li key={tip.category_id} className="rounded-lg border border-border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Prioridade {index + 1}</p>
                  <p className="text-sm font-semibold text-foreground">{tip.category_name}</p>
                  <p className="text-sm text-foreground">Potencial de economia: {tip.potential_saving_label}</p>
                  <p className="text-xs text-muted-foreground">{tip.rationale}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {isEmpty && (
        <section>
          <Card className="space-y-2 border-dashed p-6">
            <h2 className="text-lg font-semibold text-foreground">5) Primeiro passo</h2>
            <p className="text-sm text-muted-foreground">
              Seu dashboard ainda está vazio. Comece importando um PDF e depois rode a classificação IA.
            </p>
          </Card>
        </section>
      )}

      <ImportPdfModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSuccess={() => setReloadTick((prev) => prev + 1)}
      />
    </div>
  );
}
