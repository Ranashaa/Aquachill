// Vie des poissons : naissance, croissance, reproduction, expéditions, objectifs.
import { TANK_CAPACITY } from '../config';
import { DESTINATIONS_BY_ID, type DestinationId } from '../data/expeditions';
import { GROWTH, MISSION_DEFS, type MissionKind } from '../data/missions';
import { FISH_NAMES, PERSONALITY_LIST } from '../data/personality';
import { RARITY_WEIGHT, speciesForBiome, type SpeciesId } from '../data/species';
import type { FishInstance, FloorState, GameState, Mission, Stage } from '../state/GameState';
import { happiness } from './happiness';
import { pick, pickWeighted, type Rng } from './rng';

const MIN = 60_000;

export function newFish(
  state: GameState,
  species: SpeciesId,
  rng: Rng,
  now: number,
  opts: Partial<Pick<FishInstance, 'bornAt' | 'stage' | 'variant' | 'parents'>> = {},
): FishInstance {
  const used = new Set(state.floors.flatMap((f) => f.fish.map((x) => x.name)));
  const free = FISH_NAMES.filter((n) => !used.has(n));
  return {
    uid: state.nextUid++,
    species,
    since: now,
    name: pick(free.length ? free : FISH_NAMES, rng),
    personality: pick(PERSONALITY_LIST, rng),
    friendship: 10,
    bornAt: opts.bornAt ?? 0,
    stage: opts.stage ?? 'adult',
    variant: opts.variant ?? false,
    parents: opts.parents,
    lastPet: 0,
  };
}

/** Stade de croissance d'un poisson né dans la tour, d'après son âge. */
export function stageAt(fish: FishInstance, now: number): Stage {
  if (!fish.bornAt) return 'adult';
  const age = (now - fish.bornAt) / MIN;
  if (age < GROWTH.egg) return 'egg';
  if (age < GROWTH.egg + GROWTH.fry) return 'fry';
  if (age < GROWTH.egg + GROWTH.fry + GROWTH.juvenile) return 'juvenile';
  return 'adult';
}

/** Minutes restantes avant le prochain stade (0 si adulte). */
export function minutesToNextStage(fish: FishInstance, now: number): number {
  if (!fish.bornAt) return 0;
  const age = (now - fish.bornAt) / MIN;
  const steps = [GROWTH.egg, GROWTH.egg + GROWTH.fry, GROWTH.egg + GROWTH.fry + GROWTH.juvenile];
  const next = steps.find((s) => s > age);
  return next === undefined ? 0 : Math.ceil(next - age);
}

export const STAGE_NAMES: Record<Stage, string> = { egg: 'Œuf', fry: 'Alevin', juvenile: 'Juvénile', adult: 'Adulte' };

/** Couple capable de pondre dans cet aquarium, ou null. */
export function breedingPair(floor: FloorState): [FishInstance, FishInstance] | null {
  if (floor.fish.length >= TANK_CAPACITY) return null;
  if (happiness(floor) < 0.6) return null;
  const adults = floor.fish.filter((f) => f.stage === 'adult' && f.friendship >= 30);
  for (let i = 0; i < adults.length; i++) {
    for (let j = i + 1; j < adults.length; j++) {
      if (adults[i].species === adults[j].species) return [adults[i], adults[j]];
    }
  }
  return null;
}

/** Œuf rapporté d'expédition : les espèces inconnues et rares sont favorisées. */
export function expeditionFind(dest: DestinationId, discovered: Set<SpeciesId>, rng: Rng): { species: SpeciesId; variant: boolean } {
  const list = speciesForBiome(DESTINATIONS_BY_ID[dest].biome);
  const s = pickWeighted(list, (sp) => (RARITY_WEIGHT[sp.rarity] + 2) * (discovered.has(sp.id) ? 1 : 3), rng) ?? list[0];
  return { species: s.id, variant: rng() < 0.06 };
}

/** Complète la liste des objectifs à trois, sans doublon de type. */
export function refillMissions(missions: Mission[], rng: Rng, exclude: MissionKind[] = []): Mission[] {
  const out = missions.slice();
  let guard = 0;
  while (out.length < 3 && guard++ < 50) {
    const def = pick(MISSION_DEFS, rng);
    if (out.some((m) => m.kind === def.kind) || exclude.includes(def.kind)) continue;
    const target = pick(def.targets, rng);
    out.push({ kind: def.kind, target, progress: 0, reward: def.reward * target });
  }
  return out;
}

export function missionText(m: Mission): string {
  const def = MISSION_DEFS.find((d) => d.kind === m.kind)!;
  return def.text.replace('{n}', String(m.target));
}
