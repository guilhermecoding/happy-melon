import { z } from 'zod';

export const balloonColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Informe uma cor hexadecimal válida.');

export const createQuestionSchema = z.object({
  label: z.string().min(1),
  title: z.string().min(1),
  balloonColor: balloonColorSchema,
});

export const updateQuestionSchema = createQuestionSchema;

export type CreateQuestionDto = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionDto = z.infer<typeof updateQuestionSchema>;
