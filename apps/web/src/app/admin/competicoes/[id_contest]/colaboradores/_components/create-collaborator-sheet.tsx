'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { HugeiconsIcon } from '@hugeicons/react';
import { collaboratorService } from '@/services/collaborator/collaborator.service';
import { getCollaboratorErrorMessage } from '@/services/collaborator/collaborator.error';
import type { Collaborator } from '@/services/collaborator/collaborator.type';
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
  collaboratorSchema,
  type CollaboratorFormValues,
} from './collaborator-schema';
import { CheckmarkCircle01Icon, EyeClosedIcon } from '@hugeicons/core-free-icons';

type CreateCollaboratorSheetProps = {
  contestId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (collaborator: Collaborator) => void;
};

export function CreateCollaboratorSheet({
  contestId,
  open,
  onOpenChange,
  onCreated,
}: CreateCollaboratorSheetProps) {
  const [requestError, setRequestError] = useState<string>();

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
    } satisfies CollaboratorFormValues,
    validators: {
      onSubmit: collaboratorSchema,
    },
    onSubmit: async ({ value }) => {
      setRequestError(undefined);
      try {
        const collaborator = await collaboratorService.create(contestId, value);
        onCreated(collaborator);
        form.reset();
        onOpenChange(false);
        toast.success('Colaborador cadastrado com sucesso.');
      } catch (error) {
        const message = getCollaboratorErrorMessage(
          error,
          'Não foi possível criar o colaborador.',
        );
        setRequestError(message);
        toast.error(message);
      }
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      form.reset();
      setRequestError(undefined);
    }
    onOpenChange(nextOpen);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" showCloseButton={false}>
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold">
            Adicionar colaborador
          </SheetTitle>
          <SheetDescription>
            Cadastre um colaborador para esta competição. Ele entrará com e-mail
            e o código da competição.
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
                  <HugeiconsIcon
                    icon={CheckmarkCircle01Icon}
                    className="size-5"
                    strokeWidth={3}
                  />
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
  );
}
