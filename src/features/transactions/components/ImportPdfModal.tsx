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

const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

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
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFileIndex, setCurrentFileIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFiles([]);
    setError(null);
    setCurrentFileIndex(null);
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

  const processFile = async (file: File, token: string) => {
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
      throw new Error(`Erro na extração (${file.name}): HTTP ${response.status}`);
    }

    const analyzeData = await response.json();
    if (!analyzeData?.result) {
      throw new Error(`Resposta inválida na extração (${file.name}).`);
    }

    const importResult = await apiPost("/api/transactions/import", {
      result: analyzeData.result,
    });

    return {
      imported: Number(importResult?.imported ?? 0),
      skipped: Number(importResult?.skipped ?? 0),
    };
  };

  const handleImport = async () => {
    if (files.length === 0) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      let totalImported = 0;
      let totalSkipped = 0;
      const failedFiles: File[] = [];
      const failedMessages: string[] = [];

      for (let i = 0; i < files.length; i += 1) {
        const current = files[i];
        setCurrentFileIndex(i);
        try {
          const result = await processFile(current, token);
          totalImported += result.imported;
          totalSkipped += result.skipped;
        } catch (err) {
          failedFiles.push(current);
          const message =
            err instanceof Error ? err.message : "Falha no processamento do arquivo.";
          failedMessages.push(`${current.name}: ${message}`);
        }
      }

      let autoClassified = 0;
      let autoSkipped = 0;
      let autoWarning: string | null = null;
      if (totalImported > 0) {
        try {
          const classifyResult = await apiPost("/api/transactions/classify");
          autoClassified = Number(classifyResult?.classified_count ?? 0);
          autoSkipped = Number(classifyResult?.skipped_count ?? 0);
          if (typeof classifyResult?.warning === "string" && classifyResult.warning.trim()) {
            autoWarning = classifyResult.warning;
          }
        } catch (classificationError) {
          const message =
            classificationError instanceof Error
              ? classificationError.message
              : "Falha ao classificar automaticamente após importação.";
          toast.error(message);
        }
      }

      if (failedFiles.length === 0) {
        toast.success(
          `${totalImported} transações importadas, ${totalSkipped} já existiam e foram ignoradas em ${files.length} arquivo(s). ${autoClassified} classificadas automaticamente (${autoSkipped} ignoradas).`,
        );
        if (autoWarning) {
          toast.warning(autoWarning);
        }
        onSuccess();
        onOpenChange(false);
        resetState();
        return;
      }

      const processedCount = files.length - failedFiles.length;
      if (processedCount > 0) {
        toast.success(
          `${totalImported} transações importadas, ${totalSkipped} já existiam e foram ignoradas. ${autoClassified} classificadas automaticamente (${autoSkipped} ignoradas). ${processedCount}/${files.length} arquivo(s) processados.`,
        );
        if (autoWarning) {
          toast.warning(autoWarning);
        }
        onSuccess();
      }

      const failureSummary = `Falha em ${failedFiles.length} arquivo(s).`;
      const failureDetails = failedMessages.slice(0, 2).join(" | ");
      setError(
        failureDetails
          ? `${failureSummary} Detalhes: ${failureDetails}`
          : failureSummary,
      );
      toast.error(`${failureSummary} Tente novamente.`);
      setFiles(failedFiles);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Não foi possível importar o PDF.";
      setError(message);
      toast.error(message);
    } finally {
      setCurrentFileIndex(null);
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
              multiple
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(event) => {
                const selected = Array.from(event.target.files ?? []);
                setFiles(selected);
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
              {files.length === 0
                ? "Nenhum arquivo selecionado"
                : files.length === 1
                  ? `Arquivo selecionado: ${files[0].name}`
                  : `${files.length} arquivos selecionados`}
            </p>
            {files.length > 1 && (
              <ul className="max-h-24 overflow-auto rounded-md border border-border p-2 text-xs text-muted-foreground">
                {files.slice(0, 5).map((file) => (
                  <li key={`${file.name}-${file.size}-${file.lastModified}`}>
                    - {file.name}
                  </li>
                ))}
                {files.length > 5 && <li>- ... e mais {files.length - 5} arquivo(s)</li>}
              </ul>
            )}
            {isLoading && currentFileIndex !== null && (
              <p className="text-xs text-muted-foreground">
                Processando {currentFileIndex + 1}/{files.length}:{" "}
                {files[currentFileIndex]?.name}
              </p>
            )}
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
          <Button type="button" onClick={handleImport} disabled={files.length === 0 || isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading
              ? "Importando..."
              : files.length > 1
                ? `Importar ${files.length} PDFs`
                : "Importar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
