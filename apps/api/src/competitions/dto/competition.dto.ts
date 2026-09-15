import { z } from 'zod';

export const contestStatusSchema = z.enum(['active', 'inactive']);

const roundDatesRefine = (
  data: { startsAt: string; endsAt: string },
  ctx: z.RefinementCtx,
) => {
  const startsAt = new Date(data.startsAt);
  const endsAt = new Date(data.endsAt);

  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    ctx.addIssue({
      code: 'custom',
      message: 'Datas inválidas.',
      path: ['endsAt'],
    });
    return;
  }

  if (endsAt <= startsAt) {
    ctx.addIssue({
      code: 'custom',
      message: 'A data de término deve ser posterior à data de início.',
      path: ['endsAt'],
    });
  }
};

export const roundInputSchema = z
  .object({
    name: z.string().min(1),
    startsAt: z.iso.datetime(),
    endsAt: z.iso.datetime(),
  })
  .superRefine(roundDatesRefine);

export const createCompetitionSchema = z.object({
  name: z.string().min(1),
  status: contestStatusSchema,
  venue: z.string().min(1),
  rounds: z.array(roundInputSchema).min(1),
});

export const updateCompetitionSchema = z.object({
  name: z.string().min(1),
  status: contestStatusSchema,
  venue: z.string().min(1),
});

export const createRoundSchema = roundInputSchema;
export const updateRoundSchema = roundInputSchema;

export const staffSettingsSchema = z
  .object({
    balloonLimitEnabled: z.boolean(),
    balloonLimit: z.number().int().min(1).nullable(),
    deliveryTimeoutEnabled: z.boolean(),
    deliveryTimeoutMinutes: z.number().int().min(1).nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.balloonLimitEnabled && data.balloonLimit === null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe o limite de balões.',
        path: ['balloonLimit'],
      });
    }

    if (!data.balloonLimitEnabled && data.balloonLimit !== null) {
      ctx.addIssue({
        code: 'custom',
        message: 'O limite deve ser nulo quando desabilitado.',
        path: ['balloonLimit'],
      });
    }

    if (data.deliveryTimeoutEnabled && data.deliveryTimeoutMinutes === null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe o timeout de entrega em minutos.',
        path: ['deliveryTimeoutMinutes'],
      });
    }

    if (
      !data.deliveryTimeoutEnabled &&
      data.deliveryTimeoutMinutes !== null
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'O timeout deve ser nulo quando desabilitado.',
        path: ['deliveryTimeoutMinutes'],
      });
    }
  });

export type CreateCompetitionDto = z.infer<typeof createCompetitionSchema>;
export type UpdateCompetitionDto = z.infer<typeof updateCompetitionSchema>;
export type CreateRoundDto = z.infer<typeof createRoundSchema>;
export type UpdateRoundDto = z.infer<typeof updateRoundSchema>;
export type StaffSettingsDto = z.infer<typeof staffSettingsSchema>;
export type ContestStatusDto = z.infer<typeof contestStatusSchema>;
