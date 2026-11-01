import { TEAM_PLACEMENT_MAX_LENGTH } from '@repo/shared';
import { z } from 'zod';

const placementText = z
  .string()
  .max(
    TEAM_PLACEMENT_MAX_LENGTH,
    `Use no máximo ${TEAM_PLACEMENT_MAX_LENGTH} caracteres`,
  );

export const staffTeamPlacementSchema = z.object({
  room: placementText,
  machine: placementText,
});

export type StaffTeamPlacementValues = z.infer<typeof staffTeamPlacementSchema>;

export const emptyStaffTeamPlacementValues: StaffTeamPlacementValues = {
  room: '',
  machine: '',
};

export function normalizePlacement(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function isPlacementDirty(
  values: StaffTeamPlacementValues,
  team: { room: string | null; machine: string | null },
): boolean {
  return (
    normalizePlacement(values.room) !== team.room ||
    normalizePlacement(values.machine) !== team.machine
  );
}

export function toPlacementValues(team: {
  room: string | null;
  machine: string | null;
}): StaffTeamPlacementValues {
  return {
    room: team.room ?? '',
    machine: team.machine ?? '',
  };
}
