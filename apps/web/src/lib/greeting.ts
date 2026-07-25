export type TimeOfDayGreeting = 'Bom dia' | 'Boa tarde' | 'Boa noite';

/** Returns a Portuguese greeting based on the local hour. */
export function getTimeOfDayGreeting(date: Date = new Date()): TimeOfDayGreeting {
  const hour = date.getHours();

  if (hour < 12) {
    return 'Bom dia';
  }

  if (hour < 18) {
    return 'Boa tarde';
  }

  return 'Boa noite';
}

/** Extracts the first name from a full name. */
export function getFirstName(fullName: string): string {
  const trimmed = fullName.trim();

  if (!trimmed) {
    return '';
  }

  return trimmed.split(/\s+/)[0] ?? '';
}

/** Builds a greeting like "Boa tarde, João!". */
export function formatUserGreeting(
  fullName: string,
  date: Date = new Date(),
): string {
  const greeting = getTimeOfDayGreeting(date);
  const firstName = getFirstName(fullName);

  if (!firstName) {
    return `${greeting}!`;
  }

  return `${greeting}, ${firstName}!`;
}
