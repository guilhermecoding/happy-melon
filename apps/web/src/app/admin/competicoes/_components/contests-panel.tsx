"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusSignCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { contestService } from '@/services/contest/contest.service';
import { getContestErrorMessage } from '@/services/contest/contest.error';
import type { Contest } from '@/services/contest/contest.type';
import ContestCard from './contest-card';
import { CreateContestSheet } from './create-contest-sheet';

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

  function handleCreated(contest: Contest) {
    setContests((current) => [contest, ...current]);
    setError(undefined);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          variant="blue"
          size="sm"
          className="w-fit"
          onClick={() => setCreateOpen(true)}
        >
          <HugeiconsIcon
            icon={PlusSignCircleIcon}
            className="size-5"
            strokeWidth={3}
          />
          Nova Competição
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando competições...</p>
      ) : contests.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma competição cadastrada.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
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
      )}

      <CreateContestSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />
    </div>
  );
}
