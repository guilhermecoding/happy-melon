'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import { BalloonIcon } from '@hugeicons/core-free-icons';
import {
  COLOR,
  isBalloonColor,
} from '@/services/question/balloon-color';
import { cn } from '@/lib/utils';

type BalloonProps = {
  color: typeof COLOR[keyof typeof COLOR] | string;
  className?: string;
};

export function Balloon({ color, className }: BalloonProps) {
  const normalized = color.toUpperCase();
  const isWhite = normalized === COLOR.WHITE;
  const shouldFill = isBalloonColor(normalized) && !isWhite;

  return (
    <HugeiconsIcon
      icon={BalloonIcon}
      className={cn('shrink-0', className)}
      color={isWhite ? COLOR.BLACK : color}
      strokeWidth={1.5}
      fill={shouldFill ? 'currentColor' : 'none'}
    />
  );
}
