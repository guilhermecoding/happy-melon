"use client";

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { HugeiconsIcon } from '@hugeicons/react';
import {
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

function toCreatePayload(value: TeamFormValues) {
  return {
    name: value.name.trim(),
    usernameTeam: value.usernameTeam.trim().toLowerCase(),
    room: value.room.trim() || null,
    machine: value.machine.trim() || null,
  };
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

  async function handleCsvFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) {
      resetBulkState();
      return;
    }

    setCsvFileName(file.name);
    setRequestError(undefined);

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
              'border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              tab === 'novo'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setTab('novo')}
          >
            Novo Time
          </button>
          <button
            type="button"
            className={cn(
              'border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              tab === 'massa'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setTab('massa')}
          >
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
                      placeholder="username do time"
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
                      placeholder="Opcional"
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

            <SheetFooter className="shrink-0">
              <form.Subscribe selector={(state) => state.isSubmitting}>
                {(isSubmitting) => (
                  <Button
                    type="submit"
                    variant="green"
                    loading={isSubmitting}
                    className="w-full"
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

              <Field>
                <FieldLabel htmlFor="teams-csv-upload">Arquivo CSV</FieldLabel>
                <Input
                  key={csvInputKey}
                  id="teams-csv-upload"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(event) => void handleCsvFileChange(event)}
                />
                {csvFileName && (
                  <p className="text-sm text-muted-foreground">
                    Arquivo: {csvFileName}
                    {csvRows.length > 0
                      ? ` · ${csvRows.length} time(s) válido(s)`
                      : null}
                  </p>
                )}
              </Field>

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
