'use client';

import * as RSelect from '@radix-ui/react-select';
import { Icon } from '@/components/pouf/Icon';
import { inputClasses } from '@/components/pouf/Input';
import {
  BALLOON_COLOR_OPTIONS,
  type BalloonColor,
  type BalloonColorOption,
  isBalloonColor,
  toBalloonColor,
} from '@/services/question/balloon-color';
import { cn } from '@/lib/utils';

type BalloonColorSelectProps = {
  id?: string;
  describedBy?: string;
  value: string;
  invalid?: boolean;
  onBlur?: () => void;
  onChange: (value: BalloonColor) => void;
};

function ColorSwatch({ color, className }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'size-4 shrink-0 rounded-full border border-black/25',
        className,
      )}
      style={{ backgroundColor: color }}
    />
  );
}

function BalloonColorOptionContent({ option }: { option: BalloonColorOption }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <ColorSwatch color={option.value} />
      <span className="flex min-w-0 flex-col items-start leading-tight">
        <span className="truncate font-bold">{option.label}</span>
        <span className="text-xs text-muted-foreground/70">{option.value}</span>
      </span>
    </span>
  );
}

/** Radix Select wearing the pouf field chrome by hand: the pouf `Select` only
 *  takes `{value,label}` pairs, which would drop the colour swatches. */
export function BalloonColorSelect({
  id,
  describedBy,
  value,
  invalid,
  onBlur,
  onChange,
}: BalloonColorSelectProps) {
  const selectedValue = toBalloonColor(value);
  const selectedOption = BALLOON_COLOR_OPTIONS.find(
    (option) => option.value === selectedValue,
  );

  return (
    <RSelect.Root
      value={selectedValue}
      onValueChange={(nextValue) => {
        if (isBalloonColor(nextValue)) {
          onChange(nextValue);
        }
      }}
    >
      <RSelect.Trigger
        id={id}
        className={`${inputClasses({ invalid: !!invalid })} flex min-w-0 flex-row flex-wrap items-center justify-between gap-(--gap,var(--s4))`}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        onBlur={onBlur}
      >
        <RSelect.Value placeholder="Selecione a cor do balão">
          {selectedOption ? (
            <BalloonColorOptionContent option={selectedOption} />
          ) : null}
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
            {BALLOON_COLOR_OPTIONS.map((option) => (
              <RSelect.Item
                key={option.value}
                value={option.value}
                className="pouf-option"
              >
                <RSelect.ItemText>
                  <BalloonColorOptionContent option={option} />
                </RSelect.ItemText>
              </RSelect.Item>
            ))}
          </RSelect.Viewport>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  );
}
