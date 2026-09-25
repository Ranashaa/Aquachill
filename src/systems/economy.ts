import { BIOMES } from '../data/biomes';
import { SPECIES_BY_ID } from '../data/species';
import type { FloorState } from '../state/GameState';
import { happiness } from './happiness';

/** Pièces laissées par un visiteur après sa visite d'un étage. */
export function visitIncome(floor: FloorState): number {
  const species = new Set(floor.fish.map((f) => f.species));
  const rares = [...species].filter((id) => SPECIES_BY_ID[id].rarity === 'rare').length;
  const base = 2 + floor.fish.length + species.size + rares * 2;
  return Math.max(1, Math.round(base * BIOMES[floor.biome].income * (0.5 + happiness(floor))));
}

/** Attractivité d'un étage pour les visiteurs (poids de choix de destination). */
export function floorAppeal(floor: FloorState): number {
  return (1 + floor.fish.length) * (0.5 + happiness(floor));
}

/** Intervalle moyen entre deux visiteurs (s), plus court quand la tour grandit. */
export function spawnInterval(floors: number, level: number): number {
  return Math.max(2.5, 8 - floors * 1.2 - level * 0.25);
}

export function maxVisitors(floors: number): number {
  return 2 + floors * 3;
}

/** Revenu moyen estimé par seconde (sert au calcul des gains hors ligne). */
export function estimatedIncomeRate(floors: FloorState[], level: number): number {
  if (floors.length === 0) return 0;
  const avg = floors.reduce((sum, f) => sum + visitIncome(f), 0) / floors.length;
  return avg / spawnInterval(floors.length, level);
}

/** Récompense quand on nettoie complètement une vitre bien sale. */
export function cleanReward(floor: FloorState): number {
  return Math.round(5 * BIOMES[floor.biome].income);
}
