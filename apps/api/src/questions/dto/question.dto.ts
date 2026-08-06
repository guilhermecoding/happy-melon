import { z } from 'zod';
import { BALLOON_COLOR_VALUES } from '../balloon-color.js';

export const balloonColorSchema = z
  .string()
  .transform((value) => value.toUpperCase())
  .pipe(
    z.enum(BALLOON_COLOR_VALUES, {
      error: 'Informe uma cor de balão válida.',
    }),
  );

export const createQuestionSchema = z.object({
  label: z
    .string()
    .min(1)
    .transform((value) => value.trim().toUpperCase())
    .refine((value) => value.length > 0, 'Informe o identificador'),
  title: z.string().min(1).transform((value) => value.trim()),
  balloonColor: balloonColorSchema,
});

export const updateQuestionSchema = createQuestionSchema;

export const deleteQuestionSchema = z.object({
  password: z.string().min(1),
});

export type CreateQuestionDto = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionDto = z.infer<typeof updateQuestionSchema>;
export type DeleteQuestionDto = z.infer<typeof deleteQuestionSchema>;
