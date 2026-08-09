"use client";

import { useEffect, useMemo, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { administratorService } from '@/services/administrator/administrator.service';
import { getAdministratorErrorMessage } from '@/services/administrator/administrator.error';
import type { Administrator } from '@/services/administrator/administrator.type';
import BoxFeatures from '@/components/box-features';
import Spinner from '@/components/spinner';
import { Button } from '@/components/pouf/Button';
import { Switch } from '@/components/pouf/controls';
import { Badge } from '@/components/pouf/media';
import { Table } from '@/components/pouf/table';
import { toast } from '@/components/pouf/toaster';
import { CreateAdministratorSheet } from './create-administrator-sheet';
import { EditAdministratorSheet } from './edit-administrator-sheet';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  CirclePlusIcon,
  Crown03Icon,
  PencilEdit02Icon,
} from '@hugeicons/core-free-icons';

function formatLastAccess(lastAccess: string | null) {
  if (!lastAccess) {
    return 'Nunca';
  }

  return new Date(lastAccess).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

/** Logged-in admin first, then A–Z by name (pt-BR). */
function orderAdministrators(
  administrators: Administrator[],
  currentUserId?: string,
) {
  return [...administrators].sort((a, b) => {
    if (currentUserId) {
      if (a.id === currentUserId) return -1;
      if (b.id === currentUserId) return 1;
    }

    return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
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

  const orderedAdministrators = useMemo(
    () => orderAdministrators(administrators, currentUserId),
    [administrators, currentUserId],
  );

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
      toast.success(hasAccess
          ? `Acesso de ${administrator.name} ativado.`
          : `Acesso de ${administrator.name} desativado.`);
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
      toast.error(message);
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

  const columns = [
    {
      key: 'id',
      header: '#',
      mono: true,
      render: (administrator: Administrator) => administrator.id,
    },
    {
      key: 'name',
      header: 'Nome',
      render: (administrator: Administrator) => (
        <span className="inline-flex items-center gap-2">
          {administrator.name}
          {administrator.id === currentUserId && <Badge tone="mint">Você</Badge>}
        </span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (administrator: Administrator) => administrator.email,
    },
    {
      key: 'access',
      header: 'Acesso',
      render: (administrator: Administrator) => (
        <Switch
          checked={administrator.hasAccess}
          disabled={
            administrator.id === currentUserId ||
            updatingAccess.has(administrator.id)
          }
          label={`Acesso de ${administrator.name}`}
          onChange={(checked) => void updateAccess(administrator, checked)}
        />
      ),
    },
    {
      key: 'lastAccess',
      header: 'Último acesso',
      render: (administrator: Administrator) =>
        formatLastAccess(administrator.lastAccess),
    },
    {
      key: 'actions',
      header: 'Editar',
      align: 'right' as const,
      /* A bare button, not a cushion: one pill per row would outweigh the data
         it belongs to. */
      render: (administrator: Administrator) => (
        <button
          type="button"
          aria-label={`Editar ${administrator.name}`}
          onClick={() => openEditSheet(administrator)}
          className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgba(155,106,255,0.55)]"
        >
          <HugeiconsIcon
            icon={PencilEdit02Icon}
            className="size-5"
            strokeWidth={2}
          />
        </button>
      ),
    },
  ];

  return (
    <>
      <BoxFeatures
        title="Administradores"
        icon={Crown03Icon}
        blobSize="sm"
        blobTone="blue"
      >
        <div className="flex h-full flex-col gap-4 p-4">
          <div className="flex justify-end">
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

          {/* The pouf Table's empty state is English, so every "no rows" branch
              is decided here instead. */}
          {loading ? (
            <Spinner />
          ) : error && orderedAdministrators.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              Não foi possível carregar a lista.
            </p>
          ) : orderedAdministrators.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              Nenhum administrador encontrado.
            </p>
          ) : (
            <Table
              columns={columns}
              rows={orderedAdministrators}
              getKey={(administrator) => administrator.id}
            />
          )}
        </div>
      </BoxFeatures>

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
    </>
  );
}
