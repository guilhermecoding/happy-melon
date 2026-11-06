'use client';

import { useEffect, useMemo, useState, type PointerEvent, type MouseEvent } from 'react';
import * as RSelect from '@radix-ui/react-select';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  CirclePlusIcon,
  Delete01Icon,
  PencilEdit02Icon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/pouf/Icon';
import { inputClasses } from '@/components/pouf/Input';
import { Confirm } from '@/components/pouf/controls';
import { toast } from '@/components/pouf/toaster';
import {
  BALLOON_COLOR_OPTIONS,
  normalizeBalloonHex,
  toBalloonColor,
} from '@/services/question/balloon-color';
import {
  balloonColorService,
  getBalloonColorErrorMessage,
  type CustomBalloonColor,
} from '@/services/question/balloon-color.service';
import { BalloonColorDialog } from './balloon-color-dialog';

const NEW_BALLOON_COLOR_VALUE = '__new_color__';

type BalloonColorSelectProps = {
  id?: string;
  describedBy?: string;
  value: string;
  invalid?: boolean;
  onBlur?: () => void;
  onChange: (value: string) => void;
};

type ColorOption = {
  value: string;
  label: string;
  custom: CustomBalloonColor | null;
};

function blockItemSelection(event: PointerEvent | MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
}

function ColorSwatch({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="size-4 shrink-0 rounded-full border border-black/25"
      style={{ backgroundColor: color }}
    />
  );
}

function PersBadge() {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-current/10 px-1.5 py-0.5 text-[11px] font-black normal-case leading-none tracking-normal text-current">
      adicionada
    </span>
  );
}

function ColorOptionBody({ option }: { option: ColorOption }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <ColorSwatch color={option.value} />
      <span className="flex min-w-0 flex-col items-start leading-tight">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate font-bold">{option.label}</span>
          {option.custom ? <PersBadge /> : null}
        </span>
        <span className="text-xs text-current/70">{option.value}</span>
      </span>
    </span>
  );
}

export function BalloonColorSelect({
  id,
  describedBy,
  value,
  invalid,
  onBlur,
  onChange,
}: BalloonColorSelectProps) {
  const [open, setOpen] = useState(false);
  const [customColors, setCustomColors] = useState<CustomBalloonColor[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CustomBalloonColor | null>(null);
  const [colorToDelete, setColorToDelete] = useState<CustomBalloonColor | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadColors() {
      try {
        const colors = await balloonColorService.list();
        if (active) {
          setCustomColors(colors);
        }
      } catch (error) {
        if (active) {
          toast.error(
            getBalloonColorErrorMessage(
              error,
              'Não foi possível carregar as cores.',
            ),
          );
        }
      }
    }

    void loadColors();

    return () => {
      active = false;
    };
  }, []);

  const options = useMemo<ColorOption[]>(() => {
    const builtins = BALLOON_COLOR_OPTIONS.map((option) => ({
      value: option.value,
      label: option.label,
      custom: null,
    }));
    const custom = customColors.map((color) => ({
      value: color.hex,
      label: color.name,
      custom: color,
    }));

    return [...builtins, ...custom].sort((a, b) =>
      a.label.localeCompare(b.label, 'pt-BR'),
    );
  }, [customColors]);

  const selectedValue = toBalloonColor(value);
  const selectedOption =
    options.find((option) => option.value === selectedValue) ?? {
      value: selectedValue,
      label: selectedValue,
      custom: null,
    };

  function openCreate() {
    setEditing(null);
    setOpen(false);
    setDialogOpen(true);
  }

  function openEdit(color: CustomBalloonColor) {
    setEditing(color);
    setOpen(false);
    setDialogOpen(true);
  }

  function handleSaved(saved: CustomBalloonColor) {
    const previous = editing;
    setCustomColors((current) => [
      ...current.filter((color) => color.id !== saved.id),
      saved,
    ]);

    if (
      previous &&
      normalizeBalloonHex(value) === previous.hex &&
      saved.hex !== previous.hex
    ) {
      onChange(saved.hex);
    }
  }

  async function handleDelete() {
    if (!colorToDelete) return;

    setIsDeleting(true);

    try {
      await balloonColorService.remove(colorToDelete.id);
      setCustomColors((current) =>
        current.filter((color) => color.id !== colorToDelete.id),
      );
      setColorToDelete(null);
      toast.success('Cor excluída.');
    } catch (error) {
      toast.error(
        getBalloonColorErrorMessage(error, 'Não foi possível excluir a cor.'),
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <RSelect.Root
        open={open}
        onOpenChange={setOpen}
        value={selectedValue}
        onValueChange={(nextValue) => {
          if (nextValue === NEW_BALLOON_COLOR_VALUE) {
            openCreate();
            return;
          }

          onChange(nextValue);
        }}
      >
        <RSelect.Trigger
          id={id}
          type="button"
          className={`${inputClasses({ invalid: !!invalid })} flex min-w-0 flex-row flex-wrap items-center justify-between gap-(--gap,var(--s4))`}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          onBlur={onBlur}
        >
          <RSelect.Value placeholder="Selecione a cor do balão">
            <ColorOptionBody option={selectedOption} />
          </RSelect.Value>
          <RSelect.Icon>
            <Icon name="expand" size="sm" />
          </RSelect.Icon>
        </RSelect.Trigger>
        <RSelect.Portal>
          <RSelect.Content
            className="pouf-popover pouf-popover--select"
            position="popper"
            sideOffset={8}
          >
            <RSelect.Viewport>
              <RSelect.Item
                value={NEW_BALLOON_COLOR_VALUE}
                className="pouf-option"
              >
                <RSelect.ItemText>
                  <span className="flex min-w-0 items-center gap-2">
                    <HugeiconsIcon
                      icon={CirclePlusIcon}
                      className="size-4 shrink-0"
                      strokeWidth={2.5}
                    />
                    <span className="font-bold">Nova cor</span>
                  </span>
                </RSelect.ItemText>
              </RSelect.Item>
              {options.map((option) => (
                <RSelect.Item
                  key={option.custom?.id ?? option.value}
                  value={option.value}
                  className="pouf-option"
                >
                  <RSelect.ItemText className="min-w-0 flex-1">
                    <ColorOptionBody option={option} />
                  </RSelect.ItemText>
                  {option.custom ? (
                    <span className="ml-auto flex shrink-0 items-center">
                      <button
                        type="button"
                        aria-label={`Editar ${option.label}`}
                        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-current hover:bg-current/10"
                        onPointerDown={blockItemSelection}
                        onPointerUp={blockItemSelection}
                        onClick={(event) => {
                          blockItemSelection(event);
                          if (option.custom) openEdit(option.custom);
                        }}
                      >
                        <HugeiconsIcon
                          icon={PencilEdit02Icon}
                          className="size-4"
                          strokeWidth={2}
                        />
                      </button>
                      <button
                        type="button"
                        aria-label={`Excluir ${option.label}`}
                        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-current hover:bg-current/10"
                        onPointerDown={blockItemSelection}
                        onPointerUp={blockItemSelection}
                        onClick={(event) => {
                          blockItemSelection(event);
                          setOpen(false);
                          setColorToDelete(option.custom);
                        }}
                      >
                        <HugeiconsIcon
                          icon={Delete01Icon}
                          className="size-4"
                          strokeWidth={2}
                        />
                      </button>
                    </span>
                  ) : null}
                </RSelect.Item>
              ))}
            </RSelect.Viewport>
          </RSelect.Content>
        </RSelect.Portal>
      </RSelect.Root>

      <BalloonColorDialog
        open={dialogOpen}
        color={editing}
        colors={customColors}
        onOpenChange={setDialogOpen}
        onSaved={handleSaved}
      />

      <Confirm
        open={colorToDelete !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && isDeleting) return;
          if (!nextOpen) setColorToDelete(null);
        }}
        title="Excluir cor"
        body={`Excluir a cor ${colorToDelete?.name ?? ''}?`}
        confirmLabel="Excluir"
        cancelLabel="Manter cor"
        tone="pink"
        loading={isDeleting}
        onConfirm={() => void handleDelete()}
      />
    </>
  );
}
