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
  ViewIcon,
} from '@hugeicons/core-free-icons';
import { formatDateTime, toDateTimeLocalValue } from '@/lib/format-data';
import { Button } from '@/components/pouf/Button';
import { Badge } from '@/components/pouf/media';
import { Field, Input } from '@/components/pouf/Input';
import { Sheet } from '@/components/pouf/sheet';
import { toast } from '@/components/pouf/toaster';
import { contestService } from '@/services/contest/contest.service';
import { getContestErrorMessage } from '@/services/contest/contest.error';
import type { Contest, ContestRound } from '@/services/contest/contest.type';
import { EditContestSheet } from '../../_components/edit-contest-sheet';
import { roundFormSchema } from '../../_components/contest-schema';

type BoxContentContestViewProps = {
  contest: Contest;
};

type RoundDraft = {
  name: string;
  startsAt: string;
  endsAt: string;
};

const EMPTY_ROUND: RoundDraft = { name: '', startsAt: '', endsAt: '' };

export default function BoxContentContestView({
  contest: initialContest,
}: BoxContentContestViewProps) {
  const router = useRouter();
  const [contest, setContest] = useState(initialContest);
  const [editOpen, setEditOpen] = useState(false);
  const [roundSheetOpen, setRoundSheetOpen] = useState(false);
  const [editingRound, setEditingRound] = useState<ContestRound | null>(null);
  const [roundDraft, setRoundDraft] = useState<RoundDraft>(EMPTY_ROUND);
  const [roundError, setRoundError] = useState<string>();
  const [savingRound, setSavingRound] = useState(false);

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

  async function handleDeleteRound(round: ContestRound) {
    if (contest.rounds.length <= 1) {
      toast.error('A competição precisa ter pelo menos uma rodada.');
      return;
    }

    try {
      await contestService.deleteRound(contest.id, round.id);
      toast.success('Rodada excluída.');
      const refreshed = await contestService.get(contest.id);
      handleUpdated(refreshed);
    } catch (error) {
      toast.error(
        getContestErrorMessage(error, 'Não foi possível excluir a rodada.'),
      );
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

        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-muted-foreground font-medium">
            <HugeiconsIcon
              icon={ViewIcon}
              className="size-4 shrink-0"
              strokeWidth={2}
            />
            <span>Status</span>
          </div>
          <Badge tone={contest.status === 'active' ? 'mint' : 'pink'}>
            {contest.status === 'active' ? 'Habilitada' : 'Desabilitada'}
          </Badge>
        </div>

        <div className="mt-2 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Rodadas
            </span>
            <Button size="sm" variant="quiet" onClick={openCreateRound}>
              <HugeiconsIcon icon={Add01Icon} className="size-4" />
              Nova
            </Button>
          </div>
          {contest.rounds.map((round) => (
            <div
              key={round.id}
              className="flex flex-col gap-1 rounded-xl border p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold">{round.name}</span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="quiet"
                    onClick={() => openEditRound(round)}
                  >
                    <HugeiconsIcon icon={EditIcon} className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="quiet"
                    onClick={() => void handleDeleteRound(round)}
                  >
                    <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <HugeiconsIcon icon={DateTimeIcon} className="size-4" />
                {formatDateTime(new Date(round.startsAt))} &bull;{' '}
                {formatDateTime(new Date(round.endsAt))}
              </div>
            </div>
          ))}
        </div>
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
      </div>

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
    </>
  );
}
