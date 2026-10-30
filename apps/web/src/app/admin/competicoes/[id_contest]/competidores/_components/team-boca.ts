import type { TeamCsvRow } from './team-csv';

export type TeamBocaParseResult = {
  rows: TeamCsvRow[];
  errors: string[];
};

function parseKeyValue(line: string): { key: string; value: string } | null {
  const separatorIndex = line.indexOf('=');
  if (separatorIndex <= 0) {
    return null;
  }

  return {
    key: line.slice(0, separatorIndex).trim().toLowerCase(),
    value: line.slice(separatorIndex + 1).trim(),
  };
}

/**
 * Parses a BOCA user export (.txt) starting with `[user]`.
 * Only `userfullname` (name) and `username` are kept; room/machine stay null.
 */
export function parseTeamsBoca(content: string): TeamBocaParseResult {
  const lines = content
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trimEnd());

  const nonEmptyIndexes = lines
    .map((line, index) => ({ line: line.trim(), index }))
    .filter(({ line }) => line.length > 0);

  if (nonEmptyIndexes.length === 0) {
    return {
      rows: [],
      errors: ['O arquivo TXT está vazio.'],
    };
  }

  const first = nonEmptyIndexes[0]!;
  if (first.line.toLowerCase() !== '[user]') {
    return {
      rows: [],
      errors: [
        'Arquivo inválido: o formato BOCA deve iniciar com a seção [user].',
      ],
    };
  }

  type Block = {
    startLine: number;
    fields: Record<string, string>;
  };

  const blocks: Block[] = [];
  let current: Block | null = null;

  for (let index = first.index + 1; index < lines.length; index++) {
    const raw = lines[index]!;
    const trimmed = raw.trim();

    if (trimmed.length === 0) {
      if (current && Object.keys(current.fields).length > 0) {
        blocks.push(current);
        current = null;
      }
      continue;
    }

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      if (current && Object.keys(current.fields).length > 0) {
        blocks.push(current);
        current = null;
      }
      continue;
    }

    const pair = parseKeyValue(trimmed);
    if (!pair) {
      continue;
    }

    if (!current) {
      current = { startLine: index + 1, fields: {} };
    }

    current.fields[pair.key] = pair.value;
  }

  if (current && Object.keys(current.fields).length > 0) {
    blocks.push(current);
  }

  if (blocks.length === 0) {
    return {
      rows: [],
      errors: ['Nenhum usuário encontrado após a seção [user].'],
    };
  }

  const errors: string[] = [];
  const rowsByUsername = new Map<string, TeamCsvRow>();
  const firstSeenLineByUsername = new Map<string, number>();

  for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
    const block = blocks[blockIndex]!;
    const entryNumber = blockIndex + 1;
    const userNumber = block.fields.usernumber?.trim() || undefined;
    const name = (block.fields.userfullname ?? '').trim();
    const usernameRaw = (block.fields.username ?? '').trim();
    const usernameTeam = usernameRaw.toLowerCase();

    const identity =
      usernameRaw ||
      name ||
      (userNumber ? `usernumber=${userNumber}` : `entrada ${entryNumber}`);

    if (!name && !usernameTeam) {
      errors.push(
        `Entrada ${entryNumber} (linha ${block.startLine}): userfullname e username ausentes (${identity}).`,
      );
      continue;
    }

    if (!name) {
      errors.push(
        `Entrada ${entryNumber} (linha ${block.startLine}): userfullname ausente (${identity}).`,
      );
      continue;
    }

    if (!usernameTeam) {
      errors.push(
        `Entrada ${entryNumber} (linha ${block.startLine}): username ausente (${identity}).`,
      );
      continue;
    }

    const previousLine = firstSeenLineByUsername.get(usernameTeam);
    if (previousLine !== undefined) {
      errors.push(
        `Entrada ${entryNumber} (linha ${block.startLine}): username duplicado "${usernameTeam}" (já informado na linha ${previousLine}).`,
      );
      continue;
    }

    firstSeenLineByUsername.set(usernameTeam, block.startLine);
    rowsByUsername.set(usernameTeam, {
      name,
      usernameTeam,
      room: null,
      machine: null,
    });
  }

  return {
    rows: [...rowsByUsername.values()],
    errors,
  };
}
