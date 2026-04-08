import { useParams, useNavigate } from "react-router";
import { Card, Button, Badge, Input } from "@/shared/components/ui";
import { ArrowLeft, Edit2, Share2, FileText, CheckCircle2, ShoppingCart, Calendar, CreditCard, Tag } from "lucide-react";

export function TransactionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-10 pt-6 max-w-4xl mx-auto px-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-foreground transition-all hover:bg-muted border border-border">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex gap-4">
          <Button variant="secondary" className="px-6 py-6">
            <Share2 className="mr-3 h-4 w-4" /> Share Asset
          </Button>
          <Button variant="outline" className="px-6 py-6">
            <Edit2 className="mr-3 h-4 w-4" /> Modify
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-border bg-secondary/20">
        <div className="border-b border-border bg-secondary/10 p-12 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-background text-foreground border border-border transition-all hover:scale-105">
            <ShoppingCart className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-light text-foreground otto-title tracking-tight uppercase">Mercado Livre</h1>
          <p className="mt-2 text-[10px] otto-label text-muted-foreground/40 tracking-[0.2em] uppercase">Private Acquisition • Electronics</p>
          <div className="mt-10 text-5xl font-light text-foreground otto-title">
            - R$ 349,90
          </div>
          <div className="mt-6 flex items-center justify-center gap-3">
            <span className="text-[9px] otto-label px-3 py-1.5 rounded-full bg-primary text-primary-foreground">
              PURCHASE
            </span>
            <span className="text-[9px] otto-label px-3 py-1.5 rounded-full bg-secondary text-muted-foreground border border-border">
              VERIFIED
            </span>
          </div>
        </div>

        <div className="grid gap-12 p-12 md:grid-cols-2">
          <div className="space-y-10">
            <div>
              <h3 className="text-[10px] otto-label text-muted-foreground tracking-widest uppercase mb-6">Internal Ledger Details</h3>
              <div className="flex flex-col gap-6 rounded-2xl border border-border bg-secondary/20 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-[10px] otto-label text-muted-foreground/40">
                    <Calendar className="h-4 w-4" /> TIMESTAMP
                  </div>
                  <span className="text-xs font-medium text-foreground">10 Março 2024, 20:15</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-6">
                  <div className="flex items-center gap-4 text-[10px] otto-label text-muted-foreground/40">
                    <CreditCard className="h-4 w-4" /> SOURCE
                  </div>
                  <span className="text-xs font-medium text-foreground">Institutional Black • 9876</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-6">
                  <div className="flex items-center gap-4 text-[10px] otto-label text-muted-foreground/40">
                    <Tag className="h-4 w-4" /> TAXONOMY
                  </div>
                  <select className="bg-transparent text-xs font-medium text-foreground outline-none text-right cursor-pointer">
                    <option className="bg-background">Lifestyle</option>
                    <option className="bg-background">Essentials</option>
                    <option className="bg-background">Capital Buffer</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-[10px] otto-label text-muted-foreground tracking-widest uppercase mb-6">Confidential Notes</h3>
              <Input
                placeholder="Attach metadata or private annotations..."
                className="h-auto min-h-[120px] items-start p-4 py-4 text-muted-foreground focus:text-foreground bg-secondary/20"
                defaultValue="Private acquisition for workspace optimization."
              />
            </div>
          </div>

          <div className="space-y-10">
            <Card className="border-border bg-secondary/30 p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <FileText className="h-12 w-12 text-foreground" />
              </div>
              <div className="mb-6 flex items-center gap-3 text-[10px] otto-label text-foreground tracking-widest uppercase">
                <SparklesIcon className="h-4 w-4" /> OTTO INTELLIGENCE
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                Analysis identifies a <strong className="text-foreground font-semibold">variance of +130%</strong> compared to historical patterns in this sector. Recommend reviewing subsequent allocations.
              </p>
            </Card>

            <div>
              <h3 className="text-[10px] otto-label text-muted-foreground tracking-widest uppercase mb-6">Digital Proof</h3>
              <div className="flex h-48 cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-transparent transition-all hover:border-muted-foreground/40 hover:bg-secondary/20 group">
                <div className="h-12 w-12 flex items-center justify-center rounded-full bg-secondary text-muted-foreground/40 transition-all group-hover:bg-muted group-hover:text-foreground">
                  <FileText className="h-6 w-6" />
                </div>
                <span className="text-[10px] otto-label text-muted-foreground/40 uppercase tracking-widest group-hover:text-foreground transition-all">Upload Document</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}


