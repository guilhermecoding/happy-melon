"use client";

import { useEffect, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Award01Icon,
  CheckmarkCircle02Icon,
  ExpandIcon,
  EyeClosedIcon,
  RemoveCircleIcon,
} from '@hugeicons/core-free-icons';
import {
  BALLOON_EFFECTIVE_STATUS,
  isConfirmableStatus,
  toBalloonEffectiveStatus,
  type BalloonDeliveryStatus,
  type BalloonEffectiveStatus,
} from '@repo/shared';
import type { Team } from '@/services/team/team.type';
import { BalloonAchievement } from '@/components/balloon-achievement';
import { BalloonDeliveryStatusIcon } from '@/components/balloon-delivery-status-icon';
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
import { printService } from '@/services/print/print.service';
import { getPrintErrorMessage } from '@/services/print/print.error';
import { toast } from '@/components/ui/toast';
import PrintIcon from '@/components/print-icon';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PrintTasksDialog } from './print-tasks-dialog';

type TeamBalloonsDialogProps = {
  contestId: string;
  team: Team | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeliveryChanged?: () => void;
};

function PrintRequestCard({
  contestId,
  team,
  disabled,
  onEnqueued,
  onOpenQueue,
}: {
  contestId: string;
  team: Team;
  disabled?: boolean;
  onEnqueued?: () => void;
  onOpenQueue?: () => void;
}) {
  const [isEnqueueing, setIsEnqueueing] = useState(false);

  async function handleEnqueue() {
    setIsEnqueueing(true);

    try {
      await printService.enqueue(contestId, { teamId: team.id });
      onEnqueued?.();
      toast.add({
        title: `Impressão encaminhada para ${team.name}.`,
        type: 'success',
      });
    } catch (actionError) {
      toast.add({
        title: getPrintErrorMessage(
          actionError,
          'Não foi possível encaminhar a impressão.',
        ),
        type: 'error',
      });
    } finally {
      setIsEnqueueing(false);
    }
  }

  return (
    <div className="relative flex min-w-0 flex-col items-center justify-center rounded-2xl border border-border bg-background p-2">
      <div className="absolute top-1 right-1">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="normal"
                size="icon"
                className="size-8"
                disabled={disabled || isEnqueueing}
                onClick={onOpenQueue}
                aria-label="Abrir tasks de impressão"
              />
            }
          >
            <HugeiconsIcon
              icon={ExpandIcon}
              className="size-5 text-muted-foreground"
              strokeWidth={2}
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>Abrir tasks de impressão</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <PrintIcon className="mt-2 size-16" strokeWidth={1.5} />
      <span className="mt-6 block w-full max-w-full truncate text-center font-space-grotesk text-2xl font-semibold text-foreground">
        Impressão
      </span>
      <Button
        type="button"
        variant="blue"
        size="sm"
        className="mt-2 w-full shrink-0"
        disabled={disabled || isEnqueueing}
        loading={isEnqueueing}
        onClick={() => void handleEnqueue()}
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
  const [withholdQuestion, setWithholdQuestion] = useState<Question | null>(
    null,
  );
  const [printQueueOpen, setPrintQueueOpen] = useState(false);
  const [printQueueRefreshKey, setPrintQueueRefreshKey] = useState(0);

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

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && pendingQuestionId) return;
    if (!nextOpen) {
      setWithholdQuestion(null);
      setPrintQueueOpen(false);
    }
    onOpenChange(nextOpen);
  }

  function handleWithholdOpenChange(nextOpen: boolean) {
    if (!nextOpen && pendingQuestionId) return;
    if (!nextOpen) {
      setWithholdQuestion(null);
    }
  }

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

  async function handleWithholdConfirm() {
    if (!team || !withholdQuestion) return;

    const question = withholdQuestion;
    setPendingQuestionId(question.id);

    try {
      const delivery = await balloonService.withhold(contestId, {
        teamId: team.id,
        questionId: question.id,
      });
      applyDelivery(delivery);
      setWithholdQuestion(null);
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

  const isWithholding = Boolean(
    withholdQuestion && pendingQuestionId === withholdQuestion.id,
  );

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
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
                      className="relative min-w-0 rounded-2xl border border-border bg-background p-2"
                    >
                      {status !== BALLOON_EFFECTIVE_STATUS.ABSENT ? (
                        <BalloonDeliveryStatusIcon
                          status={status}
                          className="absolute top-2 right-2 size-6"
                          strokeWidth={2.5}
                        />
                      ) : null}
                      <BalloonAchievement
                        questionId={question.label}
                        color={toBalloonColor(question.balloonColor)}
                        resolved={true}
                      />
                      <Button
                        type="button"
                        variant={canConfirm ? 'green' : 'red'}
                        size="sm"
                        className="w-full shrink-0"
                        disabled={
                          isPending ||
                          Boolean(pendingQuestionId) ||
                          Boolean(withholdQuestion)
                        }
                        loading={isPending && canConfirm}
                        onClick={() =>
                          canConfirm
                            ? void handleConfirm(question)
                            : setWithholdQuestion(question)
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
                {team && (
                  <PrintRequestCard
                    contestId={contestId}
                    team={team}
                    disabled={
                      Boolean(pendingQuestionId) || Boolean(withholdQuestion)
                    }
                    onEnqueued={() => {
                      setPrintQueueRefreshKey((current) => current + 1);
                      onDeliveryChanged?.();
                    }}
                    onOpenQueue={() => setPrintQueueOpen(true)}
                  />
                )}
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 flex-col-reverse justify-end gap-2 xl:flex-row">
            <Button
              type="button"
              variant="white"
              className="w-full sm:w-fit"
              onClick={() => handleOpenChange(false)}
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

      <Dialog
        open={Boolean(withholdQuestion)}
        onOpenChange={handleWithholdOpenChange}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Tem certeza disso?
            </DialogTitle>
            <DialogDescription className="text-base">
              Deseja realmente reter o balão de{' '}
              <strong>{team?.name}</strong>? O balão retornará ao ponto de
              partida.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col justify-stretch sm:flex-row-reverse sm:justify-end">
            <Button
              type="button"
              variant="red"
              size="sm"
              className="w-full"
              loading={isWithholding}
              onClick={() => void handleWithholdConfirm()}
            >
              Reter
            </Button>
            <Button
              type="button"
              variant="white"
              size="sm"
              className="w-full"
              disabled={isWithholding}
              onClick={() => handleWithholdOpenChange(false)}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {team ? (
        <PrintTasksDialog
          contestId={contestId}
          team={team}
          open={printQueueOpen}
          onOpenChange={setPrintQueueOpen}
          refreshKey={printQueueRefreshKey}
          onTaskChanged={() => {
            setPrintQueueRefreshKey((current) => current + 1);
            onDeliveryChanged?.();
          }}
        />
      ) : null}
    </>
  );
}
