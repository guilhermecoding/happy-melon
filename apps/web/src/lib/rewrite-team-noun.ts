/**
 * Rewrites the team noun in copy the API stored or returned.
 * A name such as "Time Alpha" is left as written.
 */
export function rewriteTeamNoun(message: string): string {
  return message
    .replaceAll(/\bTime não encontrado\b/g, 'Competidor não encontrado')
    .replaceAll(/\bdo time\b/g, 'do competidor')
    .replaceAll(/\bum time\b/g, 'um competidor')
    .replaceAll(/\bos times\b/g, 'os competidores')
    .replaceAll(/\baos times\b/g, 'aos competidores')
    .replaceAll(/\bo time\b/g, 'o competidor');
}
