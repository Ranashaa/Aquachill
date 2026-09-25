// Mobilier et décor des salles de la tour (style Tiny Tower : contours sombres, 2-3 nuances).
import { hash01 } from '../../systems/rng';
import type { SpriteDef } from '../SpriteFactory';

const o = '#2b2238';

/** Construit une grille par une fonction (x, y) → caractère. */
function gen(w: number, h: number, palette: Record<string, string>, f: (x: number, y: number) => string): SpriteDef {
  const rows: string[] = [];
  for (let y = 0; y < h; y++) {
    let row = '';
    for (let x = 0; x < w; x++) row += f(x, y) || '.';
    rows.push(row);
  }
  return { palette, rows };
}

/** Ajoute un contour sombre autour des pixels pleins. */
function outlined(def: SpriteDef): SpriteDef {
  const h = def.rows.length;
  const w = def.rows[0].length;
  const filled = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && def.rows[y][x] !== '.';
  const rows = def.rows.map((row, y) =>
    [...row].map((ch, x) => (ch === '.' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => filled(x + dx, y + dy)) ? 'o' : ch)).join(''),
  );
  return { palette: { ...def.palette, o }, rows };
}

/** Filet de pêche en losanges avec une étoile de mer. */
const net = gen(22, 15, { o, n: '#c8b890', r: '#8a6a44', S: '#ff8a5c', s: '#e0603a' }, (x, y) => {
  const star: Record<string, string> = {
    '14,6': 'S', '13,7': 'S', '14,7': 's', '15,7': 'S', '12,8': 'S', '13,8': 'S', '14,8': 'S', '15,8': 'S', '16,8': 'S',
    '13,9': 'S', '15,9': 'S', '12,10': 'S', '16,10': 'S',
  };
  if (star[`${x},${y}`]) return star[`${x},${y}`];
  if (y === 0) return 'r';
  const sag = Math.round(Math.sin((x / 21) * Math.PI) * 3);
  if (y > 11 + sag) return '';
  return (x + y) % 4 === 0 || (x - y + 40) % 4 === 0 ? 'n' : '';
});

/** Lianes pendantes du plafond, avec feuilles. */
const vines = gen(40, 16, { g: '#5faf4a', G: '#3f8f3a', l: '#8fdf6a' }, (x, y) => {
  if (y === 0) return 'G';
  const len = 4 + Math.floor(hash01(x * 7 + 3) * 12);
  if (x % 3 !== 0 || y > len) return hash01(x * 13 + y * 7) < 0.08 && y < 4 ? 'g' : '';
  if (y === len) return 'l';
  return hash01(x + y * 31) < 0.3 ? 'l' : y % 2 ? 'g' : 'G';
});

/** Bouquet de bambous. */
const bamboo = gen(14, 44, { b: '#8fbf4a', B: '#5f8f2a', n: '#c8df7a', l: '#4a8f3a' }, (x, y) => {
  const stalks = [2, 6, 10];
  for (const [i, sx] of stalks.entries()) {
    const top = 4 + i * 5;
    if (y >= top && (x === sx || x === sx + 1)) {
      if ((y - top) % 9 === 0) return 'n';
      return x === sx ? 'b' : 'B';
    }
    // feuilles
    if (y >= top - 3 && y < top + 3 && Math.abs(x - sx - (y - top + 3)) <= 0 && x < 14) return 'l';
  }
  return '';
});

/** Squelette de baleine suspendu dans le hall. */
const whale = outlined(gen(72, 20, { b: '#f4ecd8', B: '#d8ccb0', o }, (x, y) => {
  // crâne (à gauche)
  if (x < 14) {
    const cy = 8;
    const inside = ((x - 9) / 9) ** 2 + ((y - cy) / 5) ** 2 < 1 && y < 12;
    const jaw = y >= 11 && y <= 12 && x >= 1 && x < 14;
    if (inside || jaw) return (x === 7 && y === 7) ? 'o' : y > 9 ? 'B' : 'b';
    return '';
  }
  // queue (nageoire à droite)
  if (x >= 64) {
    const d = x - 64;
    if (y >= 6 - d && y <= 8 + d && y >= 1 && y <= 14 && (y <= 3 || y >= 11 || d < 2)) return 'b';
    return '';
  }
  // colonne vertébrale qui s'affine
  const spineY = 7 + Math.round(Math.sin((x - 14) / 16) * 1.2);
  if (y === spineY) return x % 3 === 0 ? 'B' : 'b';
  // côtes
  const ribLen = Math.max(0, Math.round(10 - (x - 14) / 4.5));
  if (x % 4 === 0 && y > spineY && y <= spineY + ribLen) return 'b';
  return '';
}));

export const ROOM_SPRITES: Record<string, SpriteDef> = {
  lamp: {
    palette: { o, L: '#c8a040', l: '#a07a28', y: '#fff3a0' },
    rows: ['...o...', '...o...', '..ooo..', '.oLLlo.', 'oLLLLlo', 'ooooooo', '..yyy..', '...y...'],
  },
  bench: {
    palette: { o, W: '#b07a4a', w: '#8a5a34' },
    rows: [
      '.oooooooooooooooooooooooo.',
      'oWWWWWWWWWWWWWWWWWWWWWWWWo',
      'owwwwwwwwwwwwwwwwwwwwwwwwo',
      '.oooooooooooooooooooooooo.',
      '.oWWWWWWWWWWWWWWWWWWWWWWo.',
      '.owwwwwwwwwwwwwwwwwwwwwwo.',
      '.oooooooooooooooooooooooo.',
      '.oWo..................oWo.',
      '.oWo..................oWo.',
      '.ooo..................ooo.',
    ],
  },
  porthole: {
    palette: { o, B: '#e0b048', b: '#a87a28', c: '#6ad0ee', C: '#3a90c0', w: '#ffffff' },
    rows: [
      '.....oooooo.....',
      '...ooBBBBBBoo...',
      '..oBBboooobBBo..',
      '.oBBooccccooBBo.',
      '.oBbocwcccCobBo.',
      'oBBocwcccCCcoBBo',
      'oBbocccccCCcobBo',
      'oBbocccCCCCcobBo',
      'oBbocccCCCCcobBo',
      'oBbocccCCCCCobBo',
      'oBBoccCCCCCCoBBo',
      '.oBboCCCCCCobBo.',
      '.oBBooCCCCooBBo.',
      '..oBBboooobBBo..',
      '...ooBBBBBBoo...',
      '.....oooooo.....',
    ],
  },
  lifebuoy: {
    palette: { o, R: '#e84a3a', W: '#f8f4ea' },
    rows: [
      '...oooooo...',
      '.ooRRWWRRoo.',
      '.oRRooooRRo.',
      'oWRo....oRWo',
      'oWo......oWo',
      'oRo......oRo',
      'oRo......oRo',
      'oWo......oWo',
      'oWRo....oRWo',
      '.oRRooooRRo.',
      '.ooRRWWRRoo.',
      '...oooooo...',
    ],
  },
  poster: {
    palette: { o, F: '#b07a4a', b: '#4ab0e0', O: '#ff7b1c', W: '#ffffff', g: '#5faf4a', s: '#f2e0b0', w: '#bfefff' },
    rows: [
      'oooooooooooo',
      'oFFFFFFFFFFo',
      'oFbbbbbbbwFo',
      'oFbbbbbbbbFo',
      'oFbbObWOObFo',
      'oFbOOWOOWbFo',
      'oFbbObWOObFo',
      'oFbbbbbbbbFo',
      'oFbwbbbbbbFo',
      'oFbbbbbbbbFo',
      'oFgbbgbbgbFo',
      'oFssssssssFo',
      'oFFFFFFFFFFo',
      'oooooooooooo',
    ],
  },
  net,
  fern: {
    palette: { o, g: '#6fcf5a', G: '#3f9f3a', P: '#c8653a', p: '#a04a28' },
    rows: [
      '.......g........',
      '..g....gG...g...',
      '..gG...gG..Gg...',
      '...gG..gG.Gg...g',
      'g...gG.gGGg...gG',
      'gG...gGgGg..gGg.',
      '.gGG..gGGg.gGg..',
      '..ggG.gGGggGg...',
      'g...gGgGGGGg...g',
      'gGG..gGGGGg..gGg',
      '.ggGGgGGGGgGGgg.',
      '...ggGGGGGGgg...',
      '.....ggGGgg.....',
      '......gGGg......',
      '...oooooooooo...',
      '...oPPPPPPPPo...',
      '....oPPPPPPo....',
      '....oPpPPPPo....',
      '....oPPPPPpo....',
      '....oPPPPPPo....',
      '.....oooooo.....',
    ],
  },
  toucan: {
    palette: { o, K: '#1e1a24', w: '#8fd0ff', W: '#ffe8a0', Y: '#ff9a2a', R: '#e83a3a', b: '#6a4a2a' },
    rows: [
      '...ooo......',
      '..oKKKo.....',
      '.oKKwKoooo..',
      '.oKKKoYYYYo.',
      '.oKWWoYYYRRo',
      '.oKWWWoooooo',
      '.oKWWKo.....',
      '.oKKKKo.....',
      '.oKKKKo.....',
      '..oKKKo.....',
      '..oRRKo.....',
      '..oKKo......',
      'bbbbbbbbbbbb',
      '.bbb....bbb.',
    ],
  },
  vines,
  butterfly: {
    palette: { o, F: '#8a5a34', w: '#f4efe0', B: '#3a8af0', b: '#9ad0ff', k: '#1e1a24' },
    rows: [
      'oooooooooooo',
      'oFFFFFFFFFFo',
      'oFwwwwwwwwFo',
      'oFBBwwwwBBFo',
      'oFBbBwwBbBFo',
      'oFwBBkkBBwFo',
      'oFwwBwwBwwFo',
      'oFwwwwwwwwFo',
      'oFFFFFFFFFFo',
      'oooooooooooo',
    ],
  },
  stormlamp: {
    palette: { o, M: '#6a6a74', y: '#ffd86a', Y: '#fff8c0' },
    rows: ['..ooo..', '.o...o.', 'ooooooo', 'oMyyyMo', 'oMyYyMo', 'oMyyyMo', 'ooooooo', '.oMMMo.', '..ooo..'],
  },
  crate: {
    palette: { o, W: '#c89a5a', w: '#a8783a', r: '#c83a2a' },
    rows: [
      'oooooooooooooooo',
      'oWWWWWWWWWWWWWWo',
      'oWwwwwwwwwwwwwWo',
      'oooooooooooooooo',
      'oWWWrrrrrWWWWWWo',
      'oWwwrwwwrwwwwwWo',
      'oWWWrrrrrWWWWWWo',
      'oooooooooooooooo',
      'oWWWWWWWWWWWWWWo',
      'oWwwwwwwwwwwwwWo',
      'oooooooooooooooo',
    ],
  },
  paperlantern: {
    palette: { o, K: '#2b2238', R: '#e8453c', r: '#b83028', y: '#ffd23a' },
    rows: [
      '....o....',
      '...ooo...',
      '..oKKKo..',
      '.oRRRRRo.',
      'oRrRRRrRo',
      'oRRRRRRRo',
      'oRrRRRrRo',
      'oRRRRRRRo',
      'oRrRRRrRo',
      '.oRRRRRo.',
      '..oKKKo..',
      '...ooo...',
      '....y....',
      '....y....',
    ],
  },
  bonsai: {
    palette: { o, G: '#4a8f4a', g: '#6fbf5a', b: '#6a4a2a', T: '#3a5a8a' },
    rows: [
      '....GGGG........',
      '..GGgGGGG..GGG..',
      '.GGGGgGGGGGGgGG.',
      '..GGGG.bGGGGGGG.',
      '.....bb..GGGG...',
      '....bb...b......',
      '...bb...b.......',
      '....bbbbb.......',
      '.....bb.........',
      '..oooooooooooo..',
      '..oTTTTTTTTTTo..',
      '...oTTTTTTTTo...',
      '...oooooooooo...',
      '....o......o....',
    ],
  },
  scroll: {
    palette: { o, K: '#6a4a2a', P: '#f4ecd8', k: '#2b2238', r: '#d83a2a' },
    rows: [
      'oooooooooo',
      'oKKKKKKKKo',
      '.oPPPPPPo.',
      '.oPPPPPPo.',
      '.oPPkPPPo.',
      '.oPkkkPPo.',
      '.oPPkPPPo.',
      '.oPPkkPPo.',
      '.oPPPkPPo.',
      '.oPPPPPPo.',
      '.oPPrPPPo.',
      '.oPPPPPPo.',
      '.oPPPPPPo.',
      '.oPPPPPPo.',
      'oooooooooo',
      'oKKKKKKKKo',
      'oooooooooo',
    ],
  },
  bamboo,
  whale,
};
