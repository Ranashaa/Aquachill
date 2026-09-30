// Décors de la crique peints au pixel près : arbres, buissons, rochers, maison,
// ponton, roseaux, nénuphars… Chaque fonction renvoie un Raster (origine : bas-centre).
import { hash, hex, mixRGB, noise, ramp, Raster, type RGB } from './raster';

const LEAVES = ['#173a2c', '#23503a', '#2f6a3e', '#428a44', '#5ca84c', '#86c65a'].map(hex);
const LEAVES_AUTUMN = ['#4a2a1e', '#7a3a22', '#a8542a', '#d0782e', '#e8a040', '#f4cc6a'].map(hex);
const PINE = ['#10302a', '#18423a', '#225a44', '#2e704c', '#4a8e58'].map(hex);
const BARK = ['#3a2418', '#5a3a24', '#7a5232', '#96683e'].map(hex);
const INK = hex('#241a24');

interface Blob {
  x: number;
  y: number;
  r: number;
}

/** Feuillage en grappes : chaque grappe est éclairée d'en haut à gauche, celles de devant recouvrent celles de derrière. */
function canopy(r: Raster, blobs: Blob[], pal: RGB[], seed: number, outline: RGB): void {
  const order = [...blobs].sort((a, b) => a.y - b.y);
  const mask = new Raster(r.w, r.h);
  for (let y = 0; y < r.h; y++) {
    for (let x = 0; x < r.w; x++) {
      let top: Blob | null = null;
      for (const b of order) {
        const wob = (noise(x / 3, y / 3, seed) - 0.5) * 2.2;
        if (Math.hypot(x + 0.5 - b.x, (y + 0.5 - b.y) * 1.08) < b.r + wob) top = b;
      }
      if (!top) continue;
      const nx = (x + 0.5 - top.x) / top.r;
      const ny = (y + 0.5 - top.y) / top.r;
      const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      let t = 0.5 - nx * 0.28 - ny * 0.42 + nz * 0.18;
      // texture de feuilles : petits amas plus clairs ou plus sombres
      t += (noise(x / 2.2, y / 2.2, seed + 3) - 0.5) * 0.35;
      if (hash(x, y, seed) < 0.05) t += 0.18;
      // la base de chaque grappe se creuse dans l'ombre
      if (ny > 0.62) t -= 0.25;
      mask.set(x, y, ramp(pal, t, x, y, 0.45));
    }
  }
  mask.outline(outline);
  r.draw(mask, 0, 0);
}

export interface TreeArt {
  frames: Raster[];
  /** Largeur au sol (en px) pour les collisions. */
  base: number;
}

export function oak(seed: number, autumn = false): TreeArt {
  const W = 44;
  const H = 56;
  const frames: Raster[] = [];
  const pal = autumn ? LEAVES_AUTUMN : LEAVES;
  const j = (k: number) => (hash(seed, k, 7) - 0.5) * 3;
  const blobs: Blob[] = [
    { x: 22 + j(1), y: 19 + j(2), r: 13 },
    { x: 12 + j(3), y: 22 + j(4), r: 9 },
    { x: 32 + j(5), y: 22 + j(6), r: 9 },
    { x: 15 + j(7), y: 12 + j(8), r: 8 },
    { x: 29 + j(9), y: 11 + j(10), r: 8 },
    { x: 22 + j(11), y: 30 + j(12), r: 9 },
    { x: 9 + j(13), y: 31 + j(14), r: 6 },
    { x: 35 + j(15), y: 30 + j(16), r: 6 },
  ];
  for (let f = 0; f < 2; f++) {
    const r = new Raster(W, H);
    r.shadow(22, 52, 17, 4.5, 0.3);
    // tronc et racines
    const trunk = new Raster(W, H);
    for (let y = 30; y < 53; y++) {
      const flare = y > 48 ? (y - 48) * 1.1 : 0;
      const half = 3.2 + flare;
      for (let x = Math.floor(22 - half); x <= Math.ceil(22 + half); x++) {
        const nx = (x + 0.5 - 22) / half;
        if (Math.abs(nx) > 1) continue;
        let t = 0.62 - nx * 0.45;
        if ((x + Math.floor(y / 3)) % 4 === 0) t -= 0.25;
        trunk.set(x, y, ramp(BARK, t, x, y, 0.3));
      }
    }
    trunk.outline(INK);
    r.draw(trunk, 0, 0);
    const c = new Raster(W, H);
    canopy(c, blobs, pal, seed * 13 + 1, hex('#122a22'));
    // l'image 2 fait bouger doucement le haut du feuillage avec le vent
    r.draw(c, 0, 0);
    if (f === 1) {
      for (let y = 0; y < 22; y++) {
        for (let x = W - 2; x >= 0; x--) {
          if (c.alpha(x, y) === 0) continue;
          r.set(x + 1, y, c.get(x, y));
        }
      }
    }
    frames.push(r);
  }
  return { frames, base: 8 };
}

export function pine(seed: number): TreeArt {
  const W = 34;
  const H = 60;
  const frames: Raster[] = [];
  for (let f = 0; f < 2; f++) {
    const r = new Raster(W, H);
    r.shadow(17, 56, 13, 4, 0.3);
    const trunk = new Raster(W, H);
    for (let y = 44; y < 57; y++) for (let x = 15; x < 20; x++) trunk.set(x, y, ramp(BARK, 0.7 - (x - 15) * 0.15, x, y, 0));
    trunk.outline(INK);
    r.draw(trunk, 0, 0);
    const c = new Raster(W, H);
    // étages de branches, du bas vers le haut
    const tiers = [[48, 15], [38, 13], [29, 11], [21, 8.5], [13, 6]];
    for (const [ty, half] of tiers) {
      for (let y = ty - 12; y <= ty; y++) {
        const k = (y - (ty - 12)) / 12;
        const hw = half * k + 1;
        for (let x = Math.floor(17 - hw); x <= Math.ceil(17 + hw); x++) {
          const nx = (x + 0.5 - 17) / hw;
          if (Math.abs(nx) > 1) continue;
          const jag = y === ty && hash(x, seed, 3) < 0.5;
          if (jag) continue;
          let t = 0.55 - nx * 0.35 - (1 - k) * 0.1 + (noise(x / 2, y / 2, seed) - 0.5) * 0.3;
          if (k > 0.85) t -= 0.3;
          c.set(x, y, ramp(PINE, t, x, y, 0.4));
        }
      }
    }
    c.outline(hex('#0c2420'));
    if (f === 1) {
      const shifted = new Raster(W, H);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (c.alpha(x, y)) shifted.set(x + (y < 24 ? 1 : 0), y, c.get(x, y));
      r.draw(shifted, 0, 0);
    } else r.draw(c, 0, 0);
    frames.push(r);
  }
  return { frames, base: 6 };
}

export function bush(seed: number, berries = false): Raster {
  const r = new Raster(24, 20);
  r.shadow(12, 17, 10, 3, 0.28);
  const c = new Raster(24, 20);
  canopy(c, [{ x: 12, y: 11, r: 7 }, { x: 7, y: 13, r: 5 }, { x: 17, y: 13, r: 5 }], LEAVES, seed, hex('#122a22'));
  r.draw(c, 0, 0);
  if (berries) {
    for (let k = 0; k < 5; k++) {
      const x = 6 + Math.floor(hash(seed, k, 1) * 12);
      const y = 8 + Math.floor(hash(seed, k, 2) * 7);
      if (!r.alpha(x, y)) continue;
      r.set(x, y, hex('#e8445a'));
      r.set(x, y - 1, hex('#ffb0b8'));
    }
  }
  return r;
}

export function rock(seed: number, size = 1): Raster {
  const w = Math.round(18 * size);
  const h = Math.round(14 * size);
  const r = new Raster(w + 4, h + 4);
  const cx = (w + 4) / 2;
  const cy = h * 0.6 + 2;
  r.shadow(cx, cy + h * 0.3, w * 0.48, h * 0.18, 0.3);
  const s = new Raster(w + 4, h + 4);
  const pal = ['#4a4a5e', '#6a6a7e', '#8a8a9c', '#aeaebc', '#d0d0d8'].map(hex);
  s.ellipse(cx, cy, w * 0.44, h * 0.42, (nx, ny, x, y) => {
    const wob = noise(x / 3, y / 3, seed) * 0.3;
    if (nx * nx + ny * ny > 0.85 + wob) return null;
    let t = 0.55 - nx * 0.3 - ny * 0.5 + (noise(x / 2, y / 2, seed + 1) - 0.5) * 0.25;
    if (ny > 0.55) t -= 0.25;
    return ramp(pal, t, x, y, 0.4);
  });
  // un peu de mousse sur le dessus
  for (let x = 0; x < s.w; x++) {
    for (let y = 0; y < s.h; y++) {
      if (!s.alpha(x, y) || s.alpha(x, y - 1)) continue;
      if (noise(x / 4, 0, seed + 5) > 0.55) {
        s.set(x, y, hex('#5ca84c'));
        if (s.alpha(x, y + 1)) s.set(x, y + 1, hex('#3f8a42'));
      }
    }
  }
  s.outline(hex('#2a2a38'));
  r.draw(s, 0, 0);
  return r;
}

/** La maison du soigneur : toit de tuiles bleu ardoise, murs en bois, fenêtres, jardinières, cheminée. */
export function cottage(): Raster {
  const W = 112;
  const H = 96;
  const r = new Raster(W, H);
  r.shadow(56, 90, 56, 7, 0.3);
  const s = new Raster(W, H);
  const wallTop = 50;
  const wallBot = 88;
  const WOOD = ['#6a4a34', '#8a6444', '#a67c52', '#c2966a'].map(hex);
  const STONE = ['#5a5a6a', '#7a7a88', '#9a9aa6'].map(hex);
  // murs : planches horizontales, soubassement en pierre
  for (let y = wallTop; y < wallBot; y++) {
    for (let x = 6; x < W - 6; x++) {
      let c: RGB;
      if (y >= wallBot - 7) {
        const bx = Math.floor((x + (Math.floor(y / 4) % 2) * 3) / 6);
        const by = Math.floor(y / 4);
        c = (x + (Math.floor(y / 4) % 2) * 3) % 6 === 0 || y % 4 === 0 ? STONE[0] : ramp(STONE, 0.3 + hash(bx, by, 1) * 0.6, x, y, 0);
      } else {
        const plank = Math.floor((y - wallTop) / 5);
        const t = 0.55 + (hash(plank, Math.floor(x / 23), 2) - 0.5) * 0.3 + (noise(x / 6, y, 3) - 0.5) * 0.15;
        c = (y - wallTop) % 5 === 4 ? WOOD[0] : ramp(WOOD, t, x, y, 0.3);
      }
      s.set(x, y, c);
    }
  }
  // ombre du toit sur le mur
  for (let x = 6; x < W - 6; x++) for (let y = wallTop; y < wallTop + 4; y++) s.set(x, y, mixRGB(s.get(x, y), 0x1e1a2a, 0.45 - (y - wallTop) * 0.1));
  // porte
  const dx = 50;
  for (let y = 62; y < wallBot; y++) {
    for (let x = dx; x < dx + 14; x++) {
      const edge = x === dx || x === dx + 13 || y === 62;
      s.set(x, y, edge ? hex('#3a2418') : (x - dx) % 4 === 0 ? hex('#6a3a24') : hex('#8a4a2c'));
    }
  }
  s.set(dx + 10, 76, hex('#ffd23a'));
  s.set(dx + 10, 77, hex('#c8962a'));
  s.rect(dx - 2, wallBot, 18, 2, hex('#7a7a88'));
  // fenêtres éclairées avec jardinières fleuries
  for (const wx of [20, 78]) {
    s.rect(wx - 1, 60, 16, 14, hex('#3a2418'));
    s.rect(wx, 61, 14, 12, hex('#c2966a'));
    for (let y = 62; y < 72; y++) {
      for (let x = wx + 1; x < wx + 13; x++) {
        const glass = mixRGB(hex('#9ad8f0'), hex('#fff0b0'), (y - 62) / 10);
        s.set(x, y, (x === wx + 7) || y === 67 ? hex('#c2966a') : glass);
      }
    }
    s.set(wx + 2, 63, 0xffffff);
    s.set(wx + 3, 63, 0xffffff);
    s.set(wx + 2, 64, 0xffffff);
    s.rect(wx - 2, 74, 18, 4, hex('#7a4a2c'));
    s.rect(wx - 2, 74, 18, 1, hex('#a0683a'));
    for (let k = 0; k < 7; k++) {
      const fx = wx - 1 + k * 2.5;
      const col = [hex('#ff6a8a'), hex('#ffd23a'), hex('#fff4e0'), hex('#8ab8ff')][k % 4];
      s.set(fx, 72, hex('#3f8a42'));
      s.set(fx + 1, 73, hex('#3f8a42'));
      s.set(fx, 71, col);
      s.set(fx + 1, 72, col);
    }
  }
  // toit : tuiles en écailles, faîtage, débord
  const ROOF = ['#2a3458', '#3a4a78', '#4e64a0', '#6a86c0', '#8aa8d8'].map(hex);
  for (let y = 4; y < wallTop + 2; y++) {
    const inset = Math.max(0, 6 - (y - 4)) ;
    for (let x = 2 + inset; x < W - 2 - inset; x++) {
      const row = Math.floor((y - 4) / 5);
      const off = (row % 2) * 4;
      const fx = ((x + off) % 8) / 8;
      const fy = ((y - 4) % 5) / 5;
      let t = 0.35 + (1 - (y - 4) / (wallTop - 2)) * 0.35 + (hash(Math.floor((x + off) / 8), row, 4) - 0.5) * 0.2;
      if (fy > 0.75) t -= 0.35; // bas de chaque rangée de tuiles
      if (fx < 0.12) t -= 0.15;
      if (y < 12) t += 0.15;
      s.set(x, y, ramp(ROOF, t, x, y, 0.2));
    }
  }
  for (let x = 8; x < W - 8; x++) s.set(x, 4, ROOF[4]);
  for (let x = 2; x < W - 2; x++) s.set(x, wallTop + 1, ROOF[0]);
  // cheminée
  for (let y = 0; y < 18; y++) {
    for (let x = 80; x < 90; x++) {
      const brick = (x + (Math.floor(y / 3) % 2) * 2) % 5 === 0 || y % 3 === 0;
      s.set(x, y, y < 3 ? hex('#5a5a6a') : brick ? hex('#7a3a2a') : hex('#b0584a'));
    }
  }
  s.outline(INK);
  r.draw(s, 0, 0);
  return r;
}

/** Planches du ponton (vu de dessus), avec poteaux. */
export function pier(tilesW: number, tilesH: number): Raster {
  const W = tilesW * 16;
  const H = tilesH * 16 + 6;
  const r = new Raster(W + 2, H);
  const WOOD = ['#5a3a26', '#7a5234', '#9a6c44', '#b88a5a'].map(hex);
  for (let y = 0; y < tilesH * 16; y++) {
    const plank = Math.floor(y / 4);
    for (let x = 1; x < W + 1; x++) {
      let t = 0.5 + (hash(plank, Math.floor(x / 11), 5) - 0.5) * 0.4 + (noise(x / 5, y, 6) - 0.5) * 0.2;
      if (y % 4 === 3) t = 0;
      if (x === 1 || x === W) t = 0.05;
      r.set(x, y, ramp(WOOD, t, x, y, 0.2));
      if (y % 4 === 1 && (x === 4 || x === W - 3)) r.set(x, y, hex('#3a2a20'));
    }
  }
  // poteaux sous le ponton et leur reflet
  for (let k = 0; k < tilesH; k++) {
    for (const px of [2, W - 3]) {
      r.rect(px, k * 16 + 12, 3, 6, hex('#3a2418'));
      r.blend(px, k * 16 + 18, 0x1e3a5a, 0.4);
    }
  }
  return r;
}

export function reeds(seed: number): Raster {
  const r = new Raster(14, 20);
  for (let k = 0; k < 6; k++) {
    const x = 2 + Math.floor(hash(seed, k, 1) * 10);
    const h = 9 + Math.floor(hash(seed, k, 2) * 9);
    for (let y = 19; y > 19 - h; y--) r.set(x + (y < 10 && hash(seed, k, 3) < 0.5 ? 1 : 0), y, y > 19 - h / 3 ? hex('#3f7a3a') : hex('#6aa84a'));
    if (hash(seed, k, 4) < 0.5) {
      r.set(x, 19 - h, hex('#7a4a2a'));
      r.set(x, 20 - h, hex('#7a4a2a'));
      r.set(x, 21 - h, hex('#5a3420'));
    }
  }
  return r;
}

export function lilypad(seed: number, flower: boolean): Raster {
  const r = new Raster(12, 9);
  const pal = ['#2a6a3a', '#3f8a42', '#5ca84c', '#7ac45a'].map(hex);
  r.ellipse(6, 4.5, 5.5, 3.6, (nx, ny, x, y) => {
    if (Math.abs(Math.atan2(ny, nx) - (hash(seed, 1, 1) * 2 - 1)) < 0.35) return null; // l'encoche
    return ramp(pal, 0.6 - ny * 0.4 - nx * 0.2, x, y, 0.3);
  });
  if (flower) {
    r.set(6, 3, 0xffffff);
    r.set(5, 4, hex('#ffc0d8'));
    r.set(7, 4, hex('#ffc0d8'));
    r.set(6, 2, hex('#ffc0d8'));
    r.set(6, 4, hex('#ffd23a'));
  }
  return r;
}

export function fence(len: number): Raster {
  const W = len * 16;
  const r = new Raster(W, 16);
  const wood = ['#5a3a24', '#8a6040', '#b08050'].map(hex);
  for (let x = 0; x < W; x++) {
    r.set(x, 6, wood[2]);
    r.set(x, 7, wood[1]);
    r.set(x, 10, wood[2]);
    r.set(x, 11, wood[1]);
  }
  for (let x = 2; x < W; x += 8) {
    for (let y = 3; y < 15; y++) {
      r.set(x, y, wood[2]);
      r.set(x + 1, y, wood[1]);
      r.set(x + 2, y, wood[0]);
    }
    r.set(x + 1, 2, wood[2]);
  }
  r.outline(INK);
  return r;
}

export function mailbox(): Raster {
  const r = new Raster(12, 20);
  r.shadow(6, 18, 5, 1.5);
  r.rect(5, 9, 2, 10, hex('#6a4a34'));
  r.rect(1, 3, 10, 7, hex('#3a78c8'));
  r.rect(1, 3, 10, 2, hex('#5a98e0'));
  r.rect(2, 8, 8, 1, hex('#2a5aa0'));
  r.rect(10, 1, 1, 5, hex('#e8453c'));
  r.rect(9, 1, 1, 2, hex('#e8453c'));
  r.outline(INK);
  return r;
}

export function bench(): Raster {
  const r = new Raster(30, 16);
  r.shadow(15, 14, 14, 2);
  const w = ['#6a4a30', '#9a6c44', '#c08c5c'].map(hex);
  for (let x = 2; x < 28; x++) {
    r.set(x, 2, w[2]);
    r.set(x, 3, w[1]);
    r.set(x, 5, w[2]);
    r.set(x, 6, w[1]);
    r.set(x, 8, w[2]);
    r.set(x, 9, w[1]);
  }
  for (const x of [4, 24]) r.rect(x, 9, 2, 5, w[0]);
  r.outline(INK);
  return r;
}

export function flowerPatch(seed: number): Raster {
  const r = new Raster(16, 12);
  const cols = ['#ff6a8a', '#ffd23a', '#fff4e0', '#b88aff', '#ff9a4a'].map(hex);
  for (let k = 0; k < 7; k++) {
    const x = 2 + Math.floor(hash(seed, k, 1) * 12);
    const y = 3 + Math.floor(hash(seed, k, 2) * 7);
    const c = cols[Math.floor(hash(seed, k, 3) * cols.length)];
    r.set(x, y + 1, hex('#3f8a42'));
    r.set(x, y + 2, hex('#2f6a3e'));
    r.set(x - 1, y, c);
    r.set(x + 1, y, c);
    r.set(x, y - 1, c);
    r.set(x, y, hex('#ffe08a'));
  }
  return r;
}

export function boat(): Raster {
  const r = new Raster(34, 18);
  const hull = ['#6a3a2a', '#9a5a3a', '#c07a4e'].map(hex);
  r.ellipse(17, 9, 15.5, 7.5, (nx, ny, x, y) => {
    const inner = nx * nx / 0.7 + ny * ny / 0.45 < 1;
    if (inner) return ny < 0 ? hex('#8a5a3a') : hex('#7a4a30');
    return ramp(hull, 0.6 - ny * 0.5, x, y, 0);
  });
  for (const x of [11, 23]) r.rect(x, 4, 2, 10, hex('#b88a5a'));
  r.rect(2, 8, 30, 1, hex('#f4f0e8'));
  r.outline(INK);
  return r;
}

export type KoiPattern = 'kohaku' | 'showa' | 'yamabuki' | 'shiro';

/** Carpe koï vue de dessus (tête à droite), 2 images : la queue ondule. */
export function koiTop(pattern: KoiPattern, seed: number): Raster[] {
  const frames: Raster[] = [];
  const base = { kohaku: '#fff6ee', showa: '#1e1a24', yamabuki: '#ffc43a', shiro: '#f4f0f4' }[pattern];
  const spot = { kohaku: '#e8402a', showa: '#e8402a', yamabuki: '#ffe08a', shiro: '#2a2a34' }[pattern];
  for (let f = 0; f < 2; f++) {
    const r = new Raster(16, 9);
    // queue
    const tailY = f ? 1 : -1;
    for (const [x, y] of [[0, 4 + tailY], [1, 4 + tailY], [0, 3 + tailY], [0, 5 + tailY], [1, 4], [2, 4], [2, 3], [2, 5]]) r.set(x, y, hex(base));
    // nageoires pectorales
    r.set(9, 1, mixRGB(hex(base), 0xffffff, 0.3));
    r.set(9, 7, mixRGB(hex(base), 0xffffff, 0.3));
    r.set(8, 1, hex(base));
    r.set(8, 7, hex(base));
    r.ellipse(8.5, 4.5, 6, 2.4, (nx, ny, x, y) => {
      const patch = pattern !== 'yamabuki' && noise(x / 2.2, y / 2.2, seed) > (pattern === 'showa' ? 0.45 : 0.55);
      let c = patch ? hex(spot) : hex(base);
      if (pattern === 'showa' && noise(x / 2, y / 2, seed + 9) > 0.7) c = 0xfff6ee;
      if (ny < -0.5) c = mixRGB(c, 0xffffff, 0.25);
      if (ny > 0.5) c = mixRGB(c, 0x1a1030, 0.2);
      return nx > 0.8 ? mixRGB(c, 0x1a1030, 0.15) : c;
    });
    r.outline(hex('#1a2a3a'));
    frames.push(r);
  }
  return frames;
}

/** Papillon (2 images : ailes ouvertes, fermées). */
export function butterfly(color: string): Raster[] {
  const c = hex(color);
  const d = mixRGB(c, 0x1a1030, 0.35);
  const open = new Raster(7, 5);
  for (const [x, y] of [[0, 0], [1, 0], [0, 1], [1, 1], [2, 1], [5, 0], [6, 0], [4, 1], [5, 1], [6, 1], [1, 3], [5, 3], [0, 2], [6, 2]]) open.set(x, y, x === 0 || x === 6 ? d : c);
  for (let y = 1; y < 5; y++) open.set(3, y, hex('#2a1e2c'));
  const closed = new Raster(7, 5);
  for (const [x, y] of [[2, 0], [2, 1], [4, 0], [4, 1], [2, 2], [4, 2]]) closed.set(x, y, c);
  for (let y = 1; y < 5; y++) closed.set(3, y, hex('#2a1e2c'));
  return [open, closed];
}
