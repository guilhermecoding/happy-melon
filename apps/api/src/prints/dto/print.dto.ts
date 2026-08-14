import { z } from 'zod';

export const printTeamActionSchema = z.object({
  teamId: z.string().min(1),
});

export type PrintTeamActionDto = z.infer<typeof printTeamActionSchema>;
