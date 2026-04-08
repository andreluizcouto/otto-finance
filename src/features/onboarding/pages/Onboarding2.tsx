import { useNavigate } from "react-router";
import { Button, Card, Badge } from "@/shared/components/ui";
import { ArrowLeft, ShieldCheck, Building2, LineChart, FileText, Plus } from "lucide-react";
import { toast } from "sonner";

export function Onboarding2() {
  const navigate = useNavigate();

  const handleNext = () => {
    localStorage.setItem('onboarding_step', '2');
    navigate('/onboarding/3');
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="flex w-full items-center justify-between px-10 py-10">
        <button onClick={() => navigate(-1)} className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-foreground transition-all hover:bg-muted border border-border">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button onClick={() => navigate('/dashboard')} className="text-[10px] otto-label text-muted-foreground transition-all hover:text-foreground">
          SKIP PROTOCOL
        </button>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="mb-10 text-[9px] otto-label text-muted-foreground tracking-[0.4em]">
          PROTOCOL 02 / 03
        </div>

        <h1 className="mb-4 text-center text-4xl font-light text-foreground otto-title">
          Integração Institucional
        </h1>
        <p className="mb-16 text-center text-sm text-muted-foreground font-medium leading-relaxed">
          Sincronize suas custódias e fluxos para uma visão<br />consolidada do seu ecossistema financeiro.
        </p>

        <div className="grid w-full grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <BankCard
            name="Nubank"
            status="Última sync: há 2 min"
            icon={<Building2 className="h-5 w-5" />}
            state="connected"
            onClick={() => toast.info('Gerenciamento de conexão em breve')}
          />
          <BankCard
            name="Itaú Private"
            status="Processando transações..."
            icon={<Building2 className="h-5 w-5" />}
            state="syncing"
            onClick={() => toast.info('Gerenciamento de conexão em breve')}
          />
          <BankCard
            name="Digital Assets"
            status="Exchanges & Wallets"
            icon={<LineChart className="h-5 w-5" />}
            state="pending"
            onClick={() => toast.info('Integração em breve')}
          />
          <BankCard
            name="Custom Ledger"
            status="Importação de extratos"
            icon={<FileText className="h-5 w-5" />}
            state="pending"
            onClick={() => toast.info('Integração em breve')}
          />
          <button
            className="flex h-[160px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-transparent text-muted-foreground/20 transition-all hover:bg-secondary/20 hover:border-muted-foreground/40 hover:text-muted-foreground group"
            onClick={() => toast.info('Novas integrações em breve')}
          >
            <Plus className="h-8 w-8 transition-transform group-hover:scale-110" />
            <span className="text-[10px] otto-label">ADD NEW INSTITUTION</span>
          </button>
        </div>

        <Card className="mt-12 flex w-full items-center gap-6 border-border bg-secondary/20 p-8">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground tracking-tight uppercase">Institutional Grade Security</h3>
            <p className="mt-1.5 text-xs text-muted-foreground font-medium leading-relaxed">
              Criptografia de ponta a ponta. A OTTO opera sob o protocolo <strong className="text-foreground">Read-Only Access</strong>. Sua liquidez permanece intocada e sob seu controle total.
            </p>
          </div>
        </Card>

        <div className="mt-16 flex w-full justify-end pb-12">
          <Button
            size="lg"
            onClick={handleNext}
            className="w-full md:w-auto px-12 py-8 text-[10px] otto-label tracking-[0.2em]"
          >
            CONFIRM & CONTINUE →
          </Button>
        </div>
      </main>
    </div>
  );
}

function BankCard({ name, status, icon, state, onClick }: { name: string; status: string; icon: React.ReactNode; state: 'connected' | 'syncing' | 'pending'; onClick?: () => void }) {
  return (
    <Card
      className={`flex h-[160px] cursor-pointer flex-col justify-between p-6 transition-all duration-500 border-border ${state === 'connected' ? 'bg-secondary border-primary/20 shadow-2xl' : 'bg-background hover:bg-secondary/50'}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${state === 'connected' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
          {icon}
        </div>
        {state === 'connected' && <span className="text-[8px] otto-label text-foreground bg-secondary px-2 py-1 rounded">CONNECTED</span>}
        {state === 'syncing' && <span className="text-[8px] otto-label text-muted-foreground/40 animate-pulse">SYNCING...</span>}
        {state === 'pending' && <span className="text-[8px] otto-label text-muted-foreground/20">PENDING</span>}
      </div>
      <div>
        <h3 className="text-sm font-medium text-foreground tracking-tight uppercase">{name}</h3>
        <p className="mt-1 text-[10px] otto-label text-muted-foreground/20 uppercase tracking-widest">{status}</p>
      </div>
    </Card>
  );
}
