"use client";

import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { administratorService } from '@/services/administrator/administrator.service';
import { getAdministratorErrorMessage } from '@/services/administrator/administrator.error';
import type { Administrator } from '@/services/administrator/administrator.type';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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
    } catch (updateError) {
      setAdministrators((current) =>
        current.map((item) =>
          item.id === administrator.id
            ? { ...item, hasAccess: previousHasAccess }
            : item,
        ),
      );
      setError(
        getAdministratorErrorMessage(
          updateError,
          'Não foi possível atualizar o acesso do administrador.',
        ),
      );
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

      <div className="overflow-hidden rounded-2xl p-2 border bg-muted">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Acesso</TableHead>
              <TableHead className="w-16 text-right">Opções</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : error && administrators.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Não foi possível carregar a lista.
                </TableCell>
              </TableRow>
            ) : administrators.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Nenhum administrador encontrado.
                </TableCell>
              </TableRow>
            ) : (
              administrators.map((administrator) => (
                <TableRow key={administrator.id}>
                  <TableCell className="font-mono text-xs">{administrator.id}</TableCell>
                  <TableCell>{administrator.name}</TableCell>
                  <TableCell>{administrator.email}</TableCell>
                  <TableCell>
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
                  <TableCell className="text-right">
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
      />
    </div>
  );
}
