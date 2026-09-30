// Peinture du sol de la crique, pixel par pixel : bords organiques entre herbe,
// sable et eau, touffes, fleurs, sable mouillé, profondeur de la mer et écume.
import { fbm, hash, hex, mixRGB, noise, ramp, Raster, type RGB } from './raster';
import { groundAt, MAP_ROWS, PATHS, ROWS, TILE, WORLD_H, WORLD_W, type Ground } from './map';

export const PAL = {
  grass: ['#2c5e3a', '#3a7a3e', '#4e9444', '#68ad4a', '#86c452'].map(hex),
  forest: ['#1f4a34', '#2c5e3a', '#3a7a3e'].map(hex),
  sand: ['#cfa872', '#dfbf88', '#ead09c', '#f4e2b8'].map(hex),
  wetSand: hex('#b99468'),
  dirt: ['#86583a', '#a06e46', '#b98656', '#cc9c66'].map(hex),
  soil: ['#4e3226', '#62402e', '#7a5438'].map(hex),
  rock: ['#5a5a6e', '#7a7a8c', '#9a9aa8', '#bcbcc4'].map(hex),
  sea: ['#1f5f9c', '#2a78b4', '#3494c8', '#48b4d4', '#6ad0dc', '#9ae8e4'].map(hex),
  pond: ['#1f5a66', '#2a7278', '#3a8c86', '#58a894', '#80c4a4'].map(hex),
  flowers: ['#fff4e0', '#ffd23a', '#ff8ab0', '#8ab8ff', '#e8a0ff'].map(hex),
  edge: hex('#23462e'),
};

const ID: Record<Ground, number> = { grass: 0, meadow: 1, sand: 2, rock: 3, sea: 4, pond: 5, dirt: 6, soil: 7 };
const isWaterId = (id: number) => id === 4 || id === 5;
const isGrassId = (id: number) => id <= 1;

/** Distance (en px) de chaque pixel au pixel le plus proche vérifiant `target`. */
function distanceField(ids: Uint8Array, w: number, h: number, target: (id: number) => boolean): Float32Array {
  const d = new Float32Array(w * h).fill(1e6);
  for (let i = 0; i < w * h; i++) if (target(ids[i])) d[i] = 0;
  const D = 1.414;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (x > 0) d[i] = Math.min(d[i], d[i - 1] + 1);
      if (y > 0) {
        d[i] = Math.min(d[i], d[i - w] + 1);
        if (x > 0) d[i] = Math.min(d[i], d[i - w - 1] + D);
        if (x < w - 1) d[i] = Math.min(d[i], d[i - w + 1] + D);
      }
    }
  }
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      if (x < w - 1) d[i] = Math.min(d[i], d[i + 1] + 1);
      if (y < h - 1) {
        d[i] = Math.min(d[i], d[i + w] + 1);
        if (x < w - 1) d[i] = Math.min(d[i], d[i + w + 1] + D);
        if (x > 0) d[i] = Math.min(d[i], d[i + w - 1] + D);
      }
    }
  }
  return d;
}

function distToPaths(x: number, y: number): number {
  let best = 1e9;
  for (const path of PATHS) {
    for (let k = 0; k < path.length - 1; k++) {
      const ax = path[k][0] * TILE, ay = path[k][1] * TILE, bx = path[k + 1][0] * TILE, by = path[k + 1][1] * TILE;
      const dx = bx - ax, dy = by - ay;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
      best = Math.min(best, Math.hypot(x - ax - t * dx, y - ay - t * dy));
    }
  }
  return best;
}

export interface GroundArt {
  base: HTMLCanvasElement;
  /** Images animées de l'eau (reflets et écume), superposées au sol. */
  water: HTMLCanvasElement[];
  ids: Uint8Array;
  distLand: Float32Array;
}

export function renderGround(): GroundArt {
  const w = WORLD_W;
  const h = WORLD_H;
  const ids = new Uint8Array(w * h);
  const forest = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // bords organiques : chaque type de sol « pèse » selon les 4 tuiles voisines, plus un peu de bruit
      const jx = x + (fbm(x / 22, y / 22, 3) - 0.5) * 8;
      const jy = y + (fbm(x / 22, y / 22, 9) - 0.5) * 8;
      const fx = jx / TILE - 0.5;
      const fy = jy / TILE - 0.5;
      const ix = Math.floor(fx);
      const iy = Math.floor(fy);
      const sx = fx - ix;
      const sy = fy - iy;
      const wts = new Map<Ground, number>();
      for (const [ox, oy, wt] of [[0, 0, (1 - sx) * (1 - sy)], [1, 0, sx * (1 - sy)], [0, 1, (1 - sx) * sy], [1, 1, sx * sy]] as const) {
        const gg = groundAt(ix + ox, iy + oy);
        wts.set(gg, (wts.get(gg) ?? 0) + wt);
      }
      let g: Ground = 'grass';
      let best = -1;
      for (const [gg, wt] of wts) {
        const v = wt + (noise(x / 9, y / 9, gg.length * 13) - 0.5) * 0.18;
        if (v > best) {
          best = v;
          g = gg;
        }
      }
      // le potager reste net (tracé par la main du jardinier)
      const exact = groundAt(Math.floor(x / TILE), Math.floor(y / TILE));
      if (exact === 'soil' || g === 'soil') g = exact;
      const tx = Math.floor(x / TILE);
      const ty = Math.floor(y / TILE);
      if ((g === 'grass' || g === 'meadow' || g === 'sand') && distToPaths(x, y) < 8.5 + (noise(x / 7, y / 7, 50) - 0.5) * 4) g = 'dirt';
      ids[y * w + x] = ID[g];
      const ch = MAP_ROWS[Math.max(0, Math.min(ROWS - 1, ty))]?.[tx];
      forest[y * w + x] = ch === 'T' ? 1 : 0;
    }
  }
  const distLand = distanceField(ids, w, h, (id) => !isWaterId(id));
  const distWater = distanceField(ids, w, h, isWaterId);
  const distForest = distanceField(forest, w, h, (v) => v === 1);

  const r = new Raster(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const id = ids[i];
      let c: RGB;
      if (isGrassId(id)) {
        const patch = fbm(x / 46, y / 46, 5);
        const fine = noise(x / 5, y / 5, 7);
        let t = 0.46 + (patch - 0.5) * 1.1 + (fine - 0.5) * 0.12;
        // la lisière de la forêt est plus sombre
        const fd = distForest[i];
        if (fd < 40) t -= (1 - fd / 40) * 0.35;
        c = ramp(fd < 6 ? PAL.forest : PAL.grass, fd < 6 ? t + 0.3 : t, x, y, 0.12);
      } else if (id === 2) {
        const dw = distWater[i];
        const t = 0.55 + (fbm(x / 30, y / 30, 11) - 0.5) * 0.5;
        c = ramp(PAL.sand, t, x, y, 0.6);
        if (dw < 7) c = mixRGB(c, PAL.wetSand, dw < 3 ? 0.85 : 0.45);
        if (hash(x, y, 2) < 0.025) c = PAL.sand[0];
        else if (hash(x, y, 3) < 0.02) c = PAL.sand[3];
      } else if (id === 3) {
        // galets : cellules irrégulières avec un liseré clair en haut
        const cx = Math.floor(x / 7 + noise(x / 9, y / 9, 4) * 0.8);
        const cy = Math.floor(y / 6 + noise(x / 9, y / 9, 6) * 0.8);
        const tone = hash(cx, cy, 5);
        const fx = (x / 7 + noise(x / 9, y / 9, 4) * 0.8) % 1;
        const fy = (y / 6 + noise(x / 9, y / 9, 6) * 0.8) % 1;
        c = fx < 0.14 || fy > 0.84 ? PAL.rock[0] : fy < 0.22 ? PAL.rock[3] : ramp(PAL.rock, 0.35 + tone * 0.45, x, y, 0.4);
      } else if (id === 6) {
        const t = 0.5 + (fbm(x / 20, y / 20, 13) - 0.5) * 0.6;
        c = ramp(PAL.dirt, t, x, y, 0.7);
        if (hash(x >> 1, y >> 1, 8) < 0.04) c = PAL.dirt[3];
        if (hash(x, y, 9) < 0.02) c = PAL.dirt[0];
      } else if (id === 7) {
        // sillons du potager
        const row = y % 6;
        c = row === 0 ? PAL.soil[0] : row === 1 ? PAL.soil[2] : PAL.soil[1];
        if (hash(x, y, 10) < 0.05) c = PAL.soil[0];
      } else {
        const d = distLand[i];
        const pal = id === 4 ? PAL.sea : PAL.pond;
        const depth = id === 4 ? d / 46 : d / 22;
        const t = 1 - depth + (fbm(x / 24, y / 24, 15) - 0.5) * 0.25;
        c = ramp(pal, t, x, y, 1);
      }
      r.set(x, y, c);
    }
  }

  // liserés : l'herbe forme un petit rebord sombre au-dessus du sable, du chemin, de l'eau
  for (let y = 1; y < h - 2; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (!isGrassId(ids[i])) continue;
      const below = ids[i + w];
      const side = ids[i - 1] !== ids[i] && !isGrassId(ids[i - 1]) || ids[i + 1] !== ids[i] && !isGrassId(ids[i + 1]) || !isGrassId(ids[i - w]);
      if (!isGrassId(below)) {
        r.set(x, y, PAL.edge);
        r.set(x, y + 1, mixRGB(r.get(x, y + 1), 0x1e2a3a, 0.35));
        if (isWaterId(below) || isWaterId(ids[i + 2 * w])) r.set(x, y + 2, mixRGB(r.get(x, y + 2), 0x1e2a3a, 0.25));
      } else if (side) {
        r.set(x, y, PAL.grass[0]);
      }
    }
  }

  // touffes d'herbe et fleurs
  const cell = 6;
  for (let cy = 0; cy < h / cell; cy++) {
    for (let cx = 0; cx < w / cell; cx++) {
      const x = cx * cell + Math.floor(hash(cx, cy, 20) * 4) + 1;
      const y = cy * cell + Math.floor(hash(cx, cy, 21) * 4) + 1;
      if (x < 2 || y < 2 || x >= w - 2 || y >= h - 2) continue;
      const id = ids[y * w + x];
      if (!isGrassId(id) || !isGrassId(ids[(y + 2) * w + x]) || !isGrassId(ids[(y - 2) * w + x])) continue;
      const roll = hash(cx, cy, 22);
      const flowerChance = id === 1 ? 0.3 : 0.035;
      if (roll < flowerChance) {
        const fc = PAL.flowers[Math.floor(hash(cx, cy, 23) * PAL.flowers.length)];
        r.set(x, y + 1, PAL.grass[1]);
        r.set(x - 1, y, fc);
        r.set(x + 1, y, fc);
        r.set(x, y - 1, fc);
        r.set(x, y, fc === PAL.flowers[1] ? 0xe0782a : 0xffd23a);
      } else if (roll < flowerChance + 0.28) {
        const light = PAL.grass[4];
        const dark = PAL.grass[1];
        r.set(x, y, dark);
        r.set(x - 1, y - 1, light);
        r.set(x + 1, y - 1, light);
        r.set(x, y - 2, PAL.grass[3]);
        r.set(x - 1, y, dark);
        r.set(x + 1, y, dark);
      }
    }
  }

  // coquillages et galets sur le sable
  for (let k = 0; k < 90; k++) {
    const x = Math.floor(hash(k, 1, 30) * w);
    const y = Math.floor(hash(k, 2, 30) * h);
    const i = y * w + x;
    if (ids[i] !== 2 || distWater[i] < 3) continue;
    const c = hash(k, 3, 30) < 0.5 ? hex('#fff0f0') : hex('#f0b8a8');
    r.set(x, y, c);
    r.set(x + 1, y, c);
    r.set(x, y + 1, mixRGB(c, 0x8a6a5a, 0.4));
  }

  // animation de l'eau : écume qui respire sur la plage, reflets qui glissent au large
  const water: HTMLCanvasElement[] = [];
  const FRAMES = 4;
  for (let f = 0; f < FRAMES; f++) {
    const o = new Raster(w, h);
    const phase = (f / FRAMES) * Math.PI * 2;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const id = ids[i];
        if (!isWaterId(id)) continue;
        const d = distLand[i];
        if (id === 4) {
          const reach = 2.2 + Math.sin(phase + x / 9 + noise(x / 20, y / 20, 40) * 3) * 1.4;
          if (d < reach) o.set(x, y, 0xf4fdff, 230);
          else if (d < reach + 1.5) o.set(x, y, 0xc8f4f4, 140);
          else if (d > 8) {
            // petites vagues : traits clairs qui dérivent
            const wave = Math.sin(x / 7 + y / 3.2 + phase + noise(x / 30, y / 12, 41) * 6);
            if (wave > 0.94 && (y & 1) === 0 && noise(x / 8, y / 4, 44) > 0.35) o.set(x, y, 0xbfeef6, d > 30 ? 110 : 160);
          }
        } else {
          const wave = Math.sin(x / 5 + y / 2.6 + phase + noise(x / 16, y / 10, 42) * 5);
          if (d > 3 && wave > 0.97 && (y & 1) === 0 && noise(x / 6, y / 3, 43 + f) > 0.4) o.set(x, y, 0xd8fff0, 110);
          if (d < 1.5) o.set(x, y, 0xe8fff4, 90);
        }
      }
    }
    water.push(o.toCanvas());
  }
  return { base: r.toCanvas(), water, ids, distLand };
}
