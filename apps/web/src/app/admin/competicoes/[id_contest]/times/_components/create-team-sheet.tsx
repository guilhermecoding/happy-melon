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
import { toast } from '@/components/pouf/toaster';
import { BulkImportTeamsDialog } from './bulk-import-teams-dialog';
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
  const [requestError, setRequestError] = useState<string>();
  const [bulkOpen, setBulkOpen] = useState(false);

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
        toast.success('Time cadastrado com sucesso.');
        handleOpenChange(false);
      } catch (error) {
        const message = getTeamErrorMessage(
          error,
          'Não foi possível criar o time.',
        );
        setRequestError(message);
        toast.error(message);
      }
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      form.reset();
      setRequestError(undefined);
      setBulkOpen(false);
    }
    onOpenChange(nextOpen);
  }

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={handleOpenChange}
      >
        <SheetContent
          side="right"
          showCloseButton={false}
          className="overflow-hidden"
        >
          <SheetHeader className="shrink-0">
            <SheetTitle className="text-2xl font-bold">Adicionar time</SheetTitle>
            <SheetDescription>
              Cadastre um novo time nesta competição.
            </SheetDescription>
          </SheetHeader>

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

              <Button
                type="button"
                variant="orange"
                className="mt-2 w-full"
                size="sm"
                onClick={() => setBulkOpen(true)}
              >
                <HugeiconsIcon
                  icon={Upload01Icon}
                  className="size-5"
                  strokeWidth={3}
                />
                Importar em massa
              </Button>
            </div>

            <SheetFooter className="shrink-0 flex flex-col gap-2">
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
        </SheetContent>
      </Sheet>

      <BulkImportTeamsDialog
        contestId={contestId}
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onBulkUpserted={(teams) => {
          onBulkUpserted(teams);
          setBulkOpen(false);
          handleOpenChange(false);
        }}
      />
    </>
  );
}
