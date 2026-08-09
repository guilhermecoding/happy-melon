"use client";

import { useEffect, useState } from 'react';
import {
  PlusSignCircleIcon,
  BubbleChatQuestionIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import BoxFeatures from '@/components/box-features';
import Spinner from '@/components/spinner';
import { Button } from '@/components/pouf/Button';
import { questionService } from '@/services/question/question.service';
import { getQuestionErrorMessage } from '@/services/question/question.error';
import type { Question } from '@/services/question/question.type';
import FlashCardQuestions from './flash-card-questions';
import { CreateQuestionSheet } from './create-question-sheet';
import { EditQuestionSheet } from './edit-question-sheet';

type BoxQuestionsProps = {
  contestId: string;
};

export default function BoxQuestions({ contestId }: BoxQuestionsProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadQuestions() {
      try {
        const data = await questionService.list(contestId);
        if (active) setQuestions(data);
      } catch (loadError) {
        if (active) {
          setError(
            getQuestionErrorMessage(
              loadError,
              'Não foi possível carregar as questões.',
            ),
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadQuestions();
    return () => {
      active = false;
    };
  }, [contestId]);

  function handleCreated(question: Question) {
    setQuestions((current) => [...current, question]);
    setError(undefined);
  }

  function handleUpdated(question: Question) {
    setQuestions((current) =>
      current.map((item) => (item.id === question.id ? question : item)),
    );
  }

  function handleDeleted(questionId: string) {
    setQuestions((current) => current.filter((item) => item.id !== questionId));
  }

  function openEditSheet(question: Question) {
    setEditingQuestion(question);
    setEditOpen(true);
  }

  return (
    <>
      <BoxFeatures
        title="Questões da prova"
        icon={BubbleChatQuestionIcon}
        blobSize="sm"
        blobTone="blue"
      >
        <div className="flex h-full flex-col gap-4 p-4">
          <div className="flex justify-end">
            <Button tone="blue" size="sm" onClick={() => setCreateOpen(true)}>
              <HugeiconsIcon
                icon={PlusSignCircleIcon}
                className="size-5 shrink-0"
                strokeWidth={3}
              />
              Adicionar questão
            </Button>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          {loading ? (
            <Spinner />
          ) : questions.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              Nenhuma questão cadastrada.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 @lg/main:grid-cols-2 @3xl/main:grid-cols-3 @5xl/main:grid-cols-4">
              {questions.map((question) => (
                <FlashCardQuestions
                  key={question.id}
                  label={question.label}
                  title={question.title}
                  balloonColor={question.balloonColor}
                  onClick={() => openEditSheet(question)}
                />
              ))}
            </div>
          )}
        </div>
      </BoxFeatures>

      <CreateQuestionSheet
        contestId={contestId}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />

      <EditQuestionSheet
        question={editingQuestion}
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditingQuestion(null);
        }}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />
    </>
  );
}
