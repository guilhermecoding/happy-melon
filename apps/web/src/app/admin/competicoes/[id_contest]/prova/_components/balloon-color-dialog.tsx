'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { EyeClosedIcon, SaveIcon } from '@hugeicons/core-free-icons';
import { Button } from '@/components/pouf/Button';
import { Dialog } from '@/components/pouf/controls';
import { Field, Input } from '@/components/pouf/Input';
import { toast } from '@/components/pouf/toaster';
import {
  BALLOON_COLOR_OPTIONS,
  BALLOON_COLOR_VALUES,
  balloonColorNameKey,
  normalizeBalloonHex,
} from '@/services/question/balloon-color';
import {
  balloonColorService,
  getBalloonColorErrorMessage,
  type CustomBalloonColor,
} from '@/services/question/balloon-color.service';

type BalloonColorDialogProps = {
  open: boolean;
  color: CustomBalloonColor | null;
  colors: CustomBalloonColor[];
  onOpenChange: (open: boolean) => void;
  onSaved: (color: CustomBalloonColor) => void;
};

type FieldErrors = {
  name?: string;
  hex?: string;
};

function validateColorFields(
  nameInput: string,
  hexInput: string,
  colors: CustomBalloonColor[],
  excludeId?: string,
): { errors: FieldErrors; name?: string; hex?: string } {
  const name = nameInput.trim();
  const hex = normalizeBalloonHex(hexInput);
  const errors: FieldErrors = {};

  if (!name) {
    errors.name = 'Informe o nome da cor.';
  }

  if (!hex) {
    errors.hex = 'Informe um código de cor válido.';
  }

  if (!name || !hex) {
    return { errors };
  }

  const nameKey = balloonColorNameKey(name);
  const others = colors.filter((color) => color.id !== excludeId);
  const nameTaken =
    BALLOON_COLOR_OPTIONS.some(
      (option) => balloonColorNameKey(option.label) === nameKey,
    ) || others.some((color) => balloonColorNameKey(color.name) === nameKey);
  const hexTaken =
    (BALLOON_COLOR_VALUES as readonly string[]).includes(hex) ||
    others.some((color) => color.hex === hex);

  if (nameTaken) {
    errors.name = 'Já existe uma cor com este nome.';
  }

  if (hexTaken) {
    errors.hex = 'Já existe uma cor com este código.';
  }

  if (errors.name || errors.hex) {
    return { errors };
  }

  return { errors, name, hex };
}

function assignServerError(message: string): FieldErrors | null {
  if (/c[oó]digo/i.test(message)) {
    return { hex: message };
  }

  if (/nome/i.test(message)) {
    return { name: message };
  }

  return null;
}

export function BalloonColorDialog({
  open,
  color,
  colors,
  onOpenChange,
  onSaved,
}: BalloonColorDialogProps) {
  const [name, setName] = useState('');
  const [hex, setHex] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [requestError, setRequestError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const preview = normalizeBalloonHex(hex);
  const editing = color !== null;

  useEffect(() => {
    if (!open) {
      return;
    }

    setName(color?.name ?? '');
    setHex(color?.hex ?? '');
    setErrors({});
    setRequestError(undefined);
  }, [open, color]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();

    const result = validateColorFields(name, hex, colors, color?.id);
    setErrors(result.errors);
    setRequestError(undefined);

    if (!result.name || !result.hex) {
      return;
    }

    setSaving(true);

    try {
      const saved = editing
        ? await balloonColorService.update(color.id, {
            name: result.name,
            hex: result.hex,
          })
        : await balloonColorService.create({
            name: result.name,
            hex: result.hex,
          });
      onSaved(saved);
      onOpenChange(false);
      toast.success(editing ? 'Cor atualizada.' : 'Cor cadastrada.');
    } catch (error) {
      const message = getBalloonColorErrorMessage(
        error,
        editing
          ? 'Não foi possível atualizar a cor.'
          : 'Não foi possível cadastrar a cor.',
      );
      const fieldError = assignServerError(message);
      if (fieldError) {
        setErrors(fieldError);
      } else {
        setRequestError(message);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && saving) return;
        onOpenChange(nextOpen);
      }}
      title={editing ? 'Editar cor' : 'Nova cor'}
      description="Informe o nome e o código da cor do balão."
    >
      <form className="flex flex-col gap-5" onSubmit={(event) => void handleSubmit(event)}>
        <Field label="Nome" error={errors.name}>
          {(id, describedBy) => (
            <Input
              id={id}
              name="balloon-color-name"
              describedBy={describedBy}
              placeholder="Ex: Turquesa"
              value={name}
              invalid={!!errors.name}
              onChange={(value) => {
                setName(value);
                setErrors((current) => ({ ...current, name: undefined }));
              }}
            />
          )}
        </Field>

        <Field label="Código" error={errors.hex}>
          {(id, describedBy) => (
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="size-12 shrink-0 rounded-md border border-black/20 bg-ink/5"
                style={preview ? { backgroundColor: preview } : undefined}
              />
              <div className="min-w-0 flex-1">
                <Input
                  id={id}
                  name="balloon-color-hex"
                  describedBy={describedBy}
                  placeholder="#FF8000"
                  value={hex}
                  mono
                  invalid={!!errors.hex}
                  spellCheck={false}
                  autoCapitalize="off"
                  onChange={(value) => {
                    setHex(value);
                    setErrors((current) => ({ ...current, hex: undefined }));
                  }}
                />
              </div>
            </div>
          )}
        </Field>

        {requestError ? (
          <p role="alert" className="text-sm text-destructive">
            {requestError}
          </p>
        ) : null}

        <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
          <Button
            type="button"
            variant="quiet"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            <HugeiconsIcon icon={EyeClosedIcon} className="size-5" strokeWidth={3} />
            Fechar
          </Button>
          <Button type="submit" tone="mint" loading={saving}>
            <HugeiconsIcon icon={SaveIcon} className="size-5" strokeWidth={3} />
            Salvar
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
