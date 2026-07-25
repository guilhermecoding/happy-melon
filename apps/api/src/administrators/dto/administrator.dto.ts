import { z } from 'zod';

export const createAdministratorSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
});

export const updateAdministratorSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
});

export const setAccessSchema = z.object({
  hasAccess: z.boolean(),
});

export type CreateAdministratorDto = z.infer<
  typeof createAdministratorSchema
>;
export type UpdateAdministratorDto = z.infer<
  typeof updateAdministratorSchema
>;
export type SetAccessDto = z.infer<typeof setAccessSchema>;
