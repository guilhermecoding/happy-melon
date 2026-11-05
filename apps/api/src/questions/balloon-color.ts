export const COLOR = {
  BLACK: '#000000',
  BLUE: '#0000FF',
  LIGHT_BLUE: '#00FFFF',
  NAVY: '#000080',
  WHITE: '#FFFFFF',
  MAROON: '#800000',
  BROWN: '#A3794D',
  ORANGE: '#FF8000',
  SILVER: '#C0C0C0',
  PINK: '#FF00FF',
  PURPLE: '#800080',
  GREEN: '#008000',
  LIME: '#00FF00',
  RED: '#FF0000',
  YELLOW: '#FFD800',
} as const;

export type BalloonColor = (typeof COLOR)[keyof typeof COLOR];

export const BALLOON_COLOR_VALUES = Object.values(COLOR) as [
  BalloonColor,
  ...BalloonColor[],
];

export const BALLOON_COLOR_LABELS: Record<BalloonColor, string> = {
  [COLOR.YELLOW]: 'Amarelo',
  [COLOR.BLUE]: 'Azul',
  [COLOR.LIGHT_BLUE]: 'Azul claro',
  [COLOR.NAVY]: 'Azul marinho',
  [COLOR.WHITE]: 'Branco',
  [COLOR.MAROON]: 'Grená',
  [COLOR.ORANGE]: 'Laranja',
  [COLOR.BROWN]: 'Marrom',
  [COLOR.BLACK]: 'Preto',
  [COLOR.SILVER]: 'Prata',
  [COLOR.PINK]: 'Rosa',
  [COLOR.PURPLE]: 'Roxo',
  [COLOR.GREEN]: 'Verde',
  [COLOR.LIME]: 'Verde limão',
  [COLOR.RED]: 'Vermelho',
};

const HEX_COLOR = /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export function balloonColorNameKey(name: string): string {
  return name.trim().toLocaleLowerCase('pt-BR');
}

export function normalizeBalloonHex(value: string): string | null {
  const match = value.trim().match(HEX_COLOR);
  if (!match?.[1]) {
    return null;
  }

  const digits = match[1].toUpperCase();
  const expanded =
    digits.length === 3
      ? digits
          .split('')
          .map((digit) => `${digit}${digit}`)
          .join('')
      : digits;

  return `#${expanded}`;
}

export function isBuiltinBalloonColor(value: string): value is BalloonColor {
  return (BALLOON_COLOR_VALUES as readonly string[]).includes(value);
}

export function builtinBalloonColorLabel(value: string): string | undefined {
  const normalized = normalizeBalloonHex(value);
  if (!normalized || !isBuiltinBalloonColor(normalized)) {
    return undefined;
  }

  return BALLOON_COLOR_LABELS[normalized];
}

export const BUILTIN_BALLOON_NAME_KEYS = new Set(
  Object.values(BALLOON_COLOR_LABELS).map((label) => balloonColorNameKey(label)),
);

export const BUILTIN_BALLOON_HEXES = new Set<string>(BALLOON_COLOR_VALUES);
