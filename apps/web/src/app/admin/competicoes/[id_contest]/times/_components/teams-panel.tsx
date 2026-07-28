"use client";

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Delete01Icon,
  Download01Icon,
  PencilEdit02Icon,
  PlusSignCircleIcon,
  Search01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { AdminPasswordConfirmDialog } from '@/components/admin-password-confirm-dialog';
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
import { toast } from '@/components/ui/toast';
import { teamService } from '@/services/team/team.service';
import { getTeamErrorMessage } from '@/services/team/team.error';
import type { Team } from '@/services/team/team.type';
import { CreateTeamSheet } from './create-team-sheet';
import { EditTeamSheet } from './edit-team-sheet';
import { downloadTeamsCsv } from './team-csv';

type TeamsPanelProps = {
  contestId: string;
};

const PAGE_SIZE = 10;

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
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteAllError, setDeleteAllError] = useState<string>();
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const filteredTeams = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return teams
      .filter((team) => matchesSearch(team, query))
      .sort((a, b) =>
        a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }),
      );
  }, [teams, deferredSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredTeams.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const paginatedTeams = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredTeams.slice(start, start + PAGE_SIZE);
  }, [filteredTeams, currentPage]);

  const rangeStart =
    filteredTeams.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filteredTeams.length);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

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

  function handleDownloadTeams() {
    if (teams.length === 0) {
      toast.add({
        title: 'Não há times para baixar.',
        type: 'error',
      });
      return;
    }

    const orderedTeams = [...teams].sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }),
    );

    downloadTeamsCsv(orderedTeams, `times-${contestId}.csv`);
    toast.add({
      title: `${orderedTeams.length} time(s) exportado(s).`,
      type: 'success',
    });
  }

  async function handleConfirmDeleteAll(password: string) {
    setIsDeletingAll(true);
    setDeleteAllError(undefined);

    try {
      const result = await teamService.removeAll(contestId, { password });
      setTeams([]);
      setSelectedTeam(null);
      setDeleteAllOpen(false);
      toast.add({
        title:
          result.deletedCount > 0
            ? `${result.deletedCount} time(s) excluído(s) com sucesso.`
            : 'Nenhum time para excluir.',
        type: 'success',
      });
    } catch (deleteError) {
      const message = getTeamErrorMessage(
        deleteError,
        'Não foi possível excluir os times.',
      );
      setDeleteAllError(message);
      toast.add({
        title: message,
        type: 'error',
      });
    } finally {
      setIsDeletingAll(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 @5xl/main:flex-row sm:items-center sm:justify-between">
        <div className="w-full flex justify-start">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar times..."
            aria-label="Buscar times"
            className="w-full sm:max-w-86 rounded-2xl"
            icon={
              <HugeiconsIcon
                icon={Search01Icon}
                className="size-5"
                strokeWidth={2}
              />
            }
          />
        </div>

        <div className="w-full flex flex-col-reverse justify-start sm:flex-row @5xl/main:justify-end gap-2">
          <Button
            variant="orange"
            size="sm"
            className="flex w-full sm:w-fit"
            disabled={loading || teams.length === 0}
            onClick={handleDownloadTeams}
          >
            <HugeiconsIcon
              icon={Download01Icon}
              className="size-5 shrink-0"
              strokeWidth={3}
            />
            Baixar times
          </Button>

          <Button
            variant="red"
            size="sm"
            className="flex w-full sm:w-fit"
            disabled={loading || teams.length === 0}
            onClick={() => {
              setDeleteAllError(undefined);
              setDeleteAllOpen(true);
            }}
          >
            <HugeiconsIcon
              icon={Delete01Icon}
              className="size-5 shrink-0"
              strokeWidth={3}
            />
            Apagar times
          </Button>

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
              paginatedTeams.map((team, index) => {
                const absoluteIndex = (currentPage - 1) * PAGE_SIZE + index;

                return (
                  <TableRow
                    key={team.id}
                    className={absoluteIndex % 2 === 0 ? 'bg-white' : ''}
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
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && filteredTeams.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {rangeStart}–{rangeEnd} de {filteredTeams.length}
            {totalPages > 1
              ? ` · Página ${currentPage} de ${totalPages}`
              : null}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="white"
              size="sm"
              className="w-full sm:w-fit"
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
              type="button"
              variant="white"
              size="sm"
              className="w-full sm:w-fit"
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
      )}

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

      <AdminPasswordConfirmDialog
        open={deleteAllOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setDeleteAllOpen(false);
            setDeleteAllError(undefined);
          }
        }}
        title="Confirmar exclusão"
        description={
          <>
            Digite a senha do administrador logado para excluir{' '}
            <strong>todos os {teams.length} time(s)</strong> desta competição.
            Esta ação não pode ser desfeita.
          </>
        }
        confirmLabel="Apagar todos"
        confirmVariant="red"
        isLoading={isDeletingAll}
        error={deleteAllError}
        onConfirm={handleConfirmDeleteAll}
      />
    </div>
  );
}
