"use client";

import { useEffect, useRef, useState } from 'react';
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
  CopyIcon,
  CopyCheckIcon,
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
  const [temporaryPassword, setTemporaryPassword] = useState<string>();
  const [copied, setCopied] = useState(false);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

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
      setTemporaryPassword(undefined);
      setCopied(false);
    }
  }, [administrator, form, open]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      form.reset();
      setRequestError(undefined);
      setConfirmAction(null);
      setConfirmError(undefined);
      setTemporaryPassword(undefined);
      setCopied(false);
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
        copiedTimeoutRef.current = null;
      }
    }
    onOpenChange(nextOpen);
  }

  function handleConfirmOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setConfirmAction(null);
      setConfirmError(undefined);
    }
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

      const result = await administratorService.resetPassword(administrator.id, {
        password,
      });
      handleConfirmOpenChange(false);
      setTemporaryPassword(result.temporaryPassword);
      toast.add({
        title: 'Senha redefinida com sucesso.',
        type: 'success',
      });
    } catch (error) {
      const message = getAdministratorErrorMessage(
        error,
        confirmAction === 'delete'
          ? 'Não foi possível excluir o administrador.'
          : 'Não foi possível redefinir a senha do administrador.',
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

  async function handleCopyPassword() {
    if (!temporaryPassword) return;
    await navigator.clipboard.writeText(temporaryPassword);
    setCopied(true);
    if (copiedTimeoutRef.current) {
      clearTimeout(copiedTimeoutRef.current);
    }
    copiedTimeoutRef.current = setTimeout(() => {
      setCopied(false);
      copiedTimeoutRef.current = null;
    }, 3000);
  }

  const confirmOpen = confirmAction !== null;

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

              <Separator className="my-1 bg-black/15" />

              <button
                type="button"
                className="w-full py-1 text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                onClick={() => {
                  setConfirmError(undefined);
                  setConfirmAction('resetPassword');
                }}
              >
                Redefinir senha
              </button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <AdminPasswordConfirmDialog
        open={confirmOpen && confirmAction === 'delete'}
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
        open={confirmOpen && confirmAction === 'resetPassword'}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) handleConfirmOpenChange(false);
        }}
        title="Redefinir senha"
        description={
          <>
            Digite a senha do administrador logado para gerar uma nova senha
            para <strong>{administrator?.name}</strong>.
          </>
        }
        confirmLabel="Redefinir"
        confirmVariant="orange"
        isLoading={isConfirming}
        error={confirmError}
        onConfirm={handleConfirmPassword}
      />

      <Dialog
        open={Boolean(temporaryPassword)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setTemporaryPassword(undefined);
            setCopied(false);
          }
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Nova senha gerada
            </DialogTitle>
            <DialogDescription className="text-base">
              Copie a senha temporária antes de fechar. Ela não será exibida
              novamente.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 rounded-md border p-3">
            <code className="min-w-0 flex-1 break-all font-mono text-base tracking-wide">
              {temporaryPassword}
            </code>
            <Button
              type="button"
              variant="normal"
              className="size-10"
              size="icon"
              aria-label={copied ? 'Senha copiada' : 'Copiar senha temporária'}
              onClick={() => void handleCopyPassword()}
            >
              <HugeiconsIcon
                icon={copied ? CopyCheckIcon : CopyIcon}
                className="size-5"
                strokeWidth={2}
              />
            </Button>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="white"
              size="sm"
              className="w-full"
              onClick={() => {
                setTemporaryPassword(undefined);
                setCopied(false);
              }}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
