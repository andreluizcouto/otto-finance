import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Tag,
  CreditCard,
  Edit2,
  Sparkles,
  Receipt,
  Split,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Share2,
} from 'lucide-react';
import { apiGet, formatBRL, formatDate } from '@/shared/lib/api';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConfidenceBar({ score }: { score: number | null }) {
  if (score === null) return null;
  const pct    = score > 1 ? Math.round(score) : Math.round(score * 100);
  const label  = pct >= 90 ? 'Alta' : pct >= 70 ? 'Média' : 'Baixa';
  const glow   = pct >= 90
    ? 'bg-white shadow-[0_0_12px_rgba(255,255,255,0.4)]'
    : pct >= 70
    ? 'bg-white/70'
    : 'bg-white/40';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-[10px] text-white/40 uppercase tracking-widest mb-2 font-bold">
        <span>Confiança IA</span>
        <span className="text-white/70 tabular-nums">{pct}% — {label}</span>
      </div>
      <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden border border-white/[0.05]">
        <div className={cn("h-full rounded-full transition-all duration-1000 ease-out", glow)} style={{ width: `${pct}%` }} />   
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tx, setTx] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // The current API might not have a direct GET /transactions/:id
        // So we might need to fetch all and find, or use the endpoint if it exists
        // Looking at reference, it uses apiFetch(`/transactions/${id}`)
        // Let's assume the local API follows the same pattern or fetch all as backup
        const res = await apiGet(`/api/transactions?limit=1000`);
        const found = (res.transactions ?? []).find((t: any) => t.id === id);
        if (!found) throw new Error('Transação não encontrada');
        setTx(found);
      } catch (err: any) {
        console.error('TransactionDetail fetch error:', err);
        setError(err.message ?? 'Erro ao carregar detalhes');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const isIncome = (tx?.amount ?? 0) > 0;

  return (
    <div className="w-full max-w-4xl mx-auto relative z-10 animate-in slide-in-from-bottom-8 duration-700 py-10 px-6">

      <div className="flex items-center justify-between mb-10">
        <button 
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-white/40 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Voltar
        </button>
        
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-white/60 hover:text-white hover:bg-white/[0.08] transition-all">
            <Share2 className="w-3.5 h-3.5" /> Compartilhar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-white/60 hover:text-white hover:bg-white/[0.08] transition-all">
            <Edit2 className="w-3.5 h-3.5" /> Editar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <Loader2 className="w-10 h-10 text-white/10 animate-spin" />
          <p className="text-xs text-white/20 uppercase tracking-[0.2em]">Sincronizando dados...</p>
        </div>
      ) : error || !tx ? (
        <div className="flex flex-col items-center justify-center py-24 gap-6 text-center bg-white/[0.02] border border-white/[0.05] rounded-3xl">
          <AlertCircle className="w-12 h-12 text-white/10" />
          <div>
            <h2 className="text-xl font-light text-white/80 mb-2">Ops, algo deu errado</h2>
            <p className="text-white/40 text-sm max-w-xs">{error ?? 'Não conseguimos localizar esta transação.'}</p>
          </div>
          <Link
            to="/transactions"
            className="text-xs border border-white/10 hover:border-white/30 text-white/60 hover:text-white px-6 py-3 rounded-xl transition-colors bg-white/5 uppercase tracking-widest font-bold"
          >
            Ver todas as movimentações
          </Link>
        </div>
      ) : (
        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/[0.08] rounded-[2.5rem] p-10 relative overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)]">
          {/* Decorative Glow */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/[0.02] blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/4" />

          {/* ── Header ────────────────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-10 mb-12 relative z-10">       
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-4xl shadow-inner group hover:scale-105 transition-transform duration-500">
                {tx.categories?.emoji ?? '💳'}
              </div>
              <div>
                <h1 className="text-3xl font-light tracking-tight text-white mb-2">
                  {tx.merchant_name || tx.description}
                </h1>
                <div className="flex items-center gap-3 text-white/40 text-xs font-medium uppercase tracking-[0.15em]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(tx.date)}</span>
                </div>
              </div>
            </div>
            <div className="text-left md:text-right shrink-0">
              <div className={cn(
                "text-5xl font-light tabular-nums tracking-tighter drop-shadow-2xl",
                isIncome ? 'text-white' : 'text-white/90'
              )}>      
                {isIncome ? '+' : '-'}{formatBRL(Math.abs(tx.amount))}
              </div>
              <div className="flex md:justify-end gap-2 mt-3">
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] px-2.5 py-1 rounded-md border border-white/[0.06] bg-white/[0.02]">
                  {isIncome ? 'Crédito' : 'Débito'}
                </span>
              </div>
            </div>
          </div>

          {/* ── Insight OTTO ──────────────────────────────────────────────── */}
          <div className="bg-gradient-to-br from-white/[0.08] to-transparent border border-white/10 rounded-[2rem] p-8 mb-10 flex flex-col md:flex-row items-start gap-6 relative z-10 overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Sparkles className="h-24 w-24 text-white" />
            </div>
            
            <div className="p-3 bg-white/10 rounded-2xl shrink-0 shadow-xl border border-white/10">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">Insight OTTO</h3>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <p className="text-sm text-white/60 leading-relaxed font-medium">
                {tx.manually_reviewed
                  ? 'Esta transação foi validada manualmente e está integrada ao seu fluxo de caixa consolidado.'
                  : `Classificada de forma autônoma como "${tx.categories?.name ?? 'Outros'}" através de padrões estatísticos.`
                }
                {(tx.confidence_score !== null) &&
                  ` Nível de precisão analítica: ${tx.confidence_score > 1
                    ? Math.round(tx.confidence_score)
                    : Math.round((tx.confidence_score as number) * 100)}%.`
                }
              </p>
              {!tx.manually_reviewed && (
                <div className="flex gap-3 mt-6">
                  <button className="text-[10px] font-bold uppercase tracking-widest bg-white text-black hover:bg-white/90 transition-all px-4 py-2 rounded-xl shadow-lg">
                    Validar
                  </button>
                  <button className="text-[10px] font-bold uppercase tracking-widest bg-transparent border border-white/20 hover:bg-white/5 transition-all px-4 py-2 rounded-xl text-white/60 hover:text-white">
                    Reclassificar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Details Grid ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10 relative z-10 border-t border-white/10 pt-10">

            <div className="space-y-8">
              <h4 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Atributos</h4>
              
              <div className="space-y-6">
                {/* Categoria */}
                <div className="flex items-center justify-between group py-1">
                  <div className="flex items-center gap-3">
                    <Tag className="w-4 h-4 text-white/20" />
                    <span className="text-white/40 text-xs font-medium uppercase tracking-widest">Taxonomia</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white/90">
                      {tx.categories?.emoji} {tx.categories?.name ?? 'Outros'}
                    </span>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-white">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Status de revisão */}
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-white/20" />
                    <span className="text-white/40 text-xs font-medium uppercase tracking-widest">Status</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {tx.manually_reviewed ? (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                        <span className="text-xs font-bold text-white/80 uppercase tracking-widest">Validado</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-white/30" />
                        <span className="text-xs font-bold text-white/50 uppercase tracking-widest italic">Automático</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Barra de confiança */}
                <div className="pt-2">
                  <ConfidenceBar score={tx.confidence_score} />
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h4 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Documentação</h4>
              
              <div className="space-y-6">
                {/* Notas */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.04] transition-colors group">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Anotações Privadas</span>
                    <button className="text-white/20 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-white/40 italic leading-relaxed">Nenhuma nota vinculada a este registro.</p>
                </div>

                {/* Ações rápidas */}
                <div className="grid grid-cols-2 gap-4">
                  <button className="flex flex-col items-center justify-center gap-3 p-5 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/20 transition-all rounded-2xl group text-white/40 hover:text-white shadow-xl">
                    <Receipt className="w-5 h-5 group-hover:scale-110 transition-transform text-white/20 group-hover:text-white" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Ver Recibo</span>
                  </button>
                  <button className="flex flex-col items-center justify-center gap-3 p-5 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/20 transition-all rounded-2xl group text-white/40 hover:text-white shadow-xl">
                    <Split className="w-5 h-5 group-hover:scale-110 transition-transform text-white/20 group-hover:text-white" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Dividir</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
