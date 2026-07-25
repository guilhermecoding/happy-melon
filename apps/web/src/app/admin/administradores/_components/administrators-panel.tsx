"use client";

import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { administratorService } from '@/services/administrator/administrator.service';
import { getAdministratorErrorMessage } from '@/services/administrator/administrator.error';
import type { Administrator } from '@/services/administrator/administrator.type';
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
import { CreateAdministratorSheet } from './create-administrator-sheet';
import { EditAdministratorSheet } from './edit-administrator-sheet';
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

export function AdministratorsPanel() {
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user.id;
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [updatingAccess, setUpdatingAccess] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedAdministrator, setSelectedAdministrator] =
    useState<Administrator | null>(null);

  useEffect(() => {
    let active = true;

    async function loadAdministrators() {
      try {
        const data = await administratorService.list();
        if (active) setAdministrators(data);
      } catch (loadError) {
        if (active) {
          setError(
            getAdministratorErrorMessage(
              loadError,
              'Não foi possível carregar os administradores.',
            ),
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadAdministrators();
    return () => {
      active = false;
    };
  }, []);

  async function updateAccess(administrator: Administrator, hasAccess: boolean) {
    const previousHasAccess = administrator.hasAccess;
    setError(undefined);
    setAdministrators((current) =>
      current.map((item) =>
        item.id === administrator.id ? { ...item, hasAccess } : item,
      ),
    );
    setUpdatingAccess((current) => new Set(current).add(administrator.id));

    try {
      const updatedAdministrator = await administratorService.setAccess(
        administrator.id,
        hasAccess,
      );
      setAdministrators((current) =>
        current.map((item) =>
          item.id === updatedAdministrator.id ? updatedAdministrator : item,
        ),
      );
      toast.add({
        title: hasAccess
          ? `Acesso de ${administrator.name} ativado.`
          : `Acesso de ${administrator.name} desativado.`,
        type: 'success',
      });
    } catch (updateError) {
      setAdministrators((current) =>
        current.map((item) =>
          item.id === administrator.id
            ? { ...item, hasAccess: previousHasAccess }
            : item,
        ),
      );
      const message = getAdministratorErrorMessage(
        updateError,
        'Não foi possível atualizar o acesso do administrador.',
      );
      setError(message);
      toast.add({
        title: message,
        type: 'error',
      });
    } finally {
      setUpdatingAccess((current) => {
        const next = new Set(current);
        next.delete(administrator.id);
        return next;
      });
    }
  }

  function openEditSheet(administrator: Administrator) {
    setSelectedAdministrator(administrator);
    setEditOpen(true);
  }

  function replaceAdministrator(updatedAdministrator: Administrator) {
    setAdministrators((current) =>
      current.map((administrator) =>
        administrator.id === updatedAdministrator.id
          ? updatedAdministrator
          : administrator,
      ),
    );
  }

  function removeAdministrator(administratorId: string) {
    setAdministrators((current) =>
      current.filter((administrator) => administrator.id !== administratorId),
    );
    if (selectedAdministrator?.id === administratorId) {
      setSelectedAdministrator(null);
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
          <HugeiconsIcon icon={CirclePlusIcon} className="size-5" strokeWidth={3} />
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
              <TableHead className="w-16 px-4 font-bold text-right">Editar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 px-4 text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : error && administrators.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 px-4 text-center text-muted-foreground">
                  Não foi possível carregar a lista.
                </TableCell>
              </TableRow>
            ) : administrators.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 px-4 text-center text-muted-foreground">
                  Nenhum administrador encontrado.
                </TableCell>
              </TableRow>
            ) : (
              administrators.map((administrator, index) => (
                <TableRow key={administrator.id} className={index % 2 === 0 ? 'bg-white' : ''}>
                  <TableCell className="w-20 px-4 whitespace-nowrap font-mono text-xs">
                    {administrator.id}
                  </TableCell>
                  <TableCell className="px-4">{administrator.name}</TableCell>
                  <TableCell className="px-4">{administrator.email}</TableCell>
                  <TableCell className="px-4">
                    <Switch
                      checked={administrator.hasAccess}
                      disabled={
                        administrator.id === currentUserId ||
                        updatingAccess.has(administrator.id)
                      }
                      aria-label={`Acesso de ${administrator.name}`}
                      onCheckedChange={(checked) =>
                        void updateAccess(administrator, checked)
                      }
                    />
                  </TableCell>
                  <TableCell className="px-4 text-muted-foreground">
                    {formatLastAccess(administrator.lastAccess)}
                  </TableCell>
                  <TableCell className="px-4 text-right">
                    <Button
                      type="button"
                      variant="normal"
                      size="icon"
                      className="size-9"
                      aria-label={`Editar ${administrator.name}`}
                      onClick={() => openEditSheet(administrator)}
                    >
                      <HugeiconsIcon icon={PencilEdit02Icon} className="size-5" strokeWidth={1.5} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CreateAdministratorSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(administrator) =>
          setAdministrators((current) => [...current, administrator])
        }
      />
      <EditAdministratorSheet
        administrator={selectedAdministrator}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdated={replaceAdministrator}
        onDeleted={removeAdministrator}
      />
    </div>
  );
}
