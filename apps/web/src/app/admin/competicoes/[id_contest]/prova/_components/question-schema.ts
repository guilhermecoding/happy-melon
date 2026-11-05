import { z } from 'zod';
import { normalizeBalloonHex } from '@/services/question/balloon-color';

export const questionFormSchema = z.object({
  label: z.string().min(1, 'Informe o identificador'),
  title: z.string().min(1, 'Informe o título'),
  balloonColor: z
    .string()
    .refine(
      (value) => normalizeBalloonHex(value) !== null,
      'Selecione uma cor de balão válida',
    ),
});

export type QuestionFormValues = {
  label: string;
  title: string;
  balloonColor: string;
};
