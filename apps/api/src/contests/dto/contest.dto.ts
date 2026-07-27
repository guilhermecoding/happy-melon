import { z } from 'zod';

export const contestStatusSchema = z.enum(['active', 'inactive']);

export const createContestSchema = z
  .object({
    name: z.string().min(1),
    status: contestStatusSchema,
    startsAt: z.iso.datetime(),
    endsAt: z.iso.datetime(),
    venue: z.string().min(1),
  })
  .refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
    message: 'A data de término deve ser posterior à data de início.',
    path: ['endsAt'],
  });

export const updateContestSchema = createContestSchema;

export type CreateContestDto = z.infer<typeof createContestSchema>;
export type UpdateContestDto = z.infer<typeof updateContestSchema>;
export type ContestStatusDto = z.infer<typeof contestStatusSchema>;
