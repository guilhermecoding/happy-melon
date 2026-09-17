export type Chef = {
  id: string;
  name: string;
  email: string;
  hasAccess: boolean;
  lastAccess: string | null;
};

export type CreatedChef = Chef & {
  temporaryPassword?: string;
};

export type CreateChefInput = {
  name: string;
  email: string;
};

export type UpdateChefInput = {
  name: string;
  email: string;
};

export type DeleteChefInput = {
  password: string;
};

export type ResetChefPasswordInput = {
  password: string;
  newPassword: string;
};
