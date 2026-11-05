'use client';

import { Icon } from '@/components/pouf/Icon';
import { Tooltip } from '@/components/pouf/controls';
import { cn } from '@/lib/utils';

type FirstBalloonBadgeProps = {
  size?: 'sm' | 'md';
  className?: string;
};

export function FirstBalloonBadge({
  size = 'md',
  className,
}: FirstBalloonBadgeProps) {
  return (
    <Tooltip
      tip="Primeira submissão da questão"
      className={cn(
        'absolute -right-0.5 -bottom-0.5 flex items-center justify-center rounded-full bg-yellow-400 text-white ring-1',
        size === 'sm' ? 'size-4' : 'size-6',
        className,
      )}
    >
      <span
        className={cn(
          'flex leading-none [&_svg]:block',
          size === 'sm' ? 'scale-[0.55]' : 'scale-75',
        )}
      >
        <Icon name="star" size="sm" />
      </span>
    </Tooltip>
  );
}
