import { z } from 'zod';

export const administratorSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  email: z.email('Informe um e-mail válido'),
});

export type AdministratorFormValues = z.infer<typeof administratorSchema>;

export type Administrator = {
  id: string;
  name: string;
  email: string;
  hasAccess: boolean;
};
