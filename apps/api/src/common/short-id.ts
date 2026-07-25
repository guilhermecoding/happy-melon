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
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as {
    code?: string;
    meta?: { target?: string | string[] };
  };

  if (candidate.code !== 'P2002') {
    return false;
  }

  const target = candidate.meta?.target;

  if (Array.isArray(target)) {
    return target.includes('id');
  }

  return target === 'id';
}
