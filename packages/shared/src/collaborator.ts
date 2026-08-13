export const COLLABORATOR_EVENT_TYPE = {
  JOINED: 'collaborator.joined',
} as const;

export type CollaboratorEventType =
  (typeof COLLABORATOR_EVENT_TYPE)[keyof typeof COLLABORATOR_EVENT_TYPE];

export type CollaboratorListItem = {
  id: string;
  name: string;
  email: string;
  hasAccess: boolean;
  lastAccess: string | null;
  ipAddress: string | null;
  createdAt: string;
};

export type CollaboratorJoinedEvent = {
  type: typeof COLLABORATOR_EVENT_TYPE.JOINED;
  collaborator: CollaboratorListItem;
};
