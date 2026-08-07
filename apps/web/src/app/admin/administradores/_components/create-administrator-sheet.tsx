"use client";

import { useRef, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { HugeiconsIcon } from '@hugeicons/react';
import { administratorService } from '@/services/administrator/administrator.service';
import { getAdministratorErrorMessage } from '@/services/administrator/administrator.error';
import type { Administrator } from '@/services/administrator/administrator.type';
import { Button } from '@/components/ui/button';
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
import { toast } from '@/components/pouf/toaster';
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
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" showCloseButton={false}>
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold">Adicionar administrador</SheetTitle>
          <SheetDescription>
            Cadastre um novo administrador do sistema.
          </SheetDescription>
        </SheetHeader>

        {temporaryPassword ? (
          <div className="flex flex-1 flex-col gap-3 px-4">
            <p className="text-sm text-muted-foreground">
              Administrador criado. Copie a senha temporária antes de fechar.
            </p>
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
            <SheetFooter className="mt-auto px-0">
              <Button
                type="button"
                variant="white"
                onClick={() => handleOpenChange(false)}
                className="w-full"
              >
                Fechar
              </Button>
            </SheetFooter>
          </div>
        ) : (
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
                    placeholder="Nome do administrador"
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
                    placeholder="exemplo@email.com"
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
                  <Button
                    type="submit"
                    variant="green"
                    loading={isSubmitting}
                    className="w-full"
                  >
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-5" strokeWidth={3} />
                    Adicionar
                  </Button>
                )}
              </form.Subscribe>
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
        )}
      </SheetContent>
    </Sheet>
  );
}
