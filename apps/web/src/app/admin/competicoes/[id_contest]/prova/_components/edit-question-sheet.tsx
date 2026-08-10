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
        toast.success('Questão atualizada com sucesso.');
        handleOpenChange(false);
      } catch (error) {
        const message = getQuestionErrorMessage(
          error,
          'Não foi possível atualizar a questão.',
        );
        setRequestError(message);
        toast.error(message);
      }
    },
  });

  useEffect(() => {
    if (open && question) {
      /* keepDefaultValues: a bare reset() would ALSO promote these values to the
         form's defaults, and useForm re-runs update() on every render — which
         then sees the component's own defaults differ and wipes an untouched
         form back to empty on the next render. */
      form.reset(toFormValues(question), { keepDefaultValues: true });
      setRequestError(undefined);
      setDeleteConfirmOpen(false);
      setConfirmError(undefined);
    }
  }, [question, form, open]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isConfirming) return;

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
      setIsConfirming(false);
      handleOpenChange(false);
      toast.success('Questão excluída com sucesso.');
      return;
    } catch (error) {
      const message = getQuestionErrorMessage(
        error,
        'Não foi possível excluir a questão.',
      );
      setConfirmError(message);
      toast.error(message);
    }

    setIsConfirming(false);
  }

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={handleOpenChange}
        title="Editar questão"
        description="Atualize os dados da questão selecionada."
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
            <Button
              tone="pink"
              onClick={() => {
                setConfirmError(undefined);
                setDeleteConfirmOpen(true);
              }}
            >
              <HugeiconsIcon icon={Delete01Icon} className="size-5" strokeWidth={3} />
              Apagar
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
        confirmTone="pink"
        isLoading={isConfirming}
        error={confirmError}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
