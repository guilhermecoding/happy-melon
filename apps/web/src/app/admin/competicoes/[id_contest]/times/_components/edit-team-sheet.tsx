"use client";

import { useEffect, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Delete01Icon,
  EyeClosedIcon,
  SaveIcon,
} from '@hugeicons/core-free-icons';
import { AdminPasswordConfirmDialog } from '@/components/admin-password-confirm-dialog';
import { teamService } from '@/services/team/team.service';
import { getTeamErrorMessage } from '@/services/team/team.error';
import type { Team } from '@/services/team/team.type';
import { Button } from '@/components/pouf/Button';
import { Field, Input } from '@/components/pouf/Input';
import { Sheet } from '@/components/pouf/sheet';
import { toast } from '@/components/pouf/toaster';
import { fieldError } from '@/lib/form';
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
  onDeleted: (teamId: string) => void;
};

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
  onDeleted,
}: EditTeamSheetProps) {
  const [requestError, setRequestError] = useState<string>();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [confirmError, setConfirmError] = useState<string>();
  const [isConfirming, setIsConfirming] = useState(false);

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
        toast.success('Time atualizado com sucesso.');
        handleOpenChange(false);
      } catch (error) {
        const message = getTeamErrorMessage(
          error,
          'Não foi possível atualizar o time.',
        );
        setRequestError(message);
        toast.error(message);
      }
    },
  });

  useEffect(() => {
    if (open && team) {
      form.reset(toFormValues(team));
      setRequestError(undefined);
      setDeleteConfirmOpen(false);
      setConfirmError(undefined);
    }
  }, [team, form, open]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isConfirming) return;

    if (!nextOpen) {
      form.reset();
      setRequestError(undefined);
      setDeleteConfirmOpen(false);
      setConfirmError(undefined);
    }
    onOpenChange(nextOpen);
  }

  async function handleConfirmDelete(password: string) {
    if (!team) return;

    setIsConfirming(true);
    setConfirmError(undefined);

    try {
      await teamService.remove(team.id, { password });
      onDeleted(team.id);
      setDeleteConfirmOpen(false);
      setIsConfirming(false);
      handleOpenChange(false);
      toast.success('Time excluído com sucesso.');
      return;
    } catch (error) {
      const message = getTeamErrorMessage(
        error,
        'Não foi possível excluir o time.',
      );
      setConfirmError(message);
      toast.error(message);
    }

    setIsConfirming(false);
  }

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={handleOpenChange}
        title="Editar time"
        description="Atualize os dados do time selecionado."
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <div className="flex flex-col gap-5">
            <form.Field name="name">
              {(field) => (
                <Field label="Nome" error={fieldError(field.state.meta)}>
                  {(id, describedBy) => (
                    <Input
                      id={id}
                      name={field.name}
                      describedBy={describedBy}
                      placeholder="Nome do time"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={field.handleChange}
                      invalid={!field.state.meta.isValid}
                    />
                  )}
                </Field>
              )}
            </form.Field>

            <form.Field name="usernameTeam">
              {(field) => (
                <Field label="Usuário" error={fieldError(field.state.meta)}>
                  {(id, describedBy) => (
                    <Input
                      id={id}
                      name={field.name}
                      describedBy={describedBy}
                      placeholder="Username do time"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={field.handleChange}
                      invalid={!field.state.meta.isValid}
                    />
                  )}
                </Field>
              )}
            </form.Field>

            <form.Field name="room">
              {(field) => (
                <Field label="Sala" error={fieldError(field.state.meta)}>
                  {(id, describedBy) => (
                    <Input
                      id={id}
                      name={field.name}
                      describedBy={describedBy}
                      placeholder="Sala do time (opcional)"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={field.handleChange}
                      invalid={!field.state.meta.isValid}
                    />
                  )}
                </Field>
              )}
            </form.Field>

            <form.Field name="machine">
              {(field) => (
                <Field label="Máquina" error={fieldError(field.state.meta)}>
                  {(id, describedBy) => (
                    <Input
                      id={id}
                      name={field.name}
                      describedBy={describedBy}
                      placeholder="Número da máquina (opcional)"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={field.handleChange}
                      invalid={!field.state.meta.isValid}
                    />
                  )}
                </Field>
              )}
            </form.Field>

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
              tone="pink"
              onClick={() => {
                setConfirmError(undefined);
                setDeleteConfirmOpen(true);
              }}
            >
              <HugeiconsIcon
                icon={Delete01Icon}
                className="size-5"
                strokeWidth={3}
              />
              Apagar
            </Button>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" tone="mint" loading={isSubmitting}>
                  <HugeiconsIcon
                    icon={SaveIcon}
                    className="size-5"
                    strokeWidth={3}
                  />
                  Salvar
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </Sheet>

      <AdminPasswordConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setDeleteConfirmOpen(false);
            setConfirmError(undefined);
          }
        }}
        title="Confirmar exclusão"
        description={
          <>
            Digite a senha do administrador logado para excluir o time{' '}
            <strong>{team?.name}</strong>
            {team?.usernameTeam ? (
              <>
                {' '}
                (<strong>{team.usernameTeam}</strong>)
              </>
            ) : null}
            . Esta ação não pode ser desfeita.
          </>
        }
        confirmLabel="Confirmar"
        confirmTone="pink"
        isLoading={isConfirming}
        error={confirmError}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
