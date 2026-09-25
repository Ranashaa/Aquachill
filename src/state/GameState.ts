import { ALGAE_COLS, ALGAE_ROWS, TANK_SLOTS } from '../config';
import type { BiomeId, Temp } from '../data/biomes';
import type { DecorId } from '../data/decor';
import type { SpeciesId } from '../data/species';
import type { StarId } from '../data/stars';

export const SAVE_VERSION = 1;

export interface FishInstance {
  uid: number;
  species: SpeciesId;
  /** Horodatage d'arrivée (ms). */
  since: number;
}

export interface FloorState {
  biome: BiomeId;
  temp: Temp;
  /** Emplacements de décor au fond de l'aquarium. */
  slots: (DecorId | null)[];
  fish: FishInstance[];
  /** Grille d'algues sur la vitre, chaque cellule entre 0 (propre) et 1 (sale). */
  algae: number[];
  /** Secondes avant la prochaine tentative d'attraction. */
  attractIn: number;
}

export interface JournalEntry {
  /** Horodatage de l'identification. */
  at: number;
  /** Nombre total d'individus accueillis. */
  count: number;
  /** Identifié correctement du premier coup. */
  guessed: boolean;
}

export interface GameState {
  version: number;
  coins: number;
  xp: number;
  floors: FloorState[];
  inventory: Partial<Record<DecorId, number>>;
  journal: Partial<Record<SpeciesId, JournalEntry>>;
  /** Poissons arrivés dont l'espèce n'a pas encore été identifiée. */
  toIdentify: number[];
  /** Nombre de visites de chaque star. */
  stars: Partial<Record<StarId, number>>;
  nextUid: number;
  savedAt: number;
  settings: { muted: boolean };
  stats: { visitors: number; coinsEarned: number; scrubs: number };
  tutorialDone: boolean;
}

export function createFloor(biome: BiomeId): FloorState {
  return {
    biome,
    temp: 1,
    slots: Array.from({ length: TANK_SLOTS }, () => null),
    fish: [],
    algae: Array.from({ length: ALGAE_COLS * ALGAE_ROWS }, () => 0),
    attractIn: 12,
  };
}

export function createNewState(now = Date.now()): GameState {
  const reef = createFloor('reef');
  // Une roche vivante offerte pour que les premiers pensionnaires arrivent vite.
  reef.slots[1] = 'live_rock';
  return {
    version: SAVE_VERSION,
    coins: 80,
    xp: 0,
    floors: [reef],
    inventory: {},
    journal: {},
    toIdentify: [],
    stars: {},
    nextUid: 1,
    savedAt: now,
    settings: { muted: false },
    stats: { visitors: 0, coinsEarned: 0, scrubs: 0 },
    tutorialDone: false,
  };
}

export function findFish(state: GameState, uid: number): { floor: number; fish: FishInstance } | null {
  for (let i = 0; i < state.floors.length; i++) {
    const fish = state.floors[i].fish.find((f) => f.uid === uid);
    if (fish) return { floor: i, fish };
  }
  return null;
}

export function discoveredCount(state: GameState): number {
  return Object.keys(state.journal).length;
}
