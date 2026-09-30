// Personnages vus de dessus, façon RPG : 16×24 px, grosse tête, 3 directions
// (bas, droite — la gauche est un miroir —, haut) × 4 images de marche.
import { hex, mixRGB, Raster, type RGB } from './raster';

export type Hair = 'short' | 'long' | 'bun' | 'bob' | 'spiky';

export interface ActorSpec {
  skin: string;
  hair: string;
  hairStyle: Hair;
  shirt: string;
  pants: string;
  shoes: string;
  cap?: string;
  glasses?: boolean;
  beard?: string;
  dress?: boolean;
  /** Accessoire en bandoulière (sacoche, appareil photo). */
  strap?: string;
}

export type Dir = 'down' | 'right' | 'up';
export const DIRS: Dir[] = ['down', 'right', 'up'];
export const W = 16;
export const H = 24;

const OUT = hex('#2a1e2c');

function tones(base: string): [RGB, RGB, RGB, RGB] {
  const c = hex(base);
  return [mixRGB(c, 0x1a1030, 0.45), mixRGB(c, 0x1a1030, 0.2), c, mixRGB(c, 0xffffff, 0.3)];
}

/** Dessine une image de personnage. `step` : 0 repos, 1 pas gauche, 2 repos, 3 pas droit. */
export function actorFrame(spec: ActorSpec, dir: Dir, step: number): Raster {
  const r = new Raster(W, H);
  const skin = tones(spec.skin);
  const hair = tones(spec.hair);
  const shirt = tones(spec.shirt);
  const pants = tones(spec.pants);
  const shoe = tones(spec.shoes);
  const bob = step % 2 === 1 ? 1 : 0; // le corps descend d'un pixel pendant le pas
  const body = new Raster(W, H);

  // --- jambes
  const legTop = 19;
  if (dir === 'right') {
    const front = step === 1 ? 2 : step === 3 ? -2 : 0;
    for (const [lx, off, back] of [[7, -front, true], [7, front, false]] as const) {
      for (let y = legTop; y < 23; y++) {
        const shoeRow = y === 22;
        for (let x = lx + off; x < lx + off + 3; x++) body.set(x, y, shoeRow ? shoe[back ? 1 : 2] : pants[back ? 1 : 2]);
      }
      if (off !== 0 || !back) body.set(lx + off + 3, 22, shoe[back ? 1 : 2]);
    }
  } else {
    for (const [lx, side] of [[4, 1], [9, 3]] as const) {
      const lift = step === side ? 1 : 0;
      for (let y = legTop; y < 23 - lift; y++) {
        for (let x = lx; x < lx + 3; x++) body.set(x, y, y === 22 - lift ? shoe[2] : pants[x === lx ? 1 : 2]);
      }
    }
  }

  // --- torse (ou robe)
  const tTop = 12 + bob;
  const tBot = spec.dress ? 21 : 19;
  for (let y = tTop; y < tBot; y++) {
    const flare = spec.dress && y > 16 ? Math.floor((y - 16) / 2) : 0;
    const x0 = (dir === 'right' ? 5 : 4) - flare;
    const x1 = (dir === 'right' ? 11 : 11) + flare;
    for (let x = x0; x <= x1; x++) {
      const t = (x - x0) / Math.max(1, x1 - x0);
      let c = t < 0.2 ? shirt[3] : t > 0.8 ? shirt[1] : shirt[2];
      if (!spec.dress && y >= 17) c = x === x0 ? pants[3] : pants[2];
      if (y === tTop) c = shirt[1];
      body.set(x, y, c);
    }
  }
  if (spec.strap && dir !== 'up') {
    for (let k = 0; k < 6; k++) body.set(dir === 'right' ? 6 + Math.floor(k / 2) : 5 + k, tTop + 1 + k, hex(spec.strap));
    body.set(dir === 'right' ? 10 : 10, tTop + 6, hex('#2a2a34'));
    body.set(dir === 'right' ? 10 : 11, tTop + 6, hex('#2a2a34'));
  }

  // --- bras (balancement)
  const swing = step === 1 ? 1 : step === 3 ? -1 : 0;
  if (dir === 'right') {
    const ax = 8 + swing;
    for (let y = tTop + 1; y < tTop + 5; y++) body.set(ax, y, shirt[1]), body.set(ax + 1, y, shirt[2]);
    body.set(ax, tTop + 5, skin[2]);
    body.set(ax + 1, tTop + 5, skin[2]);
  } else {
    for (const [ax, s] of [[3, swing], [12, -swing]] as const) {
      for (let y = tTop + 1; y < tTop + 5 + s; y++) body.set(ax, y, shirt[ax === 3 ? 2 : 1]);
      body.set(ax, tTop + 5 + s, skin[2]);
    }
  }

  // --- tête
  const hx = dir === 'right' ? 8.5 : 8;
  const hy = 7 + bob;
  body.ellipse(hx, hy, 5.6, 5.4, (nx, ny) => (nx * -0.5 + ny * -0.6 > 0.25 ? skin[3] : nx + ny * 0.3 > 0.55 ? skin[1] : skin[2]));
  if (dir === 'right') body.set(14, hy + 1, skin[2]); // le nez

  // --- cheveux
  const hairAt = (x: number, y: number): boolean => {
    const ny = y - hy;
    const nx = x - hx;
    const inHead = (nx / 6) ** 2 + (ny / 5.8) ** 2 <= 1.05;
    if (!inHead) {
      if (spec.hairStyle === 'bun' && Math.hypot(x - hx, y - (hy - 6)) < 2.6) return true;
      // cheveux longs : un rideau arrondi qui tombe sur les épaules
      if (spec.hairStyle === 'long' && ny > -1 && ny < 7 && Math.abs(nx) < 6.6 - Math.max(0, ny - 4) * 0.8) {
        return dir === 'up' || Math.abs(nx) > 3.5 || (dir === 'right' && nx < 0);
      }
      return false;
    }
    if (dir === 'up') return ny < 4.5 || spec.hairStyle === 'long' || spec.hairStyle === 'bob';
    if (dir === 'down') {
      if (ny < -2.2) return true;
      if (ny < -1.2) return (x + (spec.hairStyle === 'spiky' ? y : 0)) % 3 !== 0; // frange
      const side = Math.abs(nx) > 4.2;
      if (spec.hairStyle === 'long') return side || (ny > 3 && Math.abs(nx) > 3.6);
      if (spec.hairStyle === 'bob') return side && ny < 3.5;
      return side && ny < 1;
    }
    // profil : arrière de la tête et dessus
    if (ny < -2.2) return true;
    if (nx < -1.2) return spec.hairStyle === 'long' || spec.hairStyle === 'bob' || ny < 2.5;
    if (ny < -1.2) return nx < 3;
    return false;
  };
  if (!spec.cap || spec.hairStyle === 'long') {
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (!hairAt(x, y)) continue;
        const nx = x - hx;
        const ny = y - hy;
        let c = hair[2];
        if (ny < -3.5 && nx < 0 && nx > -4) c = hair[3];
        if (nx > 3.5 || ny > 2) c = hair[1];
        if ((x + y * 2) % 5 === 0 && ny < -2) c = hair[3];
        body.set(x, y, c);
      }
    }
  }
  if (spec.cap) {
    const cap = tones(spec.cap);
    for (let y = 1 + bob; y < hy - 1; y++) {
      for (let x = 2; x < 15; x++) {
        const nx = x - hx;
        const ny = y - hy;
        if ((nx / 6) ** 2 + (ny / 5.8) ** 2 > 1.05) continue;
        body.set(x, y, ny < -4.5 && nx < 0 ? cap[3] : nx > 3 ? cap[1] : cap[2]);
      }
    }
    if (dir === 'down') for (let x = 3; x < 14; x++) body.set(x, hy - 1, cap[0]);
    if (dir === 'right') for (let x = 9; x < 16; x++) body.set(x, hy - 1, cap[1]);
    if (dir === 'up') for (let x = 3; x < 14; x++) for (let y = hy - 1; y < hy + 4; y++) {
      if ((x - hx) ** 2 / 36 + (y - hy) ** 2 / 33.6 <= 1.05) body.set(x, y, y === hy + 3 ? hair[1] : hair[2]);
    }
    if (spec.hairStyle !== 'long' && dir !== 'up') {
      // mèches grises sous la casquette
      const sx = dir === 'right' ? [3, 4] : [2, 13];
      for (const x of sx) for (let y = hy; y < hy + 2; y++) body.set(x, y, hair[2]);
    }
  }

  // --- visage
  const eye = hex('#2a1a2a');
  const blush = mixRGB(skin[2], hex('#ff6a7a'), 0.45);
  if (dir === 'down') {
    for (const ex of [5, 10]) {
      body.set(ex, hy + 1, eye);
      body.set(ex, hy + 2, eye);
      body.set(ex + (ex === 5 ? -1 : 1), hy + 3, blush);
    }
    body.set(7, hy + 3, skin[1]);
    body.set(8, hy + 3, skin[1]);
    if (spec.glasses) {
      for (const ex of [5, 10]) {
        for (const [dx, dy] of [[-1, 0], [1, 0], [-1, 1], [1, 1], [0, -1], [0, 2]]) body.set(ex + dx, hy + 1 + dy, hex('#e8e8f0'));
      }
      body.set(7, hy + 1, hex('#e8e8f0'));
      body.set(8, hy + 1, hex('#e8e8f0'));
    }
    if (spec.beard) {
      const b = tones(spec.beard);
      for (let x = 4; x <= 12; x++) for (let y = hy + 3; y <= hy + 5; y++) {
        if ((x === 4 || x === 12) && y === hy + 5) continue;
        if (y === hy + 3 && x > 6 && x < 10) continue;
        body.set(x, y, y === hy + 5 ? b[1] : b[2]);
      }
    }
  } else if (dir === 'right') {
    body.set(12, hy + 1, eye);
    body.set(12, hy + 2, eye);
    body.set(12, hy + 3, blush);
    if (spec.glasses) {
      for (const [dx, dy] of [[-1, 0], [1, 0], [-1, 1], [1, 1], [0, -1], [0, 2]]) body.set(12 + dx, hy + 1 + dy, hex('#e8e8f0'));
    }
    if (spec.beard) {
      const b = tones(spec.beard);
      for (let x = 9; x <= 13; x++) for (let y = hy + 3; y <= hy + 4 + (x < 12 ? 1 : 0); y++) body.set(x, y, b[x > 11 ? 2 : 1]);
    }
  }

  body.outline(OUT);
  r.shadow(8, 23, 5.5, 1.6, 0.3);
  r.draw(body, 0, 0);
  return r;
}

/** Planche complète : pour chaque direction, 4 images de marche. */
export function actorSheet(spec: ActorSpec): Raster[] {
  return DIRS.flatMap((d) => [0, 1, 2, 3].map((s) => actorFrame(spec, d, s)));
}

export const frameIndex = (dir: Dir, step: number) => DIRS.indexOf(dir) * 4 + (step % 4);
