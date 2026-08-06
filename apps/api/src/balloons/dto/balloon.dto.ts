import { z } from 'zod';

export const teamQuestionActionSchema = z.object({
  teamId: z.string().min(1),
  questionId: z.string().min(1),
});

export type TeamQuestionActionDto = z.infer<typeof teamQuestionActionSchema>;
