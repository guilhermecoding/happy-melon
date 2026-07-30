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
    <HugeiconsIcon
      icon={getBalloonDeliveryStatusIcon(status)}
      className={cn(
        'size-5 text-foreground',
        getBalloonDeliveryStatusColorClass(status),
        className,
      )}
      strokeWidth={strokeWidth}
    />
  );
}
