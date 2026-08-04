'use client';

import { useEffect, useMemo, useState } from 'react';
import { collaboratorService } from '@/services/collaborator/collaborator.service';
import { getCollaboratorErrorMessage } from '@/services/collaborator/collaborator.error';
import type { Collaborator } from '@/services/collaborator/collaborator.type';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';
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
import { CirclePlusIcon, PencilEdit02Icon } from '@hugeicons/core-free-icons';

function formatLastAccess(lastAccess: string | null) {
  if (!lastAccess) {
    return 'Nunca';
  }

  return new Date(lastAccess).toLocaleString('pt-BR', {
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
  const [updatingAccess, setUpdatingAccess] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] =
    useState<Collaborator | null>(null);

  const orderedCollaborators = useMemo(
    () => orderCollaborators(collaborators),
    [collaborators],
  );

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

  function removeCollaborator(collaboratorId: string) {
    setCollaborators((current) =>
      current.filter((collaborator) => collaborator.id !== collaboratorId),
    );
    if (selectedCollaborator?.id === collaboratorId) {
      setSelectedCollaborator(null);
    }
  }

  return (
    <div className="flex flex-col gap-4 mt-6">
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
              <TableHead className="w-20 px-4 font-bold">#</TableHead>
              <TableHead className="px-4 font-bold">Nome</TableHead>
              <TableHead className="px-4 font-bold">Email</TableHead>
              <TableHead className="px-4 font-bold">Acesso</TableHead>
              <TableHead className="px-4 font-bold">Último acesso</TableHead>
              <TableHead className="w-16 px-4 font-bold text-right">
                Editar
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
            ) : error && orderedCollaborators.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 px-4 text-center text-muted-foreground"
                >
                  Não foi possível carregar a lista.
                </TableCell>
              </TableRow>
            ) : orderedCollaborators.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 px-4 text-center text-muted-foreground"
                >
                  Nenhum colaborador encontrado.
                </TableCell>
              </TableRow>
            ) : (
              orderedCollaborators.map((collaborator, index) => (
                <TableRow
                  key={collaborator.id}
                  className={index % 2 === 0 ? 'bg-white' : ''}
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
                    {formatLastAccess(collaborator.lastAccess)}
                  </TableCell>
                  <TableCell className="px-4 text-right">
                    <Button
                      type="button"
                      variant="normal"
                      size="icon"
                      className="size-9"
                      aria-label={`Editar ${collaborator.name}`}
                      onClick={() => openEditSheet(collaborator)}
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
        onDeleted={removeCollaborator}
      />
    </div>
  );
}
