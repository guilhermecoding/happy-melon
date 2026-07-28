"use client";

import { useEffect, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Award01Icon, CheckmarkCircle02Icon, EyeClosedIcon } from '@hugeicons/core-free-icons';
import type { Team } from '@/services/team/team.type';
import { BalloonAchievement } from '@/components/balloon-achievement';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toBalloonColor } from '@/services/question/balloon-color';
import { questionService } from '@/services/question/question.service';
import { getQuestionErrorMessage } from '@/services/question/question.error';
import type { Question } from '@/services/question/question.type';

type TeamAchievementsDialogProps = {
  contestId: string;
  team: Team | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TeamAchievementsDialog({
  contestId,
  team,
  open,
  onOpenChange,
}: TeamAchievementsDialogProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;

    async function loadQuestions() {
      setLoading(true);
      setError(undefined);

      try {
        const data = await questionService.list(contestId);
        if (active) setQuestions(data);
      } catch (loadError) {
        if (active) {
          setQuestions([]);
          setError(
            getQuestionErrorMessage(
              loadError,
              'Não foi possível carregar os balões da prova.',
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
  }, [contestId, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className="max-h-[min(95vh,50rem)] w-full max-w-[95vw] gap-4 overflow-y-auto p-4 sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[80vw] xl:max-w-[70vw] sm:p-6"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold sm:text-2xl">
            Balões Conquistados
          </DialogTitle>
          <DialogDescription className="text-base">
            {team ? (
              <>
                Visualize as conquistas do time <strong>{team.name}</strong> (
                <strong>{team.usernameTeam}</strong>).
              </>
            ) : (
              'Visualize as conquistas do time selecionado.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-48 rounded-2xl border-4 bg-muted/40 px-6 py-10">
          {loading ? (
            <p className="text-center text-sm text-muted-foreground">
              Carregando balões da prova...
            </p>
          ) : error ? (
            <p role="alert" className="text-center text-sm text-destructive">
              {error}
            </p>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-muted">
                <HugeiconsIcon
                  icon={Award01Icon}
                  className="size-7 text-muted-foreground"
                  strokeWidth={1.5}
                />
              </span>
              <p className="text-sm font-medium text-foreground">
                Nenhum balão cadastrado na prova
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Cadastre questões na prova para exibir os balões conquistados.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 text-center sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
              {questions.map((question) => (
                <div
                  key={question.id}
                  className="min-w-0 rounded-2xl border border-border bg-background p-2"
                >
                  <BalloonAchievement
                    key={question.id}
                    questionId={question.label}
                    color={toBalloonColor(question.balloonColor)}
                    resolved={true}
                  />
                  <Button variant="green" size="sm" className="w-full shrink-0">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-5" strokeWidth={3} />
                    Confirmar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 flex-col-reverse justify-end gap-2 xl:flex-row">
          <Button
            type="button"
            variant="white"
            className="w-full sm:w-fit"
            onClick={() => onOpenChange(false)}
          >
            <HugeiconsIcon
              icon={EyeClosedIcon}
              className="size-5"
              strokeWidth={3}
            />
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
