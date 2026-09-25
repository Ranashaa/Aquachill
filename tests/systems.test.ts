import { describe, expect, it } from 'vitest';
import { ALGAE_FULL_SECONDS, TANK_CAPACITY } from '../src/config';
import { SPECIES, SPECIES_BY_ID } from '../src/data/species';
import { DECOR, DECOR_LIST } from '../src/data/decor';
import { STARS } from '../src/data/stars';
import { FLOOR_PLAN } from '../src/data/progression';
import { createFloor, createNewState } from '../src/state/GameState';
import { migrate } from '../src/state/SaveManager';
import { cleanliness, growAlgae, scrub } from '../src/systems/algae';
import { attractionTick, eligibleSpecies, isEligible } from '../src/systems/attraction';
import { visitIncome } from '../src/systems/economy';
import { happiness } from '../src/systems/happiness';
import { levelForXp, levelProgress, requirementStatus } from '../src/systems/progression';
import { seeded } from '../src/systems/rng';
import { Sim } from '../src/systems/Sim';
import { visitX } from '../src/systems/visitors';

describe('données', () => {
  it('chaque besoin d’espèce est fourni par un décor du même biome', () => {
    for (const s of SPECIES) {
      for (const tag of s.needs) {
        const ok = DECOR_LIST.some((d) => d.biome === s.biome && d.tags.includes(tag));
        expect(ok, `${s.id} a besoin de ${tag}`).toBe(true);
      }
    }
  });

  it('18 espèces, 6 par biome jouable', () => {
    expect(SPECIES).toHaveLength(18);
    for (const biome of ['reef', 'amazon', 'koi']) {
      expect(SPECIES.filter((s) => s.biome === biome)).toHaveLength(6);
    }
  });

  it('chaque biome jouable a une espèce sans condition de décor', () => {
    for (const biome of ['reef', 'amazon', 'koi']) {
      expect(SPECIES.some((s) => s.biome === biome && s.needs.length === 0)).toBe(true);
    }
  });

  it('les stars ont des identifiants uniques', () => {
    expect(new Set(STARS.map((s) => s.id)).size).toBe(STARS.length);
  });
});

describe('algues', () => {
  it('poussent jusqu’à saturation puis se nettoient en frottant', () => {
    const floor = createFloor('reef');
    expect(cleanliness(floor)).toBe(1);
    growAlgae(floor, ALGAE_FULL_SECONDS * 3);
    expect(cleanliness(floor)).toBe(0);
    for (let u = 0; u <= 1; u += 0.05) for (let v = 0; v <= 1; v += 0.05) scrub(floor, u, v);
    expect(cleanliness(floor)).toBeGreaterThan(0.99);
  });

  it('les plantes ralentissent la pousse', () => {
    const bare = createFloor('reef');
    const planted = createFloor('reef');
    planted.slots = ['seagrass', 'seagrass', 'seagrass', null, null, null];
    growAlgae(bare, 600);
    growAlgae(planted, 600);
    expect(cleanliness(planted)).toBeGreaterThan(cleanliness(bare));
  });
});

describe('attraction', () => {
  it('respecte biome, température et décor', () => {
    const floor = createFloor('reef');
    expect(eligibleSpecies(floor).map((s) => s.id)).toEqual(['demoiselle']);
    floor.slots[0] = 'anemone';
    expect(isEligible(SPECIES_BY_ID.clown, floor)).toBe(true);
    floor.slots[1] = 'live_rock';
    floor.slots[2] = 'brain_coral';
    expect(isEligible(SPECIES_BY_ID.mandarin, floor)).toBe(false); // eau tempérée
    floor.temp = 2;
    expect(isEligible(SPECIES_BY_ID.mandarin, floor)).toBe(true);
    expect(isEligible(SPECIES_BY_ID.neon, floor)).toBe(false);
  });

  it('n’attire plus quand l’aquarium est plein', () => {
    const floor = createFloor('amazon');
    floor.fish = Array.from({ length: TANK_CAPACITY }, (_, i) => ({ uid: i, species: 'neon' as const, since: 0 }));
    const rng = seeded(1);
    for (let i = 0; i < 100; i++) expect(attractionTick(floor, 60, rng, new Set())).toBeNull();
  });

  it('finit par attirer une espèce éligible', () => {
    const floor = createFloor('koi');
    const rng = seeded(42);
    let got = null;
    for (let i = 0; i < 50 && !got; i++) got = attractionTick(floor, 60, rng, new Set());
    expect(got?.id).toBe('medaka');
  });
});

describe('économie et bonheur', () => {
  it('un aquarium propre et décoré rapporte plus', () => {
    const dirty = createFloor('reef');
    growAlgae(dirty, ALGAE_FULL_SECONDS * 2);
    const nice = createFloor('reef');
    nice.slots = ['live_rock', 'anemone', 'brain_coral', 'seagrass', null, null];
    expect(happiness(nice)).toBeGreaterThan(happiness(dirty));
    expect(visitIncome(nice)).toBeGreaterThan(visitIncome(dirty));
  });
});

describe('progression', () => {
  it('niveaux', () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(20)).toBe(2);
    expect(levelProgress(40).ratio).toBeCloseTo(0.5);
  });

  it('débloque l’étage suivant selon niveau, espèces et pièces', () => {
    const state = createNewState();
    let st = requirementStatus(state)!;
    expect(st.entry.biome).toBe('amazon');
    expect(st.canBuild).toBe(false);
    state.xp = 1000;
    state.coins = 10000;
    state.journal = { demoiselle: { at: 0, count: 1, guessed: true }, clown: { at: 0, count: 1, guessed: true }, gramma: { at: 0, count: 1, guessed: true } };
    st = requirementStatus(state)!;
    expect(st.canBuild).toBe(true);
  });

  it('les biomes « bientôt » ne sont pas constructibles', () => {
    const state = createNewState();
    state.floors = FLOOR_PLAN.slice(0, 3).map((e) => createFloor(e.biome));
    state.xp = 1e6;
    state.coins = 1e6;
    for (const s of SPECIES) state.journal[s.id] = { at: 0, count: 1, guessed: true };
    expect(requirementStatus(state)!.canBuild).toBe(false);
  });
});

describe('Sim', () => {
  it('les visiteurs rapportent des pièces et de l’XP', () => {
    const sim = new Sim(createNewState(), seeded(7));
    const coins0 = sim.state.coins;
    for (let i = 0; i < 600; i++) sim.update(0.5);
    expect(sim.state.stats.visitors).toBeGreaterThan(5);
    expect(sim.state.xp).toBeGreaterThan(0);
    expect(sim.state.coins).toBeGreaterThan(coins0);
  });

  it('les nouveaux poissons attendent une identification', () => {
    const sim = new Sim(createNewState(), seeded(3));
    const fish = sim.welcomeFish(0, 'demoiselle');
    const twin = sim.welcomeFish(0, 'demoiselle');
    expect(sim.state.toIdentify).toEqual([fish.uid, twin.uid]);
    const res = sim.identify(fish.uid, 'clown')!;
    expect(res.correct).toBe(false);
    expect(sim.state.journal.demoiselle).toBeDefined();
    expect(sim.state.toIdentify).toEqual([]);
    sim.welcomeFish(0, 'demoiselle');
    expect(sim.state.toIdentify).toEqual([]);
  });

  it('poser un décor l’achète si besoin et rend l’ancien à l’inventaire', () => {
    const sim = new Sim(createNewState(), seeded(3));
    const coins = sim.state.coins;
    expect(sim.placeDecor(0, 1, 'anemone')).toBe(true);
    expect(sim.state.coins).toBe(coins - DECOR.anemone.price);
    expect(sim.state.inventory.live_rock).toBe(1);
    expect(sim.placeDecor(0, 2, 'live_rock')).toBe(true);
    expect(sim.state.coins).toBe(coins - DECOR.anemone.price);
    expect(sim.placeDecor(0, 3, 'lantern')).toBe(false); // mauvais biome
  });

  it('le nettoyage complet d’une vitre sale rapporte une récompense', () => {
    const sim = new Sim(createNewState(), seeded(3));
    growAlgae(sim.state.floors[0], ALGAE_FULL_SECONDS);
    sim.update(0.01);
    const coins = sim.state.coins;
    for (let u = 0; u <= 1; u += 0.05) for (let v = 0; v <= 1; v += 0.05) sim.scrubAt(0, u, v);
    expect(sim.state.coins).toBeGreaterThan(coins);
  });

  it('rattrape le temps hors ligne', () => {
    const state = createNewState(0);
    const sim = new Sim(state, seeded(9));
    const res = sim.applyOffline(3600 * 1000);
    expect(res.coins).toBeGreaterThan(0);
    expect(res.arrivals).toBeGreaterThan(0);
  });
});

describe('visiteurs', () => {
  it('ressortent par la porte de l’ascenseur', () => {
    expect(visitX(123, 0).x).toBeCloseTo(0.94);
    expect(visitX(123, 1).x).toBeCloseTo(0.94);
  });
});

describe('sauvegarde', () => {
  it('complète les champs manquants', () => {
    const partial = { version: 1, coins: 5, floors: [createFloor('reef')] };
    const state = migrate(partial);
    expect(state.coins).toBe(5);
    expect(state.settings.muted).toBe(false);
    expect(state.journal).toEqual({});
  });
});

import { daylightAt } from '../src/systems/daylight';

describe('cycle jour/nuit', () => {
  it('fait nuit à minuit et jour à midi', () => {
    expect(daylightAt(0).night).toBe(1);
    expect(daylightAt(12).night).toBe(0);
    expect(daylightAt(12).sun).not.toBeNull();
    expect(daylightAt(23.5).moon).not.toBeNull();
    expect(daylightAt(19.5).night).toBeGreaterThan(0.4);
    expect(daylightAt(19.5).night).toBeLessThan(0.8);
  });
});
