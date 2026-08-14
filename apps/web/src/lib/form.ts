/** TanStack Form reports validation errors as Zod issues (or plain strings).
 *  The pouf `Field` takes a single message, so collapse to the first one. */
export function fieldError(meta: { errors: unknown[] }): string | undefined {
  const first = meta.errors[0]
  if (!first) return undefined
  if (typeof first === 'string') return first
  return (first as { message?: string }).message
}
