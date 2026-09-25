import type { BiomeId } from './biomes';

export interface FloorRequirement {
  /** Niveau de la tour minimum. */
  level: number;
  /** Nombre d'espèces identifiées dans le carnet. */
  species: number;
  /** Coût de construction en pièces. */
  coins: number;
}

export interface FloorPlanEntry {
  biome: BiomeId;
  req: FloorRequirement;
  /** Biome prévu dans une prochaine version : visible mais non constructible. */
  comingSoon?: boolean;
}

/** Ordre de déblocage des étages, du bas vers le haut. */
export const FLOOR_PLAN: FloorPlanEntry[] = [
  { biome: 'reef', req: { level: 1, species: 0, coins: 0 } },
  { biome: 'amazon', req: { level: 2, species: 3, coins: 250 } },
  { biome: 'koi', req: { level: 4, species: 7, coins: 800 } },
  { biome: 'mangrove', req: { level: 6, species: 12, coins: 2000 }, comingSoon: true },
  { biome: 'ice', req: { level: 8, species: 16, coins: 4000 }, comingSoon: true },
  { biome: 'abyss', req: { level: 10, species: 20, coins: 8000 }, comingSoon: true },
];

/** XP cumulée nécessaire pour atteindre chaque niveau (index 0 = niveau 1). */
export const LEVEL_XP = [0, 20, 60, 130, 240, 400, 620, 900, 1250, 1700, 2300, 3000];

export const XP = {
  visit: 1,
  starVisit: 5,
  newSpecies: 10,
  identifyBonus: 5,
};
