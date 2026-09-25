import { TANK_CAPACITY } from '../config';
import { DECOR, type DecorTag } from '../data/decor';
import { RARITY_WEIGHT, speciesForBiome, type Species, type SpeciesId } from '../data/species';
import type { FloorState } from '../state/GameState';
import { happiness } from './happiness';
import { pickWeighted, type Rng } from './rng';

export function floorTags(floor: FloorState): Set<DecorTag> {
  const tags = new Set<DecorTag>();
  for (const id of floor.slots) if (id) for (const t of DECOR[id].tags) tags.add(t);
  return tags;
}

/** Une espèce peut-elle être attirée par cet aquarium (biome, température, décor) ? */
export function isEligible(species: Species, floor: FloorState, tags = floorTags(floor)): boolean {
  return species.biome === floor.biome && species.temps.includes(floor.temp) && species.needs.every((t) => tags.has(t));
}

export function eligibleSpecies(floor: FloorState): Species[] {
  const tags = floorTags(floor);
  return speciesForBiome(floor.biome).filter((s) => isEligible(s, floor, tags));
}

/** Délai aléatoire entre deux tentatives d'attraction (s). */
export function nextAttractDelay(rng: Rng): number {
  return 60 + rng() * 70;
}

/**
 * Fait avancer le minuteur d'attraction. Retourne l'espèce qui arrive, ou null.
 * Les espèces jamais vues sont favorisées pour que la découverte avance.
 */
export function attractionTick(
  floor: FloorState,
  dt: number,
  rng: Rng,
  discovered: Set<SpeciesId>,
): Species | null {
  floor.attractIn -= dt;
  if (floor.attractIn > 0) return null;
  floor.attractIn = nextAttractDelay(rng);
  if (floor.fish.length >= TANK_CAPACITY) return null;
  const candidates = eligibleSpecies(floor);
  if (candidates.length === 0) return null;
  // Un aquarium sale attire moins, mais attire toujours un peu.
  const chance = 0.6 * (0.4 + 0.6 * happiness(floor));
  if (rng() > chance) return null;
  return pickWeighted(
    candidates,
    (s) => RARITY_WEIGHT[s.rarity] * (discovered.has(s.id) ? 1 : 2.5),
    rng,
  );
}
