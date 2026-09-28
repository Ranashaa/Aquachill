import { describe, expect, it } from 'vitest';
import { BUNDLES } from '../src/data/bundles';
import { CROP_LIST, CROPS, DAY_START } from '../src/data/garden';
import { VILLAGER_LIST } from '../src/data/villagers';
import { createFloor, createNewState } from '../src/state/GameState';
import { migrate } from '../src/state/SaveManager';
import * as farm from '../src/systems/farm';

describe('données du jardin', () => {
  it('chaque culture a des prix cohérents et chaque habitué des goûts valides', () => {
    for (const c of CROP_LIST) expect(c.sellPrice).toBeGreaterThan(c.seedPrice);
    for (const v of VILLAGER_LIST) {
      for (const c of [...v.loves, ...v.likes]) expect(CROPS[c]).toBeDefined();
      expect(v.lines.length).toBeGreaterThanOrEqual(6);
      for (const k of [1, 3, 5]) expect(v.letters[k]).toBeDefined();
    }
    for (const b of BUNDLES) expect(b.needs.length).toBeGreaterThan(0);
  });
});

describe('journée', () => {
  it('l’horloge avance et s’arrête à 2 h du matin', () => {
    const s = createNewState(0);
    expect(s.day.minute).toBe(DAY_START);
    farm.tickClock(s, 7);
    expect(s.day.minute).toBeCloseTo(DAY_START + 10);
    farm.tickClock(s, 1e6);
    expect(s.day.minute).toBe(farm.LATEST_MINUTE);
    expect(farm.clockText(DAY_START + 75)).toBe('07:10');
    expect(farm.calendar(29)).toMatchObject({ season: 'Été', dayOfSeason: 1 });
  });

  it('une bouture soignée pousse chaque nuit jusqu’à la récolte', () => {
    const s = createNewState(0);
    expect(farm.plant(s, 0, 0, 'zoanthus')).toBe('ok');
    expect(s.seeds.zoanthus).toBe(2);
    expect(farm.plant(s, 0, 0, 'zoanthus')).toBe('occupied');
    expect(farm.plant(s, 0, 1, 'cabomba')).toBe('biome');
    farm.endDay(s);
    expect(s.floors[0].plots[0].grown).toBe(1);
    // sans soin, rien ne pousse (mais rien ne meurt)
    farm.endDay(s);
    expect(s.floors[0].plots[0].grown).toBe(1);
    expect(farm.tend(s, 0, 0)).toBe(true);
    expect(farm.tend(s, 0, 0)).toBe(false);
    const recap = farm.endDay(s);
    expect(recap.ready).toBe(1);
    expect(farm.harvest(s, 0, 0)).toBe('zoanthus');
    // les zoanthes repoussent
    expect(s.floors[0].plots[0].crop).toBe('zoanthus');
    expect(s.items.zoanthus).toBe(1);
  });

  it('le coffre est vendu pendant la nuit', () => {
    const s = createNewState(0);
    s.items = { acropora: 2 };
    expect(farm.ship(s, 'acropora', 5)).toBe(2);
    expect(farm.binValue(s)).toBe(CROPS.acropora.sellPrice * 2);
    const coins = s.coins;
    const recap = farm.endDay(s);
    expect(recap.shipTotal).toBe(110);
    expect(s.coins).toBe(coins + 110);
    expect(s.shipBin).toEqual({});
    expect(s.day.n).toBe(2);
  });

  it('bavarder et offrir rapprochent, et une lettre arrive au matin', () => {
    const s = createNewState(0);
    expect(farm.talk(s, 'marcel').gained).toBe(true);
    expect(farm.talk(s, 'marcel').gained).toBe(false);
    s.items = { marimo: 2 };
    expect(farm.giveGift(s, 'marcel', 'marimo')?.taste).toBe('love');
    expect(farm.giveGift(s, 'marcel', 'marimo')).toBeNull();
    expect(farm.villagerHearts(s, 'marcel')).toBe(1);
    const recap = farm.endDay(s);
    expect(recap.letters).toEqual(['marcel']);
    const gift = farm.readLetter(s, 0);
    expect(gift?.seeds).toBe('mousse');
    expect(s.seeds.mousse).toBe(1);
    expect(farm.readLetter(s, 0)).toBeNull();
    farm.endDay(s);
    expect(s.mail).toHaveLength(1);
  });

  it('les lots du Grand Bassin se remplissent et récompensent', () => {
    const s = createNewState(0);
    s.items = { zoanthus: 3, acropora: 1 };
    expect(farm.giveToBundle(s, 'corail', 'zoanthus')).toBe(true);
    expect(farm.giveToBundle(s, 'corail', 'zoanthus')).toBe(true);
    expect(farm.giveToBundle(s, 'corail', 'zoanthus')).toBe(false);
    expect(farm.bundleReady(s, 'corail')).toBe(false);
    farm.giveToBundle(s, 'corail', 'acropora');
    const coins = s.coins;
    expect(farm.completeBundle(s, 'corail')).toBe(true);
    expect(s.coins).toBe(coins + 150);
    expect(s.seeds.champignon).toBe(3);
    expect(farm.bundlesDone(s)).toBe(1);
    s.counters.feed = 5;
    s.counters.tend = 6;
    expect(farm.completeBundle(s, 'soins')).toBe(true);
    expect(s.boots).toBe(true);
  });

  it('les habitués se placent dans la tour en journée seulement', () => {
    const s = createNewState(0);
    s.floors.push(createFloor('amazon'));
    s.day.minute = 10 * 60;
    for (const v of VILLAGER_LIST) {
      const spot = farm.villagerSpot(s, v.id)!;
      expect(spot.floor).toBeGreaterThanOrEqual(-1);
      expect(spot.floor).toBeLessThan(2);
    }
    for (let d = 1; d < 20; d++) {
      s.day.n = d;
      const keys = VILLAGER_LIST.map((v) => JSON.stringify(farm.villagerSpot(s, v.id)));
      expect(new Set(keys).size).toBe(VILLAGER_LIST.length);
    }
    s.day.minute = 22 * 60;
    expect(farm.villagerSpot(s, 'lila')).toBeNull();
  });

  it('migre une sauvegarde v2 vers v3', () => {
    const v2 = { ...createNewState(0), version: 2 } as any;
    for (const f of v2.floors) delete f.plots;
    delete v2.day;
    delete v2.villagers;
    const st = migrate(v2);
    expect(st.floors[0].plots).toHaveLength(3);
    expect(st.day.n).toBe(1);
    expect(st.villagers.nina.friendship).toBe(0);
  });
});
