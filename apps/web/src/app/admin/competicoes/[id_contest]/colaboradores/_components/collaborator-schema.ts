import { z } from 'zod';

export const collaboratorSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  email: z.email('Informe um e-mail válido'),
});

export const collaboratorNameSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
});

export type CollaboratorFormValues = z.infer<typeof collaboratorSchema>;
export type CollaboratorNameFormValues = z.infer<typeof collaboratorNameSchema>;
