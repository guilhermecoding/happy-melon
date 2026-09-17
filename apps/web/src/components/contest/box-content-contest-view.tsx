"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Add01Icon,
  BalloonIcon,
  DateTimeIcon,
  Delete02Icon,
  EditIcon,
  IterationCwIcon,
} from '@hugeicons/core-free-icons';
import { formatDateTime, toDateTimeLocalValue } from '@/lib/format-data';
import { AdminPasswordConfirmDialog } from '@/components/admin-password-confirm-dialog';
import { Button } from '@/components/pouf/Button';
import { Field, Input } from '@/components/pouf/Input';
import { Sheet } from '@/components/pouf/sheet';
import { toast } from '@/components/pouf/toaster';
import { contestService } from '@/services/contest/contest.service';
import { getContestErrorMessage } from '@/services/contest/contest.error';
import type { Contest, ContestRound } from '@/services/contest/contest.type';
import { EditContestSheet } from '@/app/admin/competicoes/_components/edit-contest-sheet';
import { parseScoreFreezeMinutes, roundFormSchema } from '@/app/admin/competicoes/_components/contest-schema';

type BoxContentContestViewProps = {
  contest: Contest;
  editable?: boolean;
};

type RoundDraft = {
  name: string;
  startsAt: string;
  endsAt: string;
  scoreFreezeMinutes: string;
};

const EMPTY_ROUND: RoundDraft = {
  name: '',
  startsAt: '',
  endsAt: '',
  scoreFreezeMinutes: '',
};

export default function BoxContentContestView({
  contest: initialContest,
  editable = true,
}: BoxContentContestViewProps) {
  const router = useRouter();
  const [contest, setContest] = useState(initialContest);
  const [editOpen, setEditOpen] = useState(false);
  const [roundSheetOpen, setRoundSheetOpen] = useState(false);
  const [editingRound, setEditingRound] = useState<ContestRound | null>(null);
  const [roundDraft, setRoundDraft] = useState<RoundDraft>(EMPTY_ROUND);
  const [roundError, setRoundError] = useState<string>();
  const [savingRound, setSavingRound] = useState(false);
  const [roundToDelete, setRoundToDelete] = useState<ContestRound | null>(null);
  const [deletingRound, setDeletingRound] = useState(false);
  const [deleteRoundError, setDeleteRoundError] = useState<string>();

  useEffect(() => {
    setContest(initialContest);
  }, [initialContest]);

  function handleUpdated(updatedContest: Contest) {
    setContest(updatedContest);
    router.refresh();
  }

  function openCreateRound() {
    setEditingRound(null);
    setRoundDraft(EMPTY_ROUND);
    setRoundError(undefined);
    setRoundSheetOpen(true);
  }

  function openEditRound(round: ContestRound) {
    setEditingRound(round);
    setRoundDraft({
      name: round.name,
      startsAt: toDateTimeLocalValue(round.startsAt),
      endsAt: toDateTimeLocalValue(round.endsAt),
      scoreFreezeMinutes:
        round.scoreFreezeMinutes != null ? String(round.scoreFreezeMinutes) : '',
    });
    setRoundError(undefined);
    setRoundSheetOpen(true);
  }

  async function handleSaveRound() {
    const parsed = roundFormSchema.safeParse(roundDraft);
    if (!parsed.success) {
      setRoundError(parsed.error.issues[0]?.message ?? 'Dados inválidos.');
      return;
    }

    setSavingRound(true);
    setRoundError(undefined);
    const payload = {
      name: parsed.data.name,
      startsAt: new Date(parsed.data.startsAt).toISOString(),
      endsAt: new Date(parsed.data.endsAt).toISOString(),
      scoreFreezeMinutes: parseScoreFreezeMinutes(parsed.data.scoreFreezeMinutes),
    };

    try {
      if (editingRound) {
        await contestService.updateRound(contest.id, editingRound.id, payload);
        toast.success('Rodada atualizada.');
      } else {
        await contestService.createRound(contest.id, payload);
        toast.success('Rodada criada.');
      }
      const refreshed = await contestService.get(contest.id);
      handleUpdated(refreshed);
      setRoundSheetOpen(false);
    } catch (error) {
      const message = getContestErrorMessage(
        error,
        'Não foi possível salvar a rodada.',
      );
      setRoundError(message);
      toast.error(message);
    } finally {
      setSavingRound(false);
    }
  }

  function openDeleteRound(round: ContestRound) {
    if (contest.rounds.length <= 1) {
      toast.error('A competição precisa ter pelo menos uma rodada.');
      return;
    }

    setDeleteRoundError(undefined);
    setRoundToDelete(round);
  }

  async function handleConfirmDeleteRound(password: string) {
    if (!roundToDelete) return;

    setDeletingRound(true);
    setDeleteRoundError(undefined);

    try {
      await contestService.deleteRound(contest.id, roundToDelete.id, {
        password,
      });
      toast.success('Rodada excluída.');
      const refreshed = await contestService.get(contest.id);
      handleUpdated(refreshed);
      setRoundToDelete(null);
    } catch (error) {
      const message = getContestErrorMessage(
        error,
        'Não foi possível excluir a rodada.',
      );
      setDeleteRoundError(message);
      toast.error(message);
    } finally {
      setDeletingRound(false);
    }
  }

  return (
    <>
      <div className="p-4 flex flex-col gap-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-muted-foreground font-medium">
            <HugeiconsIcon
              icon={BalloonIcon}
              className="size-4 shrink-0"
              strokeWidth={2}
            />
            <span>Competição</span>
          </div>
          <span className="text-lg font-bold">{contest.name}</span>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-muted-foreground font-medium">
            #
            <span>ID</span>
          </div>
          <span className="text-lg font-bold">{contest.id}</span>
        </div>

        <div className="mt-2 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <HugeiconsIcon icon={IterationCwIcon} className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={2} />
              <span className="text-sm font-medium text-muted-foreground">
                Rodadas
              </span>
            </div>
            {editable ? (
              <Button size="sm" tone="mint" onClick={openCreateRound}>
                <HugeiconsIcon icon={Add01Icon} className="size-4 shrink-0" strokeWidth={2} />
                Nova
              </Button>
            ) : null}
          </div>
          {contest.rounds.map((round) => (
            <div
              key={round.id}
              className="flex flex-col gap-1 rounded-xl border p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold">{round.name}</span>
                {editable ? (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="quiet"
                      onClick={() => openEditRound(round)}
                    >
                      <HugeiconsIcon icon={EditIcon} className="size-4 shrink-0" strokeWidth={2} />
                    </Button>
                    <Button
                      size="sm"
                      variant="quiet"
                      onClick={() => openDeleteRound(round)}
                    >
                      <HugeiconsIcon icon={Delete02Icon} className="size-4 shrink-0" strokeWidth={2} />
                    </Button>
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <HugeiconsIcon icon={DateTimeIcon} className="size-4 shrink-0" strokeWidth={2} />
                {formatDateTime(new Date(round.startsAt))} &bull;{' '}
                {formatDateTime(new Date(round.endsAt))}
              </div>
            </div>
          ))}
        </div>
        {editable ? (
          <div className="mt-2 flex justify-end">
            <Button tone="orange" size="sm" onClick={() => setEditOpen(true)}>
              <HugeiconsIcon
                icon={EditIcon}
                className="size-4 shrink-0"
                strokeWidth={2}
              />
              Editar
            </Button>
          </div>
        ) : null}
      </div>

      {editable ? (
        <>
          <EditContestSheet
            contest={contest}
            open={editOpen}
            onOpenChange={setEditOpen}
            onUpdated={handleUpdated}
          />

          <Sheet
            open={roundSheetOpen}
            onOpenChange={setRoundSheetOpen}
            title={editingRound ? 'Editar rodada' : 'Nova rodada'}
            description="Defina o nome e o horário desta fatia da competição."
          >
            <div className="flex flex-col gap-4">
              <Field label="Nome">
                {(id) => (
                  <Input
                    id={id}
                    value={roundDraft.name}
                    onChange={(value) =>
                      setRoundDraft((current) => ({ ...current, name: value }))
                    }
                  />
                )}
              </Field>
              <Field label="Início">
                {(id) => (
                  <Input
                    id={id}
                    type="datetime-local"
                    value={roundDraft.startsAt}
                    onChange={(value) =>
                      setRoundDraft((current) => ({ ...current, startsAt: value }))
                    }
                  />
                )}
              </Field>
              <Field label="Término">
                {(id) => (
                  <Input
                    id={id}
                    type="datetime-local"
                    value={roundDraft.endsAt}
                    onChange={(value) =>
                      setRoundDraft((current) => ({ ...current, endsAt: value }))
                    }
                  />
                )}
              </Field>
              <Field
                label="Congelamento"
                description="Define quando o placar será congelado nos minutos restantes."
              >
                {(id, describedBy) => (
                  <Input
                    id={id}
                    describedBy={describedBy}
                    type="number"
                    inputMode="numeric"
                    placeholder="Ex: 20"
                    min={1}
                    step={1}
                    value={roundDraft.scoreFreezeMinutes}
                    onChange={(value) =>
                      setRoundDraft((current) => ({
                        ...current,
                        scoreFreezeMinutes: value,
                      }))
                    }
                  />
                )}
              </Field>
              {roundError ? (
                <p role="alert" className="text-sm text-destructive">
                  {roundError}
                </p>
              ) : null}
              <div className="flex justify-end">
                <Button tone="mint" loading={savingRound} onClick={() => void handleSaveRound()}>
                  Salvar
                </Button>
              </div>
            </div>
          </Sheet>

          <AdminPasswordConfirmDialog
            open={Boolean(roundToDelete)}
            onOpenChange={(nextOpen) => {
              if (!nextOpen) {
                setRoundToDelete(null);
                setDeleteRoundError(undefined);
              }
            }}
            title="Confirmar exclusão da rodada"
            description={
              <>
                Digite a senha do administrador logado para excluir a rodada{' '}
                <strong>{roundToDelete?.name}</strong>. Questões da prova, balões,
                impressões e o histórico desta rodada serão apagados. Esta ação não
                pode ser desfeita.
              </>
            }
            confirmLabel="Apagar rodada"
            confirmTone="pink"
            isLoading={deletingRound}
            error={deleteRoundError}
            onConfirm={handleConfirmDeleteRound}
          />
        </>
      ) : null}
    </>
  );
}
