"use client";

import { useEffect, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { HugeiconsIcon } from '@hugeicons/react';
import { EyeClosedIcon, SaveIcon } from '@hugeicons/core-free-icons';
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
import {
  emptyTeamFormValues,
  teamFormSchema,
  type TeamFormValues,
} from './team-schema';

type EditTeamSheetProps = {
  team: Team | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (team: Team) => void;
};

const SHEET_CONTENT_CLASS =
  'overflow-hidden data-[side=right]:md:max-w-[50vw] data-[side=right]:md:w-[50vw]';

function toFormValues(team: Team): TeamFormValues {
  return {
    name: team.name,
    usernameTeam: team.usernameTeam,
    room: team.room ?? '',
    machine: team.machine ?? '',
  };
}

export function EditTeamSheet({
  team,
  open,
  onOpenChange,
  onUpdated,
}: EditTeamSheetProps) {
  const [requestError, setRequestError] = useState<string>();

  const form = useForm({
    defaultValues: emptyTeamFormValues satisfies TeamFormValues,
    validators: {
      onSubmit: teamFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (!team) return;

      setRequestError(undefined);
      try {
        const updatedTeam = await teamService.update(team.id, {
          name: value.name.trim(),
          usernameTeam: value.usernameTeam.trim().toLowerCase(),
          room: value.room.trim() || null,
          machine: value.machine.trim() || null,
        });
        onUpdated(updatedTeam);
        toast.add({
          title: 'Time atualizado com sucesso.',
          type: 'success',
        });
        handleOpenChange(false);
      } catch (error) {
        const message = getTeamErrorMessage(
          error,
          'Não foi possível atualizar o time.',
        );
        setRequestError(message);
        toast.add({
          title: message,
          type: 'error',
        });
      }
    },
  });

  useEffect(() => {
    if (open && team) {
      form.reset(toFormValues(team));
      setRequestError(undefined);
    }
  }, [team, form, open]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      form.reset();
      setRequestError(undefined);
    }
    onOpenChange(nextOpen);
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
          <SheetTitle className="text-2xl font-bold">Editar time</SheetTitle>
          <SheetDescription>
            Atualize os dados do time selecionado.
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
                    icon={SaveIcon}
                    className="size-5"
                    strokeWidth={3}
                  />
                  Salvar
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
  );
}
