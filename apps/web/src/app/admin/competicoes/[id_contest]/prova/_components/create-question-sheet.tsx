"use client";

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircle01Icon, EyeClosedIcon } from '@hugeicons/core-free-icons';
import { questionService } from '@/services/question/question.service';
import { getQuestionErrorMessage } from '@/services/question/question.error';
import type { Question } from '@/services/question/question.type';
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
import { toast } from '@/components/ui/toast';
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

export function CreateQuestionSheet({
  contestId,
  open,
  onOpenChange,
  onCreated,
}: CreateQuestionSheetProps) {
  const [requestError, setRequestError] = useState<string>();

  const form = useForm({
    defaultValues: {
      label: '',
      title: '',
      balloonColor: '#ff0000',
    } satisfies QuestionFormValues,
    validators: {
      onSubmit: questionFormSchema,
    },
    onSubmit: async ({ value }) => {
      setRequestError(undefined);
      try {
        const question = await questionService.create(contestId, {
          label: value.label.trim().toUpperCase(),
          title: value.title,
          balloonColor: value.balloonColor.toUpperCase(),
        });
        onCreated(question);
        toast.add({
          title: 'Questão cadastrada com sucesso.',
          type: 'success',
        });
        handleOpenChange(false);
      } catch (error) {
        const message = getQuestionErrorMessage(
          error,
          'Não foi possível criar a questão.',
        );
        setRequestError(message);
        toast.add({
          title: message,
          type: 'error',
        });
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
      <SheetContent side="right" showCloseButton={false} className="overflow-hidden">
        <SheetHeader className="shrink-0">
          <SheetTitle className="text-2xl font-bold">Nova questão</SheetTitle>
          <SheetDescription>
            Cadastre uma nova questão da prova.
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
            <form.Field name="label">
              {(field) => (
                <Field data-invalid={!field.state.meta.isValid}>
                  <FieldLabel htmlFor={field.name}>Identificador</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    placeholder="Ex: A, B, 1, 2"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) =>
                      field.handleChange(event.target.value.toUpperCase())
                    }
                    aria-invalid={!field.state.meta.isValid}
                    className="uppercase"
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>

            <form.Field name="title">
              {(field) => (
                <Field data-invalid={!field.state.meta.isValid}>
                  <FieldLabel htmlFor={field.name}>Título</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    placeholder="Título da questão"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    aria-invalid={!field.state.meta.isValid}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>

            <form.Field name="balloonColor">
              {(field) => (
                <Field data-invalid={!field.state.meta.isValid}>
                  <FieldLabel htmlFor={field.name}>Cor do balão</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="color"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    aria-invalid={!field.state.meta.isValid}
                    className="h-12 w-full cursor-pointer p-1"
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
              <HugeiconsIcon icon={EyeClosedIcon} className="size-5" strokeWidth={3} />
              Fechar
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
