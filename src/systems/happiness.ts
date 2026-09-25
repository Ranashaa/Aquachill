import type { FloorState } from '../state/GameState';
import { cleanliness } from './algae';

/** Score de décoration : 4 objets différents suffisent pour un aquarium douillet. */
export function decorScore(floor: FloorState): number {
  const distinct = new Set(floor.slots.filter(Boolean)).size;
  return Math.min(1, distinct / 4);
}

/** Bonheur des pensionnaires entre 0 et 1. Jamais de mort : juste plus ou moins de joie. */
export function happiness(floor: FloorState): number {
  return 0.65 * cleanliness(floor) + 0.35 * decorScore(floor);
}

export type Mood = 'ravi' | 'content' | 'morose';

export function mood(floor: FloorState): Mood {
  const h = happiness(floor);
  if (h >= 0.75) return 'ravi';
  if (h >= 0.45) return 'content';
  return 'morose';
}

export const MOOD_TEXT: Record<Mood, string> = {
  ravi: 'Les poissons sont ravis !',
  content: 'Les poissons sont contents.',
  morose: 'Les poissons trouvent la vitre un peu sale…',
};
