import { z } from 'zod';
import { roundsOverlap } from '@repo/shared';

const contestDatesRefine = (data: { startsAt: string; endsAt: string }) => {
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
  path: ['endsAt'],
};

export const roundFormSchema = z
  .object({
    name: z.string().min(1, 'Informe o nome da rodada'),
    startsAt: z.string().min(1, 'Informe a data e hora de início'),
    endsAt: z.string().min(1, 'Informe a data e hora de término'),
  })
  .refine(contestDatesRefine, contestDatesRefineConfig);

export const contestFormSchema = z
  .object({
    name: z.string().min(1, 'Informe o nome'),
    status: z.enum(['active', 'inactive'], {
      error: 'Selecione o status',
    }),
    venue: z.string().min(1, 'Informe o local da sede'),
    rounds: z.array(roundFormSchema).min(1, 'Inclua pelo menos uma rodada'),
  })
  .superRefine((data, ctx) => {
    for (let i = 0; i < data.rounds.length; i++) {
      for (let j = i + 1; j < data.rounds.length; j++) {
        const a = data.rounds[i]!;
        const b = data.rounds[j]!;
        if (
          roundsOverlap(
            { id: String(i), name: a.name, startsAt: a.startsAt, endsAt: a.endsAt },
            { id: String(j), name: b.name, startsAt: b.startsAt, endsAt: b.endsAt },
          )
        ) {
          ctx.addIssue({
            code: 'custom',
            message: 'O horário desta rodada se sobrepõe a outra rodada.',
            path: ['rounds', j, 'startsAt'],
          });
        }
      }
    }
  });

export const editContestFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  venue: z.string().min(1, 'Informe o local da sede'),
});

export type RoundFormValues = z.infer<typeof roundFormSchema>;
export type ContestFormValues = z.infer<typeof contestFormSchema>;
export type EditContestFormValues = z.infer<typeof editContestFormSchema>;
