"use client";

import { useRef, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { HugeiconsIcon } from '@hugeicons/react';
import { administratorService } from '@/services/administrator/administrator.service';
import { getAdministratorErrorMessage } from '@/services/administrator/administrator.error';
import type { Administrator } from '@/services/administrator/administrator.type';
import { Button, IconButton } from '@/components/pouf/Button';
import { Field, Input } from '@/components/pouf/Input';
import { Sheet } from '@/components/pouf/sheet';
import { RowCard } from '@/components/pouf/surface';
import { toast } from '@/components/pouf/toaster';
import { fieldError } from '@/lib/form';
import {
  administratorSchema,
  type AdministratorFormValues,
} from './administrator-schema';
import { CheckmarkCircle01Icon, CopyCheckIcon, CopyIcon, EyeClosedIcon } from '@hugeicons/core-free-icons';

type CreateAdministratorSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (administrator: Administrator) => void;
};

export function CreateAdministratorSheet({
  open,
  onOpenChange,
  onCreated,
}: CreateAdministratorSheetProps) {
  const [temporaryPassword, setTemporaryPassword] = useState<string>();
  const [requestError, setRequestError] = useState<string>();
  const [copied, setCopied] = useState(false);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
    } satisfies AdministratorFormValues,
    validators: {
      onSubmit: administratorSchema,
    },
    onSubmit: async ({ value }) => {
      setRequestError(undefined);
      try {
        const administrator = await administratorService.create(value);
        onCreated(administrator);
        setTemporaryPassword(administrator.temporaryPassword);
        toast.success('Administrador cadastrado com sucesso.');
      } catch (error) {
        const message = getAdministratorErrorMessage(
          error,
          'Não foi possível criar o administrador.',
        );
        setRequestError(message);
        toast.error(message);
      }
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      form.reset();
      setTemporaryPassword(undefined);
      setRequestError(undefined);
      setCopied(false);
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
        copiedTimeoutRef.current = null;
      }
    }
    onOpenChange(nextOpen);
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

  return (
    <Sheet
      open={open}
      onOpenChange={handleOpenChange}
      title="Adicionar administrador"
      description="Cadastre um novo administrador do sistema."
    >
      {temporaryPassword ? (
        <div>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Administrador criado. Copie a senha temporária antes de fechar.
            </p>
            <RowCard>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 font-mono text-base tracking-wide break-all">
                  {temporaryPassword}
                </code>
                <IconButton
                  size="sm"
                  label={copied ? 'Senha copiada' : 'Copiar senha temporária'}
                  onClick={() => void handleCopyPassword()}
                  icon={
                    <HugeiconsIcon
                      icon={copied ? CopyCheckIcon : CopyIcon}
                      className="size-5"
                      strokeWidth={2}
                    />
                  }
                />
              </div>
            </RowCard>
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
          </div>
        </div>
      ) : (
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
      )}
    </Sheet>
  );
}
