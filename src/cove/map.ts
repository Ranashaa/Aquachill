// La crique : carte en tuiles de 16 px. Chaque caractère est un type de sol ;
// les objets (maison, arbres, ponton…) sont posés par-dessus.

export const TILE = 16;

// T forêt · . herbe · , prairie fleurie · s sable · r rochers · ~ mer · o mare
// d chemin de terre · f potager · h maison
export const MAP_ROWS = [
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'TTTTTT..TTTTTTTTTTT....TTTTTTTTTTTTT',
  'TTTT.......TTTTT.........TTTTTTTTTTT',
  'TTT...........TT...........TTTTTTTTT',
  'TT..................,,,......TTTTTTT',
  'TT....hhhhhhh.......,,.........TTTTT',
  'T.....hhhhhhh.................,,TTTT',
  'T.....hhhhhhh...........ooooo....TTT',
  'T.....hhhhhhh.........ooooooooo...TT',
  'T.....hhhhhhh........ooooooooooo...T',
  'T...................oooooooooooo...T',
  'T...................ooooooooooo....T',
  'T.ffff..............,oooooooooo....T',
  'T.ffff..............,,.ooooooo.....T',
  'T.ffff................,,..........TT',
  'T..............................,,.TT',
  'TT................,,..............TT',
  'TT...............,,,,..............T',
  'T.................,,...............T',
  'T.,,............................,..T',
  'T.,,,...................,,.........T',
  'T..,...................,,,,........T',
  'T.......................,,.........T',
  'T.................................TT',
  'T...,,..........................TTTT',
  'TT..,,,........................TTTTT',
  'TTs............s.............sssTTTT',
  'Tssss.......s..ss........sssssssrrTT',
  'sssssssss..ss..sssss...sssssssssrrrT',
  'ssssssssssssss..ssssssssssssssssrrrr',
  'ssssssssssssssssssssssssssssssssrrrr',
  'sssssssssssssssssssssssssssssssrrrrr',
  '~ssssssssssssssssssssssssssssssrrrr~',
  '~~~ssssssssssssssssssssssssssssrrr~~',
  '~~~~~~ssssss~~ssssss~~~~~sssssrrr~~~',
  '~~~~~~~~~~~~~~~sss~~~~~~~~~~~~rr~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
];

export const COLS = MAP_ROWS[0].length;
export const ROWS = MAP_ROWS.length;
export const WORLD_W = COLS * TILE;
export const WORLD_H = ROWS * TILE;

export type Ground = 'grass' | 'meadow' | 'sand' | 'rock' | 'sea' | 'pond' | 'dirt' | 'soil';

const GROUND: Record<string, Ground> = {
  T: 'grass', '.': 'grass', ',': 'meadow', s: 'sand', r: 'rock', '~': 'sea', o: 'pond', d: 'dirt', f: 'soil', h: 'grass',
};

export function groundAt(tx: number, ty: number): Ground {
  const cx = Math.max(0, Math.min(COLS - 1, tx));
  const cy = Math.max(0, Math.min(ROWS - 1, ty));
  return GROUND[MAP_ROWS[cy][cx]] ?? 'grass';
}

/** Chemins de terre (en tuiles), tracés en courbes douces. */
export const PATHS: [number, number][][] = [
  [[9.5, 11], [9.5, 15], [10.2, 18], [12, 21], [13.6, 24], [14.4, 27.5], [15.6, 31], [16.9, 35.5]],
  [[9.8, 16.5], [13, 16.8], [17, 16], [20.5, 15.2]],
];

export const isWater = (g: Ground) => g === 'sea' || g === 'pond';

/** Le ponton de Marcel, qui s'avance dans la mer. */
export const PIER = { x: 16, y: 36, w: 2, h: 8 };
export const HOUSE = { x: 6, y: 6, w: 7, h: 5, doorX: 9 };

/** Grille de passage (true = on peut marcher). Les obstacles d'objets sont ajoutés par la scène. */
export function baseWalkable(): boolean[][] {
  return MAP_ROWS.map((row, y) => [...row].map((ch, x) => {
    if (x >= PIER.x && x < PIER.x + PIER.w && y >= PIER.y && y < PIER.y + PIER.h) return true;
    return ch !== '~' && ch !== 'o' && ch !== 'T' && ch !== 'h';
  }));
}
