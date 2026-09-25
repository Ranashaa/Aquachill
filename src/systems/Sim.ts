import { DROP_AUTO_COLLECT, OFFLINE_CAP_SECONDS, TANK_CAPACITY } from '../config';
import { BIOMES, type Temp } from '../data/biomes';
import { DECOR, type DecorId } from '../data/decor';
import { XP } from '../data/progression';
import { SPECIES_BY_ID, type Species, type SpeciesId } from '../data/species';
import { STARS_BY_ID, type StarId } from '../data/stars';
import {
  createFloor, findFish, type Expedition, type FishInstance, type GameState, type LogEntry, type Mission, type NewsItem,
} from '../state/GameState';
import { DESTINATIONS_BY_ID, type DestinationId } from '../data/expeditions';
import type { MissionKind } from '../data/missions';
import { hearts } from '../data/personality';
import { saveGame } from '../state/SaveManager';
import { cleanliness, growAlgae, scrub } from './algae';
import { attractionTick } from './attraction';
import { cleanReward, estimatedIncomeRate, floorAppeal, maxVisitors, spawnInterval, visitIncome } from './economy';
import { Emitter } from './Emitter';
import { levelForXp, requirementStatus } from './progression';
import { hash01, pick, pickWeighted, type Rng } from './rng';
import { breedingPair, expeditionFind, newFish, refillMissions, stageAt } from './life';
import {
  maybePickStar, nextPhase, phaseDuration, visitSpots, VISITOR_LOOKS,
  type CoinDrop, type Visitor,
} from './visitors';

export type SimEvents = {
  coins: number;
  xp: { xp: number; level: number };
  levelUp: number;
  fishArrived: { floor: number; fish: FishInstance; isNew: boolean };
  fishLeft: { floor: number; uid: number };
  floorChanged: number;
  floorBuilt: number;
  dropSpawned: CoinDrop;
  dropCollected: { drop: CoinDrop; auto: boolean };
  starArrived: Visitor;
  starTapped: { visitor: Visitor; bonus: number };
  identifyChanged: number;
  cleaned: { floor: number; reward: number };
  toast: string;
  fishGrew: { floor: number; fish: FishInstance };
  eggLaid: { floor: number; fish: FishInstance };
  petted: { floor: number; fish: FishInstance; gained: boolean };
  expeditionStarted: Expedition;
  expeditionDone: { entry: LogEntry; coins: number };
  missionDone: Mission;
  missionsChanged: Mission[];
  news: NewsItem;
};

export interface IdentifyResult {
  correct: boolean;
  species: Species;
  reward: number;
}

export interface OfflineSummary {
  seconds: number;
  coins: number;
  arrivals: number;
}

export class Sim {
  readonly events = new Emitter<SimEvents>();
  visitors: Visitor[] = [];
  drops: CoinDrop[] = [];
  private nextId = 1;
  private spawnIn = 1.5;
  private saveIn = 10;
  private dirtyFloors = new Set<number>();

  private lifeT = 0;
  private breedT = new Map<number, number>();

  constructor(public state: GameState, private rng: Rng = Math.random, private clock: () => number = Date.now) {
    if (state.missions.length < 3) state.missions = refillMissions(state.missions, rng);
  }

  now(): number {
    return this.clock();
  }

  get level(): number {
    return levelForXp(this.state.xp);
  }

  discoveredSet(): Set<SpeciesId> {
    const set = new Set(Object.keys(this.state.journal) as SpeciesId[]);
    for (const uid of this.state.toIdentify) {
      const found = findFish(this.state, uid);
      if (found) set.add(found.fish.species);
    }
    return set;
  }

  // ------------------------------------------------------------------ boucle

  update(dt: number): void {
    const s = this.state;
    const discovered = this.discoveredSet();
    s.floors.forEach((floor, i) => {
      growAlgae(floor, dt, i);
      if (cleanliness(floor) < 0.75) this.dirtyFloors.add(i);
      const arrival = attractionTick(floor, dt, this.rng, discovered);
      if (arrival) {
        this.welcomeFish(i, arrival.id);
        discovered.add(arrival.id);
      }
    });

    this.updateVisitors(dt);
    this.lifeT -= dt;
    if (this.lifeT <= 0) {
      this.lifeT = 1;
      this.updateLife();
    }

    for (const drop of this.drops) drop.age += dt;
    for (const drop of this.drops.filter((d) => d.age >= DROP_AUTO_COLLECT)) this.collectDrop(drop.id, true);

    this.saveIn -= dt;
    if (this.saveIn <= 0) {
      this.saveIn = 10;
      this.save();
    }
  }

  private updateVisitors(dt: number): void {
    const s = this.state;
    this.spawnIn -= dt;
    if (this.spawnIn <= 0 && s.floors.length > 0) {
      this.spawnIn = spawnInterval(s.floors.length, this.level) * (0.6 + this.rng() * 0.8);
      if (this.visitors.length < maxVisitors(s.floors.length)) this.spawnVisitor();
    }
    for (const v of this.visitors) {
      v.t += dt;
      while (v.t >= v.dur) {
        if (v.phase === 'visit') this.finishVisit(v);
        const next = nextPhase(v);
        if (!next) {
          v.phase = 'walkOut';
          v.t = v.dur + 1; // marqué pour suppression
          break;
        }
        v.t -= v.dur;
        v.phase = next;
        v.dur = phaseDuration(v, next);
      }
    }
    this.visitors = this.visitors.filter((v) => !(v.phase === 'walkOut' && v.t > v.dur));
  }

  spawnVisitor(): Visitor {
    const s = this.state;
    const floors = s.floors.map((f, i) => ({ f, i }));
    const target = pickWeighted(floors, ({ f }) => floorAppeal(f), this.rng) ?? floors[0];
    const present = new Set(this.visitors.map((v) => v.star).filter(Boolean) as StarId[]);
    const star = maybePickStar(this.level, present, s.stars, this.rng);
    const v: Visitor = {
      id: this.nextId++,
      look: Math.floor(this.rng() * VISITOR_LOOKS),
      star,
      floor: target.i,
      phase: 'walkIn',
      t: 0,
      dur: 0,
      seed: Math.floor(this.rng() * 1e6),
      starTapped: false,
    };
    v.dur = phaseDuration(v, 'walkIn');
    this.visitors.push(v);
    if (star) {
      s.stars[star] = (s.stars[star] ?? 0) + 1;
      this.events.emit('starArrived', v);
    }
    return v;
  }

  private finishVisit(v: Visitor): void {
    const floor = this.state.floors[v.floor];
    if (!floor) return;
    this.state.stats.visitors++;
    this.progress('visitors');
    this.addXp(v.star ? XP.starVisit : XP.visit);
    const amount = visitIncome(floor) * (v.star ? 3 : 1);
    const drop: CoinDrop = {
      id: this.nextId++,
      floor: v.floor,
      x: visitSpots(v.seed)[1] + (hash01(v.seed) - 0.5) * 0.06,
      amount,
      age: 0,
      star: !!v.star,
    };
    this.drops.push(drop);
    this.events.emit('dropSpawned', drop);
  }

  // ------------------------------------------------------------ économie / xp

  addCoins(n: number): void {
    this.state.coins += n;
    if (n > 0) this.state.stats.coinsEarned += n;
    this.events.emit('coins', this.state.coins);
  }

  addXp(n: number): void {
    const before = this.level;
    this.state.xp += n;
    const after = this.level;
    this.events.emit('xp', { xp: this.state.xp, level: after });
    for (let l = before + 1; l <= after; l++) {
      this.addCoins(l * 15);
      this.events.emit('levelUp', l);
    }
  }

  collectDrop(id: number, auto = false): CoinDrop | null {
    const idx = this.drops.findIndex((d) => d.id === id);
    if (idx < 0) return null;
    const [drop] = this.drops.splice(idx, 1);
    this.addCoins(drop.amount);
    this.events.emit('dropCollected', { drop, auto });
    return drop;
  }

  /** Toucher une star : un petit bonus, une fois par visite. */
  tapStar(visitorId: number): number {
    const v = this.visitors.find((x) => x.id === visitorId);
    if (!v || !v.star || v.starTapped) return 0;
    v.starTapped = true;
    const bonus = 10 + this.level * 5;
    this.addCoins(bonus);
    this.events.emit('starTapped', { visitor: v, bonus });
    return bonus;
  }

  // ----------------------------------------------------------------- décor

  buyDecor(id: DecorId): boolean {
    const item = DECOR[id];
    if (this.state.coins < item.price) return false;
    this.addCoins(-item.price);
    this.state.inventory[id] = (this.state.inventory[id] ?? 0) + 1;
    return true;
  }

  /** Pose un objet (acheté si l'inventaire est vide). L'objet déjà en place retourne à l'inventaire. */
  placeDecor(floorIndex: number, slot: number, id: DecorId): boolean {
    const floor = this.state.floors[floorIndex];
    if (!floor || DECOR[id].biome !== floor.biome) return false;
    if (!this.state.inventory[id] && !this.buyDecor(id)) return false;
    this.state.inventory[id]! -= 1;
    const previous = floor.slots[slot];
    if (previous) this.state.inventory[previous] = (this.state.inventory[previous] ?? 0) + 1;
    floor.slots[slot] = id;
    this.progress('decor');
    this.events.emit('floorChanged', floorIndex);
    return true;
  }

  removeDecor(floorIndex: number, slot: number): void {
    const floor = this.state.floors[floorIndex];
    const id = floor?.slots[slot];
    if (!id) return;
    floor.slots[slot] = null;
    this.state.inventory[id] = (this.state.inventory[id] ?? 0) + 1;
    this.events.emit('floorChanged', floorIndex);
  }

  setTemp(floorIndex: number, temp: Temp): void {
    this.state.floors[floorIndex].temp = temp;
    this.events.emit('floorChanged', floorIndex);
  }

  // -------------------------------------------------------------- entretien

  scrubAt(floorIndex: number, u: number, v: number): number {
    const floor = this.state.floors[floorIndex];
    const removed = scrub(floor, u, v);
    if (removed > 0) this.state.stats.scrubs++;
    if (this.dirtyFloors.has(floorIndex) && cleanliness(floor) >= 0.985) {
      this.dirtyFloors.delete(floorIndex);
      const reward = cleanReward(floor);
      this.addCoins(reward);
      this.events.emit('cleaned', { floor: floorIndex, reward });
      this.progress('clean');
    }
    return removed;
  }

  // --------------------------------------------------------------- poissons

  welcomeFish(floorIndex: number, species: SpeciesId): FishInstance {
    const s = this.state;
    const fish = newFish(s, species, this.rng, this.now());
    s.floors[floorIndex].fish.push(fish);
    const entry = s.journal[species];
    const isNew = !entry;
    if (entry) entry.count++;
    else {
      s.toIdentify.push(fish.uid);
      this.events.emit('identifyChanged', s.toIdentify.length);
    }
    this.events.emit('fishArrived', { floor: floorIndex, fish, isNew });
    this.events.emit('floorChanged', floorIndex);
    return fish;
  }

  identify(uid: number, guess: SpeciesId): IdentifyResult | null {
    const s = this.state;
    const found = findFish(s, uid);
    if (!found) {
      s.toIdentify = s.toIdentify.filter((x) => x !== uid);
      this.events.emit('identifyChanged', s.toIdentify.length);
      return null;
    }
    const species = SPECIES_BY_ID[found.fish.species];
    const correct = guess === species.id;
    const sameSpecies = s.toIdentify.filter((x) => findFish(s, x)?.fish.species === species.id);
    s.toIdentify = s.toIdentify.filter((x) => !sameSpecies.includes(x));
    let reward = 0;
    if (!s.journal[species.id]) {
      s.journal[species.id] = { at: this.now(), count: sameSpecies.length || 1, guessed: correct };
      this.progress('identify');
      this.addXp(XP.newSpecies + (correct ? XP.identifyBonus : 0));
      if (correct) {
        reward = Math.round(10 * BIOMES[species.biome].income);
        this.addCoins(reward);
      }
    }
    this.events.emit('identifyChanged', s.toIdentify.length);
    this.save();
    return { correct, species, reward };
  }

  /** Rendre un poisson à la nature pour libérer de la place (aucune pénalité). */
  releaseFish(uid: number): void {
    const found = findFish(this.state, uid);
    if (!found) return;
    const floor = this.state.floors[found.floor];
    floor.fish = floor.fish.filter((f) => f.uid !== uid);
    if (this.state.toIdentify.includes(uid)) {
      this.state.toIdentify = this.state.toIdentify.filter((x) => x !== uid);
      this.events.emit('identifyChanged', this.state.toIdentify.length);
    }
    this.events.emit('fishLeft', { floor: found.floor, uid });
    this.events.emit('floorChanged', found.floor);
  }

  // ------------------------------------------------------ vie des poissons

  /** Croissance, éclosions, pontes et retour d'expédition. */
  private updateLife(): void {
    const s = this.state;
    const now = this.now();
    s.floors.forEach((floor, i) => {
      for (const fish of floor.fish) {
        const stage = stageAt(fish, now);
        if (stage === fish.stage) continue;
        const hatched = fish.stage === 'egg';
        fish.stage = stage;
        if (hatched) {
          this.progress('hatch');
          const sp = SPECIES_BY_ID[fish.species];
          this.addNews(`${fish.name} vient d’éclore (${sp.name}) !`, 'heart');
          if (!s.journal[fish.species] && !s.toIdentify.includes(fish.uid)) {
            s.toIdentify.push(fish.uid);
            this.events.emit('identifyChanged', s.toIdentify.length);
          }
        } else if (stage === 'adult') {
          this.addNews(`${fish.name} est devenu adulte.`, 'ico-star');
        }
        if (fish.variant) s.variantsSeen[fish.species] = true;
        this.events.emit('fishGrew', { floor: i, fish });
        this.events.emit('floorChanged', i);
      }
      // ponte : un couple heureux et complice
      const t = (this.breedT.get(i) ?? 60) - 1;
      this.breedT.set(i, t);
      if (t <= 0) {
        this.breedT.set(i, 90 + this.rng() * 90);
        const pair = breedingPair(floor);
        if (pair && this.rng() < 0.35) {
          const egg = newFish(s, pair[0].species, this.rng, now, {
            bornAt: now, stage: 'egg', variant: this.rng() < 0.12, parents: [pair[0].name, pair[1].name],
          });
          floor.fish.push(egg);
          this.addNews(`${pair[0].name} et ${pair[1].name} ont pondu un œuf !`, 'heart');
          this.events.emit('eggLaid', { floor: i, fish: egg });
          this.events.emit('floorChanged', i);
        }
      }
    });
    if (s.expedition && now >= s.expedition.end) this.finishExpedition();
  }

  /** Caresser un poisson : il est content, et l'amitié grandit (avec une petite pause). */
  petFish(uid: number): boolean {
    const found = findFish(this.state, uid);
    if (!found || found.fish.stage === 'egg') return false;
    const fish = found.fish;
    const now = this.now();
    const gained = now - fish.lastPet > 20_000;
    if (gained) {
      fish.lastPet = now;
      const before = hearts(fish.friendship);
      fish.friendship = Math.min(100, fish.friendship + 5);
      this.progress('pet');
      if (hearts(fish.friendship) > before) this.addNews(`${fish.name} t’apprécie de plus en plus (${hearts(fish.friendship)} ♥).`, 'ico-heart');
    }
    this.events.emit('petted', { floor: found.floor, fish, gained });
    return gained;
  }

  /** Le repas rapproche les poissons de leur soigneur. */
  feedFloor(floorIndex: number): void {
    for (const fish of this.state.floors[floorIndex]?.fish ?? []) {
      if (fish.stage !== 'egg') fish.friendship = Math.min(100, fish.friendship + 2);
    }
    this.progress('feed');
  }

  renameFish(uid: number, name: string): void {
    const found = findFish(this.state, uid);
    const clean = name.trim().slice(0, 16);
    if (!found || !clean || clean === found.fish.name) return;
    found.fish.name = clean;
    this.progress('name');
    this.events.emit('floorChanged', found.floor);
  }

  // ------------------------------------------------------------ expéditions

  startExpedition(dest: DestinationId): boolean {
    const s = this.state;
    const d = DESTINATIONS_BY_ID[dest];
    if (s.expedition || !s.floors.some((f) => f.biome === d.biome)) return false;
    const now = this.now();
    s.expedition = { dest, start: now, end: now + d.minutes * 60_000 };
    this.events.emit('expeditionStarted', s.expedition);
    this.save();
    return true;
  }

  private finishExpedition(): void {
    const s = this.state;
    const exp = s.expedition!;
    s.expedition = null;
    const d = DESTINATIONS_BY_ID[exp.dest];
    const found = expeditionFind(exp.dest, this.discoveredSet(), this.rng);
    const entry: LogEntry = { at: this.now(), dest: exp.dest, ...found, postcard: pick(d.postcards, this.rng) };
    s.logbook.unshift(entry);
    s.logbook = s.logbook.slice(0, 30);
    s.eggs.push({ ...found, from: exp.dest });
    const coins = 20 + Math.floor(this.rng() * 40);
    this.addCoins(coins);
    this.progress('expedition');
    this.addNews(`Le sous-marin est rentré de : ${d.name}, avec un œuf !`, 'ico-fish');
    this.events.emit('expeditionDone', { entry, coins });
    this.save();
  }

  /** Dépose un œuf rapporté dans un aquarium du bon biome. */
  placeEgg(eggIndex: number, floorIndex: number): boolean {
    const s = this.state;
    const egg = s.eggs[eggIndex];
    const floor = s.floors[floorIndex];
    if (!egg || !floor || SPECIES_BY_ID[egg.species].biome !== floor.biome || floor.fish.length >= TANK_CAPACITY) return false;
    const now = this.now();
    floor.fish.push(newFish(s, egg.species, this.rng, now, { bornAt: now, stage: 'egg', variant: egg.variant }));
    s.eggs.splice(eggIndex, 1);
    this.events.emit('floorChanged', floorIndex);
    return true;
  }

  // ---------------------------------------------------------- objectifs

  progress(kind: MissionKind, n = 1): void {
    const s = this.state;
    let changed = false;
    for (const m of s.missions) {
      if (m.kind !== kind || m.progress >= m.target) continue;
      m.progress = Math.min(m.target, m.progress + n);
      changed = true;
      if (m.progress >= m.target) {
        this.addCoins(m.reward);
        this.addXp(5);
        this.events.emit('missionDone', m);
      }
    }
    if (!changed) return;
    const done = s.missions.filter((m) => m.progress >= m.target).map((m) => m.kind);
    s.missions = refillMissions(s.missions.filter((m) => m.progress < m.target), this.rng, done);
    this.events.emit('missionsChanged', s.missions);
  }

  // --------------------------------------------------------------- nouvelles

  addNews(text: string, icon = 'bubble'): void {
    const item = { at: this.now(), text, icon };
    this.state.news.unshift(item);
    this.state.news = this.state.news.slice(0, 40);
    this.events.emit('news', item);
  }

  // ----------------------------------------------------------------- tour

  buildFloor(): boolean {
    const status = requirementStatus(this.state);
    if (!status?.canBuild) return false;
    this.addCoins(-status.entry.req.coins);
    this.state.floors.push(createFloor(status.entry.biome));
    const idx = this.state.floors.length - 1;
    this.events.emit('floorBuilt', idx);
    this.save();
    return true;
  }

  starName(id: StarId): string {
    return STARS_BY_ID[id].name;
  }

  // --------------------------------------------------------- persistance

  save(): void {
    saveGame(this.state);
  }

  /** Rattrape le temps passé hors du jeu (plafonné, gains réduits de moitié). */
  applyOffline(now = Date.now()): OfflineSummary {
    const seconds = Math.min(OFFLINE_CAP_SECONDS, Math.max(0, (now - this.state.savedAt) / 1000));
    const summary: OfflineSummary = { seconds, coins: 0, arrivals: 0 };
    if (seconds < 30) return summary;
    const coins = Math.floor(estimatedIncomeRate(this.state.floors, this.level) * seconds * 0.5);
    const discovered = this.discoveredSet();
    const step = 30;
    for (let t = 0; t < seconds; t += step) {
      const dt = Math.min(step, seconds - t);
      this.state.floors.forEach((floor, i) => {
        growAlgae(floor, dt, i);
        const arrival = attractionTick(floor, dt, this.rng, discovered);
        if (arrival) {
          this.welcomeFish(i, arrival.id);
          discovered.add(arrival.id);
          summary.arrivals++;
        }
      });
    }
    if (coins > 0) this.addCoins(coins);
    summary.coins = coins;
    return summary;
  }
}
