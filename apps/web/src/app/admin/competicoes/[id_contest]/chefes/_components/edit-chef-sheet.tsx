"use client";

import { useEffect, useState, type FormEvent } from 'react';
import { useForm } from '@tanstack/react-form';
import { toast } from '@/components/pouf/toaster';
import { chefService } from '@/services/chef/chef.service';
import { getChefErrorMessage } from '@/services/chef/chef.error';
import type { Chef } from '@/services/chef/chef.type';
import { AdminPasswordConfirmDialog } from '@/components/admin-password-confirm-dialog';
import { Button } from '@/components/pouf/Button';
import { Dialog } from '@/components/pouf/controls';
import { Field, Input } from '@/components/pouf/Input';
import { Sheet } from '@/components/pouf/sheet';
import { fieldError } from '@/lib/form';
import { chefFormSchema, type ChefFormValues } from './chef-schema';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  SaveIcon,
  Delete01Icon,
  EyeClosedIcon,
  ResetPasswordIcon,
} from '@hugeicons/core-free-icons';

type EditChefSheetProps = {
  contestId: string;
  chef: Chef | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (chef: Chef) => void;
  onDeleted: (chefId: string) => void;
};

type ConfirmAction = 'delete' | 'resetPassword' | null;

export function EditChefSheet({
  contestId,
  chef,
  open,
  onOpenChange,
  onUpdated,
  onDeleted,
}: EditChefSheetProps) {
  const [requestError, setRequestError] = useState<string>();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [confirmError, setConfirmError] = useState<string>();
  const [isConfirming, setIsConfirming] = useState(false);
  const [newPasswordOpen, setNewPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordError, setNewPasswordError] = useState<string>();
  const [pendingNewPassword, setPendingNewPassword] = useState<string>();

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
    } satisfies ChefFormValues,
    validators: {
      onSubmit: chefFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (!chef) return;

      setRequestError(undefined);
      try {
        const updatedChef = await chefService.update(contestId, chef.id, value);
        onUpdated(updatedChef);
        toast.success('Chefe atualizado com sucesso.');
        handleOpenChange(false);
      } catch (error) {
        const message = getChefErrorMessage(
          error,
          'Não foi possível atualizar o chefe.',
        );
        setRequestError(message);
        toast.error(message);
      }
    },
  });

  useEffect(() => {
    if (open && chef) {
      form.reset(
        { name: chef.name, email: chef.email },
        { keepDefaultValues: true },
      );
      setRequestError(undefined);
      setConfirmAction(null);
      setConfirmError(undefined);
      setNewPasswordOpen(false);
      setNewPassword('');
      setNewPasswordError(undefined);
      setPendingNewPassword(undefined);
    }
  }, [chef, form, open]);

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
    if (!chef || !confirmAction) return;

    setIsConfirming(true);
    setConfirmError(undefined);

    try {
      if (confirmAction === 'delete') {
        await chefService.remove(contestId, chef.id, { password });
        onDeleted(chef.id);
        handleConfirmOpenChange(false);
        setIsConfirming(false);
        handleOpenChange(false);
        toast.success('Chefe excluído com sucesso.');
        return;
      }

      if (!pendingNewPassword) {
        setConfirmError('Informe a nova senha antes de confirmar.');
        setIsConfirming(false);
        return;
      }

      await chefService.resetPassword(contestId, chef.id, {
        password,
        newPassword: pendingNewPassword,
      });
      setPendingNewPassword(undefined);
      handleConfirmOpenChange(false);
      toast.success('Senha alterada com sucesso.');
    } catch (error) {
      const message = getChefErrorMessage(
        error,
        confirmAction === 'delete'
          ? 'Não foi possível excluir o chefe.'
          : 'Não foi possível alterar a senha do chefe.',
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
        title="Editar chefe"
        description="Atualize o nome e o e-mail do chefe."
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
                      placeholder="Nome do chefe"
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
                      placeholder="E-mail do chefe"
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
            Informe a nova senha para <strong>{chef?.name}</strong>.
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
            <strong>{chef?.name}</strong>. Esta ação não pode ser desfeita.
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
            da senha de <strong>{chef?.name}</strong>.
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
