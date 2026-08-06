'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
        <span className="truncate font-medium">{option.label}</span>
        <span className="text-xs text-muted-foreground/70">{option.value}</span>
      </span>
    </span>
  );
}

export function BalloonColorSelect({
  id,
  value,
  invalid,
  onBlur,
  onChange,
}: BalloonColorSelectProps) {
  const selectedValue = toBalloonColor(value);

  return (
    <Select
      value={selectedValue}
      onValueChange={(nextValue) => {
        if (typeof nextValue === 'string' && isBalloonColor(nextValue)) {
          onChange(nextValue);
        }
      }}
    >
      <SelectTrigger
        id={id}
        className="h-auto w-full rounded-2xl border-3 border-input bg-gray-50 px-4 py-6 text-base shadow-none dark:bg-input/30"
        aria-invalid={invalid}
        onBlur={onBlur}
      >
        <SelectValue placeholder="Selecione a cor do balão">
          {(current: string | null) => {
            const currentValue =
              current && isBalloonColor(current) ? current : selectedValue;
            const option = BALLOON_COLOR_OPTIONS.find(
              (item) => item.value === currentValue,
            );
            return option ? <BalloonColorOptionContent option={option} /> : null;
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="start">
        {BALLOON_COLOR_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value} className="py-2">
            <BalloonColorOptionContent option={option} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
