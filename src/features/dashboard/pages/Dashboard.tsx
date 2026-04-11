import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button, Card } from "@/shared/components/ui";
import { apiGet } from "@/shared/lib/api";
import { toast } from "sonner";

const PERIOD_LABELS = ["Este Mês", "Esta Semana", "Últimos 3 Meses"];
const PERIOD_API: Record<string, string> = {
  "Este Mês": "Este mes",
  "Esta Semana": "Esta semana",
  "Últimos 3 Meses": "Ultimos 3 meses",
};

type FlowStatus = "positive" | "negative" | "neutral";
type CategoryTrend = "up" | "down" | "flat";
type BudgetStatus = "on_track" | "warning" | "exceeded" | "no_limit";
type AlertSeverity = "high" | "medium" | "low";

interface DashboardFlow {
  inflow_total_label: string;
  outflow_total_label: string;
  net_flow_label: string;
  net_flow_status: FlowStatus;
}

interface CategoryInsight {
  category_id: string;
  category_name: string;
  emoji: string;
  current_amount_label: string;
  share_pct: number;
  delta_pct: number | null;
  trend: CategoryTrend;
}

interface CutRecommendation {
  category_id: string;
  category_name: string;
  suggested_cut_amount_label: string;
  rationale: string;
}

interface BudgetProgressItem {
  category_id: string;
  category_name: string;
  monthly_limit_label: string;
  spent_amount_label: string;
  progress_pct: number;
  status: BudgetStatus;
}

interface DashboardAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
}

interface DashboardPayload {
  flow?: DashboardFlow;
  category_insights?: CategoryInsight[];
  budget_progress?: BudgetProgressItem[];
  alerts?: DashboardAlert[];
  cuts?: CutRecommendation[];
  narrative_summary?: string;
  disclaimer?: string;
}

const FLOW_STATUS_LABEL: Record<FlowStatus, string> = {
  positive: "Positivo",
  negative: "Negativo",
  neutral: "Neutro",
};

const FLOW_STATUS_CLASSES: Record<FlowStatus, string> = {
  positive: "border-emerald-300 bg-emerald-100 text-emerald-800",
  negative: "border-rose-300 bg-rose-100 text-rose-800",
  neutral: "border-slate-300 bg-slate-100 text-slate-700",
};

const TREND_ARROW: Record<CategoryTrend, string> = {
  up: "↑",
  down: "↓",
  flat: "→",
};

const BUDGET_STATUS_LABEL: Record<BudgetStatus, string> = {
  on_track: "No limite",
  warning: "Atenção",
  exceeded: "Estourado",
  no_limit: "Sem limite",
};

const BUDGET_STATUS_BADGE: Record<BudgetStatus, string> = {
  on_track: "border-emerald-300 bg-emerald-100 text-emerald-800",
  warning: "border-amber-300 bg-amber-100 text-amber-800",
  exceeded: "border-rose-300 bg-rose-100 text-rose-800",
  no_limit: "border-slate-300 bg-slate-100 text-slate-700",
};

const BUDGET_BAR_FILL: Record<BudgetStatus, string> = {
  on_track: "bg-emerald-400",
  warning: "bg-amber-400",
  exceeded: "bg-rose-400",
  no_limit: "bg-slate-400",
};

const ALERT_SEVERITY_META: Record<AlertSeverity, { label: string; colorVar: string }> = {
  high: { label: "Alta", colorVar: "--color-risk-high" },
  medium: { label: "Média", colorVar: "--color-risk-medium" },
  low: { label: "Baixa", colorVar: "--color-risk-low" },
};

function formatShare(sharePct: number): string {
  if (!Number.isFinite(sharePct)) {
    return "—";
  }
  return `${sharePct.toFixed(1)}% do total`;
}

function formatDeltaLabel(item: CategoryInsight): string {
  const arrow = TREND_ARROW[item.trend];
  if (item.delta_pct === null) {
    return `${arrow} sem base comparativa`;
  }
  return `${arrow} ${Math.abs(item.delta_pct).toFixed(1)}%`;
}

function clampProgress(progressPct: number): number {
  if (!Number.isFinite(progressPct)) {
    return 0;
  }
  return Math.max(0, Math.min(progressPct, 100));
}

export function Dashboard() {
  const navigate = useNavigate();
  const [activePeriod, setActivePeriod] = useState<string>(PERIOD_API[PERIOD_LABELS[0]]);
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    apiGet(`/api/dashboard?period=${encodeURIComponent(activePeriod)}`)
      .then((payload) => setData(payload as DashboardPayload))
      .catch(() => toast.error("Erro ao carregar dashboard"))
      .finally(() => setIsLoading(false));
  }, [activePeriod]);

  const flowStatus: FlowStatus = data?.flow?.net_flow_status ?? "neutral";
  const categoryInsights = data?.category_insights ?? [];
  const budgetProgress = data?.budget_progress ?? [];
  const actionableAlerts = data?.alerts ?? [];
  const topCuts = (data?.cuts ?? []).slice(0, 3);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pb-10 pt-6">
      <header className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Dashboard de decisão</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Foque no fluxo do período para decidir onde manter ou cortar gastos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 rounded-full border border-border bg-secondary p-1">
          {PERIOD_LABELS.map((period) => {
            const mappedPeriod = PERIOD_API[period];
            return (
              <button
                key={period}
                onClick={() => setActivePeriod(mappedPeriod)}
                className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                  mappedPeriod === activePeriod
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

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Estou melhorando ou piorando?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Leia primeiro o fluxo do período. Isso mostra se o mês está fechando no azul ou no vermelho.
          </p>
        </div>

        <Card className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-foreground">Fluxo líquido no período</h3>
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${FLOW_STATUS_CLASSES[flowStatus]}`}
            >
              {FLOW_STATUS_LABEL[flowStatus]}
            </span>
          </div>
          {isLoading ? (
            <div className="h-10 animate-pulse rounded-md bg-secondary" />
          ) : (
            <p className="text-4xl font-semibold tracking-tight text-foreground">{data?.flow?.net_flow_label ?? "—"}</p>
          )}
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="space-y-2 p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Entradas no período</h3>
            {isLoading ? (
              <div className="h-8 animate-pulse rounded-md bg-secondary" />
            ) : (
              <p className="text-2xl font-semibold tracking-tight text-foreground">{data?.flow?.inflow_total_label ?? "—"}</p>
            )}
          </Card>
          <Card className="space-y-2 p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Saídas no período</h3>
            {isLoading ? (
              <div className="h-8 animate-pulse rounded-md bg-secondary" />
            ) : (
              <p className="text-2xl font-semibold tracking-tight text-foreground">{data?.flow?.outflow_total_label ?? "—"}</p>
            )}
          </Card>
        </div>

        <p className="text-xs text-muted-foreground">
          {data?.disclaimer ?? "Nao inclui saldo anterior da conta."}
        </p>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Onde estou exagerando?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            As categorias abaixo mostram impacto no total e direção de variação versus o período anterior.
          </p>
        </div>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground">Top categorias de gasto</h3>
          {isLoading ? (
            <div className="mt-4 space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-14 animate-pulse rounded-md bg-secondary" />
              ))}
            </div>
          ) : categoryInsights.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Ainda não há categorias suficientes para comparar exageros no período selecionado.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {categoryInsights.map((item) => (
                <li
                  key={item.category_id}
                  className="flex flex-col gap-2 rounded-lg border border-border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      {item.emoji} {item.category_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{formatShare(item.share_pct)}</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-base font-semibold text-foreground">{item.current_amount_label}</p>
                    <p className="text-sm text-muted-foreground">{formatDeltaLabel(item)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="space-y-4 p-6">
          <h3 className="text-lg font-semibold text-foreground">Orçamento por categoria</h3>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-16 animate-pulse rounded-md bg-secondary" />
              ))}
            </div>
          ) : budgetProgress.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sem orçamento configurado neste período. Defina limites para acompanhar excessos.
            </p>
          ) : (
            <ul className="space-y-3">
              {budgetProgress.map((item) => {
                const visualProgress = clampProgress(item.progress_pct);
                const limitLabel = item.status === "no_limit" ? "Sem limite" : item.monthly_limit_label;
                return (
                  <li key={item.category_id} className="rounded-lg border border-border p-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{item.category_name}</p>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${BUDGET_STATUS_BADGE[item.status]}`}
                      >
                        {BUDGET_STATUS_LABEL[item.status]}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.spent_amount_label} / {limitLabel}
                    </p>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className={`h-full rounded-full ${BUDGET_BAR_FILL[item.status]}`}
                        style={{ width: `${visualProgress}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{item.progress_pct.toFixed(0)}% do orçamento usado</p>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="space-y-4 p-6">
          <h3 className="text-lg font-semibold text-foreground">Alertas acionáveis</h3>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-20 animate-pulse rounded-md bg-secondary" />
              ))}
            </div>
          ) : actionableAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sem alertas críticos neste período. Continue monitorando para manter o ritmo.
            </p>
          ) : (
            <ul className="space-y-3">
              {actionableAlerts.map((alert) => {
                const severity = ALERT_SEVERITY_META[alert.severity];
                return (
                  <li key={alert.id} className="rounded-lg border border-border p-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="break-words text-sm font-semibold text-foreground">{alert.title}</p>
                      <span
                        className="inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium"
                        style={{
                          color: `var(${severity.colorVar})`,
                          borderColor: `var(${severity.colorVar})`,
                        }}
                      >
                        {severity.label}
                      </span>
                    </div>
                    <p className="break-words text-sm text-muted-foreground">{alert.message}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">O que cortar primeiro?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Comece pelas 3 ações com maior potencial de economia para ajudar a fechar no azul.
          </p>
        </div>
        <Card className="space-y-3 p-6">
          <h3 className="text-lg font-semibold text-foreground">Cortes recomendados (Top 3)</h3>
          {isLoading ? (
            <>
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-16 animate-pulse rounded-md bg-secondary" />
              ))}
            </>
          ) : topCuts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Não há cortes recomendados para este período com os dados disponíveis.
            </p>
          ) : (
            topCuts.map((cut, index) => (
              <article key={cut.category_id} className="rounded-lg border border-border p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Prioridade {index + 1}</p>
                <p className="mt-1 text-base font-semibold text-foreground">{cut.category_name}</p>
                <p className="text-sm font-medium text-foreground">Economia sugerida: {cut.suggested_cut_amount_label}</p>
                <p className="mt-1 break-words text-sm text-muted-foreground">{cut.rationale}</p>
              </article>
            ))
          )}
          <div className="pt-2">
            <Button onClick={() => navigate("/transactions")}>Ver transações para agir agora</Button>
          </div>
        </Card>
      </section>

      <section>
        <Card className="space-y-3 p-6">
          <h3 className="text-lg font-semibold text-foreground">Resumo do período</h3>
          {isLoading ? (
            <div className="h-20 animate-pulse rounded-md bg-secondary" />
          ) : (
            <p className="break-words text-sm leading-relaxed text-muted-foreground">
              {data?.narrative_summary ?? "Sem resumo narrativo disponível para o período selecionado."}
            </p>
          )}
        </Card>
      </section>
    </div>
  );
}
