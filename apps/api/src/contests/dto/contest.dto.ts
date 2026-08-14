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

export type CreateContestDto = z.infer<typeof createContestSchema>;
export type UpdateContestDto = z.infer<typeof updateContestSchema>;
export type StaffSettingsDto = z.infer<typeof staffSettingsSchema>;
export type ContestStatusDto = z.infer<typeof contestStatusSchema>;
