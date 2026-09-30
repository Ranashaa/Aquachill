// Le temps dans la crique : une journée dure environ 14 minutes de jeu,
// de 6 h à 2 h du matin. La lumière suit l'heure.
import { mixRGB, type RGB } from './raster';
import type { Npc } from './dialogue';

export const DAY_START = 6 * 60;
export const DAY_LATE = 24 * 60;
export const DAY_MAX = 26 * 60;
/** Secondes réelles par minute de jeu. */
export const SECONDS_PER_MINUTE = 0.7;
export const SEASONS = ['Printemps', 'Été', 'Automne', 'Hiver'] as const;
export const DAYS_PER_SEASON = 28;

export interface Clock {
  day: number;
  minute: number;
}

export const newClock = (): Clock => ({ day: 1, minute: DAY_START });

export function tick(c: Clock, dt: number): void {
  c.minute = Math.min(DAY_MAX, c.minute + dt / SECONDS_PER_MINUTE);
}

export function timeText(minute: number): string {
  const m = Math.floor(minute) % (24 * 60);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.floor((m % 60) / 10) * 10).padStart(2, '0')}`;
}

export function dateText(day: number): string {
  const i = day - 1;
  return `${SEASONS[Math.floor(i / DAYS_PER_SEASON) % 4]}, jour ${(i % DAYS_PER_SEASON) + 1}`;
}

export const hourOf = (c: Clock) => (c.minute / 60) % 24;

interface Key {
  h: number;
  tint: RGB;
  amount: number;
  /** 0 = jour, 1 = nuit : allume lanternes, fenêtres et lucioles. */
  dark: number;
}

// couleur multipliée sur le monde, selon l'heure
const KEYS: Key[] = [
  { h: 0, tint: 0x2a3a78, amount: 0.62, dark: 1 },
  { h: 5, tint: 0x3a4080, amount: 0.55, dark: 1 },
  { h: 6, tint: 0xff9a78, amount: 0.3, dark: 0.35 },
  { h: 7.5, tint: 0xffd8b0, amount: 0.12, dark: 0 },
  { h: 10, tint: 0xffffff, amount: 0, dark: 0 },
  { h: 16, tint: 0xffffff, amount: 0, dark: 0 },
  { h: 18, tint: 0xffa860, amount: 0.3, dark: 0 },
  { h: 19.5, tint: 0xff6a5a, amount: 0.42, dark: 0.35 },
  { h: 20.5, tint: 0x7a58b0, amount: 0.45, dark: 0.7 },
  { h: 22, tint: 0x2a3a78, amount: 0.6, dark: 1 },
  { h: 24, tint: 0x2a3a78, amount: 0.62, dark: 1 },
];

export function lighting(hour: number): { multiply: RGB; dark: number } {
  const h = ((hour % 24) + 24) % 24;
  let i = 0;
  while (i < KEYS.length - 2 && KEYS[i + 1].h <= h) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const t = (h - a.h) / (b.h - a.h);
  const ca = mixRGB(0xffffff, a.tint, a.amount);
  const cb = mixRGB(0xffffff, b.tint, b.amount);
  return { multiply: mixRGB(ca, cb, t), dark: a.dark + (b.dark - a.dark) * t };
}

/** Heures de présence des habitués dans la crique. */
export const SCHEDULE: Record<Npc, [number, number]> = {
  marcel: [6.5, 19],
  lila: [9, 18.5],
  gobie: [8, 20],
  nina: [10, 21.5],
  elio: [6.2, 17],
  maelle: [7, 18],
  yanis: [11, 23],
  camille: [16, 26],
};

export function present(id: Npc, hour: number): boolean {
  const [a, b] = SCHEDULE[id];
  const h = hour < 6 ? hour + 24 : hour;
  return h >= a && h < b;
}
