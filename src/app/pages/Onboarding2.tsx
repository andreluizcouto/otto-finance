import { useNavigate } from "react-router";
import { Button, Card, Badge } from "../components/ui";
import { ArrowLeft, ShieldCheck, Building2, LineChart, FileText, Plus } from "lucide-react";

export function Onboarding2() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="flex w-full items-center justify-between px-6 py-6 md:px-12">
        <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)] text-[#F4F5F8] transition-colors hover:bg-[rgba(255,255,255,0.1)]">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button onClick={() => navigate('/dashboard')} className="text-sm font-medium text-[#8B949E] transition-colors hover:text-[#F4F5F8]">
          Pular
        </button>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 rounded-full border border-[rgba(170,104,255,0.2)] bg-[rgba(170,104,255,0.05)] px-3 py-1 text-xs font-semibold tracking-widest text-[#aa68ff] uppercase">
          PASSO 02 DE 03
        </div>

        <h1 className="mb-3 text-center text-3xl font-bold tracking-tight text-[#F4F5F8] md:text-4xl">
          Conecte suas fontes de dados
        </h1>
        <p className="mb-12 text-center text-[#8B949E]">
          Sincronize suas contas ou importe dados manualmente para que a<br />IA possa analisar seu panorama financeiro.
        </p>

        <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <BankCard
            name="Nubank"
            status="Última sync: há 2 min"
            icon={<Building2 className="h-6 w-6" />}
            state="connected"
          />
          <BankCard
            name="Itaú"
            status="Processando transações..."
            icon={<Building2 className="h-6 w-6" />}
            state="syncing"
          />
          <BankCard
            name="Importar CSV"
            status="Extratos ou planilhas"
            icon={<FileText className="h-6 w-6" />}
            state="pending"
          />
          <BankCard
            name="Corretoras"
            status="XP, BTG, Rico, etc."
            icon={<LineChart className="h-6 w-6" />}
            state="pending"
          />
          <button className="flex h-[140px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] text-[#8B949E] transition-all hover:bg-[rgba(255,255,255,0.05)] hover:text-[#F4F5F8]">
            <Plus className="h-8 w-8" />
            <span className="text-sm font-medium">Adicionar nova conexão</span>
          </button>
        </div>

        <Card className="mt-8 flex w-full items-center gap-5 border-[#74ee15] border-opacity-30 bg-[rgba(116,238,21,0.05)] p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[rgba(116,238,21,0.1)] text-[#74ee15]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#F4F5F8]">Segurança de Nível Bancário</h3>
            <p className="mt-1 text-xs text-[#8B949E]">Conexão end-to-end encrypted. A FinCoach possui apenas acesso <strong className="text-white">Read-Only (somente leitura)</strong> aos seus dados. Nunca poderemos mover seu dinheiro.</p>
          </div>
        </Card>

        <div className="mt-12 flex w-full justify-end">
          <Button size="lg" onClick={() => navigate('/onboarding/3')}>
            Próximo Passo →
          </Button>
        </div>
      </main>
    </div>
  );
}

function BankCard({ name, status, icon, state }: { name: string; status: string; icon: React.ReactNode; state: 'connected' | 'syncing' | 'pending' }) {
  return (
    <Card className={`flex h-[140px] flex-col justify-between p-5 transition-transform hover:scale-[1.02] ${state === 'connected' ? 'border-[#aa68ff] bg-[rgba(170,104,255,0.05)]' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(255,255,255,0.05)] text-[#F4F5F8]">
          {icon}
        </div>
        {state === 'connected' && <Badge variant="success">● CONECTADO</Badge>}
        {state === 'syncing' && <Badge variant="purple">● SINCRONIZANDO</Badge>}
        {state === 'pending' && <Badge variant="default">● PENDENTE</Badge>}
      </div>
      <div>
        <h3 className="text-base font-semibold text-[#F4F5F8]">{name}</h3>
        <p className="mt-1 text-xs text-[#8B949E]">{status}</p>
      </div>
    </Card>
  );
}
