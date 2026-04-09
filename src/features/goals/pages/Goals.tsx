import { useNavigate } from "react-router";
import { Card, Button } from "@/shared/components/ui";
import { Target, Plus } from "lucide-react";
import { toast } from "sonner";

export function Goals() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-10 pt-6 max-w-7xl mx-auto px-6">
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-4xl otto-title text-white">Objetivos</h1>
          <p className="mt-2 otto-label text-xs">Planejamento Estratégico de Patrimônio</p>
        </div>
        <Button
          onClick={() => toast.info("Cadastro de metas em breve")}
          className="bg-white text-black hover:bg-white/90 rounded-xl px-6 py-6 text-[10px] otto-label transition-all"
        >
          <Plus className="mr-3 h-4 w-4" /> Definir Objetivo
        </Button>
      </div>

      <Card className="border-white/10 bg-white/[0.02] p-10">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-white border border-white/10">
            <Target className="h-7 w-7" />
          </div>
          <h2 className="text-2xl otto-title text-white">Sem metas financeiras reais conectadas</h2>
          <p className="text-sm leading-relaxed text-white/50">
            Removemos os dados simulados desta tela. Assim que o módulo de metas com backend estiver disponível,
            esta seção exibirá apenas objetivos reais da sua conta.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="secondary" onClick={() => navigate("/dashboard")}>
              Voltar ao Dashboard
            </Button>
            <Button onClick={() => navigate("/transactions")}>Ver Transações Reais</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

