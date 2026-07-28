export const COLOR = {
  BLACK: '#000000',
  BLUE: '#0000FF',
  LIGHT_BLUE: '#00FFFF',
  NAVY: '#000080',
  WHITE: '#FFFFFF',
  MAROON: '#800000',
  ORANGE: '#FF8000',
  SILVER: '#C0C0C0',
  PINK: '#FF00FF',
  PURPLE: '#800080',
  GREEN: '#008000',
  LIME: '#00FF00',
  RED: '#FF0000',
  YELLOW: '#FFFF00',
} as const;

export type BalloonColor = (typeof COLOR)[keyof typeof COLOR];

export const BALLOON_COLOR_VALUES = Object.values(COLOR) as [
  BalloonColor,
  ...BalloonColor[],
];

const BALLOON_COLOR_LABELS: Record<BalloonColor, string> = {
  [COLOR.YELLOW]: 'Amarelo',
  [COLOR.BLUE]: 'Azul',
  [COLOR.LIGHT_BLUE]: 'Azul claro',
  [COLOR.NAVY]: 'Azul marinho',
  [COLOR.WHITE]: 'Branco',
  [COLOR.MAROON]: 'Grená',
  [COLOR.ORANGE]: 'Laranja',
  [COLOR.BLACK]: 'Preto',
  [COLOR.SILVER]: 'Prata',
  [COLOR.PINK]: 'Rosa',
  [COLOR.PURPLE]: 'Roxo',
  [COLOR.GREEN]: 'Verde',
  [COLOR.LIME]: 'Verde limão',
  [COLOR.RED]: 'Vermelho',
};

export type BalloonColorOption = {
  value: BalloonColor;
  label: string;
};

export const BALLOON_COLOR_OPTIONS: BalloonColorOption[] = (
  Object.values(COLOR) as BalloonColor[]
)
  .map((value) => ({
    value,
    label: BALLOON_COLOR_LABELS[value],
  }))
  .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

export function isBalloonColor(value: string): value is BalloonColor {
  return (BALLOON_COLOR_VALUES as readonly string[]).includes(value);
}

export function toBalloonColor(
  value: string,
  fallback: BalloonColor = COLOR.RED,
): BalloonColor {
  const normalized = value.toUpperCase();
  return isBalloonColor(normalized) ? normalized : fallback;
}

export function getBalloonColorLabel(value: BalloonColor): string {
  return BALLOON_COLOR_LABELS[value];
}
