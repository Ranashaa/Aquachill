import { FLOOR_PLAN, LEVEL_XP, type FloorPlanEntry } from '../data/progression';
import { discoveredCount, type GameState } from '../state/GameState';

export function levelForXp(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_XP.length; i++) if (xp >= LEVEL_XP[i]) level = i + 1;
  return level;
}

/** Progression vers le niveau suivant : { current, needed, ratio } (ratio = 1 au niveau max). */
export function levelProgress(xp: number): { level: number; into: number; needed: number; ratio: number } {
  const level = levelForXp(xp);
  const base = LEVEL_XP[level - 1];
  const next = LEVEL_XP[level];
  if (next === undefined) return { level, into: xp - base, needed: 0, ratio: 1 };
  return { level, into: xp - base, needed: next - base, ratio: (xp - base) / (next - base) };
}

export interface RequirementStatus {
  entry: FloorPlanEntry;
  levelOk: boolean;
  speciesOk: boolean;
  coinsOk: boolean;
  /** Tous les critères sont remplis et l'étage n'est pas « bientôt ». */
  canBuild: boolean;
}

/** Prochain étage à construire (ou null si tout est construit). */
export function nextFloor(state: GameState): FloorPlanEntry | null {
  return FLOOR_PLAN[state.floors.length] ?? null;
}

export function requirementStatus(state: GameState): RequirementStatus | null {
  const entry = nextFloor(state);
  if (!entry) return null;
  const levelOk = levelForXp(state.xp) >= entry.req.level;
  const speciesOk = discoveredCount(state) >= entry.req.species;
  const coinsOk = state.coins >= entry.req.coins;
  return { entry, levelOk, speciesOk, coinsOk, canBuild: !entry.comingSoon && levelOk && speciesOk && coinsOk };
}
