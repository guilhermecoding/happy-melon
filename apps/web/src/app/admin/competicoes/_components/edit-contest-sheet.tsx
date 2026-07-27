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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { toast } from '@/components/ui/toast';
import {
  contestFormSchema,
  type ContestFormValues,
} from './contest-schema';
import { EyeClosedIcon, SaveIcon } from '@hugeicons/core-free-icons';

const STATUS_LABELS = {
  active: 'Habilitada',
  inactive: 'Desabilitada',
} as const;

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

function toFormValues(contest: Contest): ContestFormValues {
  return {
    name: contest.name,
    status: contest.status,
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
      status: 'active' as ContestFormValues['status'],
      startsAt: '',
      endsAt: '',
      venue: '',
    } satisfies ContestFormValues,
    validators: {
      onSubmit: contestFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (!contest) return;

      setRequestError(undefined);
      try {
        const updatedContest = await contestService.update(contest.id, {
          name: value.name,
          status: value.status,
          startsAt: new Date(value.startsAt).toISOString(),
          endsAt: new Date(value.endsAt).toISOString(),
          venue: value.venue,
        });
        onUpdated(updatedContest);
        toast.add({
          title: 'Competição atualizada com sucesso.',
          type: 'success',
        });
        handleOpenChange(false);
      } catch (error) {
        const message = getContestErrorMessage(
          error,
          'Não foi possível atualizar a competição.',
        );
        setRequestError(message);
        toast.add({
          title: message,
          type: 'error',
        });
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

            <form.Field name="status">
              {(field) => (
                <Field data-invalid={!field.state.meta.isValid}>
                  <FieldLabel htmlFor={field.name}>Status</FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => {
                      if (value === 'active' || value === 'inactive') {
                        field.handleChange(value);
                      }
                    }}
                  >
                    <SelectTrigger
                      id={field.name}
                      className="h-auto w-full rounded-xl border-3 border-input bg-gray-50 px-4 py-6 text-base shadow-none dark:bg-input/30"
                      aria-invalid={!field.state.meta.isValid}
                    >
                      <SelectValue>
                        {(value: string | null) =>
                          value === 'active' || value === 'inactive'
                            ? STATUS_LABELS[value]
                            : null
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false} align="start">
                      <SelectItem value="active">{STATUS_LABELS.active}</SelectItem>
                      <SelectItem value="inactive">
                        {STATUS_LABELS.inactive}
                      </SelectItem>
                    </SelectContent>
                  </Select>
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
