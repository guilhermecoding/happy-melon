'use client';

import { useEffect, useMemo, useState } from 'react';
import { collaboratorService } from '@/services/collaborator/collaborator.service';
import { getCollaboratorErrorMessage } from '@/services/collaborator/collaborator.error';
import type { Collaborator } from '@/services/collaborator/collaborator.type';
import { Button } from '@/components/pouf/Button';
import { Confirm, Switch } from '@/components/pouf/controls';
import { DropdownMenu } from '@/components/pouf/menu';
import { Table } from '@/components/pouf/table';
import { toast } from '@/components/pouf/toaster';
import { CreateCollaboratorSheet } from './create-collaborator-sheet';
import { EditCollaboratorSheet } from './edit-collaborator-sheet';
import { CollaboratorSettingsDialog } from './collaborator-settings-dialog';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CirclePlusIcon,
  CustomizeIcon,
  Delete01Icon,
  MoreHorizontalIcon,
  PencilEdit02Icon,
} from '@hugeicons/core-free-icons';
import Spinner from '@/components/spinner';

const PAGE_SIZE = 5;

function formatDateTime(value: string | null) {
  if (!value) {
    return 'Nunca';
  }

  return new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function orderCollaborators(collaborators: Collaborator[]) {
  return [...collaborators].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }),
  );
}

type BoxListCollaboratorsProps = {
  contestId: string;
};

export default function BoxListCollaborators({
  contestId,
}: BoxListCollaboratorsProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [page, setPage] = useState(1);
  const [updatingAccess, setUpdatingAccess] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] =
    useState<Collaborator | null>(null);
  const [collaboratorToDelete, setCollaboratorToDelete] =
    useState<Collaborator | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const orderedCollaborators = useMemo(
    () => orderCollaborators(collaborators),
    [collaborators],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(orderedCollaborators.length / PAGE_SIZE),
  );
  const currentPage = Math.min(page, totalPages);

  const paginatedCollaborators = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return orderedCollaborators.slice(start, start + PAGE_SIZE);
  }, [orderedCollaborators, currentPage]);

  const rangeStart =
    orderedCollaborators.length === 0
      ? 0
      : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(
    currentPage * PAGE_SIZE,
    orderedCollaborators.length,
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    let active = true;

    async function loadCollaborators() {
      try {
        const data = await collaboratorService.list(contestId);
        if (active) setCollaborators(data);
      } catch (loadError) {
        if (active) {
          setError(
            getCollaboratorErrorMessage(
              loadError,
              'Não foi possível carregar os colaboradores.',
            ),
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadCollaborators();
    return () => {
      active = false;
    };
  }, [contestId]);

  async function updateAccess(collaborator: Collaborator, hasAccess: boolean) {
    const previousHasAccess = collaborator.hasAccess;
    setError(undefined);
    setCollaborators((current) =>
      current.map((item) =>
        item.id === collaborator.id ? { ...item, hasAccess } : item,
      ),
    );
    setUpdatingAccess((current) => new Set(current).add(collaborator.id));

    try {
      const updated = await collaboratorService.setAccess(
        contestId,
        collaborator.id,
        hasAccess,
      );
      setCollaborators((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success(hasAccess
        ? `Acesso de ${collaborator.name} ativado.`
        : `Acesso de ${collaborator.name} desativado.`);
    } catch (updateError) {
      setCollaborators((current) =>
        current.map((item) =>
          item.id === collaborator.id
            ? { ...item, hasAccess: previousHasAccess }
            : item,
        ),
      );
      const message = getCollaboratorErrorMessage(
        updateError,
        'Não foi possível atualizar o acesso do colaborador.',
      );
      setError(message);
      toast.error(message);
    } finally {
      setUpdatingAccess((current) => {
        const next = new Set(current);
        next.delete(collaborator.id);
        return next;
      });
    }
  }

  function openEditSheet(collaborator: Collaborator) {
    setSelectedCollaborator(collaborator);
    setEditOpen(true);
  }

  function replaceCollaborator(updated: Collaborator) {
    setCollaborators((current) =>
      current.map((collaborator) =>
        collaborator.id === updated.id ? updated : collaborator,
      ),
    );
  }

  function removeCollaboratorFromList(collaboratorId: string) {
    setCollaborators((current) =>
      current.filter((collaborator) => collaborator.id !== collaboratorId),
    );
    if (selectedCollaborator?.id === collaboratorId) {
      setSelectedCollaborator(null);
    }
  }

  async function handleDelete() {
    if (!collaboratorToDelete) return;

    setIsDeleting(true);
    try {
      await collaboratorService.remove(contestId, collaboratorToDelete.id);
      removeCollaboratorFromList(collaboratorToDelete.id);
      setCollaboratorToDelete(null);
      toast.success('Colaborador removido com sucesso.');
    } catch (deleteError) {
      const message = getCollaboratorErrorMessage(
        deleteError,
        'Não foi possível excluir o colaborador.',
      );
      setError(message);
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  }

  const columns = [
    {
      key: 'id',
      header: 'ID',
      mono: true,
      render: (collaborator: Collaborator) => collaborator.id,
    },
    {
      key: 'name',
      header: 'Nome',
      render: (collaborator: Collaborator) => collaborator.name,
    },
    {
      key: 'email',
      header: 'Email',
      render: (collaborator: Collaborator) => collaborator.email,
    },
    {
      key: 'access',
      header: 'Acesso',
      render: (collaborator: Collaborator) => (
        <Switch
          checked={collaborator.hasAccess}
          disabled={updatingAccess.has(collaborator.id)}
          label={`Acesso de ${collaborator.name}`}
          onChange={(checked) => void updateAccess(collaborator, checked)}
        />
      ),
    },
    {
      key: 'lastAccess',
      header: 'Último acesso',
      render: (collaborator: Collaborator) =>
        formatDateTime(collaborator.lastAccess),
    },
    {
      key: 'createdAt',
      header: 'Ingresso',
      render: (collaborator: Collaborator) =>
        formatDateTime(collaborator.createdAt),
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right' as const,
      render: (collaborator: Collaborator) => (
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
              onClick: () => openEditSheet(collaborator),
            },
            {
              label: 'Remover',
              tone: 'down' as const,
              icon: (
                <HugeiconsIcon
                  icon={Delete01Icon}
                  className="size-4"
                  strokeWidth={2}
                />
              ),
              onClick: () => setCollaboratorToDelete(collaborator),
            },
          ]}
        >
          {/* A bare button, not a cushion: one pill per row would outweigh the
              data it belongs to. */}
          <button
            type="button"
            aria-label={`Opções de ${collaborator.name}`}
            className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgba(155,106,255,0.55)]"
          >
            <HugeiconsIcon
              icon={MoreHorizontalIcon}
              className="size-5"
              strokeWidth={2}
            />
          </button>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="flex h-full flex-1 flex-col gap-4 p-4">
      <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
        <Button tone="orange" size="sm" onClick={() => setSettingsOpen(true)}>
          <HugeiconsIcon
            icon={CustomizeIcon}
            className="size-5"
            strokeWidth={2.5}
          />
          Ajustes
        </Button>
        <Button tone="blue" size="sm" onClick={() => setCreateOpen(true)}>
          <HugeiconsIcon
            icon={CirclePlusIcon}
            className="size-5"
            strokeWidth={3}
          />
          Adicionar
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {/* The pouf Table's empty state is English, so every "no rows" branch is
          decided here instead. */}
      {loading ? (
        <Spinner />
      ) : error && orderedCollaborators.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          Ops! Não foi possível carregar a lista.
        </p>
      ) : orderedCollaborators.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          Nenhum colaborador ingressou ainda.
        </p>
      ) : (
        <>
          <div className="min-h-0 flex-1">
            <Table
              columns={columns}
              rows={paginatedCollaborators}
              getKey={(collaborator) => collaborator.id}
            />
          </div>

          <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {rangeStart}–{rangeEnd} de {orderedCollaborators.length}
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

      <CreateCollaboratorSheet
        contestId={contestId}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(collaborator) =>
          setCollaborators((current) => [...current, collaborator])
        }
      />
      <EditCollaboratorSheet
        contestId={contestId}
        collaborator={selectedCollaborator}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdated={replaceCollaborator}
        onDeleted={removeCollaboratorFromList}
      />

      <CollaboratorSettingsDialog
        contestId={contestId}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />

      <Confirm
        open={collaboratorToDelete !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && isDeleting) return;
          if (!nextOpen) setCollaboratorToDelete(null);
        }}
        title="Excluir colaborador"
        body={`Remover ${collaboratorToDelete?.name ?? 'o colaborador'} desta competição? Se não houver vínculo em outras competições, a conta será excluída.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        tone="pink"
        loading={isDeleting}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
