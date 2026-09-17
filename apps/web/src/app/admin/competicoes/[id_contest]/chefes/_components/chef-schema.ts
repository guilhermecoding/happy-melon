import { z } from 'zod';

export const chefFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  email: z.email('Informe um e-mail válido'),
});

export type ChefFormValues = z.infer<typeof chefFormSchema>;
