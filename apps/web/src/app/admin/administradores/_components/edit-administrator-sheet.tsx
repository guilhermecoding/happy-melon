"use client";

import { useEffect, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { toast } from '@/components/ui/toast';
import { authClient } from '@/lib/auth-client';
import { administratorService } from '@/services/administrator/administrator.service';
import { getAdministratorErrorMessage } from '@/services/administrator/administrator.error';
import type { Administrator } from '@/services/administrator/administrator.type';
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
  administratorSchema,
  type AdministratorFormValues,
} from './administrator-schema';
import { HugeiconsIcon } from '@hugeicons/react';
import { SaveIcon, Delete01Icon, EyeClosedIcon } from '@hugeicons/core-free-icons';

type EditAdministratorSheetProps = {
  administrator: Administrator | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (administrator: Administrator) => void;
  onDeleted: (administratorId: string) => void;
};

export function EditAdministratorSheet({
  administrator,
  open,
  onOpenChange,
  onUpdated,
  onDeleted,
}: EditAdministratorSheetProps) {
  const { data: session } = authClient.useSession();
  const [requestError, setRequestError] = useState<string>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [deleteError, setDeleteError] = useState<string>();
  const [isDeleting, setIsDeleting] = useState(false);

  const isCurrentUser = Boolean(
    administrator && session?.user.id === administrator.id,
  );

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
    } satisfies AdministratorFormValues,
    validators: {
      onSubmit: administratorSchema,
    },
    onSubmit: async ({ value }) => {
      if (!administrator) return;

      setRequestError(undefined);
      try {
        const updatedAdministrator = await administratorService.update(
          administrator.id,
          value,
        );
        onUpdated(updatedAdministrator);
        onOpenChange(false);
        toast.add({
          title: 'Administrador atualizado com sucesso.',
          type: 'success',
        });
      } catch (error) {
        setRequestError(
          getAdministratorErrorMessage(
            error,
            'Não foi possível atualizar o administrador.',
          ),
        );
      }
    },
  });

  useEffect(() => {
    if (open && administrator) {
      form.reset({
        name: administrator.name,
        email: administrator.email,
      });
      setRequestError(undefined);
      setDeleteOpen(false);
      setPassword('');
      setDeleteError(undefined);
    }
  }, [administrator, form, open]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      form.reset();
      setRequestError(undefined);
      setDeleteOpen(false);
      setPassword('');
      setDeleteError(undefined);
    }
    onOpenChange(nextOpen);
  }

  function handleDeleteDialogChange(nextOpen: boolean) {
    setDeleteOpen(nextOpen);
    if (!nextOpen) {
      setPassword('');
      setDeleteError(undefined);
    }
  }

  async function handleConfirmDelete() {
    if (!administrator) return;

    if (!password.trim()) {
      setDeleteError('Informe a senha de administrador para confirmar.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(undefined);

    try {
      await administratorService.remove(administrator.id, { password });
      onDeleted(administrator.id);
      handleDeleteDialogChange(false);
      handleOpenChange(false);
      toast.add({
        title: 'Administrador excluído com sucesso.',
        type: 'success',
      });
    } catch (error) {
      const message = getAdministratorErrorMessage(
        error,
        'Não foi possível excluir o administrador.',
      );
      setDeleteError(message);
      toast.add({
        title: message,
        type: 'error',
      });
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
              Editar administrador
            </SheetTitle>
            <SheetDescription>
              Atualize o nome e o e-mail do administrador.
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
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    aria-invalid={!field.state.meta.isValid}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>

            <form.Field name="email">
              {(field) => (
                <Field data-invalid={!field.state.meta.isValid}>
                  <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
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

            <SheetFooter className="mt-auto px-0">
              <form.Subscribe selector={(state) => state.isSubmitting}>
                {(isSubmitting) => (
                  <Button type="submit" loading={isSubmitting} className="w-full">
                    <HugeiconsIcon icon={SaveIcon} className="size-5" strokeWidth={3} />
                    Salvar
                  </Button>
                )}
              </form.Subscribe>
              {!isCurrentUser && (
                <Button
                  type="button"
                  variant="red"
                  className="w-full"
                  onClick={() => setDeleteOpen(true)}
                >
                  <HugeiconsIcon icon={Delete01Icon} className="size-5" strokeWidth={3} />
                  Apagar
                </Button>
              )}
              <Button
                type="button"
                variant="white"
                onClick={() => handleOpenChange(false)}
                className="w-full"
              >
                <HugeiconsIcon icon={EyeClosedIcon} className="size-5" strokeWidth={3} />
                Fechar
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Dialog open={deleteOpen} onOpenChange={handleDeleteDialogChange}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Confirmar exclusão</DialogTitle>
            <DialogDescription className="text-base">
              Digite a senha do administrador logado para excluir{' '}
              <strong>{administrator?.name}</strong>. Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>

          <form
            className="flex flex-col gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              void handleConfirmDelete();
            }}
          >
            <Field data-invalid={Boolean(deleteError)}>
              <FieldLabel htmlFor="admin-delete-password">
                Senha de administrador
              </FieldLabel>
              <Input
                id="admin-delete-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={Boolean(deleteError)}
                disabled={isDeleting}
              />
              {deleteError && (
                <p role="alert" className="text-sm text-destructive">
                  {deleteError}
                </p>
              )}
            </Field>

            <DialogFooter className="flex-col justify-stretch sm:flex-row-reverse sm:justify-end">
              <Button
                type="submit"
                variant="red"
                size="sm"
                className="w-full"
                loading={isDeleting}
              >
                Confirmar
              </Button>
              <Button
                type="button"
                variant="white"
                size="sm"
                className="w-full"
                disabled={isDeleting}
                onClick={() => handleDeleteDialogChange(false)}
              >
                Cancelar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
