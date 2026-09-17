import { z } from 'zod';

export const createChefSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
});

export const updateChefSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
});

export const setChefAccessSchema = z.object({
  hasAccess: z.boolean(),
});

export const deleteChefSchema = z.object({
  password: z.string().min(1),
});

export const resetPasswordChefSchema = z.object({
  password: z.string().min(1),
  newPassword: z.string().min(8),
});

export type CreateChefDto = z.infer<typeof createChefSchema>;
export type UpdateChefDto = z.infer<typeof updateChefSchema>;
export type SetChefAccessDto = z.infer<typeof setChefAccessSchema>;
export type DeleteChefDto = z.infer<typeof deleteChefSchema>;
export type ResetPasswordChefDto = z.infer<typeof resetPasswordChefSchema>;
