'use client';

import { useEffect, useMemo, useState } from 'react';
import { collaboratorService } from '@/services/collaborator/collaborator.service';
import { getCollaboratorErrorMessage } from '@/services/collaborator/collaborator.error';
import type { Collaborator } from '@/services/collaborator/collaborator.type';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CreateCollaboratorSheet } from './create-collaborator-sheet';
import { EditCollaboratorSheet } from './edit-collaborator-sheet';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CirclePlusIcon,
  Delete01Icon,
  MoreHorizontalIcon,
  PencilEdit02Icon,
} from '@hugeicons/core-free-icons';

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
      toast.add({
        title: hasAccess
          ? `Acesso de ${collaborator.name} ativado.`
          : `Acesso de ${collaborator.name} desativado.`,
        type: 'success',
      });
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
      toast.add({
        title: message,
        type: 'error',
      });
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
      toast.add({
        title: 'Colaborador removido com sucesso.',
        type: 'success',
      });
    } catch (deleteError) {
      const message = getCollaboratorErrorMessage(
        deleteError,
        'Não foi possível excluir o colaborador.',
      );
      setError(message);
      toast.add({
        title: message,
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex h-full flex-1 flex-col gap-4 p-4 pt-6">
      <div className="flex justify-end">
        <Button
          onClick={() => setCreateOpen(true)}
          className="w-full sm:w-auto"
          size="sm"
        >
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

      <div className="overflow-hidden rounded-2xl border bg-muted">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20 px-4 font-bold">ID</TableHead>
              <TableHead className="px-4 font-bold">Nome</TableHead>
              <TableHead className="px-4 font-bold">Email</TableHead>
              <TableHead className="px-4 font-bold">Acesso</TableHead>
              <TableHead className="px-4 font-bold">Último acesso</TableHead>
              <TableHead className="px-4 font-bold">Inscrição</TableHead>
              <TableHead className="w-24 px-4 font-bold text-right">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 px-4 text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : error && orderedCollaborators.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 px-4 text-center text-muted-foreground"
                >
                  Não foi possível carregar a lista.
                </TableCell>
              </TableRow>
            ) : orderedCollaborators.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 px-4 text-center text-muted-foreground"
                >
                  Nenhum colaborador encontrado.
                </TableCell>
              </TableRow>
            ) : (
              paginatedCollaborators.map((collaborator, index) => {
                const absoluteIndex = (currentPage - 1) * PAGE_SIZE + index;

                return (
                  <TableRow
                    key={collaborator.id}
                    className={absoluteIndex % 2 === 0 ? 'bg-white' : ''}
                  >
                    <TableCell className="w-20 px-4 whitespace-nowrap font-mono text-xs">
                      {collaborator.id}
                    </TableCell>
                    <TableCell className="px-4">{collaborator.name}</TableCell>
                    <TableCell className="px-4">{collaborator.email}</TableCell>
                    <TableCell className="px-4">
                      <Switch
                        checked={collaborator.hasAccess}
                        disabled={updatingAccess.has(collaborator.id)}
                        aria-label={`Acesso de ${collaborator.name}`}
                        onCheckedChange={(checked) =>
                          void updateAccess(collaborator, checked)
                        }
                      />
                    </TableCell>
                    <TableCell className="px-4 text-muted-foreground">
                      {formatDateTime(collaborator.lastAccess)}
                    </TableCell>
                    <TableCell className="px-4 text-muted-foreground">
                      {formatDateTime(collaborator.createdAt)}
                    </TableCell>
                    <TableCell className="px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              type="button"
                              variant="normal"
                              size="icon"
                              className="size-9"
                              aria-label={`Opções de ${collaborator.name}`}
                            />
                          }
                        >
                          <HugeiconsIcon
                            icon={MoreHorizontalIcon}
                            className="size-5"
                            strokeWidth={1.5}
                          />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-40">
                          <DropdownMenuItem
                            onClick={() => openEditSheet(collaborator)}
                          >
                            <HugeiconsIcon
                              icon={PencilEdit02Icon}
                              className="size-4"
                              strokeWidth={1.5}
                            />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setCollaboratorToDelete(collaborator)}
                          >
                            <HugeiconsIcon
                              icon={Delete01Icon}
                              className="size-4"
                              strokeWidth={1.5}
                            />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && orderedCollaborators.length > 0 && (
        <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {rangeStart}–{rangeEnd} de {orderedCollaborators.length}
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

      <Dialog
        open={collaboratorToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setCollaboratorToDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Excluir colaborador</DialogTitle>
            <DialogDescription>
              Remover <strong>{collaboratorToDelete?.name}</strong> desta competição? Se não
              houver vínculo em outras competições, a conta será excluída.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="white"
              size="sm"
              onClick={() => setCollaboratorToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="red"
              size="sm"
              loading={isDeleting}
              onClick={() => void handleDelete()}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
