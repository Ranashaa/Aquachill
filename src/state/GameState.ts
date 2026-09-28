import { ALGAE_COLS, ALGAE_ROWS, TANK_SLOTS } from '../config';
import type { BiomeId, Temp } from '../data/biomes';
import type { DecorId } from '../data/decor';
import type { SpeciesId } from '../data/species';
import type { StarId } from '../data/stars';
import type { DestinationId } from '../data/expeditions';
import type { MissionKind } from '../data/missions';
import type { Personality } from '../data/personality';
import type { Ambience } from '../audio/AudioEngine';
import { DAY_START, PLOTS_PER_FLOOR, type CropId } from '../data/garden';
import type { VillagerId } from '../data/villagers';
import type { BundleId } from '../data/bundles';

export const SAVE_VERSION = 3;

export type Stage = 'egg' | 'fry' | 'juvenile' | 'adult';

export interface FishInstance {
  uid: number;
  species: SpeciesId;
  /** Horodatage d'arrivée (ms). */
  since: number;
  name: string;
  personality: Personality;
  /** Amitié avec le soigneur, de 0 à 100 (5 cœurs). */
  friendship: number;
  /** Naissance (ms) pour les poissons nés dans la tour, 0 sinon (déjà adulte). */
  bornAt: number;
  stage: Stage;
  /** Variante de couleur rare. */
  variant: boolean;
  /** Prénoms des parents, pour les poissons nés ici. */
  parents?: [string, string];
  /** Dernier câlin (ms), pour espacer les gains d'amitié. */
  lastPet: number;
}

export interface Expedition {
  dest: DestinationId;
  start: number;
  end: number;
}

export interface EggInStock {
  species: SpeciesId;
  variant: boolean;
  from: DestinationId;
}

export interface LogEntry {
  at: number;
  dest: DestinationId;
  species: SpeciesId;
  variant: boolean;
  postcard: string;
}

export interface Mission {
  kind: MissionKind;
  target: number;
  progress: number;
  reward: number;
}

export interface NewsItem {
  at: number;
  text: string;
  icon: string;
}

/** Un bac de culture au pied de l'aquarium. */
export interface Plot {
  crop: CropId | null;
  /** Jours de soin reçus depuis la plantation (ou la dernière récolte). */
  grown: number;
  tendedToday: boolean;
}

export interface VillagerState {
  /** Amitié de 0 à 100 (20 points par cœur). */
  friendship: number;
  talkedToday: boolean;
  giftedToday: boolean;
  /** Cœurs pour lesquels une lettre a déjà été envoyée. */
  letters: number[];
}

export interface Letter {
  from: VillagerId;
  hearts: number;
  day: number;
  read: boolean;
}

export type Counter = 'feed' | 'tend' | 'harvest' | 'ship';

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
  plots: Plot[];
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
  settings: { muted: boolean; ambience: Ambience; favoriteFloor: number; farmIntro: boolean };
  stats: { visitors: number; coinsEarned: number; scrubs: number; pauses: number; pauseMinutes: number };
  tutorialDone: boolean;
  towerName: string;
  expedition: Expedition | null;
  eggs: EggInStock[];
  logbook: LogEntry[];
  missions: Mission[];
  news: NewsItem[];
  /** Variantes rares déjà vues, par espèce. */
  variantsSeen: Partial<Record<SpeciesId, boolean>>;
  /** Calendrier du jeu : jour (1, 2, …) et minute de la journée (6:00 = 360). */
  day: { n: number; minute: number };
  seeds: Partial<Record<CropId, number>>;
  items: Partial<Record<CropId, number>>;
  /** Coffre d'expédition, vendu pendant la nuit. */
  shipBin: Partial<Record<CropId, number>>;
  villagers: Record<VillagerId, VillagerState>;
  mail: Letter[];
  /** Objets déjà déposés dans chaque lot du Grand Bassin. */
  bundles: Partial<Record<BundleId, { given: Partial<Record<CropId, number>>; done: boolean }>>;
  counters: Record<Counter, number>;
  boots: boolean;
  /** Bilan de la journée en cours. */
  today: { coins: number; visitors: number; tended: number; harvested: number };
}

export const emptyPlots = (): Plot[] => Array.from({ length: PLOTS_PER_FLOOR }, () => ({ crop: null, grown: 0, tendedToday: false }));

export function freshVillagers(): Record<VillagerId, VillagerState> {
  const v = (): VillagerState => ({ friendship: 0, talkedToday: false, giftedToday: false, letters: [] });
  return { marcel: v(), lila: v(), gobie: v(), nina: v() };
}

export function createFloor(biome: BiomeId): FloorState {
  return {
    biome,
    temp: 1,
    slots: Array.from({ length: TANK_SLOTS }, () => null),
    fish: [],
    algae: Array.from({ length: ALGAE_COLS * ALGAE_ROWS }, () => 0),
    attractIn: 12,
    plots: emptyPlots(),
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
    settings: { muted: false, ambience: 'music', favoriteFloor: 0, farmIntro: false },
    stats: { visitors: 0, coinsEarned: 0, scrubs: 0, pauses: 0, pauseMinutes: 0 },
    tutorialDone: false,
    towerName: 'Aquachill',
    expedition: null,
    eggs: [],
    logbook: [],
    missions: [],
    news: [],
    variantsSeen: {},
    day: { n: 1, minute: DAY_START },
    seeds: { zoanthus: 3 },
    items: {},
    shipBin: {},
    villagers: freshVillagers(),
    mail: [],
    bundles: {},
    counters: { feed: 0, tend: 0, harvest: 0, ship: 0 },
    boots: false,
    today: { coins: 0, visitors: 0, tended: 0, harvested: 0 },
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
