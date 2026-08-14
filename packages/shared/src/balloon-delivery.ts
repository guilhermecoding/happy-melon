export const BALLOON_DELIVERY_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  DELIVERED: 'delivered',
  WITHHELD: 'withheld',
} as const;

export type BalloonDeliveryStatus =
  (typeof BALLOON_DELIVERY_STATUS)[keyof typeof BALLOON_DELIVERY_STATUS];

export const BALLOON_DELIVERY_STATUS_VALUES = Object.values(
  BALLOON_DELIVERY_STATUS,
) as [BalloonDeliveryStatus, ...BalloonDeliveryStatus[]];

export const BALLOON_EFFECTIVE_STATUS = {
  ABSENT: 'absent',
  ...BALLOON_DELIVERY_STATUS,
} as const;

export type BalloonEffectiveStatus =
  (typeof BALLOON_EFFECTIVE_STATUS)[keyof typeof BALLOON_EFFECTIVE_STATUS];

export const TASK_KIND = {
  BALLOON_TASK: 'balloon_task',
  PRINT_TASK: 'print_task',
} as const;

export type TaskKind = (typeof TASK_KIND)[keyof typeof TASK_KIND];

export const TASK_KIND_VALUES = Object.values(TASK_KIND) as [
  TaskKind,
  ...TaskKind[],
];

export const TASK_TYPE = {
  BALLOON_PENDING: 'balloon_pending',
  BALLOON_PROCESSING: 'balloon_processing',
  BALLOON_DELIVERED: 'balloon_delivered',
  BALLOON_WITHHELD: 'balloon_withheld',
  PRINT_PENDING: 'print_pending',
  PRINT_PROCESSING: 'print_processing',
  PRINT_DELIVERED: 'print_delivered',
  PRINT_WITHHELD: 'print_withheld',
} as const;

export type TaskType = (typeof TASK_TYPE)[keyof typeof TASK_TYPE];

export const TASK_TYPE_VALUES = Object.values(TASK_TYPE) as [
  TaskType,
  ...TaskType[],
];

export const BALLOON_STATUS_TO_TASK_TYPE = {
  [BALLOON_DELIVERY_STATUS.PENDING]: TASK_TYPE.BALLOON_PENDING,
  [BALLOON_DELIVERY_STATUS.PROCESSING]: TASK_TYPE.BALLOON_PROCESSING,
  [BALLOON_DELIVERY_STATUS.DELIVERED]: TASK_TYPE.BALLOON_DELIVERED,
  [BALLOON_DELIVERY_STATUS.WITHHELD]: TASK_TYPE.BALLOON_WITHHELD,
} as const satisfies Record<BalloonDeliveryStatus, TaskType>;

export const PRINT_STATUS_TO_TASK_TYPE = {
  [BALLOON_DELIVERY_STATUS.PENDING]: TASK_TYPE.PRINT_PENDING,
  [BALLOON_DELIVERY_STATUS.PROCESSING]: TASK_TYPE.PRINT_PROCESSING,
  [BALLOON_DELIVERY_STATUS.DELIVERED]: TASK_TYPE.PRINT_DELIVERED,
  [BALLOON_DELIVERY_STATUS.WITHHELD]: TASK_TYPE.PRINT_WITHHELD,
} as const satisfies Record<BalloonDeliveryStatus, TaskType>;

export const CONFIRMABLE_STATUSES = [
  BALLOON_EFFECTIVE_STATUS.ABSENT,
  BALLOON_EFFECTIVE_STATUS.WITHHELD,
] as const satisfies readonly BalloonEffectiveStatus[];

export const WITHHOLDABLE_STATUSES = [
  BALLOON_DELIVERY_STATUS.PENDING,
  BALLOON_DELIVERY_STATUS.PROCESSING,
  BALLOON_DELIVERY_STATUS.DELIVERED,
] as const satisfies readonly BalloonDeliveryStatus[];

export const RESOLVED_BALLOON_STATUSES = [
  BALLOON_DELIVERY_STATUS.PENDING,
  BALLOON_DELIVERY_STATUS.PROCESSING,
  BALLOON_DELIVERY_STATUS.DELIVERED,
] as const satisfies readonly BalloonDeliveryStatus[];

export function toBalloonEffectiveStatus(
  status: BalloonDeliveryStatus | null | undefined,
): BalloonEffectiveStatus {
  return status ?? BALLOON_EFFECTIVE_STATUS.ABSENT;
}

export function isConfirmableStatus(
  status: BalloonEffectiveStatus,
): boolean {
  return (CONFIRMABLE_STATUSES as readonly BalloonEffectiveStatus[]).includes(
    status,
  );
}

export function isWithholdableStatus(
  status: BalloonEffectiveStatus,
): status is (typeof WITHHOLDABLE_STATUSES)[number] {
  return (WITHHOLDABLE_STATUSES as readonly string[]).includes(status);
}

export function isResolvedBalloonStatus(
  status: BalloonEffectiveStatus,
): boolean {
  return (RESOLVED_BALLOON_STATUSES as readonly string[]).includes(status);
}

export function taskTypeFromStatus(
  status: BalloonDeliveryStatus,
  kind: TaskKind = TASK_KIND.BALLOON_TASK,
): TaskType {
  if (kind === TASK_KIND.PRINT_TASK) {
    return PRINT_STATUS_TO_TASK_TYPE[status];
  }

  return BALLOON_STATUS_TO_TASK_TYPE[status];
}

export type StaffTask = {
  id: string;
  kind: TaskKind;
  contestId: string;
  teamId: string;
  teamName: string;
  teamUsername: string;
  teamRoom: string | null;
  teamMachine: string | null;
  status: BalloonDeliveryStatus;
  claimedByUserId: string | null;
  claimedAt: string | null;
  createdAt: string;
  questionId?: string | null;
  balloonColor?: string | null;
  questionLabel?: string | null;
};

export const STAFF_TASK_EVENT_TYPE = {
  QUEUED: 'task.queued',
  CLAIMED: 'task.claimed',
  REMOVED: 'task.removed',
  SETTINGS_UPDATED: 'task.settings.updated',
} as const;

export type StaffTaskEventType =
  (typeof STAFF_TASK_EVENT_TYPE)[keyof typeof STAFF_TASK_EVENT_TYPE];

export type StaffTaskLifecycleEvent = {
  type:
    | typeof STAFF_TASK_EVENT_TYPE.QUEUED
    | typeof STAFF_TASK_EVENT_TYPE.CLAIMED
    | typeof STAFF_TASK_EVENT_TYPE.REMOVED;
  task: StaffTask;
};

export type StaffSettingsUpdatedEvent = {
  type: typeof STAFF_TASK_EVENT_TYPE.SETTINGS_UPDATED;
  deliveryTimeoutMinutes: number | null;
  balloonLimit: number | null;
};

export type StaffTaskEvent = StaffTaskLifecycleEvent | StaffSettingsUpdatedEvent;

export type StaffTasksSnapshot = {
  queue: StaffTask[];
  mine: StaffTask[];
  deliveryTimeoutMinutes: number | null;
  balloonLimit: number | null;
};
