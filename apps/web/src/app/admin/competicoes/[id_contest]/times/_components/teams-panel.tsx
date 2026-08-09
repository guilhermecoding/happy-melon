"use client";

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Award01Icon,
  Delete01Icon,
  Download01Icon,
  MoreHorizontalIcon,
  PencilEdit02Icon,
  PlusSignCircleIcon,
  Search01Icon,
  UserMultiple02Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { AdminPasswordConfirmDialog } from '@/components/admin-password-confirm-dialog';
import BoxFeatures from '@/components/box-features';
import Spinner from '@/components/spinner';
import { Button, IconButton } from '@/components/pouf/Button';
import { Input } from '@/components/pouf/Input';
import { DropdownMenu } from '@/components/pouf/menu';
import { Table } from '@/components/pouf/table';
import { toast } from '@/components/pouf/toaster';
import { teamService } from '@/services/team/team.service';
import { getTeamErrorMessage } from '@/services/team/team.error';
import type { Team } from '@/services/team/team.type';
import { CreateTeamSheet } from './create-team-sheet';
import { EditTeamSheet } from './edit-team-sheet';
import { TeamAchievementsDialog } from './team-achievements-dialog';
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
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [achievementsTeam, setAchievementsTeam] = useState<Team | null>(null);
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

  function openAchievementsDialog(team: Team) {
    setAchievementsTeam(team);
    setAchievementsOpen(true);
  }

  function handleDownloadTeams() {
    if (teams.length === 0) {
      toast.error('Não há times para baixar.');
      return;
    }

    const orderedTeams = [...teams].sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }),
    );

    downloadTeamsCsv(orderedTeams, `times-${contestId}.csv`);
    toast.success(`${orderedTeams.length} time(s) exportado(s).`);
  }

  async function handleConfirmDeleteAll(password: string) {
    setIsDeletingAll(true);
    setDeleteAllError(undefined);

    try {
      const result = await teamService.removeAll(contestId, { password });
      setTeams([]);
      setSelectedTeam(null);
      setDeleteAllOpen(false);
      toast.success(result.deletedCount > 0
            ? `${result.deletedCount} time(s) excluído(s) com sucesso.`
            : 'Nenhum time para excluir.');
    } catch (deleteError) {
      const message = getTeamErrorMessage(
        deleteError,
        'Não foi possível excluir os times.',
      );
      setDeleteAllError(message);
      toast.error(message);
    } finally {
      setIsDeletingAll(false);
    }
  }

  const columns = [
    {
      key: 'id',
      header: 'ID',
      mono: true,
      render: (team: Team) => team.id,
    },
    {
      key: 'name',
      header: 'Nome',
      render: (team: Team) => team.name,
    },
    {
      key: 'usernameTeam',
      header: 'Usuário',
      render: (team: Team) => team.usernameTeam,
    },
    {
      key: 'room',
      header: 'Sala',
      render: (team: Team) => team.room || '—',
    },
    {
      key: 'machine',
      header: 'Máquina',
      render: (team: Team) => team.machine || '—',
    },
    {
      key: 'actions',
      header: 'Opções',
      align: 'right' as const,
      render: (team: Team) => (
        <DropdownMenu
          items={[
            {
              label: 'Editar',
              icon: (
                <HugeiconsIcon
                  icon={PencilEdit02Icon}
                  className="size-4"
                  strokeWidth={2}
                />
              ),
              onClick: () => openEditSheet(team),
            },
            {
              label: 'Conquistas',
              icon: (
                <HugeiconsIcon
                  icon={Award01Icon}
                  className="size-4"
                  strokeWidth={2}
                />
              ),
              onClick: () => openAchievementsDialog(team),
            },
          ]}
        >
          <IconButton
            size="sm"
            label={`Opções de ${team.name}`}
            icon={
              <HugeiconsIcon
                icon={MoreHorizontalIcon}
                className="size-5"
                strokeWidth={2}
              />
            }
          />
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <BoxFeatures
        title="Times"
        icon={UserMultiple02Icon}
        blobSize="sm"
        blobTone="blue"
      >
        <div className="flex h-full flex-col gap-4 p-4">
          <div className="flex flex-col gap-3 @5xl/main:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full justify-start sm:max-w-86">
              <Input
                value={search}
                onChange={setSearch}
                placeholder="Buscar times..."
                label="Buscar times"
                icon={
                  <HugeiconsIcon
                    icon={Search01Icon}
                    className="size-5"
                    strokeWidth={2}
                  />
                }
              />
            </div>

            <div className="flex w-full flex-col-reverse justify-start gap-2 sm:flex-row @5xl/main:justify-end">
              <Button
                tone="orange"
                size="sm"
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
                tone="pink"
                size="sm"
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

              <Button tone="blue" size="sm" onClick={() => setCreateOpen(true)}>
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

          {/* The pouf Table has an English empty state, so every "no rows"
              branch is decided here instead. */}
          {loading ? (
            <Spinner />
          ) : error && teams.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              Não foi possível carregar a lista.
            </p>
          ) : filteredTeams.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              {search.trim()
                ? 'Nenhum time encontrado para a busca.'
                : 'Nenhum time cadastrado.'}
            </p>
          ) : (
            <>
              <div className="min-h-0 flex-1">
                <Table
                  columns={columns}
                  rows={paginatedTeams}
                  getKey={(team) => team.id}
                />
              </div>

              <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando {rangeStart}–{rangeEnd} de {filteredTeams.length}
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
          )}
        </div>
      </BoxFeatures>

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

      <TeamAchievementsDialog
        contestId={contestId}
        team={achievementsTeam}
        open={achievementsOpen}
        onOpenChange={(nextOpen) => {
          setAchievementsOpen(nextOpen);
          if (!nextOpen) {
            setAchievementsTeam(null);
          }
        }}
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
        confirmTone="pink"
        isLoading={isDeletingAll}
        error={deleteAllError}
        onConfirm={handleConfirmDeleteAll}
      />
    </>
  );
}
