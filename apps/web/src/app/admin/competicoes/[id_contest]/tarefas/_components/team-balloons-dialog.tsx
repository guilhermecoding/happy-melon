"use client";

import { useEffect, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Award01Icon,
  CheckmarkCircle02Icon,
  EyeClosedIcon,
  RemoveCircleIcon,
} from '@hugeicons/core-free-icons';
import {
  isConfirmableStatus,
  isResolvedBalloonStatus,
  toBalloonEffectiveStatus,
  type BalloonDeliveryStatus,
  type BalloonEffectiveStatus,
} from '@repo/shared';
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
import { balloonService } from '@/services/balloon/balloon.service';
import { getBalloonErrorMessage } from '@/services/balloon/balloon.error';
import type { BalloonDelivery } from '@/services/balloon/balloon.type';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import PrintIcon from '@/components/print-icon';

type TeamBalloonsDialogProps = {
  contestId: string;
  team: Team | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeliveryChanged?: () => void;
};

function PrintRequestCard({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col justify-center items-center rounded-2xl border border-border bg-background p-2',
        className,
      )}
    >
      <PrintIcon className="size-16 mt-2" strokeWidth={1.5} />
      <span className="block w-full max-w-full truncate text-center font-space-grotesk font-semibold text-2xl text-foreground mt-6">
        Impressão
      </span>
      <Button
        type="button"
        variant="blue"
        size="sm"
        className="w-full shrink-0 mt-2"
      >
        <HugeiconsIcon
          icon={CheckmarkCircle02Icon}
          className="size-5"
          strokeWidth={3}
        />
        Encaminhar
      </Button>
    </div>
  );
}

function getStatusForQuestion(
  deliveriesByQuestionId: Map<string, BalloonDeliveryStatus>,
  questionId: string,
): BalloonEffectiveStatus {
  return toBalloonEffectiveStatus(deliveriesByQuestionId.get(questionId));
}

export function TeamBalloonsDialog({
  contestId,
  team,
  open,
  onOpenChange,
  onDeliveryChanged,
}: TeamBalloonsDialogProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [deliveriesByQuestionId, setDeliveriesByQuestionId] = useState(
    () => new Map<string, BalloonDeliveryStatus>(),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [pendingQuestionId, setPendingQuestionId] = useState<string>();

  useEffect(() => {
    if (!open || !team) {
      return;
    }

    let active = true;

    async function loadData() {
      setLoading(true);
      setError(undefined);

      try {
        const [questionsData, deliveriesData] = await Promise.all([
          questionService.list(contestId),
          balloonService.listDeliveries(contestId, team!.id),
        ]);

        if (!active) return;

        setQuestions(questionsData);
        setDeliveriesByQuestionId(
          new Map(
            deliveriesData.map((delivery) => [
              delivery.questionId,
              delivery.status,
            ]),
          ),
        );
      } catch (loadError) {
        if (active) {
          setQuestions([]);
          setDeliveriesByQuestionId(new Map());
          setError(
            getQuestionErrorMessage(
              loadError,
              getBalloonErrorMessage(
                loadError,
                'Não foi possível carregar os balões da prova.',
              ),
            ),
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, [contestId, open, team]);

  function applyDelivery(delivery: BalloonDelivery) {
    setDeliveriesByQuestionId((current) => {
      const next = new Map(current);
      next.set(delivery.questionId, delivery.status);
      return next;
    });
    onDeliveryChanged?.();
  }

  async function handleConfirm(question: Question) {
    if (!team) return;

    setPendingQuestionId(question.id);

    try {
      const delivery = await balloonService.confirm(contestId, {
        teamId: team.id,
        questionId: question.id,
      });
      applyDelivery(delivery);
      toast.add({
        title: `Balão ${question.label} confirmado para ${team.name}.`,
        type: 'success',
      });
    } catch (actionError) {
      toast.add({
        title: getBalloonErrorMessage(
          actionError,
          'Não foi possível confirmar o balão.',
        ),
        type: 'error',
      });
    } finally {
      setPendingQuestionId(undefined);
    }
  }

  async function handleWithhold(question: Question) {
    if (!team) return;

    setPendingQuestionId(question.id);

    try {
      const delivery = await balloonService.withhold(contestId, {
        teamId: team.id,
        questionId: question.id,
      });
      applyDelivery(delivery);
      toast.add({
        title: `Balão ${question.label} retido para ${team.name}.`,
        type: 'success',
      });
    } catch (actionError) {
      toast.add({
        title: getBalloonErrorMessage(
          actionError,
          'Não foi possível reter o balão.',
        ),
        type: 'error',
      });
    } finally {
      setPendingQuestionId(undefined);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className="max-h-[min(95vh,50rem)] w-full max-w-[95vw] gap-4 overflow-y-auto p-4 sm:max-w-[95vw] sm:p-6 md:max-w-[90vw] lg:max-w-[80vw] xl:max-w-[70vw]"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold sm:text-2xl">
            Balões Conquistados
          </DialogTitle>
          <DialogDescription className="text-base">
            {team ? (
              <>
                Gerencie as conquistas do time <strong>{team.name}</strong> (
                <strong>{team.usernameTeam}</strong>).
              </>
            ) : (
              'Gerencie as conquistas do time selecionado.'
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
              {questions.map((question) => {
                const status = getStatusForQuestion(
                  deliveriesByQuestionId,
                  question.id,
                );
                const canConfirm = isConfirmableStatus(status);
                const isPending = pendingQuestionId === question.id;

                return (
                  <div
                    key={question.id}
                    className="min-w-0 rounded-2xl border border-border bg-background p-2"
                  >
                    <BalloonAchievement
                      questionId={question.label}
                      color={toBalloonColor(question.balloonColor)}
                      resolved={isResolvedBalloonStatus(status)}
                    />
                    <Button
                      type="button"
                      variant={canConfirm ? 'green' : 'red'}
                      size="sm"
                      className="w-full shrink-0"
                      disabled={isPending || Boolean(pendingQuestionId)}
                      loading={isPending}
                      onClick={() =>
                        canConfirm
                          ? void handleConfirm(question)
                          : void handleWithhold(question)
                      }
                    >
                      <HugeiconsIcon
                        icon={
                          canConfirm
                            ? CheckmarkCircle02Icon
                            : RemoveCircleIcon
                        }
                        className="size-5"
                        strokeWidth={3}
                      />
                      {canConfirm ? 'Confirmar' : 'Reter'}
                    </Button>
                  </div>
                );
              })}
              {team && <PrintRequestCard />}
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
