"use client";

import { useEffect, useState, type FormEvent } from 'react';
import { useForm } from '@tanstack/react-form';
import { toast } from '@/components/pouf/toaster';
import { authClient } from '@/lib/auth-client';
import { administratorService } from '@/services/administrator/administrator.service';
import { getAdministratorErrorMessage } from '@/services/administrator/administrator.error';
import type { Administrator } from '@/services/administrator/administrator.type';
import { AdminPasswordConfirmDialog } from '@/components/admin-password-confirm-dialog';
import { Button } from '@/components/pouf/Button';
import { Dialog } from '@/components/pouf/controls';
import { Field, Input } from '@/components/pouf/Input';
import { Sheet } from '@/components/pouf/sheet';
import { fieldError } from '@/lib/form';
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
        toast.success('Administrador atualizado com sucesso.');
        handleOpenChange(false);
      } catch (error) {
        const message = getAdministratorErrorMessage(
          error,
          'Não foi possível atualizar o administrador.',
        );
        setRequestError(message);
        toast.error(message);
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
    if (!nextOpen && isConfirming) return;

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
        setIsConfirming(false);
        handleOpenChange(false);
        toast.success('Administrador excluído com sucesso.');
        return;
      }

      if (!pendingNewPassword) {
        setConfirmError('Informe a nova senha antes de confirmar.');
        setIsConfirming(false);
        return;
      }

      await administratorService.resetPassword(administrator.id, {
        password,
        newPassword: pendingNewPassword,
      });
      setPendingNewPassword(undefined);
      handleConfirmOpenChange(false);
      toast.success('Senha alterada com sucesso.');
    } catch (error) {
      const message = getAdministratorErrorMessage(
        error,
        confirmAction === 'delete'
          ? 'Não foi possível excluir o administrador.'
          : 'Não foi possível alterar a senha do administrador.',
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
        title="Editar administrador"
        description="Atualize o nome e o e-mail do administrador."
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
                      placeholder="Nome do administrador"
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
                      placeholder="E-mail do administrador"
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

            <div className="h-0.5 rounded-full bg-ink/10" />

            <div className="flex">
              <Button
                tone="orange"
                size="sm"
                block
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
            {!isCurrentUser && (
              <Button
                tone="pink"
                onClick={() => {
                  setConfirmError(undefined);
                  setConfirmAction('delete');
                }}
              >
                <HugeiconsIcon
                  icon={Delete01Icon}
                  className="size-5"
                  strokeWidth={3}
                />
                Apagar
              </Button>
            )}
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

      <Dialog
        open={newPasswordOpen}
        onOpenChange={handleNewPasswordOpenChange}
        title="Alterar senha"
        description={
          <>
            Informe a nova senha para <strong>{administrator?.name}</strong>.
            Mínimo de 8 caracteres.
          </>
        }
      >
        <form onSubmit={handleNewPasswordSubmit}>
          <Field label="Nova senha" error={newPasswordError}>
            {(id, describedBy) => (
              <Input
                id={id}
                describedBy={describedBy}
                type="password"
                autoComplete="new-password"
                placeholder="Nova senha"
                value={newPassword}
                onChange={setNewPassword}
                invalid={Boolean(newPasswordError)}
              />
            )}
          </Field>

          <div className="mt-4 flex flex-col-reverse justify-end gap-2 xl:flex-row">
            <Button
              variant="quiet"
              size="sm"
              onClick={() => handleNewPasswordOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" tone="orange" size="sm">
              Continuar
            </Button>
          </div>
        </form>
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
        confirmTone="pink"
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
        confirmTone="orange"
        isLoading={isConfirming}
        error={confirmError}
        onConfirm={handleConfirmPassword}
      />
    </>
  );
}
