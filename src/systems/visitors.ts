import { STARS, type StarId } from '../data/stars';
import { hash01, pickWeighted, type Rng } from './rng';

export type VisitorPhase = 'walkIn' | 'rideUp' | 'visit' | 'rideDown' | 'walkOut';

export interface Visitor {
  id: number;
  /** Index d'apparence (visiteur ordinaire). */
  look: number;
  star: StarId | null;
  /** Étage visité (index dans state.floors). */
  floor: number;
  phase: VisitorPhase;
  /** Temps écoulé dans la phase (s). */
  t: number;
  /** Durée de la phase (s). */
  dur: number;
  seed: number;
  starTapped: boolean;
}

export interface CoinDrop {
  id: number;
  floor: number;
  /** Position le long du couloir de l'étage, entre 0 et 1. */
  x: number;
  amount: number;
  age: number;
  star: boolean;
}

export const VISITOR_LOOKS = 24;
export const WALK_DURATION = 3.2;

export function rideDuration(floor: number): number {
  return 1 + 0.45 * (floor + 1);
}

export function visitDuration(seed: number): number {
  return 9 + hash01(seed * 7 + 3) * 6;
}

/** Deux points d'arrêt devant la vitre, en fraction du couloir (0 = gauche, 1 = ascenseur). */
export function visitSpots(seed: number): [number, number] {
  return [0.08 + hash01(seed * 13 + 1) * 0.7, 0.08 + hash01(seed * 17 + 5) * 0.7];
}

/**
 * Position horizontale (fraction du couloir) d'un visiteur pendant sa visite.
 * Il sort de l'ascenseur, va au premier point, admire, va au second, admire, repart.
 */
export function visitX(seed: number, progress: number): { x: number; walking: boolean } {
  const [a, b] = visitSpots(seed);
  const door = 0.94;
  const lerp = (p: number, q: number, k: number) => p + (q - p) * Math.min(1, Math.max(0, k));
  if (progress < 0.15) return { x: lerp(door, a, progress / 0.15), walking: true };
  if (progress < 0.45) return { x: a, walking: false };
  if (progress < 0.6) return { x: lerp(a, b, (progress - 0.45) / 0.15), walking: true };
  if (progress < 0.88) return { x: b, walking: false };
  return { x: lerp(b, door, (progress - 0.88) / 0.12), walking: true };
}

export function nextPhase(v: Visitor): VisitorPhase | null {
  switch (v.phase) {
    case 'walkIn': return 'rideUp';
    case 'rideUp': return 'visit';
    case 'visit': return 'rideDown';
    case 'rideDown': return 'walkOut';
    case 'walkOut': return null;
  }
}

export function phaseDuration(v: Visitor, phase: VisitorPhase): number {
  switch (phase) {
    case 'walkIn':
    case 'walkOut':
      return WALK_DURATION;
    case 'rideUp':
    case 'rideDown':
      return rideDuration(v.floor);
    case 'visit':
      return visitDuration(v.seed);
  }
}

/** Choisit éventuellement une star parmi celles débloquées et absentes de la tour. */
export function maybePickStar(
  level: number,
  present: Set<StarId>,
  seen: Partial<Record<StarId, number>>,
  rng: Rng,
  chance = 0.06,
): StarId | null {
  if (rng() > chance) return null;
  const candidates = STARS.filter((s) => s.level <= level && !present.has(s.id));
  const star = pickWeighted(candidates, (s) => (seen[s.id] ? 1 : 3), rng);
  return star ? star.id : null;
}
