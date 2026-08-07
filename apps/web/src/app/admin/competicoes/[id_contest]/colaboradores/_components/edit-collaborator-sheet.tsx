'use client';

import { useEffect, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { toast } from '@/components/pouf/toaster';
import { collaboratorService } from '@/services/collaborator/collaborator.service';
import { getCollaboratorErrorMessage } from '@/services/collaborator/collaborator.error';
import type { Collaborator } from '@/services/collaborator/collaborator.type';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
        onOpenChange(false);
        toast.success('Colaborador atualizado com sucesso.');
      } catch (error) {
        setRequestError(
          getCollaboratorErrorMessage(
            error,
            'Não foi possível atualizar o colaborador.',
          ),
        );
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
      onOpenChange(false);
      toast.success('Colaborador removido com sucesso.');
    } catch (error) {
      toast.error(getCollaboratorErrorMessage(
          error,
          'Não foi possível excluir o colaborador.',
        ));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="right" showCloseButton={false}>
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold">
              Editar colaborador
            </SheetTitle>
            <SheetDescription>
              Atualize os dados do colaborador nesta competição.
            </SheetDescription>
          </SheetHeader>

          <form
            className="flex flex-1 flex-col gap-5 px-4"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <form.Field name="name">
              {(field) => (
                <Field data-invalid={!field.state.meta.isValid}>
                  <FieldLabel htmlFor={field.name}>Nome</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    placeholder="Nome do colaborador"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    aria-invalid={!field.state.meta.isValid}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>

            <Field>
              <FieldLabel htmlFor="collaborator-email">Email</FieldLabel>
              <Input
                id="collaborator-email"
                value={collaborator?.email ?? ''}
                disabled
                readOnly
              />
            </Field>

            {requestError && (
              <p role="alert" className="text-sm text-destructive">
                {requestError}
              </p>
            )}

            <SheetFooter className="mt-auto px-0">
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
                variant="red"
                onClick={() => setDeleteOpen(true)}
                className="w-full"
              >
                <HugeiconsIcon
                  icon={Delete01Icon}
                  className="size-5"
                  strokeWidth={3}
                />
                Excluir
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
          </form>
        </SheetContent>
      </Sheet>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir colaborador</DialogTitle>
            <DialogDescription>
              Remover {collaborator?.name} desta competição? Se não houver
              vínculo em outras competições, a conta será excluída.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="white"
              onClick={() => setDeleteOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="red"
              loading={isDeleting}
              onClick={() => void handleDelete()}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
