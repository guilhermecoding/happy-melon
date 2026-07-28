"use client";

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  AddTeam02Icon,
  CheckmarkCircle01Icon,
  EyeClosedIcon,
  Upload01Icon,
} from '@hugeicons/core-free-icons';
import { teamService } from '@/services/team/team.service';
import { getTeamErrorMessage } from '@/services/team/team.error';
import type { Team } from '@/services/team/team.type';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import {
  downloadTeamCsvTemplate,
  parseTeamsCsv,
  type TeamCsvRow,
} from './team-csv';
import {
  emptyTeamFormValues,
  teamFormSchema,
  type TeamFormValues,
} from './team-schema';

type CreateTeamSheetProps = {
  contestId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (team: Team) => void;
  onBulkUpserted: (teams: Team[]) => void;
};

type SheetTab = 'novo' | 'massa';

const SHEET_CONTENT_CLASS =
  'overflow-hidden data-[side=right]:md:max-w-[50vw] data-[side=right]:md:w-[50vw]';

const MAX_CSV_BYTES = 5 * 1024 * 1024;

function toCreatePayload(value: TeamFormValues) {
  return {
    name: value.name.trim(),
    usernameTeam: value.usernameTeam.trim().toLowerCase(),
    room: value.room.trim() || null,
    machine: value.machine.trim() || null,
  };
}

function isCsvFile(file: File) {
  const name = file.name.toLowerCase();
  return (
    name.endsWith('.csv') ||
    file.type === 'text/csv' ||
    file.type === 'application/vnd.ms-excel'
  );
}

export function CreateTeamSheet({
  contestId,
  open,
  onOpenChange,
  onCreated,
  onBulkUpserted,
}: CreateTeamSheetProps) {
  const [tab, setTab] = useState<SheetTab>('novo');
  const [requestError, setRequestError] = useState<string>();
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<TeamCsvRow[]>([]);
  const [csvFileName, setCsvFileName] = useState<string>();
  const [csvInputKey, setCsvInputKey] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  const form = useForm({
    defaultValues: emptyTeamFormValues satisfies TeamFormValues,
    validators: {
      onSubmit: teamFormSchema,
    },
    onSubmit: async ({ value }) => {
      setRequestError(undefined);
      try {
        const team = await teamService.create(contestId, toCreatePayload(value));
        onCreated(team);
        toast.add({
          title: 'Time cadastrado com sucesso.',
          type: 'success',
        });
        handleOpenChange(false);
      } catch (error) {
        const message = getTeamErrorMessage(
          error,
          'Não foi possível criar o time.',
        );
        setRequestError(message);
        toast.add({
          title: message,
          type: 'error',
        });
      }
    },
  });

  function resetBulkState() {
    setCsvErrors([]);
    setCsvRows([]);
    setCsvFileName(undefined);
    setIsDragging(false);
    setCsvInputKey((current) => current + 1);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      form.reset();
      setRequestError(undefined);
      setTab('novo');
      resetBulkState();
      setIsBulkSubmitting(false);
    }
    onOpenChange(nextOpen);
  }

  async function processCsvFile(file: File | undefined) {
    if (!file) {
      resetBulkState();
      return;
    }

    setRequestError(undefined);

    if (!isCsvFile(file)) {
      setCsvFileName(file.name);
      setCsvErrors(['Selecione um arquivo CSV válido.']);
      setCsvRows([]);
      return;
    }

    if (file.size > MAX_CSV_BYTES) {
      setCsvFileName(file.name);
      setCsvErrors(['O arquivo excede o tamanho máximo de 5MB.']);
      setCsvRows([]);
      return;
    }

    setCsvFileName(file.name);

    try {
      const content = await file.text();
      const parsed = parseTeamsCsv(content);
      setCsvErrors(parsed.errors);
      setCsvRows(parsed.rows);
    } catch {
      setCsvErrors(['Não foi possível ler o arquivo CSV.']);
      setCsvRows([]);
    }
  }

  function handleCsvFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    void processCsvFile(event.target.files?.[0]);
  }

  function handleDragOver(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    void processCsvFile(event.dataTransfer.files?.[0]);
  }

  async function handleBulkSubmit() {
    setRequestError(undefined);

    if (csvRows.length === 0) {
      setRequestError(
        csvErrors.length > 0
          ? 'Nenhuma linha válida para importar. Corrija os erros do CSV.'
          : 'Selecione um arquivo CSV válido com ao menos um time.',
      );
      return;
    }

    setIsBulkSubmitting(true);
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
      setIsBulkSubmitting(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={handleOpenChange}
      disablePointerDismissal
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        className={SHEET_CONTENT_CLASS}
      >
        <SheetHeader className="shrink-0">
          <SheetTitle className="text-2xl font-bold">Adicionar time</SheetTitle>
          <SheetDescription>
            Cadastre um time ou importe vários times via CSV.
          </SheetDescription>
        </SheetHeader>

        <div className="flex shrink-0 gap-1 border-b px-4">
          <button
            type="button"
            className={cn(
              'border-b-2 px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2',
              tab === 'novo'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setTab('novo')}
          >
            <HugeiconsIcon
              icon={AddTeam02Icon}
              className="size-4"
              strokeWidth={2}
            />
            Manualmente
          </button>
          <button
            type="button"
            className={cn(
              'border-b-2 px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2',
              tab === 'massa'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setTab('massa')}
          >
            <HugeiconsIcon
              icon={Upload01Icon}
              className="size-4"
              strokeWidth={2}
            />
            Em Massa
          </button>
        </div>

        {tab === 'novo' ? (
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto scrollbar-thin px-4 pb-2">
              <form.Field name="name">
                {(field) => (
                  <Field data-invalid={!field.state.meta.isValid}>
                    <FieldLabel htmlFor={field.name}>Nome</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      placeholder="Nome do time"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      aria-invalid={!field.state.meta.isValid}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="usernameTeam">
                {(field) => (
                  <Field data-invalid={!field.state.meta.isValid}>
                    <FieldLabel htmlFor={field.name}>Usuário</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      placeholder="Username do time"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      aria-invalid={!field.state.meta.isValid}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="room">
                {(field) => (
                  <Field data-invalid={!field.state.meta.isValid}>
                    <FieldLabel htmlFor={field.name}>Sala</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      placeholder="Sala do time (opcional)"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      aria-invalid={!field.state.meta.isValid}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="machine">
                {(field) => (
                  <Field data-invalid={!field.state.meta.isValid}>
                    <FieldLabel htmlFor={field.name}>Máquina</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      placeholder="Número da máquina (opcional)"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      aria-invalid={!field.state.meta.isValid}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              {requestError && (
                <p role="alert" className="text-sm text-destructive">
                  {requestError}
                </p>
              )}
            </div>

            <SheetFooter className="shrink-0 flex flex-col sm:justify-start sm:flex-row-reverse gap-2">
              <form.Subscribe selector={(state) => state.isSubmitting}>
                {(isSubmitting) => (
                  <Button
                    type="submit"
                    variant="green"
                    loading={isSubmitting}
                    className="w-full md:w-fit"
                  >
                    <HugeiconsIcon
                      icon={CheckmarkCircle01Icon}
                      className="size-5"
                      strokeWidth={3}
                    />
                    Adicionar
                  </Button>
                )}
              </form.Subscribe>
              <Button
                type="button"
                variant="white"
                onClick={() => handleOpenChange(false)}
                className="w-full md:w-fit"
              >
                <HugeiconsIcon
                  icon={EyeClosedIcon}
                  className="size-5"
                  strokeWidth={3}
                />
                Fechar
              </Button>
            </SheetFooter>
          </form>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto scrollbar-thin px-4 pb-2">
              <button
                type="button"
                className="w-fit text-sm font-medium text-primary underline-offset-4 hover:underline"
                onClick={downloadTeamCsvTemplate}
              >
                Baixar modelo CSV
              </button>

              <div className="flex flex-col gap-2">
                <input
                  key={csvInputKey}
                  id="teams-csv-upload"
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={handleCsvFileChange}
                />
                <label
                  htmlFor="teams-csv-upload"
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors',
                    isDragging
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-muted/40 hover:bg-muted/70',
                  )}
                >
                  <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                    <HugeiconsIcon
                      icon={Upload01Icon}
                      className="size-6 text-foreground"
                      strokeWidth={2}
                    />
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    Arraste seu arquivo CSV aqui
                  </span>
                  <span className="mt-1 text-xs text-muted-foreground">
                    ou clique para selecionar. Máximo 5MB.
                  </span>
                </label>
                {csvFileName && (
                  <p className="text-sm text-muted-foreground">
                    Arquivo: {csvFileName}
                    {csvRows.length > 0
                      ? ` · ${csvRows.length} time(s) válido(s)`
                      : null}
                  </p>
                )}
              </div>

              {csvErrors.length > 0 && (
                <div
                  role="alert"
                  className="rounded-xl border border-destructive/30 bg-destructive/5 p-3"
                >
                  <p className="mb-2 text-sm font-medium text-destructive">
                    Erros no CSV
                  </p>
                  <ul className="flex flex-col gap-1 text-sm text-destructive">
                    {csvErrors.map((error) => (
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
            </div>

            <SheetFooter className="shrink-0">
              <Button
                type="button"
                variant="green"
                loading={isBulkSubmitting}
                className="w-full"
                onClick={() => void handleBulkSubmit()}
              >
                <HugeiconsIcon
                  icon={Upload01Icon}
                  className="size-5"
                  strokeWidth={3}
                />
                Importar
              </Button>
              <Button
                type="button"
                variant="white"
                onClick={() => handleOpenChange(false)}
                className="w-full"
              >
                <HugeiconsIcon
                  icon={EyeClosedIcon}
                  className="size-5"
                  strokeWidth={3}
                />
                Fechar
              </Button>
            </SheetFooter>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
