export type Collaborator = {
  id: string;
  name: string;
  email: string;
  hasAccess: boolean;
  lastAccess: string | null;
  createdAt: string;
};

export type CreateCollaboratorInput = {
  name: string;
  email: string;
};

export type UpdateCollaboratorInput = {
  name: string;
};
