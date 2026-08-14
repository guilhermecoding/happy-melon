'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { HugeiconsIcon } from '@hugeicons/react';
import { collaboratorService } from '@/services/collaborator/collaborator.service';
import { getCollaboratorErrorMessage } from '@/services/collaborator/collaborator.error';
import type { Collaborator } from '@/services/collaborator/collaborator.type';
import { Button } from '@/components/pouf/Button';
import { Field, Input } from '@/components/pouf/Input';
import { Sheet } from '@/components/pouf/sheet';
import { toast } from '@/components/pouf/toaster';
import { fieldError } from '@/lib/form';
import {
  collaboratorSchema,
  type CollaboratorFormValues,
} from './collaborator-schema';
import { CheckmarkCircle01Icon, EyeClosedIcon } from '@hugeicons/core-free-icons';

type CreateCollaboratorSheetProps = {
  contestId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (collaborator: Collaborator) => void;
};

export function CreateCollaboratorSheet({
  contestId,
  open,
  onOpenChange,
  onCreated,
}: CreateCollaboratorSheetProps) {
  const [requestError, setRequestError] = useState<string>();

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
    } satisfies CollaboratorFormValues,
    validators: {
      onSubmit: collaboratorSchema,
    },
    onSubmit: async ({ value }) => {
      setRequestError(undefined);
      try {
        const collaborator = await collaboratorService.create(contestId, value);
        onCreated(collaborator);
        toast.success('Colaborador cadastrado com sucesso.');
        handleOpenChange(false);
      } catch (error) {
        const message = getCollaboratorErrorMessage(
          error,
          'Não foi possível criar o colaborador.',
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
    }
    onOpenChange(nextOpen);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={handleOpenChange}
      title="Adicionar colaborador"
      description="Cadastre um colaborador para esta competição. Ele entrará com e-mail e o código da competição."
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
                    placeholder="Nome do colaborador"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={field.handleChange}
                    invalid={!field.state.meta.isValid}
                  />
                )}
              </Field>
            )}
          </form.Field>

          <form.Field name="email">
            {(field) => (
              <Field label="Email" error={fieldError(field.state.meta)}>
                {(id, describedBy) => (
                  <Input
                    id={id}
                    name={field.name}
                    describedBy={describedBy}
                    type="email"
                    placeholder="exemplo@email.com"
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
  );
}
