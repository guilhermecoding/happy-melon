'use client';

import { useEffect, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { EyeClosedIcon, SaveIcon } from '@hugeicons/core-free-icons';
import { contestService } from '@/services/contest/contest.service';
import { getContestErrorMessage } from '@/services/contest/contest.error';
import type { StaffSettingsInput } from '@/services/contest/contest.type';
import { Button } from '@/components/pouf/Button';
import { Dialog, Switch } from '@/components/pouf/controls';
import { Field, Input } from '@/components/pouf/Input';
import { RowCard } from '@/components/pouf/surface';
import Spinner from '@/components/spinner';
import { toast } from '@/components/pouf/toaster';

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
  multiTouchBanEnabled: false,
  multiTouchBanSeconds: null,
};

export function CollaboratorSettingsDialog({
  contestId,
  open,
  onOpenChange,
}: CollaboratorSettingsDialogProps) {
  const [settings, setSettings] = useState<StaffSettingsInput>(EMPTY_SETTINGS);
  const [balloonLimitInput, setBalloonLimitInput] = useState('');
  const [timeoutInput, setTimeoutInput] = useState('');
  const [multiTouchSecondsInput, setMultiTouchSecondsInput] = useState('');
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
          multiTouchBanEnabled: contest.multiTouchBanEnabled,
          multiTouchBanSeconds: contest.multiTouchBanSeconds,
        });
        setBalloonLimitInput(
          contest.balloonLimit !== null ? String(contest.balloonLimit) : '',
        );
        setTimeoutInput(
          contest.deliveryTimeoutMinutes !== null
            ? String(contest.deliveryTimeoutMinutes)
            : '',
        );
        setMultiTouchSecondsInput(
          contest.multiTouchBanSeconds !== null
            ? String(contest.multiTouchBanSeconds)
            : '',
        );
      } catch (error) {
        if (!active) return;
        const message = getContestErrorMessage(
          error,
          'Não foi possível carregar os ajustes.',
        );
        toast.error(message);
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

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && saving) return;
    onOpenChange(nextOpen);
  }

  function parsePositiveInt(value: string): number | null {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return null;
    }
    return parsed;
  }

  function parseBanSeconds(value: string): number | null {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 5 || parsed > 90) {
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
    const multiTouchBanSeconds = settings.multiTouchBanEnabled
      ? parseBanSeconds(multiTouchSecondsInput)
      : null;

    if (settings.balloonLimitEnabled && balloonLimit === null) {
      toast.error('Informe um Limite de tarefas válido (mínimo 1).');
      return;
    }

    if (settings.deliveryTimeoutEnabled && deliveryTimeoutMinutes === null) {
      toast.error('Informe um timeout válido em minutos (mínimo 1).');
      return;
    }

    if (settings.multiTouchBanEnabled && multiTouchBanSeconds === null) {
      toast.error('Informe um tempo de bloqueio entre 5 e 90 segundos.');
      return;
    }

    const payload: StaffSettingsInput = {
      balloonLimitEnabled: settings.balloonLimitEnabled,
      balloonLimit,
      deliveryTimeoutEnabled: settings.deliveryTimeoutEnabled,
      deliveryTimeoutMinutes,
      multiTouchBanEnabled: settings.multiTouchBanEnabled,
      multiTouchBanSeconds,
    };

    setSaving(true);
    try {
      await contestService.updateStaffSettings(contestId, payload);
      toast.success('Ajustes salvos com sucesso.');
      setSaving(false);
      handleOpenChange(false);
      return;
    } catch (error) {
      toast.error(getContestErrorMessage(
        error,
        'Não foi possível salvar os ajustes.',
      ));
    }

    setSaving(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Ajustes"
      description="Configure limites para os colaboradores desta competição."
    >
      {loading ? (
        <Spinner />
      ) : (
        <div className="flex flex-col gap-3">
          <RowCard>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-ink">
                    Limite de tarefas
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Número máximo de tarefas que um colaborador pode pegar
                    simultaneamente antes de ser entregue.
                  </span>
                </div>
                <Switch
                  checked={settings.balloonLimitEnabled}
                  label="Limite de tarefas"
                  onChange={(checked) =>
                    setSettings((current) => ({
                      ...current,
                      balloonLimitEnabled: checked,
                      balloonLimit: checked ? current.balloonLimit : null,
                    }))
                  }
                />
              </div>
              {settings.balloonLimitEnabled ? (
                <Field label="Quantidade">
                  {(id, describedBy) => (
                    <Input
                      id={id}
                      describedBy={describedBy}
                      type="number"
                      min={1}
                      step={1}
                      inputMode="numeric"
                      value={balloonLimitInput}
                      onChange={setBalloonLimitInput}
                      placeholder="Ex: 3"
                    />
                  )}
                </Field>
              ) : null}
            </div>
          </RowCard>

          <RowCard>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-ink">
                    Timeout de entrega
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Tempo máximo (em minutos) que um colaborador pode ficar com a
                    tarefa antes de ser entregue.
                  </span>
                </div>
                <Switch
                  checked={settings.deliveryTimeoutEnabled}
                  label="Timeout de entrega"
                  onChange={(checked) =>
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
                <Field label="Minutos">
                  {(id, describedBy) => (
                    <Input
                      id={id}
                      describedBy={describedBy}
                      type="number"
                      min={1}
                      step={1}
                      inputMode="numeric"
                      value={timeoutInput}
                      onChange={setTimeoutInput}
                      placeholder="Ex: 10"
                    />
                  )}
                </Field>
              ) : null}
            </div>
          </RowCard>

          <RowCard>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-ink">
                    Multi-toque
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Bloqueia por um tempo quem tocar várias vezes seguidas na fila de
                    tarefas, para não pegar uma tarefa no instante em que ela
                    aparece.
                  </span>
                </div>
                <Switch
                  checked={settings.multiTouchBanEnabled}
                  label="Multi-toque"
                  onChange={(checked) =>
                    setSettings((current) => ({
                      ...current,
                      multiTouchBanEnabled: checked,
                      multiTouchBanSeconds: checked
                        ? current.multiTouchBanSeconds
                        : null,
                    }))
                  }
                />
              </div>
              {settings.multiTouchBanEnabled ? (
                <Field label="Segundos">
                  {(id, describedBy) => (
                    <Input
                      id={id}
                      describedBy={describedBy}
                      type="number"
                      min={5}
                      max={90}
                      step={1}
                      inputMode="numeric"
                      value={multiTouchSecondsInput}
                      onChange={setMultiTouchSecondsInput}
                      placeholder="Min. 5, Max. 90"
                    />
                  )}
                </Field>
              ) : null}
            </div>
          </RowCard>
        </div>
      )}

      <div className="mt-4 flex flex-col-reverse justify-end gap-2 xl:flex-row">
        <Button
          variant="quiet"
          disabled={saving}
          onClick={() => handleOpenChange(false)}
        >
          <HugeiconsIcon
            icon={EyeClosedIcon}
            className="size-5"
            strokeWidth={3}
          />
          Cancelar
        </Button>
        <Button
          tone="mint"
          loading={saving}
          disabled={loading}
          onClick={() => void handleSave()}
        >
          <HugeiconsIcon icon={SaveIcon} className="size-5" strokeWidth={3} />
          Salvar
        </Button>
      </div>
    </Dialog>
  );
}
