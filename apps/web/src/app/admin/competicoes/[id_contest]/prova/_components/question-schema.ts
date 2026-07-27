import { z } from 'zod';

export const questionFormSchema = z.object({
  label: z.string().min(1, 'Informe o identificador'),
  title: z.string().min(1, 'Informe o título'),
  balloonColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Informe uma cor hexadecimal válida'),
});

export type QuestionFormValues = z.infer<typeof questionFormSchema>;
