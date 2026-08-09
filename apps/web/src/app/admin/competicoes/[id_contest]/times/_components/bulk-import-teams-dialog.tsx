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
import { Button } from '@/components/pouf/Button';
import { Dialog } from '@/components/pouf/controls';
import { RowCard } from '@/components/pouf/surface';
import { toast } from '@/components/pouf/toaster';
import { cn } from '@/lib/utils';
import {
  downloadTeamCsvTemplate,
  parseTeamsCsv,
  type TeamCsvRow,
} from './team-csv';
import { parseTeamsBoca } from './team-boca';

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
            ? 'border-purple bg-purple/5'
            : 'border-border bg-muted/40 hover:bg-muted/70',
        )}
      >
        <HugeiconsIcon
          icon={icon}
          className="size-10 text-ink/10 sm:size-24"
          strokeWidth={1.5}
        />
      </label>
      <div className="text-center">
        <p className="text-base font-bold text-ink">{title}</p>
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
  const [importRows, setImportRows] = useState<TeamCsvRow[]>([]);
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
    setImportRows([]);
    setFileName(undefined);
    setDraggingCsv(false);
    setDraggingBoca(false);
    setCsvInputKey((current) => current + 1);
    setBocaInputKey((current) => current + 1);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isSubmitting) return;

    if (!nextOpen) {
      resetState();
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
      setImportRows([]);
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setFileName(file.name);
      setFileErrors(['O arquivo excede o tamanho máximo de 5MB.']);
      setImportRows([]);
      return;
    }

    setFileName(file.name);

    try {
      const content = await file.text();
      const parsed = parseTeamsCsv(content);
      setFileErrors(parsed.errors);
      setImportRows(parsed.rows);
    } catch {
      setFileErrors(['Não foi possível ler o arquivo CSV.']);
      setImportRows([]);
    }
  }

  async function processBocaFile(file: File | undefined) {
    if (!file) {
      resetState();
      return;
    }

    setMode('boca');
    setRequestError(undefined);
    setCsvInputKey((current) => current + 1);

    if (!isTxtFile(file)) {
      setFileName(file.name);
      setFileErrors(['Selecione um arquivo TXT válido para importação BOCA.']);
      setImportRows([]);
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setFileName(file.name);
      setFileErrors(['O arquivo excede o tamanho máximo de 5MB.']);
      setImportRows([]);
      return;
    }

    setFileName(file.name);

    try {
      const content = await file.text();
      const parsed = parseTeamsBoca(content);
      setFileErrors(parsed.errors);
      setImportRows(parsed.rows);
    } catch {
      setFileErrors(['Não foi possível ler o arquivo TXT do BOCA.']);
      setImportRows([]);
    }
  }

  async function handleSubmit() {
    setRequestError(undefined);

    if (mode !== 'csv' && mode !== 'boca') {
      setRequestError('Selecione um arquivo CSV ou TXT para importar.');
      return;
    }

    if (importRows.length === 0) {
      setRequestError(
        fileErrors.length > 0
          ? `Nenhuma entrada válida para importar. Corrija os erros do ${mode === 'boca' ? 'TXT' : 'CSV'}.`
          : `Selecione um arquivo ${mode === 'boca' ? 'TXT' : 'CSV'} válido com ao menos um time.`,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const teams = await teamService.bulkUpsert(contestId, {
        teams: importRows,
      });
      onBulkUpserted(teams);
      toast.success(`${teams.length} time(s) importado(s) com sucesso.`);
      setIsSubmitting(false);
      handleOpenChange(false);
      return;
    } catch (error) {
      const message = getTeamErrorMessage(
        error,
        'Não foi possível importar os times.',
      );
      setRequestError(message);
      toast.error(message);
    }

    setIsSubmitting(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Como deseja importar?"
      description="Escolha o formato do arquivo para cadastrar vários times de uma vez."
      size="lg"
    >
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <Button tone="blue" size="sm" onClick={downloadTeamCsvTemplate}>
            <HugeiconsIcon
              icon={Download01Icon}
              className="size-5"
              strokeWidth={3}
            />
            Modelo CSV
          </Button>
        </div>

        <div className="grid grid-cols-1 justify-items-center gap-6 xl:grid-cols-2">
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

          <SquareDropzone
            id="bulk-boca-upload"
            inputKey={bocaInputKey}
            accept=".txt,text/plain"
            icon={Txt01Icon}
            title="Importação BOCA"
            description="TXT no formato de exportação do BOCA. Esta opção não inclui Sala e Máquina, apenas Nome (userfullname) e Usuário (username). Máx. 5MB."
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
              void processBocaFile(event.dataTransfer.files?.[0]);
            }}
            onChange={(event) => void processBocaFile(event.target.files?.[0])}
          />
        </div>

        {fileName && (
          <RowCard>
            <div className="flex items-center gap-2 font-semibold text-ink">
              <HugeiconsIcon
                icon={mode === 'boca' ? Txt01Icon : Csv01Icon}
                className="size-5 shrink-0"
                strokeWidth={2}
              />
              <p className="text-sm">
                Arquivo: {fileName}
                {importRows.length > 0
                  ? ` · ${importRows.length} time(s) válido(s)`
                  : null}
                {mode === 'boca' ? ' · Importação BOCA' : null}
              </p>
            </div>
          </RowCard>
        )}

        {fileErrors.length > 0 && (
          <RowCard>
            <div role="alert">
              <p className="mb-2 text-sm font-bold text-destructive">
                {mode === 'boca' ? 'Erros no TXT' : 'Erros no CSV'}
              </p>
              <ul className="flex flex-col gap-1 text-sm text-destructive">
                {fileErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          </RowCard>
        )}

        {requestError && (
          <p role="alert" className="text-sm text-destructive">
            {requestError}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-col-reverse justify-end gap-2 xl:flex-row">
        <Button variant="quiet" onClick={() => handleOpenChange(false)}>
          <HugeiconsIcon
            icon={EyeClosedIcon}
            className="size-5"
            strokeWidth={3}
          />
          Fechar
        </Button>
        <Button
          tone="mint"
          loading={isSubmitting}
          onClick={() => void handleSubmit()}
        >
          <HugeiconsIcon
            icon={Upload01Icon}
            className="size-5"
            strokeWidth={3}
          />
          Importar
        </Button>
      </div>
    </Dialog>
  );
}
