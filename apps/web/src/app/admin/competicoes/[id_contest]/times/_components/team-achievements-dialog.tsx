"use client";

import { HugeiconsIcon } from '@hugeicons/react';
import { BalloonIcon, EyeClosedIcon } from '@hugeicons/core-free-icons';
import type { Team } from '@/services/team/team.type';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BalloonColor, COLOR } from '@/services/question/balloon-color';

type TeamAchievementsDialogProps = {
  team: Team | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function BalloonAchievement({
  questionId,
  color,
  resolved,
}: {
  questionId: string;
  color: BalloonColor;
  resolved: boolean;
}) {
  const isWhite = color === COLOR.WHITE;
  const colorResolved = resolved ? color : '#ececec';
  // Outline only when unsolved or white (white fill would be invisible).
  const fill = !resolved || isWhite ? 'none' : 'currentColor';
  const strokeColor = isWhite && resolved ? COLOR.BLACK : colorResolved;

  return (
    <div className="flex flex-col items-center">
      <HugeiconsIcon
        icon={BalloonIcon}
        className="size-22 shrink-0"
        color={strokeColor}
        strokeWidth={1.5}
        fill={fill}
      />
      <span
        className="text-5xl font-jersey"
        style={{ color: colorResolved }}
      >
        {questionId}
      </span>
    </div>
  );
}

export function TeamAchievementsDialog({
  team,
  open,
  onOpenChange,
}: TeamAchievementsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[min(95vh,50rem)] w-full max-w-[80vw] gap-4 overflow-y-auto p-4 md:max-w-[80vw] lg:max-w-[60vw] xl:max-w-[40vw] sm:p-6"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold sm:text-2xl">
            Balões Conquistados
          </DialogTitle>
          <DialogDescription className="text-base">
            {team ? (
              <>
                Visualize as conquistas do time <strong>{team.name}</strong> (
                <strong>{team.usernameTeam}</strong>).
              </>
            ) : (
              'Visualize as conquistas do time selecionado.'
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Conteúdo */}
        <div className="grid grid-cols-6 min-h-48 gap-3 rounded-2xl border-4 bg-muted/40 px-6 py-10 text-center">
          <BalloonAchievement questionId="A" color={COLOR.RED} resolved={true} />
          <BalloonAchievement questionId="B" color={COLOR.WHITE} resolved={true} />
          <BalloonAchievement questionId="C" color={COLOR.RED} resolved={false} />
          <BalloonAchievement questionId="D" color={COLOR.RED} resolved={true} />
          <BalloonAchievement questionId="E" color={COLOR.WHITE} resolved={true} />
          <BalloonAchievement questionId="F" color={COLOR.RED} resolved={false} />
        </div>

        <DialogFooter className="mt-4 flex-col-reverse justify-end gap-2 xl:flex-row">
          <Button
            type="button"
            variant="white"
            className="w-full sm:w-fit"
            onClick={() => onOpenChange(false)}
          >
            <HugeiconsIcon
              icon={EyeClosedIcon}
              className="size-5"
              strokeWidth={3}
            />
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
