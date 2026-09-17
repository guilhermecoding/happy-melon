"use client";

import { useEffect, useMemo, useState } from 'react';
import { chefService } from '@/services/chef/chef.service';
import { getChefErrorMessage } from '@/services/chef/chef.error';
import type { Chef } from '@/services/chef/chef.type';
import BoxFeatures from '@/components/box-features';
import Spinner from '@/components/spinner';
import { Button } from '@/components/pouf/Button';
import { Switch } from '@/components/pouf/controls';
import { Table } from '@/components/pouf/table';
import { toast } from '@/components/pouf/toaster';
import { CreateChefSheet } from './create-chef-sheet';
import { EditChefSheet } from './edit-chef-sheet';
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

function orderChefs(chefs: Chef[]) {
  return [...chefs].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }),
  );
}

export function ChefsPanel({ contestId }: { contestId: string }) {
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [updatingAccess, setUpdatingAccess] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedChef, setSelectedChef] = useState<Chef | null>(null);

  const orderedChefs = useMemo(() => orderChefs(chefs), [chefs]);

  useEffect(() => {
    let active = true;

    async function loadChefs() {
      try {
        const data = await chefService.list(contestId);
        if (active) setChefs(data);
      } catch (loadError) {
        if (active) {
          setError(
            getChefErrorMessage(
              loadError,
              'Não foi possível carregar os chefes.',
            ),
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadChefs();
    return () => {
      active = false;
    };
  }, [contestId]);

  async function updateAccess(chef: Chef, hasAccess: boolean) {
    const previousHasAccess = chef.hasAccess;
    setError(undefined);
    setChefs((current) =>
      current.map((item) =>
        item.id === chef.id ? { ...item, hasAccess } : item,
      ),
    );
    setUpdatingAccess((current) => new Set(current).add(chef.id));

    try {
      const updatedChef = await chefService.setAccess(
        contestId,
        chef.id,
        hasAccess,
      );
      setChefs((current) =>
        current.map((item) =>
          item.id === updatedChef.id ? updatedChef : item,
        ),
      );
      toast.success(
        hasAccess
          ? `Acesso de ${chef.name} ativado.`
          : `Acesso de ${chef.name} desativado.`,
      );
    } catch (updateError) {
      setChefs((current) =>
        current.map((item) =>
          item.id === chef.id ? { ...item, hasAccess: previousHasAccess } : item,
        ),
      );
      const message = getChefErrorMessage(
        updateError,
        'Não foi possível atualizar o acesso do chefe.',
      );
      setError(message);
      toast.error(message);
    } finally {
      setUpdatingAccess((current) => {
        const next = new Set(current);
        next.delete(chef.id);
        return next;
      });
    }
  }

  function openEditSheet(chef: Chef) {
    setSelectedChef(chef);
    setEditOpen(true);
  }

  function replaceChef(updatedChef: Chef) {
    setChefs((current) =>
      current.map((chef) =>
        chef.id === updatedChef.id ? updatedChef : chef,
      ),
    );
  }

  function removeChef(chefId: string) {
    setChefs((current) => current.filter((chef) => chef.id !== chefId));
    if (selectedChef?.id === chefId) {
      setSelectedChef(null);
    }
  }

  const columns = [
    {
      key: 'id',
      header: '#',
      mono: true,
      render: (chef: Chef) => chef.id,
    },
    {
      key: 'name',
      header: 'Nome',
      render: (chef: Chef) => chef.name,
    },
    {
      key: 'email',
      header: 'Email',
      render: (chef: Chef) => chef.email,
    },
    {
      key: 'access',
      header: 'Acesso',
      render: (chef: Chef) => (
        <Switch
          checked={chef.hasAccess}
          disabled={updatingAccess.has(chef.id)}
          label={`Acesso de ${chef.name}`}
          onChange={(checked) => void updateAccess(chef, checked)}
        />
      ),
    },
    {
      key: 'lastAccess',
      header: 'Último acesso',
      render: (chef: Chef) => formatLastAccess(chef.lastAccess),
    },
    {
      key: 'actions',
      header: 'Editar',
      align: 'right' as const,
      render: (chef: Chef) => (
        <button
          type="button"
          aria-label={`Editar ${chef.name}`}
          onClick={() => openEditSheet(chef)}
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
        title="Chefes desta competição"
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

          {loading ? (
            <Spinner />
          ) : error && orderedChefs.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              Não foi possível carregar a lista.
            </p>
          ) : orderedChefs.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              Nenhum chefe cadastrado nesta competição.
            </p>
          ) : (
            <Table
              columns={columns}
              rows={orderedChefs}
              getKey={(chef) => chef.id}
            />
          )}
        </div>
      </BoxFeatures>

      <CreateChefSheet
        contestId={contestId}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(chef) => setChefs((current) => [...current, chef])}
      />
      <EditChefSheet
        contestId={contestId}
        chef={selectedChef}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdated={replaceChef}
        onDeleted={removeChef}
      />
    </>
  );
}
