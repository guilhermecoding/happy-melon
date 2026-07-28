export type TeamCsvRow = {
  name: string;
  usernameTeam: string;
  room: string | null;
  machine: string | null;
};

export type TeamCsvParseResult = {
  rows: TeamCsvRow[];
  errors: string[];
};

const TEMPLATE_HEADER = 'Nome,Usuario,Sala,Numero da Maquina';

export const TEAM_CSV_TEMPLATE = `${TEMPLATE_HEADER}
Time Alpha,alpha,Sala 1,12
Time Beta,beta,,
`;

const HEADER_ALIASES = {
  name: ['nome', 'name'],
  usernameTeam: ['usuario', 'usuário', 'username', 'username_team', 'user'],
  room: ['sala', 'room'],
  machine: [
    'maquina',
    'máquina',
    'numero da maquina',
    'número da máquina',
    'machine',
    'machine_number',
  ],
} as const;

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index++) {
    const char = line[index]!;

    if (char === '"') {
      const next = line[index + 1];
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function emptyToNull(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveColumnIndexes(headers: string[]) {
  const normalized = headers.map(normalizeHeader);

  function findIndex(aliases: readonly string[]) {
    return normalized.findIndex((header) => aliases.includes(header));
  }

  return {
    name: findIndex(HEADER_ALIASES.name),
    usernameTeam: findIndex(HEADER_ALIASES.usernameTeam),
    room: findIndex(HEADER_ALIASES.room),
    machine: findIndex(HEADER_ALIASES.machine),
  };
}

export function parseTeamsCsv(content: string): TeamCsvParseResult {
  const lines = content
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return {
      rows: [],
      errors: ['O arquivo CSV está vazio.'],
    };
  }

  const headerCells = parseCsvLine(lines[0]!);
  const columns = resolveColumnIndexes(headerCells);

  if (columns.name < 0 || columns.usernameTeam < 0) {
    return {
      rows: [],
      errors: [
        'Cabeçalho inválido. Use as colunas Nome, Usuario, Sala e Numero da Maquina.',
      ],
    };
  }

  const errors: string[] = [];
  const rowsByUsername = new Map<string, TeamCsvRow>();
  const firstSeenLineByUsername = new Map<string, number>();

  for (let index = 1; index < lines.length; index++) {
    const lineNumber = index + 1;
    const cells = parseCsvLine(lines[index]!);
    const name = (cells[columns.name] ?? '').trim();
    const usernameRaw = (cells[columns.usernameTeam] ?? '').trim();
    const usernameTeam = usernameRaw.toLowerCase();
    const room =
      columns.room >= 0 ? emptyToNull(cells[columns.room]) : null;
    const machine =
      columns.machine >= 0 ? emptyToNull(cells[columns.machine]) : null;

    const identity =
      usernameRaw || name || `conteúdo: "${lines[index]!.slice(0, 40)}"`;

    if (!name && !usernameTeam) {
      errors.push(
        `Linha ${lineNumber}: Nome e Usuário ausentes (${identity}).`,
      );
      continue;
    }

    if (!name) {
      errors.push(`Linha ${lineNumber}: Nome ausente (${identity}).`);
      continue;
    }

    if (!usernameTeam) {
      errors.push(`Linha ${lineNumber}: Usuário ausente (${identity}).`);
      continue;
    }

    const previousLine = firstSeenLineByUsername.get(usernameTeam);
    if (previousLine !== undefined) {
      errors.push(
        `Linha ${lineNumber}: Usuário duplicado "${usernameTeam}" (já informado na linha ${previousLine}).`,
      );
      continue;
    }

    firstSeenLineByUsername.set(usernameTeam, lineNumber);
    rowsByUsername.set(usernameTeam, {
      name,
      usernameTeam,
      room,
      machine,
    });
  }

  return {
    rows: [...rowsByUsername.values()],
    errors,
  };
}

export function downloadTeamCsvTemplate() {
  const blob = new Blob([TEAM_CSV_TEMPLATE], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'modelo-times.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

export function downloadTeamsCsv(
  teams: Array<{
    id: string;
    name: string;
    usernameTeam: string;
    room: string | null;
    machine: string | null;
  }>,
  filename = 'times.csv',
) {
  const header = 'ID,Nome,Usuario,Sala,Maquina';
  const lines = teams.map((team) =>
    [
      team.id,
      team.name,
      team.usernameTeam,
      team.room ?? '',
      team.machine ?? '',
    ]
      .map(escapeCsvCell)
      .join(','),
  );

  const blob = new Blob([[header, ...lines].join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
