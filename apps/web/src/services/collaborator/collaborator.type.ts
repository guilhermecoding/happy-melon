export type Collaborator = {
  id: string;
  name: string;
  email: string;
  hasAccess: boolean;
  lastAccess: string | null;
  ipAddress: string | null;
  createdAt: string;
};

export type CollaboratorScore = {
  id: string;
  name: string;
  email: string;
  deliveredCount: number;
  totalDurationMs: number;
  lastDeliveredAt: string | null;
};

export type CreateCollaboratorInput = {
  name: string;
  email: string;
};

export type UpdateCollaboratorInput = {
  name: string;
};
