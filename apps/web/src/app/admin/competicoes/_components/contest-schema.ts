import { z } from 'zod';

const contestDatesRefine = (
  data: { startsAt: string; endsAt: string },
) => {
  const startsAt = new Date(data.startsAt);
  const endsAt = new Date(data.endsAt);
  return (
    !Number.isNaN(startsAt.getTime()) &&
    !Number.isNaN(endsAt.getTime()) &&
    endsAt > startsAt
  );
};

const contestDatesRefineConfig = {
  message: 'A data de término deve ser posterior à data de início.',
  path: ['endsAt'] as const,
};

const contestBaseFields = {
  name: z.string().min(1, 'Informe o nome'),
  startsAt: z.string().min(1, 'Informe a data e hora de início'),
  endsAt: z.string().min(1, 'Informe a data e hora de término'),
  venue: z.string().min(1, 'Informe o local da sede'),
};

export const contestFormSchema = z
  .object({
    ...contestBaseFields,
    status: z.enum(['active', 'inactive'], {
      error: 'Selecione o status',
    }),
  })
  .refine(contestDatesRefine, contestDatesRefineConfig);

export const editContestFormSchema = z
  .object(contestBaseFields)
  .refine(contestDatesRefine, contestDatesRefineConfig);

export type ContestFormValues = z.infer<typeof contestFormSchema>;
export type EditContestFormValues = z.infer<typeof editContestFormSchema>;
