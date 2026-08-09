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
import { Button } from '@/components/pouf/Button';
import { Field, Input } from '@/components/pouf/Input';
import { Sheet } from '@/components/pouf/sheet';
import { toast } from '@/components/pouf/toaster';
import { fieldError } from '@/lib/form';
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
        title="Adicionar time"
        description="Cadastre um novo time nesta competição."
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

            <div className="flex">
              <Button
                tone="orange"
                size="sm"
                block
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
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" tone="mint" loading={isSubmitting}>
                  <HugeiconsIcon
                    icon={CheckmarkCircle01Icon}
                    className="size-5"
                    strokeWidth={3}
                  />
                  Adicionar
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
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
