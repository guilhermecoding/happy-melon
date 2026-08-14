export type Administrator = {
  id: string;
  name: string;
  email: string;
  hasAccess: boolean;
  lastAccess: string | null;
};

export type CreatedAdministrator = Administrator & {
  temporaryPassword: string;
};

export type CreateAdministratorInput = {
  name: string;
  email: string;
};

export type UpdateAdministratorInput = {
  name: string;
  email: string;
};

export type DeleteAdministratorInput = {
  password: string;
};

export type ResetAdministratorPasswordInput = {
  password: string;
  newPassword: string;
};

