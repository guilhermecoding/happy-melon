export type Administrator = {
  id: string;
  name: string;
  email: string;
  hasAccess: boolean;
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
