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
  YELLOW: '#FFD800',
} as const;

export type BalloonColor = (typeof COLOR)[keyof typeof COLOR];

export const BALLOON_COLOR_VALUES = Object.values(COLOR) as [
  BalloonColor,
  ...BalloonColor[],
];
