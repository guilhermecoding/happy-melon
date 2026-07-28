"use client";

import { HugeiconsIcon } from '@hugeicons/react';
import { Award01Icon, EyeClosedIcon } from '@hugeicons/core-free-icons';
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

type TeamAchievementsDialogProps = {
  team: Team | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

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
            Conquistas
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

        <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-muted/40 px-6 py-10 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-muted">
            <HugeiconsIcon
              icon={Award01Icon}
              className="size-7 text-muted-foreground"
              strokeWidth={1.5}
            />
          </span>
          <p className="text-sm font-medium text-foreground">
            Nenhuma conquista disponível
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            As conquistas deste time serão exibidas aqui quando estiverem
            disponíveis.
          </p>
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
