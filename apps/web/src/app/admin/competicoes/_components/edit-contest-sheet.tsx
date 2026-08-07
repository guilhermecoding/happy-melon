"use client";

import { useEffect, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { HugeiconsIcon } from '@hugeicons/react';
import { contestService } from '@/services/contest/contest.service';
import { getContestErrorMessage } from '@/services/contest/contest.error';
import type { Contest } from '@/services/contest/contest.type';
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
  editContestFormSchema,
  type EditContestFormValues,
} from './contest-schema';
import { EyeClosedIcon, SaveIcon } from '@hugeicons/core-free-icons';

type EditContestSheetProps = {
  contest: Contest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (contest: Contest) => void;
};

function toDateTimeLocalValue(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (value: number) => String(value).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toFormValues(contest: Contest): EditContestFormValues {
  return {
    name: contest.name,
    startsAt: toDateTimeLocalValue(contest.startsAt),
    endsAt: toDateTimeLocalValue(contest.endsAt),
    venue: contest.venue,
  };
}

export function EditContestSheet({
  contest,
  open,
  onOpenChange,
  onUpdated,
}: EditContestSheetProps) {
  const [requestError, setRequestError] = useState<string>();

  const form = useForm({
    defaultValues: {
      name: '',
      startsAt: '',
      endsAt: '',
      venue: '',
    } satisfies EditContestFormValues,
    validators: {
      onSubmit: editContestFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (!contest) return;

      setRequestError(undefined);
      try {
        const updatedContest = await contestService.update(contest.id, {
          name: value.name,
          status: contest.status,
          startsAt: new Date(value.startsAt).toISOString(),
          endsAt: new Date(value.endsAt).toISOString(),
          venue: value.venue,
        });
        onUpdated(updatedContest);
        toast.success('Competição atualizada com sucesso.');
        handleOpenChange(false);
      } catch (error) {
        const message = getContestErrorMessage(
          error,
          'Não foi possível atualizar a competição.',
        );
        setRequestError(message);
        toast.error(message);
      }
    },
  });

  useEffect(() => {
    if (open && contest) {
      form.reset(toFormValues(contest));
      setRequestError(undefined);
    }
  }, [contest, form, open]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      form.reset();
      setRequestError(undefined);
    }
    onOpenChange(nextOpen);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" showCloseButton={false} className="overflow-hidden">
        <SheetHeader className="shrink-0">
          <SheetTitle className="text-2xl font-bold">Editar competição</SheetTitle>
          <SheetDescription>
            Atualize os dados da competição selecionada.
          </SheetDescription>
        </SheetHeader>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto scrollbar-thin px-4 pb-2">
            <form.Field name="name">
              {(field) => (
                <Field data-invalid={!field.state.meta.isValid}>
                  <FieldLabel htmlFor={field.name}>Nome</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    placeholder="Nome da competição"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    aria-invalid={!field.state.meta.isValid}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>

            <form.Field name="startsAt">
              {(field) => (
                <Field data-invalid={!field.state.meta.isValid}>
                  <FieldLabel htmlFor={field.name}>Data e hora de início</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="datetime-local"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    aria-invalid={!field.state.meta.isValid}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>

            <form.Field name="endsAt">
              {(field) => (
                <Field data-invalid={!field.state.meta.isValid}>
                  <FieldLabel htmlFor={field.name}>Data e hora de término</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="datetime-local"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    aria-invalid={!field.state.meta.isValid}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>

            <form.Field name="venue">
              {(field) => (
                <Field data-invalid={!field.state.meta.isValid}>
                  <FieldLabel htmlFor={field.name}>Local da sede</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    placeholder="Cidade, estado ou local"
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
          </div>

          <SheetFooter className="shrink-0">
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  type="submit"
                  variant="green"
                  loading={isSubmitting}
                  className="w-full"
                >
                  <HugeiconsIcon icon={SaveIcon} className="size-5" strokeWidth={3} />
                  Salvar
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
      </SheetContent>
    </Sheet>
  );
}
