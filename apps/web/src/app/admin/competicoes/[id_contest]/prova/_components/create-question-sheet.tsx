"use client";

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircle01Icon, EyeClosedIcon } from '@hugeicons/core-free-icons';
import { questionService } from '@/services/question/question.service';
import { getQuestionErrorMessage } from '@/services/question/question.error';
import type { Question } from '@/services/question/question.type';
import { COLOR, type BalloonColor } from '@/services/question/balloon-color';
import { Button } from '@/components/pouf/Button';
import { Field, Input } from '@/components/pouf/Input';
import { Sheet } from '@/components/pouf/sheet';
import { toast } from '@/components/pouf/toaster';
import { fieldError } from '@/lib/form';
import { BalloonColorSelect } from './balloon-color-select';
import {
  questionFormSchema,
  type QuestionFormValues,
} from './question-schema';

type CreateQuestionSheetProps = {
  contestId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (question: Question) => void;
};

const DEFAULT_FORM_VALUES: QuestionFormValues = {
  label: '',
  title: '',
  balloonColor: COLOR.RED,
};

export function CreateQuestionSheet({
  contestId,
  open,
  onOpenChange,
  onCreated,
}: CreateQuestionSheetProps) {
  const [requestError, setRequestError] = useState<string>();

  const form = useForm({
    defaultValues: DEFAULT_FORM_VALUES,
    validators: {
      onSubmit: questionFormSchema,
    },
    onSubmit: async ({ value }) => {
      setRequestError(undefined);
      try {
        const question = await questionService.create(contestId, {
          label: value.label.trim().toUpperCase(),
          title: value.title,
          balloonColor: value.balloonColor,
        });
        onCreated(question);
        toast.success('Questão cadastrada com sucesso.');
        handleOpenChange(false);
      } catch (error) {
        const message = getQuestionErrorMessage(
          error,
          'Não foi possível criar a questão.',
        );
        setRequestError(message);
        toast.error(message);
      }
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      form.reset(DEFAULT_FORM_VALUES);
      setRequestError(undefined);
    }
    onOpenChange(nextOpen);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={handleOpenChange}
      title="Nova questão"
      description="Cadastre uma nova questão da prova."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <div className="flex flex-col gap-5">
          <form.Field name="label">
            {(field) => (
              <Field label="Identificador" error={fieldError(field.state.meta)}>
                {(id, describedBy) => (
                  <Input
                    id={id}
                    name={field.name}
                    describedBy={describedBy}
                    placeholder="Ex: A, B, 1, 2"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(value) => field.handleChange(value.toUpperCase())}
                    invalid={!field.state.meta.isValid}
                    autoCapitalize="characters"
                  />
                )}
              </Field>
            )}
          </form.Field>

          <form.Field name="title">
            {(field) => (
              <Field label="Título" error={fieldError(field.state.meta)}>
                {(id, describedBy) => (
                  <Input
                    id={id}
                    name={field.name}
                    describedBy={describedBy}
                    placeholder="Título da questão"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={field.handleChange}
                    invalid={!field.state.meta.isValid}
                  />
                )}
              </Field>
            )}
          </form.Field>

          <form.Field name="balloonColor">
            {(field) => (
              <Field label="Cor do balão" error={fieldError(field.state.meta)}>
                {(id, describedBy) => (
                  <BalloonColorSelect
                    id={id}
                    describedBy={describedBy}
                    value={field.state.value}
                    invalid={!field.state.meta.isValid}
                    onBlur={field.handleBlur}
                    onChange={(color: BalloonColor) => field.handleChange(color)}
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
