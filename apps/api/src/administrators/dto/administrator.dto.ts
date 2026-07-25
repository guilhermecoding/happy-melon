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

export const deleteAdministratorSchema = z.object({
  password: z.string().min(1),
});

export const resetPasswordAdministratorSchema = z.object({
  password: z.string().min(1),
  newPassword: z.string().min(8),
});

export type CreateAdministratorDto = z.infer<
  typeof createAdministratorSchema
>;
export type UpdateAdministratorDto = z.infer<
  typeof updateAdministratorSchema
>;
export type SetAccessDto = z.infer<typeof setAccessSchema>;
export type DeleteAdministratorDto = z.infer<
  typeof deleteAdministratorSchema
>;
export type ResetPasswordAdministratorDto = z.infer<
  typeof resetPasswordAdministratorSchema
>;
