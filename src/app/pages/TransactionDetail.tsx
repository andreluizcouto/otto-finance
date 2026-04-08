import { useParams, useNavigate } from "react-router";
import { Card, Button, Badge, Input } from "../components/ui";
import { ArrowLeft, Edit2, Share2, FileText, CheckCircle2, ShoppingCart, Calendar, CreditCard, Tag } from "lucide-react";

export function TransactionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-8 pt-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-[#8B949E] transition-colors hover:text-[#F4F5F8]">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            <Share2 className="mr-2 h-4 w-4" /> Dividir Despesa
          </Button>
          <Button variant="outline" size="sm">
            <Edit2 className="mr-2 h-4 w-4" /> Editar
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.01)] p-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)] text-[#F4F5F8]">
            <ShoppingCart className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F4F5F8]">Mercado Livre</h1>
          <p className="mt-1 text-[#8B949E]">Eletrônicos</p>
          <div className="mt-6 text-4xl font-bold text-[#F4F5F8]">
            - R$ 349,90
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
            <Badge variant="default" className="text-xs">
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current"></span> Compras
            </Badge>
            <Badge variant="success" className="text-xs border border-[rgba(116,238,21,0.2)] bg-transparent text-[#74ee15]">
              <CheckCircle2 className="mr-1 h-3 w-3" /> Aprovada
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 p-8 md:grid-cols-2">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-[#F4F5F8]">Detalhes da Transação</h3>
              <div className="mt-4 flex flex-col gap-4 rounded-xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-[#8B949E]">
                    <Calendar className="h-4 w-4" /> Data
                  </div>
                  <span className="text-sm font-medium text-[#F4F5F8]">10 Março 2024, 20:15</span>
                </div>
                <div className="flex items-center justify-between border-t border-[rgba(255,255,255,0.05)] pt-4">
                  <div className="flex items-center gap-3 text-sm text-[#8B949E]">
                    <CreditCard className="h-4 w-4" /> Método
                  </div>
                  <span className="text-sm font-medium text-[#F4F5F8]">Cartão de Crédito • 9876</span>
                </div>
                <div className="flex items-center justify-between border-t border-[rgba(255,255,255,0.05)] pt-4">
                  <div className="flex items-center gap-3 text-sm text-[#8B949E]">
                    <Tag className="h-4 w-4" /> Categoria
                  </div>
                  <select className="bg-transparent text-sm font-medium text-[#F4F5F8] outline-none text-right">
                    <option>Compras</option>
                    <option>Essenciais</option>
                    <option>Lazer & Estilo</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#F4F5F8]">Anotações</h3>
              <Input
                placeholder="Adicione notas, tags ou descrições..."
                className="mt-4 h-auto min-h-[100px] items-start p-3 py-3"
                defaultValue="Compra do novo teclado mecânico para o home office."
              />
            </div>
          </div>

          <div className="space-y-6">
            <Card className="border border-[rgba(170,104,255,0.3)] bg-[rgba(170,104,255,0.05)] p-5">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#aa68ff] uppercase tracking-wider">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-[rgba(170,104,255,0.1)]">
                  <FileText className="h-3 w-3" />
                </span>
                Análise da IA
              </div>
              <p className="text-sm text-[#F4F5F8] leading-relaxed">
                Esta compra está <strong className="text-red-500">acima da média</strong> que você costuma gastar nesta categoria (R$ 150). Considere revisar suas próximas compras de Eletrônicos este mês.
              </p>
            </Card>

            <div>
              <h3 className="text-sm font-semibold text-[#F4F5F8] mb-4">Comprovante</h3>
              <div className="flex h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] transition-all hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.05)]">
                <FileText className="h-8 w-8 text-[#8B949E]" />
                <span className="text-sm font-medium text-[#8B949E]">Anexar recibo ou nota fiscal</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
