"use client";

import { useEffect, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Delete01Icon,
  EyeClosedIcon,
  SaveIcon,
} from '@hugeicons/core-free-icons';
import { AdminPasswordConfirmDialog } from '@/components/admin-password-confirm-dialog';
import { questionService } from '@/services/question/question.service';
import { getQuestionErrorMessage } from '@/services/question/question.error';
import type { Question } from '@/services/question/question.type';
import { COLOR, toBalloonColor, type BalloonColor } from '@/services/question/balloon-color';
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
import { BalloonColorSelect } from './balloon-color-select';
import {
  questionFormSchema,
  type QuestionFormValues,
} from './question-schema';

type EditQuestionSheetProps = {
  question: Question | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (question: Question) => void;
  onDeleted: (questionId: string) => void;
};

const DEFAULT_FORM_VALUES: QuestionFormValues = {
  label: '',
  title: '',
  balloonColor: COLOR.RED,
};

function toFormValues(question: Question): QuestionFormValues {
  return {
    label: question.label,
    title: question.title,
    balloonColor: toBalloonColor(question.balloonColor),
  };
}

export function EditQuestionSheet({
  question,
  open,
  onOpenChange,
  onUpdated,
  onDeleted,
}: EditQuestionSheetProps) {
  const [requestError, setRequestError] = useState<string>();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [confirmError, setConfirmError] = useState<string>();
  const [isConfirming, setIsConfirming] = useState(false);

  const form = useForm({
    defaultValues: DEFAULT_FORM_VALUES,
    validators: {
      onSubmit: questionFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (!question) return;

      setRequestError(undefined);
      try {
        const updatedQuestion = await questionService.update(question.id, {
          label: value.label.trim().toUpperCase(),
          title: value.title,
          balloonColor: value.balloonColor,
        });
        onUpdated(updatedQuestion);
        toast.add({
          title: 'Questão atualizada com sucesso.',
          type: 'success',
        });
        handleOpenChange(false);
      } catch (error) {
        const message = getQuestionErrorMessage(
          error,
          'Não foi possível atualizar a questão.',
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
    if (open && question) {
      form.reset(toFormValues(question));
      setRequestError(undefined);
      setDeleteConfirmOpen(false);
      setConfirmError(undefined);
    }
  }, [question, form, open]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      form.reset(DEFAULT_FORM_VALUES);
      setRequestError(undefined);
      setDeleteConfirmOpen(false);
      setConfirmError(undefined);
    }
    onOpenChange(nextOpen);
  }

  async function handleConfirmDelete(password: string) {
    if (!question) return;

    setIsConfirming(true);
    setConfirmError(undefined);

    try {
      await questionService.remove(question.id, { password });
      onDeleted(question.id);
      setDeleteConfirmOpen(false);
      handleOpenChange(false);
      toast.add({
        title: 'Questão excluída com sucesso.',
        type: 'success',
      });
    } catch (error) {
      const message = getQuestionErrorMessage(
        error,
        'Não foi possível excluir a questão.',
      );
      setConfirmError(message);
      toast.add({
        title: message,
        type: 'error',
      });
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="right" showCloseButton={false} className="overflow-hidden">
          <SheetHeader className="shrink-0">
            <SheetTitle className="text-2xl font-bold">Editar questão</SheetTitle>
            <SheetDescription>
              Atualize os dados da questão selecionada.
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
                    <BalloonColorSelect
                      id={field.name}
                      value={field.state.value}
                      invalid={!field.state.meta.isValid}
                      onBlur={field.handleBlur}
                      onChange={(color: BalloonColor) => field.handleChange(color)}
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
                variant="red"
                className="w-full"
                onClick={() => {
                  setConfirmError(undefined);
                  setDeleteConfirmOpen(true);
                }}
              >
                <HugeiconsIcon icon={Delete01Icon} className="size-5" strokeWidth={3} />
                Apagar
              </Button>
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

      <AdminPasswordConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setDeleteConfirmOpen(false);
            setConfirmError(undefined);
          }
        }}
        title="Confirmar exclusão"
        description={
          <>
            Digite a senha do administrador logado para excluir a questão{' '}
            <strong>{question?.label}</strong>
            {question?.title ? (
              <>
                {' '}
                (<strong>{question.title}</strong>)
              </>
            ) : null}
            . Esta ação não pode ser desfeita.
          </>
        }
        confirmLabel="Confirmar"
        confirmVariant="red"
        isLoading={isConfirming}
        error={confirmError}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
