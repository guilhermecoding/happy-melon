'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import BoxFeatures from '@/components/box-features';
import EmptyIcon from '@/components/empty-icon';
import { Button } from '@/components/pouf/Button';
import { Card } from '@/components/pouf/surface';
import Spinner from '@/components/spinner';
import { collaboratorService } from '@/services/collaborator/collaborator.service';
import { getCollaboratorErrorMessage } from '@/services/collaborator/collaborator.error';
import type { CollaboratorScore } from '@/services/collaborator/collaborator.type';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Award01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

const PAGE_SIZE = 10;

const RANK_GOLD = '#f8d559';
const RANK_SILVER = '#f6f0ff';
const RANK_BRONZE = '#d0a04e';
const RANK_BLACK = '#3a2e5c';

const listVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' as const },
  },
};

const reducedItemVariants = {
  hidden: { opacity: 1, y: 0 },
  show: { opacity: 1, y: 0, transition: { duration: 0.01 } },
};

function getRankStyles(index: number) {
  if (index === 1) {
    return { backgroundColor: RANK_GOLD, color: '#000000' };
  }

  if (index === 2) {
    return { backgroundColor: RANK_SILVER, color: '#000000' };
  }

  if (index === 3) {
    return { backgroundColor: RANK_BRONZE, color: '#FFFFFF' };
  }

  return { backgroundColor: RANK_BLACK, color: '#FFFFFF' };
}

function formatDurationMinutes(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60_000));
  return minutes === 1 ? '1 min' : `${minutes} min`;
}

function ScoreItem({
  rank,
  score,
}: {
  rank: number;
  score: CollaboratorScore;
}) {
  const rankStyles = getRankStyles(rank);
  const tasksLabel =
    score.deliveredCount === 1 ? 'tarefa entregue' : 'tarefas entregues';

  return (
    <Card variant="tight" shadow="inset">
      <div className="flex items-center gap-4 pr-6">
        <div className="shrink-0">
          <span
            className="flex size-10 items-center justify-center rounded-full text-2xl font-bold"
            style={rankStyles}
          >
            {rank}
          </span>
        </div>
        <div className="min-w-48 shrink-0 md:min-w-0 md:flex-1 md:overflow-hidden">
          <span className="block whitespace-nowrap text-lg font-bold md:truncate">
            {score.name}
          </span>
          <span className="block whitespace-nowrap text-sm text-muted-foreground md:truncate">
            {score.id} | {score.email}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-5">
          <div className="text-right">
            <span className="block text-lg font-bold">
              {score.deliveredCount}
            </span>
            <span className="text-xs text-muted-foreground">{tasksLabel}</span>
          </div>
          <div className="text-right">
            <span className="block text-lg font-bold">
              {formatDurationMinutes(score.totalDurationMs)}
            </span>
            <span className="text-xs text-muted-foreground">tempo gasto</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function CollaboratorsScoreTable({ contestId }: { contestId: string }) {
  const reduceMotion = useReducedMotion();
  const [scores, setScores] = useState<CollaboratorScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(scores.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const paginatedScores = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return scores.slice(start, start + PAGE_SIZE);
  }, [scores, currentPage]);

  const rangeStart = scores.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, scores.length);
  const rankOffset = (currentPage - 1) * PAGE_SIZE;

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    let active = true;

    async function loadScores() {
      try {
        const data = await collaboratorService.listScore(contestId);
        if (active) {
          setScores(data);
        }
      } catch (loadError) {
        if (active) {
          setError(
            getCollaboratorErrorMessage(
              loadError,
              'Não foi possível carregar o ranking dos colaboradores.',
            ),
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadScores();

    return () => {
      active = false;
    };
  }, [contestId]);

  if (error) {
    return (
      <p role="alert" className="px-4 pb-4 text-sm text-destructive">
        {error}
      </p>
    );
  }

  if (loading) {
    return <Spinner />;
  }

  if (scores.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-4 pb-6">
        <EmptyIcon className="size-14 text-muted-foreground opacity-70" />
        <p className="text-center text-sm text-muted-foreground">
          Nenhum colaborador ingressou ainda.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-4 overflow-x-auto px-4 md:overflow-visible">
        <motion.div
          key={currentPage}
          className="flex min-w-max flex-col gap-2 md:min-w-0"
          variants={listVariants}
          initial={reduceMotion ? false : 'hidden'}
          animate="show"
        >
          {paginatedScores.map((score, index) => (
            <motion.div
              key={score.id}
              variants={reduceMotion ? reducedItemVariants : itemVariants}
            >
              <ScoreItem rank={rankOffset + index + 1} score={score} />
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="mt-4 flex flex-col gap-3 px-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {rangeStart}–{rangeEnd} de {scores.length}
          {totalPages > 1
            ? ` · Página ${currentPage} de ${totalPages}`
            : null}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="quiet"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              className="size-4"
              strokeWidth={2}
            />
            Anterior
          </Button>
          <Button
            variant="quiet"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
          >
            Próxima
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              className="size-4"
              strokeWidth={2}
            />
          </Button>
        </div>
      </div>
    </>
  );
}

export function CollaboratorsScorePanel({ contestId }: { contestId: string }) {
  return (
    <div className="mt-4">
      <BoxFeatures
        title="Score dos Colaboradores"
        icon={Award01Icon}
        blobSize="sm"
        blobTone="orange"
      >
        <CollaboratorsScoreTable contestId={contestId} />
      </BoxFeatures>
    </div>
  );
}
