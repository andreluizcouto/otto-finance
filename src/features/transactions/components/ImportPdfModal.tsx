import { useRef, useState } from "react";
import { AlertTriangle, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { apiPost } from "@/shared/lib/api";
import { getToken } from "@/shared/lib/auth";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface ImportPdfModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ImportPdfModal({
  open,
  onOpenChange,
  onSuccess,
}: ImportPdfModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isLoading) {
      return;
    }
    if (!nextOpen) {
      resetState();
    }
    onOpenChange(nextOpen);
  };

  const handleImport = async () => {
    if (!file) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${BASE_URL}/api/analyze-pdf`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Erro na extração: HTTP ${response.status}`);
      }

      const analyzeData = await response.json();
      if (!analyzeData?.result) {
        throw new Error("Resposta inválida na extração do PDF.");
      }

      const importResult = await apiPost("/api/transactions/import", {
        result: analyzeData.result,
      });

      const imported = Number(importResult?.imported ?? 0);
      const skipped = Number(importResult?.skipped ?? 0);
      toast.success(
        `${imported} transações importadas, ${skipped} já existiam e foram ignoradas`,
      );

      onSuccess();
      onOpenChange(false);
      resetState();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Não foi possível importar o PDF.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Importar Extrato PDF</DialogTitle>
          <DialogDescription>
            Envie um extrato em PDF para importar transações automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-xs italic text-amber-500">
              Seu PDF deve estar sem senha. PDFs criptografados não são
              suportados.
            </p>
          </div>

          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(event) => {
                const selected = event.target.files?.[0] ?? null;
                setFile(selected);
                setError(null);
              }}
            />

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Upload className="h-4 w-4" /> Selecionar PDF
            </Button>

            <p className="text-xs text-muted-foreground">
              {file ? `Arquivo selecionado: ${file.name}` : "Nenhum arquivo selecionado"}
            </p>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleImport} disabled={!file || isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Importar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
