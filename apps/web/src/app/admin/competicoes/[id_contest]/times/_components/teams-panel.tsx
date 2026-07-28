"use client";

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  PencilEdit02Icon,
  PlusSignCircleIcon,
  Search01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { teamService } from '@/services/team/team.service';
import { getTeamErrorMessage } from '@/services/team/team.error';
import type { Team } from '@/services/team/team.type';
import { CreateTeamSheet } from './create-team-sheet';
import { EditTeamSheet } from './edit-team-sheet';

type TeamsPanelProps = {
  contestId: string;
};

function matchesSearch(team: Team, query: string) {
  if (!query) {
    return true;
  }

  const haystack = [
    team.id,
    team.name,
    team.usernameTeam,
    team.room ?? '',
    team.machine ?? '',
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
}

export function TeamsPanel({ contestId }: TeamsPanelProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const filteredTeams = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return teams
      .filter((team) => matchesSearch(team, query))
      .sort((a, b) =>
        a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }),
      );
  }, [teams, deferredSearch]);

  useEffect(() => {
    let active = true;

    async function loadTeams() {
      try {
        const data = await teamService.list(contestId);
        if (active) setTeams(data);
      } catch (loadError) {
        if (active) {
          setError(
            getTeamErrorMessage(
              loadError,
              'Não foi possível carregar os times.',
            ),
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadTeams();
    return () => {
      active = false;
    };
  }, [contestId]);

  function handleCreated(team: Team) {
    setTeams((current) => [...current, team]);
    setError(undefined);
  }

  function handleBulkUpserted(upsertedTeams: Team[]) {
    setTeams((current) => {
      const next = new Map(current.map((team) => [team.id, team]));
      for (const team of upsertedTeams) {
        next.set(team.id, team);
      }
      return [...next.values()];
    });
    setError(undefined);
  }

  function handleUpdated(team: Team) {
    setTeams((current) =>
      current.map((item) => (item.id === team.id ? team : item)),
    );
  }

  function handleDeleted(teamId: string) {
    setTeams((current) => current.filter((item) => item.id !== teamId));
    if (selectedTeam?.id === teamId) {
      setSelectedTeam(null);
    }
  }

  function openEditSheet(team: Team) {
    setSelectedTeam(team);
    setEditOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar times..."
            aria-label="Buscar times"
            icon={
              <HugeiconsIcon
                icon={Search01Icon}
                className="size-5"
                strokeWidth={2}
              />
            }
          />
        </div>

        <Button
          variant="blue"
          size="sm"
          className="flex w-full sm:w-fit"
          onClick={() => setCreateOpen(true)}
        >
          <HugeiconsIcon
            icon={PlusSignCircleIcon}
            className="size-5 shrink-0"
            strokeWidth={3}
          />
          Adicionar time
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border bg-muted">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20 px-4 font-bold">ID</TableHead>
              <TableHead className="px-4 font-bold">Nome</TableHead>
              <TableHead className="px-4 font-bold">Usuario</TableHead>
              <TableHead className="px-4 font-bold">Sala</TableHead>
              <TableHead className="px-4 font-bold">Maquina</TableHead>
              <TableHead className="w-16 px-4 text-right font-bold">
                Opções
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 px-4 text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : error && teams.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 px-4 text-center text-muted-foreground"
                >
                  Não foi possível carregar a lista.
                </TableCell>
              </TableRow>
            ) : filteredTeams.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 px-4 text-center text-muted-foreground"
                >
                  {search.trim()
                    ? 'Nenhum time encontrado para a busca.'
                    : 'Nenhum time cadastrado.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredTeams.map((team, index) => (
                <TableRow
                  key={team.id}
                  className={index % 2 === 0 ? 'bg-white' : ''}
                >
                  <TableCell className="w-20 px-4 whitespace-nowrap font-mono text-xs">
                    {team.id}
                  </TableCell>
                  <TableCell className="px-4">{team.name}</TableCell>
                  <TableCell className="px-4">{team.usernameTeam}</TableCell>
                  <TableCell className="px-4 text-muted-foreground">
                    {team.room || '—'}
                  </TableCell>
                  <TableCell className="px-4 text-muted-foreground">
                    {team.machine || '—'}
                  </TableCell>
                  <TableCell className="px-4 text-right">
                    <Button
                      type="button"
                      variant="normal"
                      size="icon"
                      className="size-9"
                      aria-label={`Editar ${team.name}`}
                      onClick={() => openEditSheet(team)}
                    >
                      <HugeiconsIcon
                        icon={PencilEdit02Icon}
                        className="size-5"
                        strokeWidth={1.5}
                      />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CreateTeamSheet
        contestId={contestId}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
        onBulkUpserted={handleBulkUpserted}
      />
      <EditTeamSheet
        team={selectedTeam}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
