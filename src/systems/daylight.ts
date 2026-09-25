// Cycle jour/nuit calé sur l'heure locale réelle.

export interface Daylight {
  skyTop: string;
  skyBottom: string;
  /** 0 = plein jour, 1 = nuit noire. */
  night: number;
  /** Position du soleil ou de la lune : 0 → 1 d'est en ouest, null si invisible. */
  sun: number | null;
  moon: number | null;
}

interface Key {
  h: number;
  top: string;
  bottom: string;
  night: number;
}

const KEYS: Key[] = [
  { h: 0, top: '#0f1030', bottom: '#2a2458', night: 1 },
  { h: 5, top: '#1a1a48', bottom: '#3a3070', night: 0.9 },
  { h: 6.5, top: '#e8907a', bottom: '#ffd9a8', night: 0.35 },
  { h: 8, top: '#6ec4ee', bottom: '#d4f0ff', night: 0 },
  { h: 17, top: '#6ec4ee', bottom: '#d4f0ff', night: 0 },
  { h: 19, top: '#6a4a9a', bottom: '#f39a6a', night: 0.4 },
  { h: 20.5, top: '#2a2060', bottom: '#7a4a8a', night: 0.8 },
  { h: 22, top: '#14123a', bottom: '#2e2860', night: 1 },
  { h: 24, top: '#0f1030', bottom: '#2a2458', night: 1 },
];

function lerpHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) =>
    Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t)
      .toString(16)
      .padStart(2, '0');
  return `#${ch(16)}${ch(8)}${ch(0)}`;
}

export function hourOf(date: Date): number {
  return date.getHours() + date.getMinutes() / 60;
}

export function daylightAt(hour: number): Daylight {
  const h = ((hour % 24) + 24) % 24;
  let i = 0;
  while (i < KEYS.length - 2 && KEYS[i + 1].h <= h) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const t = (h - a.h) / (b.h - a.h);
  const sunUp = h >= 6 && h <= 20;
  const moonUp = h >= 19 || h <= 7;
  return {
    skyTop: lerpHex(a.top, b.top, t),
    skyBottom: lerpHex(a.bottom, b.bottom, t),
    night: a.night + (b.night - a.night) * t,
    sun: sunUp ? (h - 6) / 14 : null,
    moon: moonUp ? ((h + 5) % 24) / 12 : null,
  };
}
