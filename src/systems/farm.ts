// Journée façon Stardew : calendrier, bacs de culture, coffre d'expédition,
// habitués et lots du Grand Bassin. Logique pure sur l'état, sans Phaser.
import { BUNDLES_BY_ID, type BundleId, type Requirement } from '../data/bundles';
import {
  CROPS, DAY_END, DAY_START, DAYS_PER_SEASON, REAL_SECONDS_PER_GAME_MINUTE, SEASONS, type CropId,
} from '../data/garden';
import { hearts } from '../data/personality';
import { VILLAGERS, VILLAGER_LIST, type VillagerId } from '../data/villagers';
import type { GameState, Plot } from '../state/GameState';
import { hash01 } from './rng';

/** Au-delà de 2 h du matin, l'horloge s'arrête : le soigneur tombe de sommeil… en douceur. */
export const LATEST_MINUTE = DAY_END + 2 * 60;
export const HEART_POINTS = 20;

// ---------------------------------------------------------------- calendrier

export function tickClock(state: GameState, dt: number): void {
  state.day.minute = Math.min(LATEST_MINUTE, state.day.minute + dt / REAL_SECONDS_PER_GAME_MINUTE);
}

export function clockText(minute: number): string {
  const m = Math.floor(minute) % (24 * 60);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.floor(m % 60 / 10) * 10).padStart(2, '0')}`;
}

export function calendar(day: number): { season: string; dayOfSeason: number; year: number } {
  const i = day - 1;
  return {
    season: SEASONS[Math.floor(i / DAYS_PER_SEASON) % SEASONS.length],
    dayOfSeason: (i % DAYS_PER_SEASON) + 1,
    year: Math.floor(i / (DAYS_PER_SEASON * SEASONS.length)) + 1,
  };
}

/** Heure décimale (0-24) pour le ciel. */
export const gameHour = (state: GameState) => (state.day.minute / 60) % 24;

export const isLate = (state: GameState) => state.day.minute >= DAY_END;

// ---------------------------------------------------------------- cultures

export const isReady = (p: Plot) => !!p.crop && p.grown >= CROPS[p.crop].days;
export const daysLeft = (p: Plot) => (p.crop ? Math.max(0, CROPS[p.crop].days - p.grown) : 0);

/** Stade visuel : 0 bouture, 1 pousse, 2 prête. */
export function plotStage(p: Plot): 0 | 1 | 2 {
  if (!p.crop) return 0;
  if (isReady(p)) return 2;
  return p.grown * 2 >= CROPS[p.crop].days ? 1 : 0;
}

export const cropsForBiome = (biome: string) => Object.values(CROPS).filter((c) => c.biome === biome);

function tended(state: GameState): void {
  state.counters.tend++;
  state.today.tended++;
}

export type PlantResult = 'ok' | 'occupied' | 'biome' | 'poor';

/** Plante une bouture (achetée au passage si besoin). Planter compte comme le soin du jour. */
export function plant(state: GameState, floor: number, index: number, crop: CropId): PlantResult {
  const plot = state.floors[floor]?.plots[index];
  if (!plot || plot.crop) return 'occupied';
  if (CROPS[crop].biome !== state.floors[floor].biome) return 'biome';
  if ((state.seeds[crop] ?? 0) > 0) state.seeds[crop]! -= 1;
  else if (state.coins >= CROPS[crop].seedPrice) state.coins -= CROPS[crop].seedPrice;
  else return 'poor';
  plot.crop = crop;
  plot.grown = 0;
  plot.tendedToday = true;
  tended(state);
  return 'ok';
}

export function tend(state: GameState, floor: number, index: number): boolean {
  const plot = state.floors[floor]?.plots[index];
  if (!plot?.crop || plot.tendedToday || isReady(plot)) return false;
  plot.tendedToday = true;
  tended(state);
  return true;
}

export function harvest(state: GameState, floor: number, index: number): CropId | null {
  const plot = state.floors[floor]?.plots[index];
  if (!plot || !isReady(plot)) return null;
  const crop = plot.crop!;
  state.items[crop] = (state.items[crop] ?? 0) + 1;
  state.counters.harvest++;
  state.today.harvested++;
  if (CROPS[crop].regrow) plot.grown = 0;
  else plot.crop = null;
  plot.tendedToday = false;
  return crop;
}

export function buySeeds(state: GameState, crop: CropId, qty = 1): boolean {
  const cost = CROPS[crop].seedPrice * qty;
  if (state.coins < cost) return false;
  state.coins -= cost;
  state.seeds[crop] = (state.seeds[crop] ?? 0) + qty;
  return true;
}

// ------------------------------------------------------------ expédition

export function ship(state: GameState, crop: CropId, qty = 1): number {
  const n = Math.min(qty, state.items[crop] ?? 0);
  if (n <= 0) return 0;
  state.items[crop]! -= n;
  state.shipBin[crop] = (state.shipBin[crop] ?? 0) + n;
  return n;
}

export function unship(state: GameState, crop: CropId): number {
  const n = state.shipBin[crop] ?? 0;
  if (!n) return 0;
  delete state.shipBin[crop];
  state.items[crop] = (state.items[crop] ?? 0) + n;
  return n;
}

export const binValue = (state: GameState) =>
  Object.entries(state.shipBin).reduce((sum, [c, n]) => sum + CROPS[c as CropId].sellPrice * (n ?? 0), 0);

// ------------------------------------------------------------- habitués

export const villagerHearts = (state: GameState, id: VillagerId) => hearts(state.villagers[id].friendship);

/** Où se trouve un habitué aujourd'hui : étage (-1 = hall) et position (0-1). */
export function villagerSpot(state: GameState, id: VillagerId): { floor: number; x: number } | null {
  const m = state.day.minute;
  if (m < 8 * 60 || m >= 21 * 60) return null;
  const idx = VILLAGER_LIST.findIndex((v) => v.id === id);
  const n = state.floors.length;
  const r = hash01(state.day.n * 31 + idx * 7);
  // un habitué sur quatre traîne dans le hall, devant le Grand Bassin
  const floor = r < 0.25 ? -1 : Math.floor(hash01(state.day.n * 13 + idx) * n);
  // côtés gauche/droit de la salle, pour ne pas masquer les bacs
  const x = floor === -1 ? 0.55 + idx * 0.05 : (hash01(state.day.n + idx * 3) < 0.5 ? 0.06 : 0.9);
  return { floor, x };
}

export function dailyLine(state: GameState, id: VillagerId): string {
  const v = VILLAGERS[id];
  const h = villagerHearts(state, id);
  const r = hash01(state.day.n * 17 + id.length * 5 + id.charCodeAt(0));
  const friend = [4, 2].find((k) => h >= k && v.friendLines[k]);
  if (friend && r < 0.3) return v.friendLines[friend];
  return v.lines[Math.floor(r * 997) % v.lines.length];
}

/** Bavarder : la première conversation du jour rapproche. */
export function talk(state: GameState, id: VillagerId): { line: string; gained: boolean } {
  const vs = state.villagers[id];
  const gained = !vs.talkedToday;
  if (gained) {
    vs.talkedToday = true;
    vs.friendship = Math.min(100, vs.friendship + 8);
  }
  return { line: dailyLine(state, id), gained };
}

export type GiftTaste = 'love' | 'like' | 'neutral';

export function tasteOf(id: VillagerId, crop: CropId): GiftTaste {
  const v = VILLAGERS[id];
  return v.loves.includes(crop) ? 'love' : v.likes.includes(crop) ? 'like' : 'neutral';
}

export function giveGift(state: GameState, id: VillagerId, crop: CropId): { taste: GiftTaste; reply: string } | null {
  const vs = state.villagers[id];
  if (vs.giftedToday || !(state.items[crop]! > 0)) return null;
  state.items[crop]! -= 1;
  vs.giftedToday = true;
  const taste = tasteOf(id, crop);
  vs.friendship = Math.min(100, vs.friendship + { love: 25, like: 12, neutral: 5 }[taste]);
  const v = VILLAGERS[id];
  return { taste, reply: { love: v.loveReply, like: v.likeReply, neutral: v.neutralReply }[taste] };
}

/** Ouvre une lettre : son cadeau éventuel est ajouté. */
export function readLetter(state: GameState, index: number): { seeds?: CropId; coins?: number } | null {
  const letter = state.mail[index];
  if (!letter || letter.read) return null;
  letter.read = true;
  const gift = VILLAGERS[letter.from].letters[letter.hearts]?.gift ?? null;
  if (gift?.seeds) state.seeds[gift.seeds] = (state.seeds[gift.seeds] ?? 0) + 1;
  if (gift?.coins) state.coins += gift.coins;
  return gift;
}

// ------------------------------------------------------------- Grand Bassin

export interface ReqProgress {
  req: Requirement;
  have: number;
  need: number;
  done: boolean;
}

function bundleState(state: GameState, id: BundleId) {
  return (state.bundles[id] ??= { given: {}, done: false });
}

export function bundleProgress(state: GameState, id: BundleId): ReqProgress[] {
  const b = bundleState(state, id);
  return BUNDLES_BY_ID[id].needs.map((req) => {
    let have = 0;
    if (req.kind === 'item') have = b.given[req.crop] ?? 0;
    else if (req.kind === 'counter') have = state.counters[req.counter];
    else have = VILLAGER_LIST.filter((v) => villagerHearts(state, v.id) >= req.hearts).length;
    const need = req.qty;
    return { req, have: Math.min(have, need), need, done: b.done || have >= need };
  });
}

export function giveToBundle(state: GameState, id: BundleId, crop: CropId): boolean {
  const b = bundleState(state, id);
  const req = BUNDLES_BY_ID[id].needs.find((r) => r.kind === 'item' && r.crop === crop);
  if (b.done || !req || req.kind !== 'item') return false;
  if ((b.given[crop] ?? 0) >= req.qty || !(state.items[crop]! > 0)) return false;
  state.items[crop]! -= 1;
  b.given[crop] = (b.given[crop] ?? 0) + 1;
  return true;
}

export const bundleReady = (state: GameState, id: BundleId) =>
  !bundleState(state, id).done && bundleProgress(state, id).every((p) => p.done);

/** Termine un lot complet et donne sa récompense. */
export function completeBundle(state: GameState, id: BundleId): boolean {
  if (!bundleReady(state, id)) return false;
  bundleState(state, id).done = true;
  const r = BUNDLES_BY_ID[id].reward;
  if (r.coins) state.coins += r.coins;
  for (const [c, n] of Object.entries(r.seeds ?? {})) state.seeds[c as CropId] = (state.seeds[c as CropId] ?? 0) + (n ?? 0);
  if (r.boots) state.boots = true;
  return true;
}

export const bundlesDone = (state: GameState) => Object.values(state.bundles).filter((b) => b?.done).length;

// ------------------------------------------------------------- fin de journée

export interface DayRecap {
  day: number;
  shipped: { crop: CropId; qty: number; coins: number }[];
  shipTotal: number;
  dayCoins: number;
  visitors: number;
  tended: number;
  harvested: number;
  grown: number;
  ready: number;
  letters: VillagerId[];
}

/** Aller dormir : les bacs soignés poussent, le coffre est vendu, le courrier arrive. */
export function endDay(state: GameState): DayRecap {
  const recap: DayRecap = {
    day: state.day.n, shipped: [], shipTotal: 0, dayCoins: state.today.coins, visitors: state.today.visitors,
    tended: state.today.tended, harvested: state.today.harvested, grown: 0, ready: 0, letters: [],
  };
  for (const floor of state.floors) {
    for (const plot of floor.plots) {
      if (plot.crop && plot.tendedToday && !isReady(plot)) {
        plot.grown++;
        recap.grown++;
        if (isReady(plot)) recap.ready++;
      }
      plot.tendedToday = false;
    }
  }
  for (const [c, n] of Object.entries(state.shipBin)) {
    if (!n) continue;
    const crop = c as CropId;
    const coins = CROPS[crop].sellPrice * n;
    recap.shipped.push({ crop, qty: n, coins });
    recap.shipTotal += coins;
    state.counters.ship += n;
  }
  state.shipBin = {};
  state.coins += recap.shipTotal;
  state.stats.coinsEarned += recap.shipTotal;

  state.day.n++;
  state.day.minute = DAY_START;
  for (const v of VILLAGER_LIST) {
    const vs = state.villagers[v.id];
    vs.talkedToday = false;
    vs.giftedToday = false;
    const h = hearts(vs.friendship);
    for (const k of [1, 3, 5]) {
      if (h >= k && !vs.letters.includes(k) && v.letters[k]) {
        vs.letters.push(k);
        state.mail.unshift({ from: v.id, hearts: k, day: state.day.n, read: false });
        recap.letters.push(v.id);
      }
    }
  }
  state.mail = state.mail.slice(0, 30);
  state.today = { coins: 0, visitors: 0, tended: 0, harvested: 0 };
  return recap;
}
