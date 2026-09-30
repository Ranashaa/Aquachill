import { describe, expect, it } from 'vitest';
import { findPath, nearestWalkable, smoothPath } from '../src/cove/pathfind';
import { baseWalkable, COLS, MAP_ROWS, ROWS } from '../src/cove/map';

const grid = (rows: string[]) => rows.map((r) => [...r].map((c) => c === '.'));

describe('crique : chemins', () => {
  it('contourne un mur', () => {
    const g = grid(['.....', '.###.', '.....']);
    const p = findPath(g, { x: 0, y: 1 }, { x: 4, y: 1 })!;
    expect(p[0]).toEqual({ x: 0, y: 1 });
    expect(p[p.length - 1]).toEqual({ x: 4, y: 1 });
    for (const q of p) expect(g[q.y][q.x]).toBe(true);
    const s = smoothPath(g, p);
    expect(s.length).toBeLessThanOrEqual(p.length);
  });

  it('ne passe pas à travers les coins', () => {
    const g = grid(['.#', '#.']);
    expect(findPath(g, { x: 0, y: 0 }, { x: 1, y: 1 })).toBeNull();
  });

  it('trouve la tuile praticable la plus proche', () => {
    const g = grid(['...', '.##', '.##']);
    expect(nearestWalkable(g, 2, 2)).toEqual({ x: 2, y: 0 });
  });

  it('la carte est rectangulaire et on peut aller de la maison au bout du ponton', () => {
    for (const r of MAP_ROWS) expect(r.length).toBe(COLS);
    const g = baseWalkable();
    expect(g).toHaveLength(ROWS);
    expect(findPath(g, { x: 9, y: 12 }, { x: 16, y: 42 })).not.toBeNull();
  });
});

import { CHARACTERS, choose, greet, hearts, newRelation, nextConversation, TOPIC_COOLDOWN } from '../src/cove/dialogue';

describe('crique : dialogues et relations', () => {
  it('chaque habitué a une rencontre, trois sujets à trois choix et des petites phrases', () => {
    for (const c of Object.values(CHARACTERS)) {
      expect(c.intro.choices).toHaveLength(3);
      expect(c.topics.length).toBeGreaterThanOrEqual(3);
      for (const t of c.topics) expect(t.choices).toHaveLength(3);
      for (const s of c.small.filter((x) => x.flag)) {
        const all = [c.intro, ...c.topics].flatMap((t) => t.choices.map((ch) => ch.flag));
        expect(all, `${c.name} : ${s.flag}`).toContain(s.flag);
      }
    }
  });

  it('la rencontre d’abord, puis les sujets, en respectant les cœurs et le délai', () => {
    const r = newRelation();
    const T = 1e12;
    let conv = nextConversation('lila', r, T);
    expect(conv.kind === 'topic' && conv.topic.id).toBe('intro');
    choose(r, CHARACTERS.lila.intro, CHARACTERS.lila.intro.choices[1], T);
    expect(r.flags).toContain('lila_pirate');
    conv = nextConversation('lila', r, T + 1000);
    expect(conv.kind === 'topic' && conv.topic.id).toBe('gerard');
    choose(r, CHARACTERS.lila.topics[0], CHARACTERS.lila.topics[0].choices[0], T + 1000);
    // juste après un sujet : petite phrase, qui se souvient des réponses
    conv = nextConversation('lila', r, T + 2000);
    expect(conv.kind).toBe('small');
    conv = nextConversation('lila', r, T + 1000 + TOPIC_COOLDOWN);
    expect(conv.kind === 'topic' && conv.topic.id).toBe('pipi');
    // « grande » demande 2 cœurs
    choose(r, CHARACTERS.lila.topics[1], CHARACTERS.lila.topics[1].choices[2], T + 5e6);
    expect(hearts(r)).toBe(1);
    expect(nextConversation('lila', r, T + 1e9).kind).toBe('small');
  });

  it('un bonjour par jour, et les points restent bornés', () => {
    const r = newRelation();
    expect(greet(r, 'lundi')).toBe(10);
    expect(greet(r, 'lundi')).toBe(0);
    choose(r, CHARACTERS.marcel.intro, { text: '', delta: -500, reply: [] }, 0);
    expect(r.points).toBe(0);
  });
});

import { dateText, DAY_MAX, lighting, newClock, present, tick, timeText } from '../src/cove/time';

describe('crique : le temps', () => {
  it('l’horloge avance et s’arrête à 2 h', () => {
    const c = newClock();
    tick(c, 7);
    expect(timeText(c.minute)).toBe('06:10');
    tick(c, 1e7);
    expect(c.minute).toBe(DAY_MAX);
    expect(timeText(c.minute)).toBe('02:00');
    expect(dateText(29)).toBe('Été, jour 1');
  });

  it('la lumière est neutre à midi, sombre la nuit', () => {
    expect(lighting(12).multiply).toBe(0xffffff);
    expect(lighting(12).dark).toBe(0);
    expect(lighting(23).dark).toBe(1);
    expect(lighting(19).multiply).not.toBe(0xffffff);
  });

  it('les habitués rentrent chez eux le soir', () => {
    expect(present('lila', 12)).toBe(true);
    expect(present('lila', 20)).toBe(false);
    expect(present('nina', 21)).toBe(true);
  });
});

import * as G from '../src/cove/garden';

describe('crique : le potager', () => {
  it('planter, arroser, récolter, vendre', () => {
    const f = G.newFarm();
    expect(G.plant(f, 0, 'radis')).toBe(true);
    expect(G.plant(f, 0, 'radis')).toBe(false);
    expect(G.night(f).grew).toBe(1);
    // sans arrosage, rien ne pousse
    expect(G.night(f).grew).toBe(0);
    expect(G.water(f, 0)).toBe(true);
    expect(G.water(f, 0)).toBe(false);
    expect(G.night(f).ready).toBe(1);
    expect(G.harvest(f, 0)).toBe('radis');
    expect(f.plots[0].crop).toBeNull();
    expect(G.ship(f, 'radis', 5)).toBe(1);
    const coins = f.coins;
    expect(G.night(f).total).toBe(28);
    expect(f.coins).toBe(coins + 28);
  });

  it('les fraises repoussent', () => {
    const f = G.newFarm();
    G.plant(f, 1, 'fraise');
    for (let d = 0; d < 3; d++) {
      G.water(f, 1);
      G.night(f);
    }
    expect(G.harvest(f, 1)).toBe('fraise');
    expect(f.plots[1].crop).toBe('fraise');
    expect(G.stage(f.plots[1])).toBe(1);
  });

  it('un cadeau par jour, selon les goûts', () => {
    const f = G.newFarm();
    const rel = { points: 0, seen: [], flags: [], lastTopicAt: 0, lastGreetDay: '', smallIndex: 0 };
    f.bag = { fraise: 2 };
    expect(G.giveGift(f, rel, 'lila', 'fraise', 1)?.taste).toBe('love');
    expect(rel.points).toBe(80);
    expect(G.giveGift(f, rel, 'lila', 'fraise', 1)).toBeNull();
    expect(G.giveGift(f, rel, 'lila', 'fraise', 2)?.taste).toBe('love');
    expect(G.plotIndex(2, 13)).toBe(0);
    expect(G.plotIndex(5, 15)).toBe(11);
    expect(G.plotIndex(6, 15)).toBeNull();
  });
});
