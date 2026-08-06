'use client';

import { useEffect, useState } from 'react';
import { contestService } from '@/services/contest/contest.service';
import { getContestErrorMessage } from '@/services/contest/contest.error';
import type { StaffSettingsInput } from '@/services/contest/contest.type';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';

type CollaboratorSettingsDialogProps = {
  contestId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const EMPTY_SETTINGS: StaffSettingsInput = {
  balloonLimitEnabled: false,
  balloonLimit: null,
  deliveryTimeoutEnabled: false,
  deliveryTimeoutMinutes: null,
};

export function CollaboratorSettingsDialog({
  contestId,
  open,
  onOpenChange,
}: CollaboratorSettingsDialogProps) {
  const [settings, setSettings] = useState<StaffSettingsInput>(EMPTY_SETTINGS);
  const [balloonLimitInput, setBalloonLimitInput] = useState('');
  const [timeoutInput, setTimeoutInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    let active = true;

    async function loadSettings() {
      setLoading(true);
      try {
        const contest = await contestService.get(contestId);
        if (!active) return;

        setSettings({
          balloonLimitEnabled: contest.balloonLimitEnabled,
          balloonLimit: contest.balloonLimit,
          deliveryTimeoutEnabled: contest.deliveryTimeoutEnabled,
          deliveryTimeoutMinutes: contest.deliveryTimeoutMinutes,
        });
        setBalloonLimitInput(
          contest.balloonLimit !== null ? String(contest.balloonLimit) : '',
        );
        setTimeoutInput(
          contest.deliveryTimeoutMinutes !== null
            ? String(contest.deliveryTimeoutMinutes)
            : '',
        );
      } catch (error) {
        if (!active) return;
        const message = getContestErrorMessage(
          error,
          'Não foi possível carregar os ajustes.',
        );
        toast.add({ title: message, type: 'error' });
        onOpenChange(false);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadSettings();
    return () => {
      active = false;
    };
  }, [contestId, open, onOpenChange]);

  function parsePositiveInt(value: string): number | null {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return null;
    }
    return parsed;
  }

  async function handleSave() {
    const balloonLimit = settings.balloonLimitEnabled
      ? parsePositiveInt(balloonLimitInput)
      : null;
    const deliveryTimeoutMinutes = settings.deliveryTimeoutEnabled
      ? parsePositiveInt(timeoutInput)
      : null;

    if (settings.balloonLimitEnabled && balloonLimit === null) {
      toast.add({
        title: 'Informe um limite de balões válido (mínimo 1).',
        type: 'error',
      });
      return;
    }

    if (settings.deliveryTimeoutEnabled && deliveryTimeoutMinutes === null) {
      toast.add({
        title: 'Informe um timeout válido em minutos (mínimo 1).',
        type: 'error',
      });
      return;
    }

    const payload: StaffSettingsInput = {
      balloonLimitEnabled: settings.balloonLimitEnabled,
      balloonLimit,
      deliveryTimeoutEnabled: settings.deliveryTimeoutEnabled,
      deliveryTimeoutMinutes,
    };

    setSaving(true);
    try {
      await contestService.updateStaffSettings(contestId, payload);
      toast.add({
        title: 'Ajustes salvos com sucesso.',
        type: 'success',
      });
      onOpenChange(false);
    } catch (error) {
      const message = getContestErrorMessage(
        error,
        'Não foi possível salvar os ajustes.',
      );
      toast.add({ title: message, type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Ajustes</DialogTitle>
          <DialogDescription>
            Configure limites para os colaboradores desta competição.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">Limite de balões</span>
                  <span className="text-xs text-muted-foreground">
                    Número máximo de balões que um staff pode pegar simultaneamente antes de ser entregue.
                  </span>
                </div>
                <Switch
                  checked={settings.balloonLimitEnabled}
                  aria-label="Limite de balões"
                  onCheckedChange={(checked) =>
                    setSettings((current) => ({
                      ...current,
                      balloonLimitEnabled: checked,
                      balloonLimit: checked ? current.balloonLimit : null,
                    }))
                  }
                />
              </div>
              {settings.balloonLimitEnabled ? (
                <Field>
                  <FieldLabel htmlFor="balloon-limit">Quantidade</FieldLabel>
                  <Input
                    id="balloon-limit"
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    value={balloonLimitInput}
                    onChange={(event) =>
                      setBalloonLimitInput(event.target.value)
                    }
                    placeholder="Ex: 3"
                  />
                </Field>
              ) : null}
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">Timeout de entrega</span>
                  <span className="text-xs text-muted-foreground">
                    Tempo máximo (em minutos) que um staff pode ficar com o
                    balão antes de ser entregue.
                  </span>
                </div>
                <Switch
                  checked={settings.deliveryTimeoutEnabled}
                  aria-label="Timeout de entrega"
                  onCheckedChange={(checked) =>
                    setSettings((current) => ({
                      ...current,
                      deliveryTimeoutEnabled: checked,
                      deliveryTimeoutMinutes: checked
                        ? current.deliveryTimeoutMinutes
                        : null,
                    }))
                  }
                />
              </div>
              {settings.deliveryTimeoutEnabled ? (
                <Field>
                  <FieldLabel htmlFor="delivery-timeout">
                    Minutos
                  </FieldLabel>
                  <Input
                    id="delivery-timeout"
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    value={timeoutInput}
                    onChange={(event) => setTimeoutInput(event.target.value)}
                    placeholder="Ex: 10"
                  />
                </Field>
              ) : null}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="white"
            size="sm"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            loading={saving}
            disabled={loading || saving}
            onClick={() => void handleSave()}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
