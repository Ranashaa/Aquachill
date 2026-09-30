// Pixel art du musée : créatures vues de côté (dans les bassins), pièces de
// squelettes, trésors, le conservateur Octave, et l'intérieur du musée.
import { hash, hex, mixRGB, noise, ramp, Raster, type RGB } from './raster';
import type { Part, Skeleton } from './museum';

const INK = hex('#1e1a2c');

function shades(base: string): RGB[] {
  const c = hex(base);
  return [mixRGB(c, 0x101828, 0.55), mixRGB(c, 0x101828, 0.28), c, mixRGB(c, 0xffffff, 0.3), mixRGB(c, 0xffffff, 0.6)];
}

interface FishOpts {
  len: number;
  h: number;
  back: string;
  belly: string;
  fin: string;
  stripes?: string;
  spots?: string;
  patches?: string;
  eye?: string;
  spines?: boolean;
  throat?: string;
}

/** Poisson générique vu de côté (tête à droite), 2 images : la queue bat. */
function fish(o: FishOpts): Raster[] {
  const W = o.len + 6;
  const H = o.h + 6;
  const frames: Raster[] = [];
  for (let f = 0; f < 2; f++) {
    const r = new Raster(W, H);
    const cx = 4 + o.len * 0.55;
    const cy = H / 2;
    const back = shades(o.back);
    const belly = shades(o.belly);
    // queue
    const tx = 4 + o.len * 0.08;
    for (let y = 0; y < H; y++) {
      const dy = Math.abs(y - cy);
      const spread = o.h * 0.55;
      if (dy > spread) continue;
      const len = 3 + Math.round((dy / spread) * 3);
      for (let k = 0; k < len; k++) r.set(Math.round(tx - k + (f && y < cy ? 1 : 0) - (f && y > cy ? 1 : 0)), y, hex(o.fin));
    }
    // corps
    r.ellipse(cx, cy, o.len * 0.47, o.h / 2, (nx, ny, x, y) => {
      let c = ny < 0.1 ? ramp(back, 0.55 - ny * 0.8 - nx * 0.1, x, y, 0.2) : ramp(belly, 0.75 - ny * 0.4, x, y, 0.2);
      if (o.stripes && ny < 0.2 && Math.sin(x * 1.3 + ny * 4) > 0.6) c = hex(o.stripes);
      if (o.spots && hash(x, y, 3) < 0.12) c = hex(o.spots);
      if (o.patches && noise(x / 3, y / 3, 7) > 0.58) c = hex(o.patches);
      if (o.throat && nx > 0.35 && ny > 0.1) c = hex(o.throat);
      return c;
    });
    // nageoires dorsale et ventrale
    for (let k = -2; k <= 2; k++) {
      r.set(Math.round(cx + k), Math.round(cy - o.h / 2) - 1, hex(o.fin));
      if (Math.abs(k) < 2) r.set(Math.round(cx + k - 1), Math.round(cy + o.h / 2), hex(o.fin));
    }
    if (o.spines) for (let k = 0; k < 3; k++) r.set(Math.round(cx - 2 + k * 3), Math.round(cy - o.h / 2) - 2, hex('#e8e0c0'));
    // œil et bouche
    const ex = Math.round(cx + o.len * 0.32);
    const ey = Math.round(cy - o.h * 0.12);
    r.set(ex, ey, hex(o.eye ?? '#101018'));
    r.set(ex, ey - 1, 0xffffff);
    r.set(Math.round(cx + o.len * 0.47), Math.round(cy + 1), INK);
    r.outline(INK);
    frames.push(r);
  }
  return frames;
}

function one(draw: (r: Raster) => void, w: number, h: number): Raster[] {
  const r = new Raster(w, h);
  draw(r);
  r.outline(INK);
  const r2 = new Raster(w, h);
  r2.draw(r, 0, 1);
  return [r, r2];
}

export function creatureArt(id: string): Raster[] {
  switch (id) {
    case 'koi': return fish({ len: 22, h: 9, back: '#fff6ee', belly: '#fffaf4', fin: '#ffe8d8', patches: '#e8402a' });
    case 'epinoche': return fish({ len: 12, h: 5, back: '#6a8a5a', belly: '#d8e0d0', fin: '#a0b090', throat: '#e8402a', spines: true });
    case 'tanche': return fish({ len: 20, h: 8, back: '#4a6a2a', belly: '#b8b060', fin: '#3a5a2a', eye: '#e8402a' });
    case 'blennie': return fish({ len: 14, h: 6, back: '#8a6a4a', belly: '#d8c8a0', fin: '#6a4a2a', spots: '#4a3a2a' });
    case 'bar': return fish({ len: 28, h: 9, back: '#5a6a80', belly: '#e0e8f0', fin: '#8a9ab0' });
    case 'maquereau': return fish({ len: 24, h: 7, back: '#2a8a8a', belly: '#e8f0f0', fin: '#6ab0b0', stripes: '#1a2a3a' });
    case 'crabe': return one((r) => {
      const c = shades('#5a8a3a');
      r.ellipse(11, 8, 7, 4.5, (nx, ny, x, y) => ramp(c, 0.6 - ny * 0.5 - nx * 0.1, x, y, 0.2));
      for (const s of [-1, 1]) {
        for (let k = 0; k < 3; k++) r.set(11 + s * (7 + k), 7 - k, c[2]);
        r.ellipse(11 + s * 10, 3.5, 2.4, 2, c[3]);
        for (let k = 0; k < 3; k++) {
          r.set(11 + s * (4 + k * 2), 12, c[1]);
          r.set(11 + s * (5 + k * 2), 13, c[1]);
        }
      }
      r.set(9, 4, INK); r.set(13, 4, INK); r.set(9, 5, c[2]); r.set(13, 5, c[2]);
    }, 24, 15);
    case 'etoile': return one((r) => {
      const c = shades('#f08a3a');
      for (let y = 0; y < 18; y++) for (let x = 0; x < 18; x++) {
        const dx = x - 9 + 0.5;
        const dy = y - 9 + 0.5;
        const a = Math.atan2(dy, dx);
        const k = (Math.cos(5 * a + Math.PI / 2) + 1) / 2;
        const rad = 2.8 + 5.8 * Math.pow(k, 1.6);
        if (Math.hypot(dx, dy) > rad) continue;
        r.set(x, y, hash(x, y, 4) < 0.15 ? c[4] : ramp(c, 0.65 - dy / 20 - dx / 30, x, y, 0.2));
      }
    }, 18, 18);
    case 'bernard': return one((r) => {
      const s = shades('#e8c8a0');
      r.ellipse(8, 7, 6, 5.5, (nx, ny, x, y) => (Math.sin(Math.atan2(ny, nx) * 2 + Math.hypot(nx, ny) * 9) > 0.6 ? s[1] : ramp(s, 0.6 - ny * 0.4, x, y, 0.2)));
      const c = shades('#e8503a');
      r.ellipse(14, 9, 3, 2.5, c[2]);
      r.ellipse(17, 7, 2, 1.6, c[3]);
      for (let k = 0; k < 3; k++) r.set(12 + k * 2, 12, c[1]);
      r.set(15, 6, INK); r.set(15, 5, c[2]);
    }, 20, 14);
    case 'hippocampe': return one((r) => {
      const c = shades('#e8a83a');
      const pts: [number, number, number][] = [[9, 4, 2.6], [10, 7, 2.8], [9.5, 10, 3], [8.5, 13, 2.6], [8, 16, 2], [8.5, 18.5, 1.5], [10, 20, 1.2], [11, 19, 1], [10.5, 17.8, 0.8]];
      for (const [x, y, rad] of pts) r.ellipse(x, y, rad, rad, (nx, ny, px, py) => ramp(c, 0.6 - nx * 0.4 - ny * 0.2, px, py, 0.2));
      for (let k = 0; k < 4; k++) r.set(12 + k, 4 + (k > 2 ? 1 : 0), c[2]);
      r.set(10, 3, INK);
      for (let y = 6; y < 13; y += 2) r.set(7, y, c[4]);
      r.set(8, 1, c[3]); r.set(9, 1, c[3]);
    }, 18, 22);
    case 'grenouille': return one((r) => {
      const c = shades('#5aa83a');
      r.ellipse(10, 8, 7, 4.5, (_nx, ny, x, y) => (ny > 0.4 ? hex('#f0e8b0') : hash(x, y, 2) < 0.1 ? c[0] : ramp(c, 0.6 - ny * 0.4, x, y, 0.2)));
      r.ellipse(14, 4, 2.2, 2.2, c[3]);
      r.set(14, 4, INK);
      for (const [x, y] of [[4, 12], [3, 13], [2, 13], [16, 12], [17, 12]]) r.set(x, y, c[1]);
    }, 20, 15);
    case 'crevette': return one((r) => {
      const c = shades('#c8b8a0');
      for (let k = 0; k < 9; k++) r.ellipse(4 + k * 1.6, 8 - Math.sin(k / 3) * 3, 2.2 - k * 0.08, 2.2 - k * 0.08, (_nx, ny, x, y) => ramp(c, 0.7 - ny * 0.4, x, y, 0.2));
      for (let k = 0; k < 8; k++) r.set(19 + k, 4 - Math.floor(k / 3), c[1]);
      r.set(17, 5, INK);
      for (let k = 0; k < 4; k++) r.set(8 + k * 2, 11, c[1]);
    }, 28, 14);
    case 'triton': return one((r) => {
      const c = shades('#3a6a3a');
      for (let x = 2; x < 26; x++) {
        const t = x / 26;
        const h = x < 18 ? 2.4 : 2.4 - (x - 18) * 0.28;
        for (let y = Math.round(7 - h); y <= Math.round(7 + h); y++) r.set(x, y, y > 7 + h * 0.3 ? hex('#e8702a') : hash(x, y, 5) < 0.15 ? c[0] : ramp(c, 0.7 - t * 0.2, x, y, 0.2));
      }
      for (const lx of [6, 15]) for (let k = 0; k < 3; k++) r.set(lx + k, 10 + k, c[1]);
      r.set(23, 6, INK);
    }, 30, 14);
    case 'ecrevisse': return one((r) => {
      const c = shades('#8a5a3a');
      for (let k = 0; k < 7; k++) r.ellipse(4 + k * 2, 8, 2.6, 2.6 - k * 0.1, (_nx, ny, x, y) => ramp(c, 0.6 - ny * 0.4, x, y, 0.2));
      r.ellipse(19, 6, 3, 2, c[3]);
      r.ellipse(19, 10, 3, 2, c[2]);
      for (let k = 0; k < 6; k++) r.set(21 + k, 4 - Math.floor(k / 2), c[1]);
      r.set(16, 6, INK);
      for (let k = 0; k < 4; k++) r.set(6 + k * 2, 11, hex('#f0f0e0'));
    }, 28, 14);
    case 'raie': return one((r) => {
      const c = shades('#8a6a4a');
      for (let y = 0; y < 16; y++) for (let x = 0; x < 30; x++) {
        const dx = Math.abs(x - 14) / 14;
        const dy = Math.abs(y - 8) / 8;
        if (dx + dy > 1 || x > 26) continue;
        r.set(x, y, hash(x, y, 8) < 0.08 ? c[4] : ramp(c, 0.6 - (y - 8) / 16, x, y, 0.2));
      }
      for (let k = 0; k < 8; k++) r.set(28 + k, 8, c[1]);
      r.set(20, 6, INK); r.set(20, 10, INK);
    }, 38, 16);
    case 'poulpe': return one((r) => {
      const c = shades('#d86a5a');
      r.ellipse(12, 7, 6, 6.5, (nx, ny, x, y) => (hash(x, y, 6) < 0.1 ? c[4] : ramp(c, 0.65 - ny * 0.4 - nx * 0.2, x, y, 0.2)));
      for (let a = 0; a < 6; a++) for (let k = 0; k < 9; k++) {
        const x = Math.round(6 + a * 2.3 + Math.sin(k / 2 + a) * 1.5);
        r.set(x, 13 + k, c[k % 3 === 0 ? 3 : 1]);
      }
      r.ellipse(14, 9, 1.4, 1.2, 0xfff8e8);
      r.set(14, 9, INK);
    }, 24, 24);
    case 'seiche': return one((r) => {
      const c = shades('#b89a7a');
      r.ellipse(12, 7, 10, 4.5, (_nx, ny, x, y) => (Math.abs(ny) > 0.8 ? c[4] : Math.sin(x * 0.9) > 0.5 && ny < 0 ? c[1] : ramp(c, 0.6 - ny * 0.4, x, y, 0.2)));
      for (let k = 0; k < 5; k++) for (let j = 0; j < 4; j++) r.set(22 + j, 5 + k, c[2]);
      r.set(19, 5, INK); r.set(19, 4, 0xffffff);
    }, 28, 14);
    case 'tortue': return one((r) => {
      const s = shades('#8a6a3a');
      r.ellipse(16, 10, 11, 6, (_nx, ny, x, y) => ((Math.floor(x / 4) + Math.floor(y / 3)) % 3 === 0 ? s[1] : ramp(s, 0.65 - ny * 0.5, x, y, 0.2)));
      const k = shades('#c8a060');
      r.ellipse(29, 9, 3.2, 2.6, k[2]);
      r.set(30, 8, INK);
      for (const [fx, fy] of [[10, 16], [22, 16], [7, 5], [24, 4]]) r.ellipse(fx, fy, 3.2, 1.8, k[1]);
    }, 34, 19);
    case 'mole': return one((r) => {
      const c = shades('#a8b0c0');
      r.ellipse(14, 14, 11, 10, (nx, ny, x, y) => ramp(c, 0.65 - ny * 0.5 - nx * 0.15, x, y, 0.2));
      for (let y = 0; y < 5; y++) for (let x = 11; x < 15 - y; x++) r.set(x, y, c[1]);
      for (let y = 24; y < 29; y++) for (let x = 11; x < 15 - (28 - y); x++) r.set(x, y, c[1]);
      for (let y = 8; y < 21; y++) r.set(3, y, c[1]);
      r.set(22, 11, INK); r.set(22, 10, 0xffffff);
      r.set(25, 15, INK);
    }, 28, 30);
    default: return fish({ len: 16, h: 6, back: '#6a8aa0', belly: '#e0e8f0', fin: '#8aa0b0' });
  }
}

// ------------------------------------------------------------------ squelettes

const BONE = ['#8a7a60', '#bcae90', '#e0d4b8', '#f8f0dc'].map(hex);

function bone(r: Raster, x0: number, y0: number, x1: number, y1: number, w = 1.2): void {
  const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    const knob = t < 0.08 || t > 0.92 ? w + 0.8 : w;
    r.ellipse(x, y, knob, knob, (nx, ny, px, py) => ramp(BONE, 0.7 - ny * 0.4 - nx * 0.1, px, py, 0));
  }
}

function vertebrae(r: Raster, pts: [number, number][], size: number): void {
  for (const [x, y] of pts) {
    r.ellipse(x, y, size, size * 0.9, (_nx, ny, px, py) => ramp(BONE, 0.72 - ny * 0.4, px, py, 0));
    r.set(Math.round(x), Math.round(y - size - 0.5), BONE[1]);
  }
}

/** Une pièce de squelette (toutes à la même échelle, à assembler au même endroit). */
export function skeletonPart(s: Skeleton, p: Part): Raster {
  const r = new Raster(120, 80);
  if (s === 'trex') {
    switch (p) {
      case 'crane':
        r.ellipse(96, 26, 13, 8, (nx, ny, x, y) => (Math.hypot(nx - 0.1, ny + 0.2) < 0.28 ? null : ramp(BONE, 0.7 - ny * 0.4 - nx * 0.1, x, y, 0)));
        r.ellipse(90, 23, 3, 2.5, INK);
        for (let k = 0; k < 6; k++) r.set(88 + k * 3, 33, 0xffffff), r.set(88 + k * 3, 34, BONE[3]);
        break;
      case 'machoire':
        bone(r, 84, 36, 106, 37, 1.6);
        for (let k = 0; k < 6; k++) r.set(87 + k * 3, 34, 0xffffff);
        break;
      case 'cou': vertebrae(r, [[80, 30], [76, 33], [72, 36]], 2.4); break;
      case 'dos': vertebrae(r, [[67, 38], [61, 39], [55, 39], [49, 39], [43, 40]], 2.6); break;
      case 'cotes':
        for (let k = 0; k < 6; k++) {
          const x = 46 + k * 4;
          for (let j = 0; j < 12; j++) r.set(Math.round(x - Math.sin(j / 6) * 2), 41 + j, BONE[j % 3 === 0 ? 1 : 2]);
        }
        break;
      case 'bassin':
        r.ellipse(40, 44, 7, 5, (_nx, ny, x, y) => ramp(BONE, 0.7 - ny * 0.4, x, y, 0));
        bone(r, 66, 42, 72, 50, 1); bone(r, 72, 50, 76, 48, 0.8);
        break;
      case 'pattes':
        bone(r, 40, 48, 44, 60, 2); bone(r, 44, 60, 38, 72, 1.6); bone(r, 38, 72, 46, 74, 1);
        bone(r, 36, 48, 30, 60, 1.8); bone(r, 30, 60, 26, 72, 1.4); bone(r, 26, 72, 33, 74, 1);
        break;
      case 'queue': vertebrae(r, [[35, 41], [29, 43], [23, 46], [17, 49], [12, 53], [8, 57], [5, 61]], 2.2); break;
    }
  } else {
    switch (p) {
      case 'crane':
        r.ellipse(104, 16, 8, 4.5, (nx, ny, x, y) => (Math.hypot(nx + 0.2, ny + 0.2) < 0.25 ? null : ramp(BONE, 0.7 - ny * 0.4, x, y, 0)));
        r.ellipse(101, 14, 1.6, 1.4, INK);
        break;
      case 'machoire':
        bone(r, 98, 20, 112, 20, 1.2);
        for (let k = 0; k < 5; k++) r.set(100 + k * 3, 18, 0xffffff);
        break;
      case 'cou': vertebrae(r, [[94, 18], [89, 20], [84, 23], [79, 27], [74, 31], [69, 35]], 1.8); break;
      case 'dos': vertebrae(r, [[63, 38], [57, 39], [51, 39], [45, 39]], 2.4); break;
      case 'cotes':
        for (let k = 0; k < 5; k++) for (let j = 0; j < 9; j++) r.set(Math.round(47 + k * 4 - Math.sin(j / 5) * 2), 41 + j, BONE[j % 3 === 0 ? 1 : 2]);
        break;
      case 'bassin': r.ellipse(40, 42, 5, 3.5, (_nx, ny, x, y) => ramp(BONE, 0.7 - ny * 0.4, x, y, 0)); break;
      case 'pattes':
        for (const [x0, y0, x1, y1] of [[62, 44, 72, 58], [56, 44, 50, 60], [40, 45, 46, 58], [36, 45, 28, 57]]) {
          bone(r, x0, y0, x1, y1, 1.8);
          for (let k = 0; k < 3; k++) r.set(Math.round(x1 + (k - 1) * 2), y1 + 2, BONE[2]);
        }
        break;
      case 'queue': vertebrae(r, [[34, 41], [28, 42], [22, 44], [16, 46], [11, 48]], 1.8); break;
    }
  }
  r.outline(hex('#5a4a38'));
  return r;
}

/** Silhouette en pointillés de la pièce manquante (pour voir le squelette se compléter). */
export function ghostPart(s: Skeleton, p: Part): Raster {
  const src = skeletonPart(s, p);
  const r = new Raster(src.w, src.h);
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    if (!src.alpha(x, y)) continue;
    const edge = !src.alpha(x - 1, y) || !src.alpha(x + 1, y) || !src.alpha(x, y - 1) || !src.alpha(x, y + 1);
    if (edge && (x + y) % 2 === 0) r.set(x, y, hex('#8a7a9a'), 150);
  }
  return r;
}

// ------------------------------------------------------------------ trésors

export function treasureArt(id: string): Raster {
  const r = new Raster(16, 16);
  switch (id) {
    case 'ammonite':
      r.ellipse(8, 8, 6.5, 6.5, (nx, ny, x, y) => {
        const a = Math.atan2(ny, nx);
        const d = Math.hypot(nx, ny);
        return Math.sin(a * 1 + d * 14) > 0.5 ? hex('#8a6a4a') : ramp(shades('#c8a070'), 0.7 - ny * 0.4, x, y, 0);
      });
      break;
    case 'trilobite':
      r.ellipse(8, 8, 5, 6.5, (nx, ny, x, y) => ((y % 2 === 0) ? hex('#6a6a7a') : Math.abs(nx) < 0.3 ? hex('#9a9aa8') : ramp(shades('#7a7a88'), 0.6 - ny * 0.3, x, y, 0)));
      break;
    case 'megalodon':
      for (let y = 2; y < 14; y++) for (let x = 3; x < 13; x++) if (Math.abs(x - 8) < (y - 1) * 0.45 + 0.5) r.set(x, y, y > 11 ? hex('#6a5a4a') : ramp(shades('#d8d0c0'), 0.8 - y / 20 - (x - 8) / 20, x, y, 0));
      break;
    case 'oursin':
      r.ellipse(8, 9, 6, 5, (nx, ny, x, y) => (Math.cos(Math.atan2(ny, nx) * 5) > 0.7 && Math.hypot(nx, ny) > 0.3 ? hex('#e8e0c8') : ramp(shades('#b8a888'), 0.7 - ny * 0.4, x, y, 0)));
      break;
    case 'ambre':
      r.ellipse(8, 8, 5.5, 4.5, (nx, ny, x, y) => (Math.hypot(nx, ny) < 0.25 ? hex('#3a2a1a') : ramp(shades('#f0a030'), 0.7 - ny * 0.4 - nx * 0.2, x, y, 0)));
      r.set(6, 6, 0xffffff);
      break;
    case 'nautile':
      r.ellipse(8, 8, 6.5, 6, (nx, ny, x, y) => (Math.sin(Math.atan2(ny, nx) * 4) > 0.3 && nx < 0.3 ? hex('#c86a3a') : ramp(shades('#f4e8d8'), 0.7 - ny * 0.4, x, y, 0)));
      break;
    default:
      for (let y = 3; y < 15; y++) r.set(8, y, hex('#9a8a70'));
      for (let a = 0; a < 5; a++) for (let k = 0; k < 5; k++) r.set(8 + Math.round(Math.cos(a * 1.25 - 1.6) * k), 4 + Math.round(Math.sin(a * 1.25 - 1.6) * k * 0.6), hex('#c8b898'));
  }
  r.outline(INK);
  return r;
}

// ------------------------------------------------------------------ Octave

/** Octave, le conservateur : un poulpe à monocle et nœud papillon, vu de dessus. */
export function octaveSprite(): Raster[] {
  const frames: Raster[] = [];
  for (let f = 0; f < 2; f++) {
    const r = new Raster(20, 24);
    r.shadow(10, 22, 7, 2);
    const c = shades('#b86ad0');
    for (let a = 0; a < 6; a++) for (let k = 0; k < 7; k++) {
      const x = Math.round(3 + a * 2.8 + Math.sin(k / 2 + a + f) * 1.2);
      r.set(x, 13 + k, c[k > 4 ? 3 : 1]);
    }
    r.ellipse(10, 8, 7, 7.5, (nx, ny, x, y) => (hash(x, y, 9) < 0.08 ? c[4] : ramp(c, 0.65 - ny * 0.4 - nx * 0.2, x, y, 0.2)));
    for (const ex of [7, 13]) {
      r.ellipse(ex, 9, 1.8, 2, 0xfff8e8);
      r.set(ex, 9 + (f ? 0 : 1), INK);
    }
    for (let a = 0; a < 16; a++) r.set(Math.round(13 + Math.cos(a / 16 * 6.28) * 2.6), Math.round(9 + Math.sin(a / 16 * 6.28) * 2.8), hex('#e0b048'));
    r.set(16, 12, hex('#e0b048'));
    r.rect(8, 14, 5, 2, hex('#e8453c'));
    r.set(10, 14, hex('#a02a2a'));
    r.outline(INK);
    frames.push(r);
  }
  return frames;
}

/** Filet, planche, ronces… l'obstacle posé sur une créature à sauver. */
export function netArt(): Raster {
  const r = new Raster(20, 16);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 20; x++) {
    if ((x + y) % 4 === 0 || (x - y + 40) % 4 === 0) r.set(x, y, hex('#e8e0c8'), 230);
  }
  return r;
}

export function digSpotArt(): Raster[] {
  const frames: Raster[] = [];
  for (let f = 0; f < 2; f++) {
    const r = new Raster(12, 10);
    for (const [x, y] of [[2, 3], [3, 4], [4, 5], [5, 6], [6, 5], [7, 4], [8, 3], [9, 2], [5, 2], [5, 3], [5, 4]]) r.set(x, y + (f && x > 5 ? -1 : 0), hex('#5a3a24'));
    r.set(3, 7, hex('#8a6a4a'));
    r.set(8, 7, hex('#8a6a4a'));
    frames.push(r);
  }
  return frames;
}
