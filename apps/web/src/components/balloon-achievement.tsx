"use client";

import { Balloon } from '@/components/balloon';
import {
  type BalloonColor,
  COLOR,
} from '@/services/question/balloon-color';

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
    <div className={className ?? 'flex flex-col items-center'}>
      <Balloon color={balloonColor} className="size-22" />
      <span className="font-jersey text-5xl" style={{ color: labelColor }}>
        {questionId}
      </span>
    </div>
  );
}
