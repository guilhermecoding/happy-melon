"use client";

import { useEffect, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { HugeiconsIcon } from '@hugeicons/react';
import { contestService } from '@/services/contest/contest.service';
import { getContestErrorMessage } from '@/services/contest/contest.error';
import type { Contest } from '@/services/contest/contest.type';
import { Button } from '@/components/pouf/Button';
import { Field, Input } from '@/components/pouf/Input';
import { Sheet } from '@/components/pouf/sheet';
import { toast } from '@/components/pouf/toaster';
import { fieldError } from '@/lib/form';
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
      /* keepDefaultValues: a bare reset() would ALSO promote these values to the
         form's defaults, and useForm re-runs update() on every render — which
         then sees the component's own defaults differ and wipes an untouched
         form back to empty on the next render. */
      form.reset(toFormValues(contest), { keepDefaultValues: true });
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
    <Sheet
      open={open}
      onOpenChange={handleOpenChange}
      title="Editar competição"
      description="Atualize os dados da competição selecionada."
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
                    placeholder="Nome da competição"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={field.handleChange}
                    invalid={!field.state.meta.isValid}
                  />
                )}
              </Field>
            )}
          </form.Field>

          <form.Field name="startsAt">
            {(field) => (
              <Field
                label="Data e hora de início"
                error={fieldError(field.state.meta)}
              >
                {(id, describedBy) => (
                  <Input
                    id={id}
                    name={field.name}
                    describedBy={describedBy}
                    type="datetime-local"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={field.handleChange}
                    invalid={!field.state.meta.isValid}
                  />
                )}
              </Field>
            )}
          </form.Field>

          <form.Field name="endsAt">
            {(field) => (
              <Field
                label="Data e hora de término"
                error={fieldError(field.state.meta)}
              >
                {(id, describedBy) => (
                  <Input
                    id={id}
                    name={field.name}
                    describedBy={describedBy}
                    type="datetime-local"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={field.handleChange}
                    invalid={!field.state.meta.isValid}
                  />
                )}
              </Field>
            )}
          </form.Field>

          <form.Field name="venue">
            {(field) => (
              <Field label="Local da sede" error={fieldError(field.state.meta)}>
                {(id, describedBy) => (
                  <Input
                    id={id}
                    name={field.name}
                    describedBy={describedBy}
                    placeholder="Cidade, estado ou local"
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
            <HugeiconsIcon icon={EyeClosedIcon} className="size-5" strokeWidth={3} />
            Fechar
          </Button>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" tone="mint" loading={isSubmitting}>
                <HugeiconsIcon icon={SaveIcon} className="size-5" strokeWidth={3} />
                Salvar
              </Button>
            )}
          </form.Subscribe>
        </div>
      </form>
    </Sheet>
  );
}
