"use client";

import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  CheckmarkCircle02Icon,
  RemoveCircleIcon,
  StatusIcon,
  WorkoutRunIcon,
} from '@hugeicons/core-free-icons';
import {
  BALLOON_DELIVERY_STATUS,
  type BalloonDeliveryStatus,
} from '@repo/shared';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export const BALLOON_DELIVERY_STATUS_ICON = {
  [BALLOON_DELIVERY_STATUS.PENDING]: StatusIcon,
  [BALLOON_DELIVERY_STATUS.PROCESSING]: WorkoutRunIcon,
  [BALLOON_DELIVERY_STATUS.DELIVERED]: CheckmarkCircle02Icon,
  [BALLOON_DELIVERY_STATUS.WITHHELD]: RemoveCircleIcon,
} as const satisfies Record<BalloonDeliveryStatus, IconSvgElement>;

export const BALLOON_DELIVERY_STATUS_COLOR_CLASS = {
  [BALLOON_DELIVERY_STATUS.PENDING]: 'text-orange-500',
  [BALLOON_DELIVERY_STATUS.PROCESSING]: 'text-blue-500',
  [BALLOON_DELIVERY_STATUS.DELIVERED]: 'text-green-500',
  [BALLOON_DELIVERY_STATUS.WITHHELD]: 'text-red-500',
} as const satisfies Record<BalloonDeliveryStatus, string>;

export const BALLOON_DELIVERY_STATUS_LABEL = {
  [BALLOON_DELIVERY_STATUS.PENDING]:
    'Confirmado. Ninguém pegou este balão ainda',
  [BALLOON_DELIVERY_STATUS.PROCESSING]: 'Balão em rota de entrega',
  [BALLOON_DELIVERY_STATUS.DELIVERED]: 'Entregue',
  [BALLOON_DELIVERY_STATUS.WITHHELD]: 'Retido',
} as const satisfies Record<BalloonDeliveryStatus, string>;

export function getBalloonDeliveryStatusIcon(
  status: BalloonDeliveryStatus,
): IconSvgElement {
  return BALLOON_DELIVERY_STATUS_ICON[status] ?? StatusIcon;
}

export function getBalloonDeliveryStatusColorClass(
  status: BalloonDeliveryStatus,
): string {
  return BALLOON_DELIVERY_STATUS_COLOR_CLASS[status] ?? 'text-foreground';
}

export function getBalloonDeliveryStatusLabel(
  status: BalloonDeliveryStatus,
): string {
  return BALLOON_DELIVERY_STATUS_LABEL[status] ?? status;
}

type BalloonDeliveryStatusIconProps = {
  status: BalloonDeliveryStatus;
  className?: string;
  strokeWidth?: number;
};

export function BalloonDeliveryStatusIcon({
  status,
  className,
  strokeWidth = 2,
}: BalloonDeliveryStatusIconProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        className={cn(
          'inline-flex size-5 cursor-default rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
        aria-label={getBalloonDeliveryStatusLabel(status)}
      >
        <HugeiconsIcon
          icon={getBalloonDeliveryStatusIcon(status)}
          className={cn(
            'size-full text-foreground',
            getBalloonDeliveryStatusColorClass(status),
          )}
          strokeWidth={strokeWidth}
        />
      </TooltipTrigger>
      <TooltipContent>{getBalloonDeliveryStatusLabel(status)}</TooltipContent>
    </Tooltip>
  );
}
