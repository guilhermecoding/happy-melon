"use client";

import { useEffect, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { EyeClosedIcon, File02Icon } from '@hugeicons/core-free-icons';
import {
  isConfirmableStatus,
  TASK_KIND,
  toBalloonEffectiveStatus,
} from '@repo/shared';
import type { Team } from '@/services/team/team.type';
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
import { printService } from '@/services/print/print.service';
import { getPrintErrorMessage } from '@/services/print/print.error';
import type { PrintTask } from '@/services/print/print.type';
import { toast } from '@/components/ui/toast';

type PrintTasksDialogProps = {
  contestId: string;
  team: Team;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refreshKey?: number;
  onTaskChanged?: () => void;
};

export function PrintTasksDialog({
  contestId,
  team,
  open,
  onOpenChange,
  refreshKey = 0,
  onTaskChanged,
}: PrintTasksDialogProps) {
  const [tasks, setTasks] = useState<PrintTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [pendingTaskId, setPendingTaskId] = useState<string>();
  const [withholdTask, setWithholdTask] = useState<PrintTask | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;

    async function loadTasks() {
      setLoading(true);
      setError(undefined);

      try {
        const data = await printService.list(contestId, team.id);
        if (active) setTasks(data);
      } catch (loadError) {
        if (active) {
          setTasks([]);
          setError(
            getPrintErrorMessage(
              loadError,
              'Não foi possível carregar a fila de impressão.',
            ),
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadTasks();

    return () => {
      active = false;
    };
  }, [contestId, open, team.id, refreshKey]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && pendingTaskId) return;
    if (!nextOpen) {
      setWithholdTask(null);
    }
    onOpenChange(nextOpen);
  }

  function handleWithholdOpenChange(nextOpen: boolean) {
    if (!nextOpen && pendingTaskId) return;
    if (!nextOpen) {
      setWithholdTask(null);
    }
  }

  function applyTask(updated: PrintTask) {
    setTasks((current) =>
      current.map((task) => (task.id === updated.id ? updated : task)),
    );
    onTaskChanged?.();
  }

  async function handleConfirm(task: PrintTask) {
    setPendingTaskId(task.id);

    try {
      const updated = await printService.confirm(contestId, task.id);
      applyTask(updated);
      toast.add({
        title: `Impressão ${task.id} confirmada para ${team.name}.`,
        type: 'success',
      });
    } catch (actionError) {
      toast.add({
        title: getPrintErrorMessage(
          actionError,
          'Não foi possível confirmar a impressão.',
        ),
        type: 'error',
      });
    } finally {
      setPendingTaskId(undefined);
    }
  }

  async function handleWithholdConfirm() {
    if (!withholdTask) return;

    const task = withholdTask;
    setPendingTaskId(task.id);

    try {
      const updated = await printService.withhold(contestId, task.id);
      applyTask(updated);
      setWithholdTask(null);
      toast.add({
        title: `Impressão ${task.id} retida para ${team.name}.`,
        type: 'success',
      });
    } catch (actionError) {
      toast.add({
        title: getPrintErrorMessage(
          actionError,
          'Não foi possível reter a impressão.',
        ),
        type: 'error',
      });
    } finally {
      setPendingTaskId(undefined);
    }
  }

  const isWithholding = Boolean(
    withholdTask && pendingTaskId === withholdTask.id,
  );

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton={true}
          overlayClassName="bg-black/50 supports-backdrop-filter:backdrop-blur-sm"
          className="max-h-[min(95vh,50rem)] w-full max-w-[95vw] gap-4 overflow-y-auto p-4 sm:max-w-[95vw] sm:p-6 md:max-w-[70vw] lg:max-w-[60vw] xl:max-w-[50vw]"
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-bold sm:text-2xl">
              Fila de impressão
            </DialogTitle>
            <DialogDescription className="text-base">
              Tasks de impressão do time <strong>{team.name}</strong> (
              <strong>{team.usernameTeam}</strong>).
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-48 rounded-2xl border-4 bg-muted/40 px-4 py-6 sm:px-6">
            {loading ? (
              <p className="text-center text-sm text-muted-foreground">
                Carregando fila de impressão...
              </p>
            ) : error ? (
              <p role="alert" className="text-center text-sm text-destructive">
                {error}
              </p>
            ) : tasks.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                Nenhuma tarefa de impressão na fila.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {tasks.map((task) => {
                  const status = toBalloonEffectiveStatus(task.status);
                  const canConfirm = isConfirmableStatus(status);
                  const isPending = pendingTaskId === task.id;

                  return (
                    <div
                      key={task.id}
                      className="relative flex flex-col gap-3 rounded-2xl border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pl-10"
                    >
                      <BalloonDeliveryStatusIcon
                        status={task.status}
                        kind={TASK_KIND.PRINT_TASK}
                        className="absolute top-2 left-2 size-6"
                        strokeWidth={2.5}
                      />

                      <div className="flex min-w-0 items-center gap-3 pl-8 sm:pl-0">
                        <HugeiconsIcon
                          icon={File02Icon}
                          className="size-7 shrink-0 text-foreground"
                          strokeWidth={1.5}
                        />
                        <p className="min-w-0 text-left text-base text-foreground">
                          Tarefa <strong>{task.id}</strong> de impressão.
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant={canConfirm ? 'green' : 'red'}
                        size="sm"
                        className="w-full shrink-0 sm:w-fit"
                        disabled={
                          isPending ||
                          Boolean(pendingTaskId) ||
                          Boolean(withholdTask)
                        }
                        loading={isPending && canConfirm}
                        onClick={() =>
                          canConfirm
                            ? void handleConfirm(task)
                            : setWithholdTask(task)
                        }
                      >
                        {canConfirm ? 'Confirmar' : 'Reter'}
                      </Button>
                    </div>
                  );
                })}
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
        open={Boolean(withholdTask)}
        onOpenChange={handleWithholdOpenChange}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Tem certeza disso?
            </DialogTitle>
            <DialogDescription className="text-base">
              Deseja realmente reter a impressão de{' '}
              <strong>{team.name}</strong>? A impressão retornará ao ponto de
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
    </>
  );
}
