import { useEffect, useState } from 'react';
import {
  Calendar,
  Sparkles,
  Plus,
  ArrowRight,
  Flame,
  ShieldCheck,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatBRL, apiGet } from '@/shared/lib/api';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ApiCategory {
  id: string;
  name: string;
  emoji: string;
  color_hex: string | null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type GoalType = 'savings' | 'spending';

interface Goal {
  id: string;
  type: GoalType;
  name: string;
  emoji: string;
  target: number;
  current: number;
  deadline: string;
  color: string;
  /** Categoria vinculada (para metas de gasto) */
  category?: string;
  aiInsight: string;
}

// ─── Dados iniciais ───────────────────────────────────────────────────────────

const INITIAL_GOALS: Goal[] = [];

// ─── Circular Progress ────────────────────────────────────────────────────────

function CircularProgress({ pct, color, size = 120 }: { pct: number; color: string; size?: number }) {
  const stroke = 4;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (circ * Math.min(pct, 100)) / 100;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          className="stroke-white/[0.05] fill-none"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          className="fill-none transition-all duration-1000 ease-out"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            stroke: color,
            filter: `drop-shadow(0 0 6px ${color}60)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-light drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
          {Math.round(pct)}%
        </span>
        <span className="text-[10px] text-white/40 uppercase tracking-widest">
          {pct >= 100 ? 'Concluído' : 'Progresso'}
        </span>
      </div>
    </div>
  );
}

// ─── Goal Card ────────────────────────────────────────────────────────────────

function GoalCard({ goal }: { goal: Goal }) {
  const pct = (goal.current / goal.target) * 100;
  const remaining = Math.max(goal.target - goal.current, 0);
  const isSavings = goal.type === 'savings';

  return (
    <div className="bg-gradient-to-r from-white/[0.05] to-transparent border border-white/[0.08] hover:border-white/[0.15] transition-all duration-500 rounded-3xl p-8 relative overflow-hidden backdrop-blur-xl group">
      {/* Ambient glow */}
      <div
        className="absolute top-1/2 right-10 w-64 h-64 blur-[80px] pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity -translate-y-1/2"
        style={{ backgroundColor: goal.color }}
      />

      <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between relative z-10">
        {/* Left content */}
        <div className="flex-1 w-full min-w-0">
          {/* Header */}
          <div className="flex items-center gap-4 mb-2">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center border text-2xl shrink-0"
              style={{ backgroundColor: `${goal.color}15`, borderColor: `${goal.color}30` }}
            >
              {goal.emoji}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-light text-white/90 truncate">{goal.name}</h2>
                <span
                  className="text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full border shrink-0"
                  style={{
                    color: goal.color,
                    borderColor: `${goal.color}40`,
                    backgroundColor: `${goal.color}10`,
                  }}
                >
                  {isSavings ? 'Juntar' : 'Limite'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/40 mt-1">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>{isSavings ? `Prazo: ${goal.deadline}` : `Mês: ${goal.deadline}`}</span>
                {goal.category && (
                  <>
                    <span className="text-white/20">·</span>
                    <span>{goal.category}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Progress bar + amounts */}
          <div className="mt-8 mb-4">
            <div className="flex items-end justify-between mb-3">
              <div>
                <span className="text-3xl font-light">{formatBRL(goal.current)}</span>
                <span className="text-white/30 text-sm ml-1">
                  {isSavings ? 'guardado' : 'gasto'}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm text-white/40">
                  {isSavings ? 'Meta' : 'Limite'}: {formatBRL(goal.target)}
                </div>
                <div className="text-xs text-white/25 mt-0.5">
                  {isSavings
                    ? `Faltam ${formatBRL(remaining)}`
                    : `Resta ${formatBRL(remaining)}`}
                </div>
              </div>
            </div>
            <div className="h-2 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/[0.05]">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out relative"
                style={{
                  width: `${Math.min(pct, 100)}%`,
                  backgroundColor: !isSavings && pct > 85 ? '#ef4444' : goal.color,
                  boxShadow: `0 0 15px ${goal.color}80, 0 0 5px ${goal.color}`,
                }}
              >
                <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-r from-transparent to-white/50 blur-[2px]" />
              </div>
            </div>
          </div>

          {/* AI Insight */}
          <div className="mt-6 flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <div className="p-2 rounded-full bg-white/5 shrink-0">
              <Sparkles className="w-4 h-4 text-white/60" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-medium uppercase tracking-widest text-white/40 mb-1">
                Dica da IA
              </h4>
              <p className="text-sm text-white/80 leading-relaxed">{goal.aiInsight}</p>
            </div>
            <button className="ml-auto flex items-center justify-center p-2 rounded-full hover:bg-white/10 transition-colors text-white/40 hover:text-white shrink-0">
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Circular indicator */}
        <div className="hidden lg:flex shrink-0 items-center justify-center">
          <CircularProgress pct={pct} color={!isSavings && pct > 85 ? '#ef4444' : goal.color} />
        </div>
      </div>
    </div>
  );
}

// ─── Month/Year Picker ────────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function MonthYearPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => {
    onChange(`${MONTHS[month]} ${year}`);
  }, [month, year]);

  const prev = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };

  const next = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  return (
    <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-2 py-2.5 min-w-[9rem]">
      <button
        type="button"
        onClick={prev}
        className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>
      <span className="flex-1 text-center text-sm text-white tabular-nums">{value}</span>
      <button
        type="button"
        onClick={next}
        className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── New Goal Modal ───────────────────────────────────────────────────────────

function NewGoalModal({ onClose, onSave }: { onClose: () => void; onSave: (g: Goal) => void }) {
  const [type, setType] = useState<GoalType>('savings');
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState(() => {
    const now = new Date();
    return `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  });
  const [category, setCategory] = useState('');
  const [apiCategories, setApiCategories] = useState<ApiCategory[]>([]);

  useEffect(() => {
    apiGet('/api/categories')
      .then((res) => setApiCategories(res?.categories ?? []))
      .catch(() => {});
  }, []);

  const handleSubmit = () => {
    if (!name || !target) return;
    const goal: Goal = {
      id: Date.now().toString(),
      type,
      name,
      emoji,
      target: parseFloat(target),
      current: 0,
      deadline,
      color: type === 'savings' ? '#38bdf8' : '#fb923c',
      category: type === 'spending' ? category : undefined,
      aiInsight: 'Acabei de criar essa meta. Vou analisar seus gastos e dar uma dica em breve!',
    };
    onSave(goal);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0a0a0a] border border-white/[0.1] p-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors text-white/40 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-light mb-8">Nova Meta</h2>

        {/* Type toggle */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setType('savings')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
              type === 'savings'
                ? 'bg-white/10 border-white/20 text-white'
                : 'border-white/[0.06] text-white/40 hover:text-white/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Juntar grana
          </button>
          <button
            onClick={() => setType('spending')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
              type === 'spending'
                ? 'bg-white/10 border-white/20 text-white'
                : 'border-white/[0.06] text-white/40 hover:text-white/60'
            }`}
          >
            <Flame className="w-4 h-4" />
            Controlar gasto
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-5">
          {/* Nome + emoji */}
          <div className="flex gap-3">
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className="w-16 text-center text-2xl bg-white/[0.03] border border-white/[0.08] rounded-xl py-3 focus:outline-none focus:border-white/20 transition-colors"
              maxLength={2}
            />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'savings' ? 'Ex: Viagem pra praia' : 'Ex: Limite delivery'}
              className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>

          {/* Valor + prazo */}
          <div className="flex gap-3 items-center">
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder={type === 'savings' ? 'Valor da meta (R$)' : 'Limite mensal (R$)'}
              className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/20 transition-colors"
              inputMode="decimal"
            />
            <MonthYearPicker value={deadline} onChange={setDeadline} />
          </div>

          {/* Categoria — só para spending */}
          {type === 'spending' && (
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest mb-3">Categoria</p>
              {apiCategories.length === 0 ? (
                <p className="text-xs text-white/30">Carregando categorias...</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {apiCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.name)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm transition-all ${
                        category === cat.name
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'border-white/[0.06] text-white/40 hover:text-white/70 hover:border-white/10'
                      }`}
                    >
                      <span>{cat.emoji}</span>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!name || !target || (type === 'spending' && !category)}
          className="w-full mt-8 py-3.5 bg-white text-black rounded-xl font-medium hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed"
        >
          Criar Meta
        </button>
      </div>
    </div>
  );
}

// ─── Summary Stats ────────────────────────────────────────────────────────────

function SummaryBar({ goals }: { goals: Goal[] }) {
  const savingsGoals = goals.filter((g) => g.type === 'savings');
  const spendingGoals = goals.filter((g) => g.type === 'spending');
  const totalSaved = savingsGoals.reduce((s, g) => s + g.current, 0);
  const totalTarget = savingsGoals.reduce((s, g) => s + g.target, 0);
  const overBudget = spendingGoals.filter((g) => g.current > g.target * 0.85).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
      <div className="p-5 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08]">
        <div className="text-white/40 text-xs uppercase tracking-widest mb-2">Metas ativas</div>
        <div className="text-2xl font-light">{goals.length}</div>
      </div>
      <div className="p-5 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08]">
        <div className="text-white/40 text-xs uppercase tracking-widest mb-2">Total guardado</div>
        <div className="text-2xl font-light">
          {formatBRL(totalSaved)}{' '}
          <span className="text-sm text-white/30">de {formatBRL(totalTarget)}</span>
        </div>
      </div>
      <div className="p-5 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08]">
        <div className="text-white/40 text-xs uppercase tracking-widest mb-2">Limites apertados</div>
        <div className="text-2xl font-light">
          {overBudget > 0 ? (
            <span className="text-red-400">{overBudget} {overBudget === 1 ? 'meta' : 'metas'}</span>
          ) : (
            <span className="text-white/60">Tudo ok</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function Goals() {
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'savings' | 'spending'>('all');

  const filtered =
    filter === 'all' ? goals : goals.filter((g) => g.type === filter);

  return (
    <div className="w-full max-w-6xl mx-auto px-6 pb-10 pt-6 relative z-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-light tracking-tight mb-2">Metas Financeiras</h1>
          <p className="text-white/40 text-sm">
            Organize seus objetivos e deixa a IA te ajudar a chegar lá.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-black rounded-xl font-medium hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.4)]"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Meta</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-8">
        {([
          ['all', 'Todas'],
          ['savings', 'Juntar grana'],
          ['spending', 'Limites'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              filter === key
                ? 'bg-white/10 border-white/20 text-white'
                : 'border-white/[0.06] text-white/40 hover:text-white/60 hover:border-white/10'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Summary */}
      <SummaryBar goals={goals} />

      {/* Goal cards */}
      <div className="grid grid-cols-1 gap-8">
        {filtered.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}

        {filtered.length === 0 && (
          <div className="py-20 text-center text-white/30 text-sm">
            {goals.length === 0
              ? 'Nenhuma meta criada ainda. Que tal começar com uma viagem ou uma reserva de emergência?'
              : 'Nenhuma meta nessa categoria.'}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <NewGoalModal
          onClose={() => setShowModal(false)}
          onSave={(g) => {
            setGoals((prev) => [...prev, g]);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
