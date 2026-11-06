import { z } from 'zod';

export const balloonColorInputSchema = z.object({
  name: z.string(),
  hex: z.string(),
});

export type BalloonColorInput = z.infer<typeof balloonColorInputSchema>;
