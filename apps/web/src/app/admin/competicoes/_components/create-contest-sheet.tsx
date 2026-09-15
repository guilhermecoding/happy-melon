"use client";

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { HugeiconsIcon } from '@hugeicons/react';
import { contestService } from '@/services/contest/contest.service';
import { getContestErrorMessage } from '@/services/contest/contest.error';
import type { Contest } from '@/services/contest/contest.type';
import { Button } from '@/components/pouf/Button';
import { Select } from '@/components/pouf/controls';
import { Field, Input } from '@/components/pouf/Input';
import { Sheet } from '@/components/pouf/sheet';
import { toast } from '@/components/pouf/toaster';
import { fieldError } from '@/lib/form';
import {
  contestFormSchema,
  type ContestFormValues,
} from './contest-schema';
import {
  Add01Icon,
  CheckmarkCircle01Icon,
  Delete02Icon,
  EyeClosedIcon,
} from '@hugeicons/core-free-icons';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Habilitada' },
  { value: 'inactive', label: 'Desabilitada' },
];

const DEFAULT_ROUNDS: ContestFormValues['rounds'] = [
  { name: 'Aquecimento', startsAt: '', endsAt: '' },
  { name: 'Prova', startsAt: '', endsAt: '' },
];

type CreateContestSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (contest: Contest) => void;
};

export function CreateContestSheet({
  open,
  onOpenChange,
  onCreated,
}: CreateContestSheetProps) {
  const [requestError, setRequestError] = useState<string>();

  const form = useForm({
    defaultValues: {
      name: '',
      status: 'active' as ContestFormValues['status'],
      venue: '',
      rounds: DEFAULT_ROUNDS,
    } satisfies ContestFormValues,
    validators: {
      onSubmit: contestFormSchema,
    },
    onSubmit: async ({ value }) => {
      setRequestError(undefined);
      try {
        const contest = await contestService.create({
          name: value.name,
          status: value.status,
          venue: value.venue,
          rounds: value.rounds.map((round) => ({
            name: round.name,
            startsAt: new Date(round.startsAt).toISOString(),
            endsAt: new Date(round.endsAt).toISOString(),
          })),
        });
        onCreated(contest);
        toast.success('Competição cadastrada com sucesso.');
        handleOpenChange(false);
      } catch (error) {
        const message = getContestErrorMessage(
          error,
          'Não foi possível criar a competição.',
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
    <Sheet
      open={open}
      onOpenChange={handleOpenChange}
      title="Nova competição"
      description="Cadastre o evento e as rodadas (aquecimento e prova)."
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

          <form.Field name="status">
            {(field) => (
              <Field label="Status" error={fieldError(field.state.meta)}>
                {(id, describedBy) => (
                  <Select
                    id={id}
                    describedBy={describedBy}
                    value={field.state.value}
                    options={STATUS_OPTIONS}
                    onChange={(value) => {
                      if (value === 'active' || value === 'inactive') {
                        field.handleChange(value);
                      }
                    }}
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

          <form.Field name="rounds" mode="array">
            {(roundsField) => (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Rodadas</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="quiet"
                    onClick={() =>
                      roundsField.pushValue({
                        name: `Rodada ${roundsField.state.value.length + 1}`,
                        startsAt: '',
                        endsAt: '',
                      })
                    }
                  >
                    <HugeiconsIcon icon={Add01Icon} className="size-4" />
                    Adicionar
                  </Button>
                </div>
                {roundsField.state.value.map((_, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-3 rounded-xl border p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Rodada {index + 1}
                      </span>
                      {roundsField.state.value.length > 1 ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="quiet"
                          onClick={() => roundsField.removeValue(index)}
                        >
                          <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                          Remover
                        </Button>
                      ) : null}
                    </div>
                    <form.Field name={`rounds[${index}].name`}>
                      {(field) => (
                        <Field label="Nome" error={fieldError(field.state.meta)}>
                          {(id, describedBy) => (
                            <Input
                              id={id}
                              name={field.name}
                              describedBy={describedBy}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={field.handleChange}
                              invalid={!field.state.meta.isValid}
                            />
                          )}
                        </Field>
                      )}
                    </form.Field>
                    <form.Field name={`rounds[${index}].startsAt`}>
                      {(field) => (
                        <Field
                          label="Início"
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
                    <form.Field name={`rounds[${index}].endsAt`}>
                      {(field) => (
                        <Field
                          label="Término"
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
                  </div>
                ))}
              </div>
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
    </Sheet>
  );
}
