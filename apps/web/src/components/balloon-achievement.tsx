"use client";

import { Balloon } from '@/components/balloon';
import {
  type BalloonColor,
  COLOR,
} from '@/services/question/balloon-color';
import { cn } from '@/lib/utils';

type BalloonAchievementProps = {
  questionId: string;
  color: BalloonColor;
  resolved: boolean;
  className?: string;
};

export function BalloonAchievement({
  questionId,
  color,
  resolved,
  className,
}: BalloonAchievementProps) {
  const balloonColor = resolved ? color : '#ececec';
  const labelColor =
    resolved && color === COLOR.WHITE ? COLOR.BLACK : balloonColor;

  return (
    <div className={cn('flex min-w-0 flex-col items-center', className)}>
      <Balloon color={balloonColor} className="size-22" />
      <span
        className="block w-full max-w-full truncate text-center font-jersey text-5xl"
        style={{ color: labelColor }}
        title={questionId}
      >
        {questionId}
      </span>
    </div>
  );
}
