"use client";

import { useEffect, useState, type FormEvent } from 'react';
import { useForm } from '@tanstack/react-form';
import { toast } from '@/components/ui/toast';
import { authClient } from '@/lib/auth-client';
import { administratorService } from '@/services/administrator/administrator.service';
import { getAdministratorErrorMessage } from '@/services/administrator/administrator.error';
import type { Administrator } from '@/services/administrator/administrator.type';
import { AdminPasswordConfirmDialog } from '@/components/admin-password-confirm-dialog';
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
import { Separator } from '@/components/ui/separator';
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
import {
  SaveIcon,
  Delete01Icon,
  EyeClosedIcon,
  ResetPasswordIcon,
} from '@hugeicons/core-free-icons';

type EditAdministratorSheetProps = {
  administrator: Administrator | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (administrator: Administrator) => void;
  onDeleted: (administratorId: string) => void;
};

type ConfirmAction = 'delete' | 'resetPassword' | null;

export function EditAdministratorSheet({
  administrator,
  open,
  onOpenChange,
  onUpdated,
  onDeleted,
}: EditAdministratorSheetProps) {
  const { data: session } = authClient.useSession();
  const [requestError, setRequestError] = useState<string>();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [confirmError, setConfirmError] = useState<string>();
  const [isConfirming, setIsConfirming] = useState(false);
  const [newPasswordOpen, setNewPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordError, setNewPasswordError] = useState<string>();
  const [pendingNewPassword, setPendingNewPassword] = useState<string>();

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
      setConfirmAction(null);
      setConfirmError(undefined);
      setNewPasswordOpen(false);
      setNewPassword('');
      setNewPasswordError(undefined);
      setPendingNewPassword(undefined);
    }
  }, [administrator, form, open]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      form.reset();
      setRequestError(undefined);
      setConfirmAction(null);
      setConfirmError(undefined);
      setNewPasswordOpen(false);
      setNewPassword('');
      setNewPasswordError(undefined);
      setPendingNewPassword(undefined);
    }
    onOpenChange(nextOpen);
  }

  function handleConfirmOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setConfirmAction(null);
      setConfirmError(undefined);
      if (confirmAction === 'resetPassword') {
        setPendingNewPassword(undefined);
      }
    }
  }

  function handleNewPasswordOpenChange(nextOpen: boolean) {
    setNewPasswordOpen(nextOpen);
    if (!nextOpen) {
      setNewPassword('');
      setNewPasswordError(undefined);
    }
  }

  function handleNewPasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (newPassword.trim().length < 8) {
      setNewPasswordError('A nova senha deve ter no mínimo 8 caracteres.');
      return;
    }

    setNewPasswordError(undefined);
    setPendingNewPassword(newPassword.trim());
    handleNewPasswordOpenChange(false);
    setConfirmError(undefined);
    setConfirmAction('resetPassword');
  }

  async function handleConfirmPassword(password: string) {
    if (!administrator || !confirmAction) return;

    setIsConfirming(true);
    setConfirmError(undefined);

    try {
      if (confirmAction === 'delete') {
        await administratorService.remove(administrator.id, { password });
        onDeleted(administrator.id);
        handleConfirmOpenChange(false);
        handleOpenChange(false);
        toast.add({
          title: 'Administrador excluído com sucesso.',
          type: 'success',
        });
        return;
      }

      if (!pendingNewPassword) {
        setConfirmError('Informe a nova senha antes de confirmar.');
        return;
      }

      await administratorService.resetPassword(administrator.id, {
        password,
        newPassword: pendingNewPassword,
      });
      setPendingNewPassword(undefined);
      handleConfirmOpenChange(false);
      toast.add({
        title: 'Senha alterada com sucesso.',
        type: 'success',
      });
    } catch (error) {
      const message = getAdministratorErrorMessage(
        error,
        confirmAction === 'delete'
          ? 'Não foi possível excluir o administrador.'
          : 'Não foi possível alterar a senha do administrador.',
      );
      setConfirmError(message);
      toast.add({
        title: message,
        type: 'error',
      });
    } finally {
      setIsConfirming(false);
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
                    placeholder="Nome do administrador"
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
                    placeholder="E-mail do administrador"
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

            <Separator className="my-1 bg-black/15" />

            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="orange"
                size="sm"
                className="w-full"
                onClick={() => {
                  setNewPasswordError(undefined);
                  setNewPassword('');
                  setNewPasswordOpen(true);
                }}
              >
                <HugeiconsIcon
                  icon={ResetPasswordIcon}
                  className="size-5"
                  strokeWidth={2.5}
                />
                Alterar senha
              </Button>
            </div>

            <SheetFooter className="mt-auto px-0 gap-3">
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
                  onClick={() => {
                    setConfirmError(undefined);
                    setConfirmAction('delete');
                  }}
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

      <Dialog open={newPasswordOpen} onOpenChange={handleNewPasswordOpenChange}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Alterar senha
            </DialogTitle>
            <DialogDescription className="text-base">
              Informe a nova senha para{' '}
              <strong>{administrator?.name}</strong>. Mínimo de 8 caracteres.
            </DialogDescription>
          </DialogHeader>

          <form
            className="flex flex-col gap-6"
            onSubmit={handleNewPasswordSubmit}
          >
            <Field data-invalid={Boolean(newPasswordError)}>
              <Input
                id="admin-new-password"
                type="password"
                autoComplete="new-password"
                placeholder="Nova senha"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                aria-invalid={Boolean(newPasswordError)}
              />
              {newPasswordError && (
                <p role="alert" className="text-sm text-destructive">
                  {newPasswordError}
                </p>
              )}
            </Field>

            <DialogFooter className="flex-col justify-stretch sm:flex-row-reverse sm:justify-end">
              <Button
                type="submit"
                variant="orange"
                size="sm"
                className="w-full"
              >
                Continuar
              </Button>
              <Button
                type="button"
                variant="white"
                size="sm"
                className="w-full"
                onClick={() => handleNewPasswordOpenChange(false)}
              >
                Cancelar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AdminPasswordConfirmDialog
        open={confirmAction === 'delete'}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) handleConfirmOpenChange(false);
        }}
        title="Confirmar exclusão"
        description={
          <>
            Digite a senha do administrador logado para excluir{' '}
            <strong>{administrator?.name}</strong>. Esta ação não pode ser
            desfeita.
          </>
        }
        confirmLabel="Confirmar"
        confirmVariant="red"
        isLoading={isConfirming}
        error={confirmError}
        onConfirm={handleConfirmPassword}
      />

      <AdminPasswordConfirmDialog
        open={confirmAction === 'resetPassword'}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) handleConfirmOpenChange(false);
        }}
        title="Confirmar alteração de senha"
        description={
          <>
            Digite a senha do administrador logado para confirmar a alteração
            da senha de <strong>{administrator?.name}</strong>.
          </>
        }
        confirmLabel="Confirmar"
        confirmVariant="orange"
        isLoading={isConfirming}
        error={confirmError}
        onConfirm={handleConfirmPassword}
      />
    </>
  );
}
