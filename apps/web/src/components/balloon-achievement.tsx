"use client";

import { Balloon } from '@/components/balloon';
import { FirstBalloonBadge } from '@/components/first-balloon-badge';
import { COLOR } from '@/services/question/balloon-color';
import { cn } from '@/lib/utils';

type BalloonAchievementProps = {
  questionId?: string;
  color: string;
  resolved: boolean;
  first?: boolean;
  className?: string;
  sizeBalloon?: number;
};

export function BalloonAchievement({
  questionId,
  color,
  resolved,
  first = false,
  className,
}: BalloonAchievementProps) {
  const balloonColor = resolved ? color : '#ececec';
  const labelColor =
    resolved && color === COLOR.WHITE ? COLOR.BLACK : balloonColor;

  return (
    <div className={cn('flex min-w-0 flex-col items-center', className)}>
      <div className="relative">
        <Balloon color={balloonColor} className="size-22" />
        {first ? <FirstBalloonBadge /> : null}
      </div>
      {questionId && (
        <span
          className="block w-full max-w-full truncate text-center font-space-grotesk font-semibold text-3xl my-2"
          style={{ color: labelColor }}
          title={questionId}
        >
          {questionId}
        </span>
      )}
    </div>
  );
}
