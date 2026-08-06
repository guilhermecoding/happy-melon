import { randomBytes } from 'node:crypto';

const ID_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const ID_LENGTH = 8;
export const ID_MAX_ATTEMPTS = 10;

export function generateShortId(length = ID_LENGTH): string {
  const bytes = randomBytes(length);
  let id = '';

  for (let i = 0; i < length; i++) {
    id += ID_ALPHABET[bytes[i]! % ID_ALPHABET.length];
  }

  return id;
}

export function isIdUniqueViolation(error: unknown): boolean {
  return isUniqueViolationOn(error, 'id');
}

export function isPrismaUniqueViolation(error: unknown): boolean {
  return getPrismaErrorCode(error) === 'P2002';
}

export function isUniqueViolationOn(
  error: unknown,
  field: string,
): boolean {
  if (!isPrismaUniqueViolation(error)) {
    return false;
  }

  const target = getPrismaUniqueTarget(error);

  if (!target) {
    return false;
  }

  if (Array.isArray(target)) {
    return target.includes(field);
  }

  return target.includes(field);
}

function getPrismaErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const candidate = error as {
    code?: string;
    cause?: { code?: string };
  };

  if (typeof candidate.code === 'string') {
    return candidate.code;
  }

  if (candidate.cause && typeof candidate.cause.code === 'string') {
    return candidate.cause.code;
  }

  return undefined;
}

function getPrismaUniqueTarget(
  error: unknown,
): string | string[] | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const candidate = error as {
    meta?: { target?: string | string[] };
    cause?: { meta?: { target?: string | string[] } };
  };

  return candidate.meta?.target ?? candidate.cause?.meta?.target;
}
