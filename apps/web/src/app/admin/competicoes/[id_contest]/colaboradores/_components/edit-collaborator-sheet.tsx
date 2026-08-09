'use client';

import { useEffect, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { toast } from '@/components/pouf/toaster';
import { collaboratorService } from '@/services/collaborator/collaborator.service';
import { getCollaboratorErrorMessage } from '@/services/collaborator/collaborator.error';
import type { Collaborator } from '@/services/collaborator/collaborator.type';
import { Button } from '@/components/pouf/Button';
import { Confirm } from '@/components/pouf/controls';
import { Field, Input } from '@/components/pouf/Input';
import { Sheet } from '@/components/pouf/sheet';
import { fieldError } from '@/lib/form';
import {
  collaboratorNameSchema,
  type CollaboratorNameFormValues,
} from './collaborator-schema';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  SaveIcon,
  Delete01Icon,
  EyeClosedIcon,
} from '@hugeicons/core-free-icons';

type EditCollaboratorSheetProps = {
  contestId: string;
  collaborator: Collaborator | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (collaborator: Collaborator) => void;
  onDeleted: (collaboratorId: string) => void;
};

export function EditCollaboratorSheet({
  contestId,
  collaborator,
  open,
  onOpenChange,
  onUpdated,
  onDeleted,
}: EditCollaboratorSheetProps) {
  const [requestError, setRequestError] = useState<string>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm({
    defaultValues: {
      name: '',
    } satisfies CollaboratorNameFormValues,
    validators: {
      onSubmit: collaboratorNameSchema,
    },
    onSubmit: async ({ value }) => {
      if (!collaborator) return;

      setRequestError(undefined);
      try {
        const updated = await collaboratorService.update(
          contestId,
          collaborator.id,
          value,
        );
        onUpdated(updated);
        toast.success('Colaborador atualizado com sucesso.');
        handleOpenChange(false);
      } catch (error) {
        const message = getCollaboratorErrorMessage(
          error,
          'Não foi possível atualizar o colaborador.',
        );
        setRequestError(message);
        toast.error(message);
      }
    },
  });

  useEffect(() => {
    if (open && collaborator) {
      form.reset({
        name: collaborator.name,
      });
      setRequestError(undefined);
      setDeleteOpen(false);
    }
  }, [collaborator, form, open]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isDeleting) return;

    if (!nextOpen) {
      form.reset();
      setRequestError(undefined);
      setDeleteOpen(false);
    }
    onOpenChange(nextOpen);
  }

  async function handleDelete() {
    if (!collaborator) return;

    setIsDeleting(true);
    try {
      await collaboratorService.remove(contestId, collaborator.id);
      onDeleted(collaborator.id);
      setDeleteOpen(false);
      setIsDeleting(false);
      handleOpenChange(false);
      toast.success('Colaborador removido com sucesso.');
      return;
    } catch (error) {
      toast.error(getCollaboratorErrorMessage(
          error,
          'Não foi possível excluir o colaborador.',
        ));
    }

    setIsDeleting(false);
  }

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={handleOpenChange}
        title="Editar colaborador"
        description="Atualize os dados do colaborador nesta competição."
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

            <Field label="Email">
              {(id) => (
                <Input
                  id={id}
                  value={collaborator?.email ?? ''}
                  onChange={() => undefined}
                  disabled
                  readOnly
                />
              )}
            </Field>

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
            <Button tone="pink" onClick={() => setDeleteOpen(true)}>
              <HugeiconsIcon
                icon={Delete01Icon}
                className="size-5"
                strokeWidth={3}
              />
              Excluir
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

      <Confirm
        open={deleteOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && isDeleting) return;
          setDeleteOpen(nextOpen);
        }}
        title="Excluir colaborador"
        body={`Remover ${collaborator?.name ?? 'o colaborador'} desta competição? Se não houver vínculo em outras competições, a conta será excluída.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        tone="pink"
        loading={isDeleting}
        onConfirm={() => void handleDelete()}
      />
    </>
  );
}
