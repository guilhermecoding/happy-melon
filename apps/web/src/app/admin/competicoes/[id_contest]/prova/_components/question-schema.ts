import { z } from 'zod';
import {
  BALLOON_COLOR_VALUES,
  type BalloonColor,
} from '@/services/question/balloon-color';

export const questionFormSchema = z.object({
  label: z.string().min(1, 'Informe o identificador'),
  title: z.string().min(1, 'Informe o título'),
  balloonColor: z.enum(BALLOON_COLOR_VALUES, {
    error: 'Selecione uma cor de balão válida',
  }),
});

export type QuestionFormValues = {
  label: string;
  title: string;
  balloonColor: BalloonColor;
};
