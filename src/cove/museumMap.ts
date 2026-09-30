// L'intérieur du musée : trois grandes salles qu'on parcourt à pied. Il est posé
// sous la carte de la crique (même monde, autre zone) pour réutiliser la marche.
import { COLS, ROWS, TILE, WORLD_H } from './map';
import { hash, hex, mixRGB, ramp, Raster } from './raster';
import type { Habitat } from './museum';

export const M_COLS = 15;
/** Première rangée (en tuiles) de l'intérieur, dans la grille commune. */
export const M_ROW0 = ROWS + 4;
export const M_Y = M_ROW0 * TILE;
export const M_H = 40 * TILE;
export const M_W = M_COLS * TILE;

// # mur · . sol · P socle · C bureau d'Octave · I infirmerie · B banc · V plante · D sortie
export const M_ROWS = [
  '###############',
  '###############',
  '###############',
  '...............',
  '...............',
  '...............',
  '...............',
  '...............',
  '.PPPPPP.PPPPPP.',
  '.PPPPPP.PPPPPP.',
  '.PPPPPP.PPPPPP.',
  '...............',
  'V.............V',
  '#############..',
  '#############..',
  '#############..',
  '#############..',
  '#############..',
  '...............',
  '...............',
  '...............',
  '.....BBBBB.....',
  '...............',
  '...............',
  '...............',
  '...............',
  'V.............V',
  '######...######',
  '######...######',
  '######...######',
  '...............',
  '..CCC.....III..',
  '..CCC.....III..',
  '...............',
  '...............',
  '...............',
  '...............',
  'V.............V',
  '...............',
  '######DDD######',
];

/** Les baies vitrées des bassins, dans le mur entre la galerie et la salle des fossiles (px, relatif). */
export const TANKS: { habitat: Habitat; x: number; y: number; w: number; h: number }[] = [
  { habitat: 'mare', x: 16, y: 218, w: 62, h: 56 },
  { habitat: 'rivage', x: 82, y: 218, w: 62, h: 56 },
  { habitat: 'large', x: 148, y: 218, w: 62, h: 56 },
];
export const VITRINE = { x: 12, y: 10, w: 216, h: 30 };
export const PEDESTALS = { trex: { x: 16, y: 128 }, plesio: { x: 128, y: 128 } } as const;
export const DESK = { x: 32, y: 496 };
export const INFIRMARY = { x: 176, y: 504 };
export const EXIT = { col: 7, row: 39 };
export const ENTRY = { col: 7, row: 37 };

/** Grille de passage de l'intérieur, élargie à la largeur de la carte. */
export function museumWalk(): boolean[][] {
  return M_ROWS.map((row) => {
    const line = [...row].map((ch) => ch === '.' || ch === 'D');
    while (line.length < COLS) line.push(false);
    return line;
  });
}

const INK = hex('#241a24');

/** Peint tout l'intérieur (sols, murs, baies, socles, mobilier). */
export function renderMuseum(): Raster {
  const r = new Raster(M_W, M_H);
  const at = (c: number, rr: number) => M_ROWS[rr]?.[c] ?? '#';
  // --- sols
  for (let y = 0; y < M_H; y++) {
    const row = Math.floor(y / TILE);
    for (let x = 0; x < M_W; x++) {
      let c: number;
      if (row < 13) {
        // marbre en damier
        const light = (Math.floor(x / 16) + Math.floor(y / 16)) % 2 === 0;
        c = light ? hex('#ece4d4') : hex('#d8ccb8');
        if (hash(x >> 2, y >> 2, 3) < 0.05) c = mixRGB(c, 0x9a8a78, 0.3);
      } else if (row < 27) {
        // (la galerie)
        // moquette bleu nuit, reflets d'eau qui dansent
        c = ramp(['#1e2a4a', '#24345a', '#2c406a'].map(hex), 0.5 + Math.sin(x / 9 + y / 13) * 0.25 + Math.sin(x / 5 - y / 7) * 0.15, x, y, 0.4);
      } else {
        // parquet chaud
        const plank = Math.floor(y / 6);
        c = ramp(['#8a5a34', '#a06a3c', '#b88050'].map(hex), 0.45 + (hash(plank, Math.floor((x + plank * 7) / 30), 5) - 0.5) * 0.5, x, y, 0.2);
        if (y % 6 === 5) c = hex('#6a4028');
      }
      r.set(x, y, c);
    }
  }
  // --- murs (face visible, chapeau sombre)
  const wall = (y0: number, rows: number, face: string[], cols?: (c: number) => boolean) => {
    for (let y = y0; y < y0 + rows * TILE; y++) {
      for (let x = 0; x < M_W; x++) {
        if (cols && !cols(Math.floor(x / TILE))) continue;
        const k = y - y0;
        let c = k < 5 ? hex('#3a2a3a') : k < 7 ? hex('#5a4a5a') : ramp(face.map(hex), 0.6 - (k / (rows * TILE)) * 0.3, x, y, 0.2);
        if (k >= rows * TILE - 6) c = hex('#6a4a34');
        if (k === rows * TILE - 7) c = hex('#e0b048');
        r.set(x, y, c);
      }
    }
  };
  wall(0, 3, ['#d8c8a8', '#e8dcc0', '#f4ecd8']);
  wall(13 * TILE, 5, ['#2a3a5a', '#34466a', '#40547a'], (c) => at(c, 13) === '#');
  wall(27 * TILE, 3, ['#d8c8a8', '#e8dcc0', '#f4ecd8'], (c) => at(c, 27) === '#');
  wall(39 * TILE, 1, ['#d8c8a8', '#e8dcc0'], (c) => at(c, 39) === '#');
  // --- vitrines des trésors
  const v = VITRINE;
  for (let y = v.y; y < v.y + v.h; y++) for (let x = v.x; x < v.x + v.w; x++) {
    const frame = x === v.x || x === v.x + v.w - 1 || y === v.y || y === v.y + v.h - 1;
    r.set(x, y, frame ? hex('#6a4a34') : mixRGB(hex('#cfe8f0'), hex('#9ac0d0'), (y - v.y) / v.h));
  }
  for (let x = v.x + 1; x < v.x + v.w - 1; x++) r.set(x, v.y + v.h - 8, hex('#8a6a4a'));
  // --- baies des bassins
  for (const t of TANKS) {
    for (let y = t.y - 3; y < t.y + t.h + 3; y++) for (let x = t.x - 3; x < t.x + t.w + 3; x++) {
      const inside = x >= t.x && x < t.x + t.w && y >= t.y && y < t.y + t.h;
      if (!inside) {
        r.set(x, y, y < t.y ? hex('#1a2238') : hex('#8a8aa0'));
        continue;
      }
      const k = (y - t.y) / t.h;
      const deep = t.habitat === 'large' ? ['#1f5f9c', '#3494c8'] : t.habitat === 'rivage' ? ['#2a88a8', '#6ad0dc'] : ['#2a6a60', '#5aa890'];
      let c = mixRGB(hex(deep[1]), hex(deep[0]), k);
      if (y > t.y + t.h - 5) c = t.habitat === 'mare' ? hex('#6a5a3a') : hex('#e0cc98');
      if (Math.sin(x / 4 + y / 9) > 0.93 && y < t.y + t.h - 5) c = mixRGB(c, 0xffffff, 0.3);
      r.set(x, y, c);
    }
    // plantes et rochers au fond
    for (let k = 0; k < 5; k++) {
      const px = t.x + 4 + Math.floor(hash(k, t.x, 2) * (t.w - 8));
      const h = 5 + Math.floor(hash(k, t.x, 3) * 10);
      for (let y = 0; y < h; y++) r.set(px + (y % 3 === 0 ? 1 : 0), t.y + t.h - 5 - y, t.habitat === 'large' ? hex('#8a4a6a') : hex('#3aa05a'));
    }
    r.ellipse(t.x + t.w - 10, t.y + t.h - 5, 6, 3, hex('#7a7a8a'));
    // reflet de vitre
    for (let y = t.y + 2; y < t.y + 14; y++) r.set(t.x + 3 + Math.floor((y - t.y) * 0.3), y, mixRGB(r.get(t.x + 3, y), 0xffffff, 0.4));
    // plaque dorée
    r.rect(t.x + t.w / 2 - 22, t.y + t.h + 2, 44, 7, hex('#e0b048'));
    r.rect(t.x + t.w / 2 - 22, t.y + t.h + 8, 44, 1, hex('#8a6a28'));
  }
  // --- socles des squelettes
  for (const p of Object.values(PEDESTALS)) {
    for (let y = p.y; y < p.y + 48; y++) for (let x = p.x; x < p.x + 96; x++) {
      const top = y < p.y + 30;
      const edge = x === p.x || x === p.x + 95 || y === p.y || y === p.y + 47;
      r.set(x, y, edge ? INK : top ? ramp(['#8a8a9a', '#a8a8b8', '#c8c8d4'].map(hex), 0.7 - (y - p.y) / 60, x, y, 0.2) : mixRGB(hex('#6a6a7a'), hex('#4a4a5a'), (y - p.y - 30) / 18));
    }
    r.rect(p.x + 36, p.y + 36, 24, 5, hex('#e0b048'));
  }
  // --- bureau d'Octave, infirmerie, banc, plantes
  const d = DESK;
  for (let y = d.y; y < d.y + 32; y++) for (let x = d.x; x < d.x + 48; x++) {
    const edge = x === d.x || x === d.x + 47 || y === d.y || y === d.y + 31;
    r.set(x, y, edge ? INK : y < d.y + 6 ? hex('#c89060') : (x - d.x) % 12 === 0 ? hex('#6a4028') : hex('#8a5a36'));
  }
  const inf = INFIRMARY;
  r.ellipse(inf.x, inf.y, 22, 12, (nx, ny) => (nx * nx + ny * ny > 0.72 ? hex('#e8e8f0') : mixRGB(hex('#8ad8e8'), hex('#3a9ac0'), (ny + 1) / 2)));
  for (let k = -3; k <= 3; k++) {
    r.set(inf.x + k, inf.y - 22, hex('#e8453c'));
    r.set(inf.x, inf.y - 22 + k, hex('#e8453c'));
  }
  for (let rr = 0; rr < M_ROWS.length; rr++) for (let c = 0; c < M_COLS; c++) {
    const ch = at(c, rr);
    const x = c * TILE;
    const y = rr * TILE;
    if (ch === 'B') {
      r.rect(x, y + 6, TILE, 4, hex('#a06a3c'));
      r.rect(x, y + 10, TILE, 1, hex('#6a4028'));
      if (c % 2 === 0) r.rect(x + 2, y + 11, 2, 4, hex('#6a4028'));
    }
    if (ch === 'V') {
      r.ellipse(x + 8, y + 12, 5, 3, hex('#8a5a3a'));
      r.ellipse(x + 8, y + 6, 6, 6, (nx, ny, px, py) => ramp(['#1f5a2e', '#2f7a3a', '#4a9a44', '#6ec05a'].map(hex), 0.6 - ny * 0.4 - nx * 0.2, px, py, 0.3));
    }
  }
  // --- porte de sortie
  for (let y = 39 * TILE; y < M_H; y++) for (let x = 6 * TILE; x < 9 * TILE; x++) r.set(x, y, (x - 6 * TILE) % 24 === 0 ? INK : mixRGB(hex('#bfe8f2'), hex('#fff4d0'), 0.5));
  // arche vers la galerie
  for (let x = 6 * TILE; x < 9 * TILE; x++) for (let y = 27 * TILE; y < 27 * TILE + 8; y++) r.set(x, y, hex('#3a2a3a'));
  return r;
}

export const inMuseum = (y: number) => y >= M_Y;
export const museumTile = (x: number, y: number) => ({ c: Math.floor(x / TILE), r: Math.floor((y - M_Y) / TILE) });
export const WORLD_TOTAL_H = M_Y + M_H;
export { WORLD_H };
