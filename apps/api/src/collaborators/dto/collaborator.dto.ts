import { z } from 'zod';

export const createCollaboratorSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
});

export const updateCollaboratorSchema = z.object({
  name: z.string().min(1),
});

export const setCollaboratorAccessSchema = z.object({
  hasAccess: z.boolean(),
});

export type CreateCollaboratorDto = z.infer<typeof createCollaboratorSchema>;
export type UpdateCollaboratorDto = z.infer<typeof updateCollaboratorSchema>;
export type SetCollaboratorAccessDto = z.infer<
  typeof setCollaboratorAccessSchema
>;
