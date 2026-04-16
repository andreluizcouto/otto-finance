import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Sparkles,
  Plus,
  ArrowRight,
  Flame,
  ShieldCheck,
  X,
  Target,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Minus,
} from 'lucide-react';
import { apiGet, apiPatch, apiPost, formatBRL } from '@/shared/lib/api';
import { cn } from '@/shared/lib/utils';
import { toast } from 'sonner';
import { EmojiPickerGrid } from '@/shared/components/EmojiPickerGrid';

type GoalType = 'savings' | 'spending';
type GoalProgressAction = 'add' | 'remove';

interface Goal {
  id: string;
  type: GoalType;
  name: string;
  emoji: string;
  target: number;
  current: number;
  deadline: string;
  color: string;
  category?: string;
  aiInsight: string;
}

interface ApiGoal {
  id: string;
  type: GoalType;
  name: string;
  emoji: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  color: string;
  category?: string | null;
}

interface ApiCategory {
  id: string;
  name: string;
  emoji: string;
}

function mapGoal(goal: ApiGoal): Goal {
  const isSavings = goal.type === 'savings';
  return {
    id: goal.id,
    type: goal.type,
    name: goal.name,
    emoji: goal.emoji || '🎯',
    target: Number(goal.target_amount ?? 0),
    current: Number(goal.current_amount ?? 0),
    deadline: goal.deadline || '',
    color: goal.color || (isSavings ? '#FFFFFF' : '#A3A3A3'),
    category: goal.category ?? undefined,
    aiInsight: isSavings
      ? 'Acompanhe aportes recorrentes para acelerar a formação do seu objetivo.'
      : 'Revise este limite com frequência para evitar que a categoria consuma caixa demais.',
  };
}

function CircularProgress({ pct, color, size = 120 }: { pct: number; color: string; size?: number }) {
  const stroke = 4;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (circ * Math.min(pct, 100)) / 100;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} className="stroke-white/[0.05] fill-none" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="fill-none transition-all duration-1000 ease-out"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ stroke: color, filter: `drop-shadow(0 0 6px ${color}60)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-light drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{Math.round(pct)}%</span>
        <span className="text-[10px] text-white/40 uppercase tracking-widest">{pct >= 100 ? 'Concluído' : 'Progresso'}</span>
      </div>
    </div>
  );
}

function UpdateProgressModal({
  goal,
  saving,
  onClose,
  onSave,
}: {
  goal: Goal;
  saving: boolean;
  onClose: () => void;
  onSave: (action: GoalProgressAction, amount: number) => Promise<void>;
}) {
  const [action, setAction] = useState<GoalProgressAction>('add');
  const [amount, setAmount] = useState('');

  const handleSubmit = async () => {
    const parsed = Number(amount);
    if (!parsed || parsed <= 0) return;
    await onSave(action, parsed);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl md:rounded-[2.5rem] bg-[#0a0a0a] border border-white/10 p-8 md:p-10 shadow-2xl animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors text-white/20 hover:text-white">
          <X className="w-6 h-6" />
        </button>

        <div className="mb-8 text-center">
          <div className="text-3xl mb-3">{goal.emoji}</div>
          <h2 className="text-2xl font-light text-white mb-2 tracking-tight">Atualizar progresso</h2>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">{goal.name}</p>
        </div>

        <div className="flex gap-3 mb-6">
          {([
            ['add', 'Adicionar', Plus],
            ['remove', 'Retirar', Minus],
          ] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setAction(key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-4 min-h-[48px] rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                action === key ? 'bg-white text-black border-white' : 'border-white/[0.06] text-white/30 hover:text-white/60'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.'))}
          placeholder="Valor (R$)"
          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-5 py-4 min-h-[48px] text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/[0.06] transition-all"
          inputMode="decimal"
        />

        <button
          onClick={handleSubmit}
          disabled={saving || !amount}
          className="w-full mt-8 h-14 min-h-[48px] rounded-2xl bg-white text-black font-bold text-xs uppercase tracking-[0.2em] transition-all hover:bg-white/90 disabled:opacity-30"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Salvar'}
        </button>
      </div>
    </div>
  );
}

function GoalCard({
  goal,
  onUpdateProgress,
}: {
  goal: Goal;
  onUpdateProgress: (goal: Goal) => void;
}) {
  const pct = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
  const remaining = Math.max(goal.target - goal.current, 0);
  const isSavings = goal.type === 'savings';

  return (
    <div className="bg-gradient-to-r from-white/[0.05] to-transparent border border-white/[0.08] hover:border-white/[0.15] transition-all duration-500 rounded-2xl md:rounded-[2rem] p-6 md:p-8 relative overflow-hidden backdrop-blur-xl group">
      <div className="absolute top-1/2 right-10 w-64 h-64 blur-[80px] pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity -translate-y-1/2" style={{ backgroundColor: goal.color }} />

      <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between relative z-10">
        <div className="flex-1 w-full min-w-0">
          <div className="flex items-center gap-4 mb-4 md:mb-2">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center border text-2xl md:text-3xl shrink-0 shadow-inner" style={{ backgroundColor: `${goal.color}15`, borderColor: `${goal.color}30` }}>
              {goal.emoji}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl md:text-2xl font-light text-white/90 truncate">{goal.name}</h2>
                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-2 md:px-2.5 py-1 rounded-lg border shrink-0" style={{ color: goal.color, borderColor: `${goal.color}40`, backgroundColor: `${goal.color}10` }}>
                  {isSavings ? 'Juntar' : 'Limite'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] md:text-xs text-white/40 mt-1 font-medium uppercase tracking-widest">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>{isSavings ? `Prazo: ${goal.deadline}` : `Mês: ${goal.deadline}`}</span>
                {goal.category && <>
                  <span className="text-white/20">·</span>
                  <span className="truncate">{goal.category}</span>
                </>}
              </div>
            </div>
          </div>

          <div className="mt-8 md:mt-10 mb-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 gap-2">
              <div>
                <span className="text-3xl md:text-4xl font-light tabular-nums">{formatBRL(goal.current)}</span>
                <span className="text-white/30 text-[10px] md:text-xs ml-2 uppercase tracking-widest font-bold">{isSavings ? 'guardado' : 'gasto'}</span>
              </div>
              <div className="text-left md:text-right">
                <div className="text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-widest">{isSavings ? 'Meta' : 'Limite'}: {formatBRL(goal.target)}</div>
                <div className="text-[9px] md:text-[10px] text-white/25 mt-1 uppercase tracking-widest">{isSavings ? `Faltam ${formatBRL(remaining)}` : `Resta ${formatBRL(remaining)}`}</div>
              </div>
            </div>
            <div className="h-2 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/[0.05]">
              <div className="h-full rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: !isSavings && pct > 85 ? '#ef4444' : goal.color, boxShadow: `0 0 15px ${goal.color}80, 0 0 5px ${goal.color}` }}>
                <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-r from-transparent to-white/50 blur-[2px]" />
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex items-start gap-4 p-4 md:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors group/insight">
              <div className="p-2 md:p-2.5 rounded-xl bg-white/5 shrink-0 shadow-lg border border-white/5">
                <Sparkles className="w-4 h-4 text-white/80" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Dica da IA</h4>
                <p className="text-xs md:text-sm text-white/70 leading-relaxed font-medium">{goal.aiInsight}</p>
              </div>
              <button className="ml-auto flex items-center justify-center p-2 rounded-xl hover:bg-white/10 transition-colors text-white/20 hover:text-white shrink-0 min-h-[44px]">
                <ArrowRight className="w-5 h-5 group-hover/insight:translate-x-1 transition-transform" />
              </button>
            </div>
            <button
              onClick={() => onUpdateProgress(goal)}
              className="w-full md:w-auto px-5 py-4 min-h-[48px] rounded-2xl bg-white/[0.05] border border-white/[0.08] text-white/80 hover:bg-white/[0.1] hover:text-white transition-all text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Atualizar progresso
            </button>
          </div>
        </div>

        <div className="hidden lg:flex shrink-0 items-center justify-center">
          <CircularProgress pct={pct} color={!isSavings && pct > 85 ? '#ef4444' : goal.color} />
        </div>
      </div>
    </div>
  );
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function MonthYearPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => {
    if (value) {
      const [monthLabel, yearLabel] = value.split(' ');
      const monthIndex = MONTHS.findIndex((m) => m === monthLabel);
      if (monthIndex >= 0 && yearLabel) {
        setMonth(monthIndex);
        setYear(Number(yearLabel));
      }
      return;
    }
    onChange(`${MONTHS[month]} ${year}`);
  }, []);

  useEffect(() => {
    onChange(`${MONTHS[month]} ${year}`);
  }, [month, year, onChange]);

  const prev = () => {
    if (month === 0) {
      setMonth(11);
      setYear((current) => current - 1);
    } else {
      setMonth((current) => current - 1);
    }
  };

  const next = () => {
    if (month === 11) {
      setMonth(0);
      setYear((current) => current + 1);
    } else {
      setMonth((current) => current + 1);
    }
  };

  return (
    <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-2 py-2 min-w-[9.5rem] min-h-[48px]">
      <button type="button" onClick={prev} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white min-h-[40px] flex items-center justify-center">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="flex-1 text-center text-xs font-bold text-white uppercase tracking-widest tabular-nums">{`${MONTHS[month]} ${year}`}</span>
      <button type="button" onClick={next} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white min-h-[40px] flex items-center justify-center">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function NewGoalModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (goal: {
    name: string;
    emoji: string;
    type: GoalType;
    target_amount: number;
    current_amount: number;
    deadline: string;
    color: string;
    category?: string;
  }) => Promise<void>;
}) {
  const [type, setType] = useState<GoalType>('savings');
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('');
  const [apiCategories, setApiCategories] = useState<ApiCategory[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    apiGet('/api/categories').then((res) => setApiCategories(res?.categories ?? [])).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    const parsedTarget = Number(target);
    if (!name || !parsedTarget || (type === 'spending' && !category)) return;
    setIsSaving(true);
    try {
      await onSave({
        name,
        emoji,
        type,
        target_amount: parsedTarget,
        current_amount: 0,
        deadline,
        color: type === 'savings' ? '#FFFFFF' : '#A3A3A3',
        category: type === 'spending' ? category : undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl md:rounded-[2.5rem] bg-[#0a0a0a] border border-white/10 p-8 md:p-10 shadow-2xl animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors text-white/20 hover:text-white">
          <X className="w-6 h-6" />
        </button>

        <div className="mb-8 md:mb-10 text-center">
          <h2 className="text-2xl font-light text-white mb-2 tracking-tight">Definir Meta</h2>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Gestão de Ativos</p>
        </div>

        <div className="flex gap-3 mb-8">
          <button onClick={() => setType('savings')} className={cn("flex-1 flex items-center justify-center gap-2 py-4 min-h-[48px] rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all", type === 'savings' ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'border-white/[0.06] text-white/30 hover:text-white/60')}>
            <ShieldCheck className="w-4 h-4" />
            Juntar Ativos
          </button>
          <button onClick={() => setType('spending')} className={cn("flex-1 flex items-center justify-center gap-2 py-4 min-h-[48px] rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all", type === 'spending' ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'border-white/[0.06] text-white/30 hover:text-white/60')}>
            <Flame className="w-4 h-4" />
            Limitar Fluxos
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="relative">
              <button type="button" onClick={() => setShowEmojiPicker((value) => !value)} className="w-16 md:w-20 h-full min-h-[48px] text-2xl md:text-3xl bg-white/[0.03] border border-white/[0.08] rounded-2xl hover:border-white/30 hover:bg-white/[0.06] transition-all flex items-center justify-center">
                {emoji}
              </button>
              {showEmojiPicker && (
                <div className="absolute left-0 top-full mt-2 z-50 bg-[#111] border border-white/10 rounded-2xl p-4 shadow-2xl w-[280px] md:w-[336px]">
                  <EmojiPickerGrid selected={emoji} onSelect={(selectedEmoji) => { setEmoji(selectedEmoji); setShowEmojiPicker(false); }} />
                </div>
              )}
            </div>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'savings' ? 'Ex: Reserva de Liquidez' : 'Ex: Lifestyle / Delivery'}
              className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-2xl px-5 py-4 min-h-[48px] text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/[0.06] transition-all"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder={type === 'savings' ? 'Montante Alvo (R$)' : 'Teto Mensal (R$)'}
              className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-2xl px-5 py-4 min-h-[48px] text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/[0.06] transition-all"
              inputMode="decimal"
            />
            <MonthYearPicker value={deadline} onChange={setDeadline} />
          </div>

          {type === 'spending' && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">Vincular Taxonomia</p>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto no-scrollbar">
                {apiCategories.map((cat) => (
                  <button key={cat.id} type="button" onClick={() => setCategory(cat.name)} className={cn("flex items-center gap-2 px-3 py-2 min-h-[36px] rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all", category === cat.name ? 'bg-white/10 border-white/30 text-white' : 'border-white/[0.06] text-white/30 hover:text-white/60 hover:border-white/10')}>
                    <span>{cat.emoji}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button onClick={handleSubmit} disabled={isSaving || !name || !target || (type === 'spending' && !category)} className="w-full mt-8 md:mt-10 h-16 min-h-[56px] bg-white text-black rounded-2xl font-bold text-xs uppercase tracking-[0.2em] transition-all hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed">
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Estabelecer Meta'}
        </button>
      </div>
    </div>
  );
}

function SummaryBar({ goals }: { goals: Goal[] }) {
  const savingsGoals = goals.filter((goal) => goal.type === 'savings');
  const spendingGoals = goals.filter((goal) => goal.type === 'spending');
  const totalSaved = savingsGoals.reduce((sum, goal) => sum + goal.current, 0);
  const totalTarget = savingsGoals.reduce((sum, goal) => sum + goal.target, 0);
  const overBudget = spendingGoals.filter((goal) => goal.target > 0 && goal.current > goal.target * 0.85).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5 mb-8 md:mb-12">
      <div className="p-5 md:p-6 rounded-[1.5rem] bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08] backdrop-blur-xl">
        <div className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Metas Ativas</div>
        <div className="text-2xl md:text-3xl font-light">{goals.length}</div>
      </div>
      <div className="p-5 md:p-6 rounded-[1.5rem] bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08] backdrop-blur-xl">
        <div className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Ativos Consolidados</div>
        <div className="text-2xl md:text-3xl font-light">
          {formatBRL(totalSaved)}
          <div className="text-[10px] md:text-xs text-white/20 mt-1 uppercase tracking-widest">de {formatBRL(totalTarget)}</div>
        </div>
      </div>
      <div className="p-5 md:p-6 rounded-[1.5rem] bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08] backdrop-blur-xl">
        <div className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Alertas de Fluxo</div>
        <div className="text-2xl md:text-3xl font-light">
          {overBudget > 0 ? <span className="text-red-400/80">{overBudget}</span> : <span className="text-white/40 italic text-lg md:text-xl">Nenhum alerta</span>}
        </div>
      </div>
    </div>
  );
}

function EmptyGoalsState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="space-y-8 md:space-y-10 py-6 md:py-10">
      <div className="bg-gradient-to-r from-white/[0.02] to-transparent border border-dashed border-white/10 rounded-2xl md:rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden opacity-30 select-none">
        <div className="flex flex-col lg:flex-row gap-10 items-center justify-between">
          <div className="flex-1 w-full">
            <div className="flex items-center gap-6 mb-4">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center border text-2xl md:text-3xl bg-white/[0.02] border-white/10">🎯</div>
              <div>
                <div className="h-6 md:h-8 w-48 md:w-64 bg-white/10 rounded-lg mb-3" />
                <div className="h-3 md:h-4 w-32 md:w-40 bg-white/5 rounded-md" />
              </div>
            </div>
            <div className="h-2 w-full bg-white/[0.03] rounded-full mt-10" />
          </div>
          <div className="hidden lg:block w-32 h-32 rounded-full border-4 border-white/[0.02]" />
        </div>
      </div>

      <div className="text-center">
        <Target className="w-10 h-10 md:w-12 md:h-12 text-white/5 mx-auto mb-6" />
        <p className="text-white/30 text-xs md:text-sm mb-8 tracking-wide uppercase font-medium">Nenhum objetivo estabelecido no sistema.</p>
        <button onClick={onCreateClick} className="inline-flex items-center gap-3 px-6 md:px-8 py-3 md:py-4 bg-white/[0.04] border border-white/10 text-white hover:bg-white/[0.08] transition-all rounded-2xl text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] min-h-[48px]">
          <Plus className="w-4 h-4" />
          Estabelecer Primeiro Objetivo
        </button>
      </div>
    </div>
  );
}

export function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [savingProgress, setSavingProgress] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'savings' | 'spending'>('all');

  const loadGoals = async () => {
    setLoading(true);
    try {
      const response = await apiGet('/api/goals');
      setGoals((response?.goals ?? []).map(mapGoal));
    } catch (error: any) {
      toast.error(error?.message ?? 'Erro ao carregar metas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const filtered = useMemo(() => filter === 'all' ? goals : goals.filter((goal) => goal.type === filter), [filter, goals]);
  const hasGoals = goals.length > 0;

  const handleCreateGoal = async (payload: {
    name: string;
    emoji: string;
    type: GoalType;
    target_amount: number;
    current_amount: number;
    deadline: string;
    color: string;
    category?: string;
  }) => {
    await apiPost('/api/goals', payload);
    toast.success('Meta estabelecida com sucesso.');
    setShowModal(false);
    await loadGoals();
  };

  const handleUpdateProgress = async (action: GoalProgressAction, amount: number) => {
    if (!selectedGoal) return;
    setSavingProgress(true);
    try {
      await apiPatch(`/api/goals/${selectedGoal.id}`, { action, amount });
      toast.success('Progresso atualizado.');
      setSelectedGoal(null);
      await loadGoals();
    } catch (error: any) {
      toast.error(error?.message ?? 'Erro ao atualizar progresso.');
    } finally {
      setSavingProgress(false);
    }
  };

  return (
    <div className="w-full relative z-10 animate-in fade-in duration-500 max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-8 md:mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl md:text-2xl tracking-[0.2em] font-medium">OTTO</span>
            <div className="h-4 w-px bg-white/20" />
            <h1 className="text-xs font-medium tracking-widest text-white/40 uppercase">Metas</h1>
          </div>
          <p className="text-white/40 text-sm italic">Otimização de ativos e controle de fluxos através de IA.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-6 py-3 min-h-[48px] bg-white text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.4)]">
          <Plus className="w-4 h-4" />
          <span>Nova Meta</span>
        </button>
      </div>

      <div className="flex gap-3 mb-8 md:mb-10 overflow-x-auto no-scrollbar pb-2">
        {([
          ['all', 'Todas'],
          ['savings', 'Juntar Ativos'],
          ['spending', 'Limites de Fluxo'],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} className={cn("whitespace-nowrap px-5 py-2.5 min-h-[40px] rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all", filter === key ? 'bg-white/10 border-white/30 text-white' : 'border-white/[0.06] text-white/30 hover:text-white/60 hover:border-white/10')}>
            {label}
          </button>
        ))}
      </div>

      {hasGoals && <SummaryBar goals={goals} />}

      <div className="grid grid-cols-1 gap-5 md:gap-8">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-72 rounded-[2rem] border border-white/[0.06] bg-white/[0.03] animate-pulse" />
          ))
        ) : filtered.length > 0 ? (
          filtered.map((goal) => <GoalCard key={goal.id} goal={goal} onUpdateProgress={setSelectedGoal} />)
        ) : hasGoals ? (
          <div className="py-24 md:py-32 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-2xl md:rounded-[2.5rem]">
            <p className="text-white/20 text-xs font-bold uppercase tracking-[0.2em] px-4">Nenhuma meta identificada nesta categoria.</p>
          </div>
        ) : (
          <EmptyGoalsState onCreateClick={() => setShowModal(true)} />
        )}
      </div>

      {showModal && <NewGoalModal onClose={() => setShowModal(false)} onSave={handleCreateGoal} />}
      {selectedGoal && <UpdateProgressModal goal={selectedGoal} saving={savingProgress} onClose={() => setSelectedGoal(null)} onSave={handleUpdateProgress} />}
    </div>
  );
}
