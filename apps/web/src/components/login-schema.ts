import { z } from 'zod';

export const loginFormSchema = z
  .object({
    mode: z.enum(['collaborator', 'admin', 'register']),
    email: z.email('Informe um e-mail válido'),
    password: z.string(),
    competitionCode: z.string(),
    name: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === 'admin' && data.password.trim().length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe a senha',
        path: ['password'],
      });
    }

    if (
      data.mode === 'collaborator' &&
      data.competitionCode.trim().length === 0
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe o código da competição',
        path: ['competitionCode'],
      });
    }

    if (data.mode === 'register' && data.name.trim().length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe o nome',
        path: ['name'],
      });
    }
  });

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type LoginMode = LoginFormValues['mode'];

export function emptyLoginFormValues(
  competitionCode = '',
): LoginFormValues {
  return {
    mode: 'collaborator',
    email: '',
    password: '',
    competitionCode,
    name: '',
  };
}
