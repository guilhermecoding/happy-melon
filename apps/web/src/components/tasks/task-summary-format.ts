import { TASK_KIND, type BalloonDeliveryStatus } from '@repo/shared';

export const TASK_SUMMARY_PAGE_SIZE = 20;

const TASK_SUMMARY_STATUS_LABEL = {
  pending: 'Disponível',
  processing: 'Em rota',
  delivered: 'Entregue',
  withheld: 'Retido',
} as const satisfies Record<BalloonDeliveryStatus, string>;

const taskSummaryTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function taskSummaryStatusLabel(status: BalloonDeliveryStatus): string {
  return TASK_SUMMARY_STATUS_LABEL[status];
}

export function formatTaskSummaryTime(isoDate: string): string {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return '--/-- --:--';
  }

  const parts = taskSummaryTimeFormatter.formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${pick('day')}/${pick('month')} ${pick('hour')}:${pick('minute')}`;
}

export function taskSummaryDescription(task: {
  kind: string;
  balloonColorLabel: string | null;
  questionLabel: string | null;
}): string {
  if (task.kind === TASK_KIND.PRINT_TASK) {
    return 'Impressão de código';
  }

  const color = task.balloonColorLabel ?? '—';
  const label = task.questionLabel ?? '—';
  return `Balão ${color} do problema ${label}`;
}
