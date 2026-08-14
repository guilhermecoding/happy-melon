import { z } from 'zod';

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const optionalNullableString = z
  .union([z.string(), z.null()])
  .optional()
  .transform(emptyToNull);

export const createTeamSchema = z.object({
  name: z
    .string()
    .min(1)
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, 'Informe o nome do time'),
  usernameTeam: z
    .string()
    .min(1)
    .transform((value) => value.trim().toLowerCase())
    .refine((value) => value.length > 0, 'Informe o usuário do time'),
  room: optionalNullableString,
  machine: optionalNullableString,
});

export const updateTeamSchema = createTeamSchema;

export const bulkUpsertTeamsSchema = z.object({
  teams: z.array(createTeamSchema).min(1, 'Informe ao menos um time'),
});

export const deleteTeamSchema = z.object({
  password: z.string().min(1),
});

export type CreateTeamDto = z.infer<typeof createTeamSchema>;
export type UpdateTeamDto = z.infer<typeof updateTeamSchema>;
export type BulkUpsertTeamsDto = z.infer<typeof bulkUpsertTeamsSchema>;
export type DeleteTeamDto = z.infer<typeof deleteTeamSchema>;
