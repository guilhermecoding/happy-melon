'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import { BalloonIcon } from '@hugeicons/core-free-icons';
import {
  COLOR,
  normalizeBalloonHex,
} from '@/services/question/balloon-color';
import { cn } from '@/lib/utils';

const UNFILLED_COLORS = new Set<string>([COLOR.WHITE, '#ECECEC']);

type BalloonProps = {
  color: string;
  className?: string;
};

export function Balloon({ color, className }: BalloonProps) {
  const normalized = normalizeBalloonHex(color) ?? color;
  const isWhite = normalized.toUpperCase() === COLOR.WHITE;
  const shouldFill =
    normalizeBalloonHex(color) !== null && !UNFILLED_COLORS.has(normalized);

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
