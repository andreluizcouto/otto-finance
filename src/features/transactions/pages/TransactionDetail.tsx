import { useParams, useNavigate } from "react-router";
import { Card, Button, Badge, Input } from "@/shared/components/ui";
import { ArrowLeft, Edit2, Share2, FileText, CheckCircle2, ShoppingCart, Calendar, CreditCard, Tag } from "lucide-react";

export function TransactionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-10 pt-6 max-w-4xl mx-auto px-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white transition-all hover:bg-white/10 border border-white/5">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex gap-4">
          <Button variant="secondary" className="px-6 py-6 border-white/10">
            <Share2 className="mr-3 h-4 w-4" /> Share Asset
          </Button>
          <Button variant="outline" className="px-6 py-6 border-white/10">
            <Edit2 className="mr-3 h-4 w-4" /> Modify
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-white/5 bg-white/[0.02]">
        <div className="border-b border-white/5 bg-white/[0.01] p-12 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/5 text-white border border-white/10 transition-all hover:scale-105">
            <ShoppingCart className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-light text-white otto-title tracking-tight uppercase">Mercado Livre</h1>
          <p className="mt-2 text-[10px] otto-label text-white/40 tracking-[0.2em] uppercase">Private Acquisition • Electronics</p>
          <div className="mt-10 text-5xl font-light text-white otto-title">
            - R$ 349,90
          </div>
          <div className="mt-6 flex items-center justify-center gap-3">
            <span className="text-[9px] otto-label px-3 py-1.5 rounded-full bg-white/10 text-white border border-white/10">
              PURCHASE
            </span>
            <span className="text-[9px] otto-label px-3 py-1.5 rounded-full bg-white/5 text-white/60 border border-white/5">
              VERIFIED
            </span>
          </div>
        </div>

        <div className="grid gap-12 p-12 md:grid-cols-2">
          <div className="space-y-10">
            <div>
              <h3 className="text-[10px] otto-label text-white/40 tracking-widest uppercase mb-6">Internal Ledger Details</h3>
              <div className="flex flex-col gap-6 rounded-2xl border border-white/5 bg-white/[0.02] p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-[10px] otto-label text-white/20">
                    <Calendar className="h-4 w-4" /> TIMESTAMP
                  </div>
                  <span className="text-xs font-medium text-white">10 Março 2024, 20:15</span>
                </div>
                <div className="flex items-center justify-between border-t border-white/5 pt-6">
                  <div className="flex items-center gap-4 text-[10px] otto-label text-white/20">
                    <CreditCard className="h-4 w-4" /> SOURCE
                  </div>
                  <span className="text-xs font-medium text-white">Institutional Black • 9876</span>
                </div>
                <div className="flex items-center justify-between border-t border-white/5 pt-6">
                  <div className="flex items-center gap-4 text-[10px] otto-label text-white/20">
                    <Tag className="h-4 w-4" /> TAXONOMY
                  </div>
                  <select className="bg-transparent text-xs font-medium text-white outline-none text-right cursor-pointer">
                    <option className="bg-black">Lifestyle</option>
                    <option className="bg-black">Essentials</option>
                    <option className="bg-black">Capital Buffer</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-[10px] otto-label text-white/40 tracking-widest uppercase mb-6">Confidential Notes</h3>
              <Input
                placeholder="Attach metadata or private annotations..."
                className="h-auto min-h-[120px] items-start p-4 py-4 text-white/60 focus:text-white"
                defaultValue="Private acquisition for workspace optimization."
              />
            </div>
          </div>

          <div className="space-y-10">
            <Card className="border-white/10 bg-white/5 p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <FileText className="h-12 w-12" />
              </div>
              <div className="mb-6 flex items-center gap-3 text-[10px] otto-label text-white tracking-widest uppercase">
                <SparklesIcon className="h-4 w-4" /> OTTO INTELLIGENCE
              </div>
              <p className="text-sm text-white/40 leading-relaxed font-medium">
                Analysis identifies a <strong className="text-white">variance of +130%</strong> compared to historical patterns in this sector. Recommend reviewing subsequent allocations.
              </p>
            </Card>

            <div>
              <h3 className="text-[10px] otto-label text-white/40 tracking-widest uppercase mb-6">Digital Proof</h3>
              <div className="flex h-48 cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/10 bg-transparent transition-all hover:border-white/20 hover:bg-white/[0.02] group">
                <div className="h-12 w-12 flex items-center justify-center rounded-full bg-white/5 text-white/20 transition-all group-hover:bg-white/10 group-hover:text-white">
                  <FileText className="h-6 w-6" />
                </div>
                <span className="text-[10px] otto-label text-white/20 uppercase tracking-widest group-hover:text-white transition-all">Upload Document</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

