"use client";

import { useEffect, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { api } from '@/lib/api';
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
import {
  administratorSchema,
  type Administrator,
  type AdministratorFormValues,
} from './administrator-schema';

type EditAdministratorSheetProps = {
  administrator: Administrator | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (administrator: Administrator) => void;
};

export function EditAdministratorSheet({
  administrator,
  open,
  onOpenChange,
  onUpdated,
}: EditAdministratorSheetProps) {
  const [requestError, setRequestError] = useState<string>();

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
        const updatedAdministrator = await api<Administrator>(
          `/administrators/${administrator.id}`,
          {
            method: 'PATCH',
            body: JSON.stringify(value),
          },
        );
        onUpdated(updatedAdministrator);
        onOpenChange(false);
      } catch (error) {
        setRequestError(
          error instanceof Error ? error.message : 'Não foi possível editar o administrador',
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
    }
  }, [administrator, form, open]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      form.reset();
      setRequestError(undefined);
    }
    onOpenChange(nextOpen);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Editar administrador</SheetTitle>
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
                <Button type="submit" loading={isSubmitting}>
                  Salvar
                </Button>
              )}
            </form.Subscribe>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
