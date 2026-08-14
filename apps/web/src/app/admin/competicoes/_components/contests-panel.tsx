"use client";

import { useEffect, useMemo, useState } from 'react';
import { BalloonIcon, PlusSignCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import BoxFeatures from '@/components/box-features';
import { Button } from '@/components/pouf/Button';
import Spinner from '@/components/spinner';
import { contestService } from '@/services/contest/contest.service';
import { getContestErrorMessage } from '@/services/contest/contest.error';
import {
  getContestCondition,
  type Contest,
} from '@/services/contest/contest.type';
import ContestCard from './contest-card';
import { CreateContestSheet } from './create-contest-sheet';

function ContestGrid({ contests }: { contests: Contest[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {contests.map((contest) => (
        <ContestCard
          key={contest.id}
          id={contest.id}
          name={contest.name}
          status={contest.status}
          startsAt={contest.startsAt}
          endsAt={contest.endsAt}
        />
      ))}
    </div>
  );
}

export default function ContestsPanel() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadContests() {
      try {
        const data = await contestService.list();
        if (active) setContests(data);
      } catch (loadError) {
        if (active) {
          setError(
            getContestErrorMessage(
              loadError,
              'Não foi possível carregar as competições.',
            ),
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadContests();
    return () => {
      active = false;
    };
  }, []);

  const { currentContests, finishedContests } = useMemo(() => {
    const current: Contest[] = [];
    const finished: Contest[] = [];

    for (const contest of contests) {
      if (getContestCondition(contest.startsAt, contest.endsAt) === 'finished') {
        finished.push(contest);
      } else {
        current.push(contest);
      }
    }

    return { currentContests: current, finishedContests: finished };
  }, [contests]);

  function handleCreated(contest: Contest) {
    setContests((current) => [contest, ...current]);
    setError(undefined);
  }

  return (
    <>
      <BoxFeatures
        title="Competições"
        icon={BalloonIcon}
        blobSize="sm"
        blobTone="mint"
      >
        <div className="flex h-full flex-col gap-4 p-4">
          <div className="flex justify-end">
            <Button tone="blue" size="sm" onClick={() => setCreateOpen(true)}>
              <HugeiconsIcon
                icon={PlusSignCircleIcon}
                className="size-5"
                strokeWidth={3}
              />
              Nova Competição
            </Button>
          </div>

          {loading ? (
            <Spinner />
          ) : error ? (
            <p role="alert" className="text-center text-sm text-destructive">
              {error}
            </p>
          ) : contests.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              Nenhuma competição cadastrada.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {currentContests.length > 0 ? (
                <ContestGrid contests={currentContests} />
              ) : null}

              {finishedContests.length > 0 ? (
                <>
                  <div
                    className="flex items-center gap-3"
                    role="separator"
                    aria-label="Finalizadas"
                  >
                    <div className="h-px flex-1 bg-border" />
                    <span className="shrink-0 text-sm font-medium text-muted-foreground">
                      Finalizadas
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <ContestGrid contests={finishedContests} />
                </>
              ) : null}
            </div>
          )}
        </div>
      </BoxFeatures>

      <CreateContestSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />
    </>
  );
}
