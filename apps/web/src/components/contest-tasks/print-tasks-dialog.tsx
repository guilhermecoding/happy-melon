"use client";

import { useEffect, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { DocumentAttachmentIcon, EyeClosedIcon, File02Icon } from '@hugeicons/core-free-icons';
import {
  isConfirmableStatus,
  TASK_KIND,
  toBalloonEffectiveStatus,
} from '@repo/shared';
import type { Team } from '@/services/team/team.type';
import { BalloonDeliveryStatusIcon } from '@/components/balloon-delivery-status-icon';
import { Button as ButtonPouf } from '@/components/pouf/Button';
import { Confirm, Dialog } from '@/components/pouf/controls';
import { RowCard } from '@/components/pouf/surface';
import { printService } from '@/services/print/print.service';
import { getPrintErrorMessage } from '@/services/print/print.error';
import type { PrintTask } from '@/services/print/print.type';
import { toast } from '@/components/pouf/toaster';
import Spinner from '@/components/spinner';

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
      toast.success(`Impressão ${task.id} confirmada para ${team.name}.`);
    } catch (actionError) {
      toast.error(
        getPrintErrorMessage(
          actionError,
          'Não foi possível confirmar a impressão.',
        ),
      );
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
      toast.success(`Impressão ${task.id} retida para ${team.name}.`);
    } catch (actionError) {
      toast.error(
        getPrintErrorMessage(
          actionError,
          'Não foi possível reter a impressão.',
        ),
      );
    } finally {
      setPendingTaskId(undefined);
    }
  }

  const isWithholding = Boolean(
    withholdTask && pendingTaskId === withholdTask.id,
  );

  const description = (
    <>
      Tasks de impressão do time <strong>{team.name}</strong> (
      <strong>{team.usernameTeam}</strong>).
    </>
  );

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={handleOpenChange}
        title="Fila de impressão"
        description={description}
        size="xl"
      >
        <RowCard>
          {loading ? (
            <Spinner />
          ) : error ? (
            <p role="alert" className="text-center text-sm text-destructive">
              {error}
            </p>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2">
              <HugeiconsIcon
                icon={DocumentAttachmentIcon}
                className="size-14 text-muted-foreground opacity-50"
                strokeWidth={2}
              />
              <p className="mt-2 text-center font-medium text-muted-foreground/80">
                Nenhuma tarefa de impressão na fila.
              </p>
            </div>
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

                    <ButtonPouf
                      variant="solid"
                      tone={canConfirm ? 'mint' : 'pink'}
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
                    </ButtonPouf>
                  </div>
                );
              })}
            </div>
          )}
        </RowCard>

        <div className="mt-4 flex flex-col-reverse justify-end gap-2 xl:flex-row">
          <ButtonPouf variant="quiet" onClick={() => handleOpenChange(false)}>
            <HugeiconsIcon
              icon={EyeClosedIcon}
              className="size-5"
              strokeWidth={3}
            />
            Fechar
          </ButtonPouf>
        </div>
      </Dialog>

      <Confirm
        open={Boolean(withholdTask)}
        onOpenChange={handleWithholdOpenChange}
        title="Tem certeza disso?"
        body={`Deseja realmente reter a impressão de ${team.name}? A impressão retornará ao ponto de partida.`}
        confirmLabel="Reter"
        cancelLabel="Cancelar"
        tone="pink"
        loading={isWithholding}
        onConfirm={() => void handleWithholdConfirm()}
      />
    </>
  );
}
