import { describe, expect, it } from 'vitest';
import { DECOR_SPRITES } from '../src/sprites/defs/decor';
import { FISH_SPRITES } from '../src/sprites/defs/fish';
import { personFrames, STAR_SPECS, visitorLooks } from '../src/sprites/defs/people';
import { UI_SPRITES } from '../src/sprites/defs/ui';
import { ROOM_SPRITES } from '../src/sprites/defs/room';
import type { SpriteDef } from '../src/sprites/SpriteFactory';

function checkDef(name: string, def: SpriteDef) {
  const w = def.rows[0].length;
  def.rows.forEach((row, i) => expect(row.length, `${name} ligne ${i}`).toBe(w));
  for (const row of def.rows) {
    for (const ch of row) {
      if (ch !== '.' && ch !== ' ') expect(def.palette[ch], `${name} : couleur « ${ch} »`).toBeDefined();
    }
  }
}

describe('sprites', () => {
  it('toutes les grilles sont rectangulaires et leurs couleurs définies', () => {
    for (const [k, d] of Object.entries(FISH_SPRITES)) checkDef(`fish ${k}`, d);
    for (const [k, d] of Object.entries(DECOR_SPRITES)) checkDef(`decor ${k}`, d);
    for (const [k, d] of Object.entries(UI_SPRITES)) checkDef(`ui ${k}`, d);
    for (const [k, d] of Object.entries(ROOM_SPRITES)) checkDef(`room ${k}`, d);
    visitorLooks().forEach((spec, i) => personFrames(spec).forEach((f, j) => checkDef(`visiteur ${i}/${j}`, f)));
    for (const [k, spec] of Object.entries(STAR_SPECS)) personFrames(spec).forEach((f, j) => checkDef(`star ${k}/${j}`, f));
  });

  it('les visiteurs ont 4 images (debout, marche ×2, de dos)', () => {
    expect(personFrames(visitorLooks()[0])).toHaveLength(4);
  });
});
