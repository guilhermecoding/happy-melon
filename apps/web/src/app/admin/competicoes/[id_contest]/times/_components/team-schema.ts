import { z } from 'zod';

export const teamFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome do time'),
  usernameTeam: z.string().min(1, 'Informe o usuário do time'),
  room: z.string(),
  machine: z.string(),
});

export type TeamFormValues = z.infer<typeof teamFormSchema>;

export const emptyTeamFormValues: TeamFormValues = {
  name: '',
  usernameTeam: '',
  room: '',
  machine: '',
};
