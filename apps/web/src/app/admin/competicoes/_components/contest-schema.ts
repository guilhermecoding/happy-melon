import { z } from 'zod';

export const contestFormSchema = z
  .object({
    name: z.string().min(1, 'Informe o nome'),
    status: z.enum(['active', 'inactive'], {
      error: 'Selecione o status',
    }),
    startsAt: z.string().min(1, 'Informe a data e hora de início'),
    endsAt: z.string().min(1, 'Informe a data e hora de término'),
    venue: z.string().min(1, 'Informe o local da sede'),
  })
  .refine(
    (data) => {
      const startsAt = new Date(data.startsAt);
      const endsAt = new Date(data.endsAt);
      return (
        !Number.isNaN(startsAt.getTime()) &&
        !Number.isNaN(endsAt.getTime()) &&
        endsAt > startsAt
      );
    },
    {
      message: 'A data de término deve ser posterior à data de início.',
      path: ['endsAt'],
    },
  );

export type ContestFormValues = z.infer<typeof contestFormSchema>;
