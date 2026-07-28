"use client";

import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Csv01Icon,
  Csv02Icon,
  Download01Icon,
  EyeClosedIcon,
  Txt01Icon,
  Upload01Icon,
} from '@hugeicons/core-free-icons';
import { teamService } from '@/services/team/team.service';
import { getTeamErrorMessage } from '@/services/team/team.error';
import type { Team } from '@/services/team/team.type';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import {
  downloadTeamCsvTemplate,
  parseTeamsCsv,
  type TeamCsvRow,
} from './team-csv';
import { Separator } from '@/components/ui/separator';

type BulkImportTeamsDialogProps = {
  contestId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBulkUpserted: (teams: Team[]) => void;
};

type ImportMode = 'csv' | 'boca' | null;

const MAX_FILE_BYTES = 5 * 1024 * 1024;

function isCsvFile(file: File) {
  const name = file.name.toLowerCase();
  return (
    name.endsWith('.csv') ||
    file.type === 'text/csv' ||
    file.type === 'application/vnd.ms-excel'
  );
}

function isTxtFile(file: File) {
  const name = file.name.toLowerCase();
  return name.endsWith('.txt') || file.type === 'text/plain';
}

type SquareDropzoneProps = {
  id: string;
  inputKey: number;
  accept: string;
  icon: typeof Csv02Icon;
  title: string;
  description: string;
  isDragging: boolean;
  onDragOver: (event: React.DragEvent<HTMLLabelElement>) => void;
  onDragLeave: (event: React.DragEvent<HTMLLabelElement>) => void;
  onDrop: (event: React.DragEvent<HTMLLabelElement>) => void;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

function SquareDropzone({
  id,
  inputKey,
  accept,
  icon,
  title,
  description,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onChange,
}: SquareDropzoneProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
      <input
        key={inputKey}
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={onChange}
      />
      <label
        htmlFor={id}
        onDragOver={onDragOver}
        onDragEnter={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          'flex size-28 shrink-0 cursor-pointer items-center justify-center rounded-3xl border-4 border-dashed transition-colors sm:size-54',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border bg-muted/40 hover:bg-muted/70',
        )}
      >
        <HugeiconsIcon
          icon={icon}
          className="size-24 text-primary/10"
          strokeWidth={1.5}
        />
      </label>
      <div className="text-center">
        <p className="text-base font-bold text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function BulkImportTeamsDialog({
  contestId,
  open,
  onOpenChange,
  onBulkUpserted,
}: BulkImportTeamsDialogProps) {
  const [mode, setMode] = useState<ImportMode>(null);
  const [requestError, setRequestError] = useState<string>();
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<TeamCsvRow[]>([]);
  const [fileName, setFileName] = useState<string>();
  const [csvInputKey, setCsvInputKey] = useState(0);
  const [bocaInputKey, setBocaInputKey] = useState(0);
  const [draggingCsv, setDraggingCsv] = useState(false);
  const [draggingBoca, setDraggingBoca] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetState() {
    setMode(null);
    setRequestError(undefined);
    setFileErrors([]);
    setCsvRows([]);
    setFileName(undefined);
    setDraggingCsv(false);
    setDraggingBoca(false);
    setCsvInputKey((current) => current + 1);
    setBocaInputKey((current) => current + 1);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetState();
      setIsSubmitting(false);
    }
    onOpenChange(nextOpen);
  }

  async function processCsvFile(file: File | undefined) {
    if (!file) {
      resetState();
      return;
    }

    setMode('csv');
    setRequestError(undefined);
    setBocaInputKey((current) => current + 1);

    if (!isCsvFile(file)) {
      setFileName(file.name);
      setFileErrors(['Selecione um arquivo CSV válido.']);
      setCsvRows([]);
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setFileName(file.name);
      setFileErrors(['O arquivo excede o tamanho máximo de 5MB.']);
      setCsvRows([]);
      return;
    }

    setFileName(file.name);

    try {
      const content = await file.text();
      const parsed = parseTeamsCsv(content);
      setFileErrors(parsed.errors);
      setCsvRows(parsed.rows);
    } catch {
      setFileErrors(['Não foi possível ler o arquivo CSV.']);
      setCsvRows([]);
    }
  }

  function processBocaFile(file: File | undefined) {
    if (!file) {
      resetState();
      return;
    }

    setMode('boca');
    setRequestError(undefined);
    setCsvRows([]);
    setCsvInputKey((current) => current + 1);

    if (!isTxtFile(file)) {
      setFileName(file.name);
      setFileErrors(['Selecione um arquivo TXT válido para importação BOCA.']);
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setFileName(file.name);
      setFileErrors(['O arquivo excede o tamanho máximo de 5MB.']);
      return;
    }

    setFileName(file.name);
    setFileErrors([]);
  }

  async function handleSubmit() {
    setRequestError(undefined);

    if (mode === 'boca') {
      setRequestError(
        'A importação BOCA ainda não está disponível. Em breve.',
      );
      return;
    }

    if (mode !== 'csv' || csvRows.length === 0) {
      setRequestError(
        fileErrors.length > 0
          ? 'Nenhuma linha válida para importar. Corrija os erros do CSV.'
          : 'Selecione um arquivo CSV válido com ao menos um time.',
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const teams = await teamService.bulkUpsert(contestId, {
        teams: csvRows,
      });
      onBulkUpserted(teams);
      toast.add({
        title: `${teams.length} time(s) importado(s) com sucesso.`,
        type: 'success',
      });
      handleOpenChange(false);
    } catch (error) {
      const message = getTeamErrorMessage(
        error,
        'Não foi possível importar os times.',
      );
      setRequestError(message);
      toast.add({
        title: message,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[min(90vh,40rem)] w-full max-w-[80vw] gap-4 overflow-y-auto p-4 md:max-w-[80vw] lg:max-w-[60vw] xl:max-w-[40vw] sm:p-6"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold sm:text-2xl">
            Como deseja importar?
          </DialogTitle>
          <DialogDescription className="text-base">
            Escolha o formato do arquivo para cadastrar vários times de uma vez.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="blue"
            size="sm"
            onClick={downloadTeamCsvTemplate}
          >
            <HugeiconsIcon
              icon={Download01Icon}
              className="size-5"
              strokeWidth={3}
            />
            Modelo CSV
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 px-12 justify-items-center gap-3 sm:gap-6">
          <SquareDropzone
            id="bulk-csv-upload"
            inputKey={csvInputKey}
            accept=".csv,text/csv"
            icon={Csv01Icon}
            title="Importação Padrão"
            description="CSV com Nome, Usuário, Sala e Máquina. Máx. 5MB."
            isDragging={draggingCsv}
            onDragOver={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setDraggingCsv(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setDraggingCsv(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setDraggingCsv(false);
              void processCsvFile(event.dataTransfer.files?.[0]);
            }}
            onChange={(event) => void processCsvFile(event.target.files?.[0])}
          />

          <Separator orientation="vertical" className="h-full hidden xl:block" />
          <Separator orientation="horizontal" className="w-full block xl:hidden" />

          <SquareDropzone
            id="bulk-boca-upload"
            inputKey={bocaInputKey}
            accept=".txt,text/plain"
            icon={Txt01Icon}
            title="Importação BOCA"
            description="TXT no formato de exportação do BOCA. Máx. 5MB."
            isDragging={draggingBoca}
            onDragOver={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setDraggingBoca(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setDraggingBoca(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setDraggingBoca(false);
              processBocaFile(event.dataTransfer.files?.[0]);
            }}
            onChange={(event) => processBocaFile(event.target.files?.[0])}
          />
        </div>

        {fileName && (
          <div className="flex items-center gap-2 rounded-2xl border-2 border-green-700 bg-green-50 p-3 font-semibold text-green-700">
            <HugeiconsIcon
              icon={mode === 'boca' ? Txt01Icon : Csv01Icon}
              className="size-5 shrink-0"
              strokeWidth={1.5}
            />
            <p className="text-sm">
              Arquivo: {fileName}
              {mode === 'csv' && csvRows.length > 0
                ? ` · ${csvRows.length} time(s) válido(s)`
                : null}
              {mode === 'boca' ? ' · Importação BOCA' : null}
            </p>
          </div>
        )}

        {fileErrors.length > 0 && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/5 p-3"
          >
            <p className="mb-2 text-sm font-medium text-destructive">
              {mode === 'boca' ? 'Erros no TXT' : 'Erros no CSV'}
            </p>
            <ul className="flex flex-col gap-1 text-sm text-destructive">
              {fileErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {requestError && (
          <p role="alert" className="text-sm text-destructive">
            {requestError}
          </p>
        )}

        <DialogFooter className="flex-col-reverse justify-end gap-2 xl:flex-row mt-12">
          <Button
            type="button"
            variant="white"
            className="w-full sm:w-fit"
            onClick={() => handleOpenChange(false)}
          >
            <HugeiconsIcon
              icon={EyeClosedIcon}
              className="size-5"
              strokeWidth={3}
            />
            Fechar
          </Button>
          <Button
            type="button"
            variant="green"
            loading={isSubmitting}
            className="w-full sm:w-fit"
            onClick={() => void handleSubmit()}
          >
            <HugeiconsIcon
              icon={Upload01Icon}
              className="size-5"
              strokeWidth={3}
            />
            Importar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
