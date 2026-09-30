// Placement des décors dans la crique et grille de passage.
import { hash } from './raster';
import { AQUARIUM, baseWalkable, COLS, HOUSE, MAP_ROWS, PIER, ROWS, TILE } from './map';

export interface Prop {
  kind: 'oak' | 'autumn' | 'pine' | 'bush' | 'berry' | 'rock' | 'bigrock' | 'reeds' | 'lily' | 'lilyflower' | 'flowers'
    | 'cottage' | 'pier' | 'fence' | 'mailbox' | 'bench' | 'boat' | 'lantern' | 'bin' | 'stand' | 'aquarium';
  /** Position du pied de l'objet (origine bas-centre), en px. */
  x: number;
  y: number;
  seed: number;
  /** Couche fixe (sous les personnages) au lieu du tri par profondeur. */
  flat?: boolean;
}

export interface World {
  props: Prop[];
  walk: boolean[][];
}

export function buildWorld(): World {
  const walk = baseWalkable();
  const props: Prop[] = [];
  const block = (tx: number, ty: number) => {
    if (ty >= 0 && ty < ROWS && tx >= 0 && tx < COLS) walk[ty][tx] = false;
  };
  const at = (tx: number, ty: number) => MAP_ROWS[ty]?.[tx] ?? 'T';

  // forêt : arbres serrés sur les tuiles T, en quinconce
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      if (at(tx, ty) !== 'T') continue;
      if ((tx + ty) % 2 === 1 && hash(tx, ty, 1) < 0.7) continue;
      // on dégage les abords de l'aquarium
      if (tx >= AQUARIUM.x - 1 && tx <= AQUARIUM.x + AQUARIUM.w && ty >= AQUARIUM.y - 1 && ty <= AQUARIUM.y + AQUARIUM.h + 1) continue;
      const kind = hash(tx, ty, 2) < 0.35 ? 'pine' : hash(tx, ty, 3) < 0.12 ? 'autumn' : 'oak';
      props.push({ kind, x: tx * TILE + 8 + (hash(tx, ty, 4) - 0.5) * 8, y: ty * TILE + 14 + (hash(tx, ty, 5) - 0.5) * 6, seed: tx * 97 + ty });
    }
  }
  // quelques arbres isolés dans la prairie
  for (const [tx, ty, kind] of [[16, 9, 'oak'], [11, 24, 'oak'], [28, 22, 'autumn'], [19, 25, 'oak'], [33, 16, 'pine'], [26, 26, 'pine']] as const) {
    props.push({ kind, x: tx * TILE + 8, y: ty * TILE + 14, seed: tx * 31 + ty });
    block(tx, ty);
  }
  for (const [tx, ty, kind] of [[14, 6, 'bush'], [3, 17, 'berry'], [21, 21, 'bush'], [26, 19, 'berry'], [31, 26, 'bush'], [1, 9, 'bush'], [34, 21, 'berry']] as const) {
    props.push({ kind, x: tx * TILE + 8, y: ty * TILE + 14, seed: tx * 7 + ty });
    block(tx, ty);
  }
  for (const [tx, ty] of [[6, 18], [23, 5], [30, 24], [11, 25], [25, 12]]) props.push({ kind: 'flowers', x: tx * TILE + 8, y: ty * TILE + 12, seed: tx + ty * 5, flat: true });

  // rochers sur la pointe et la plage
  for (const [tx, ty, big] of [[33, 30, 1], [31, 34, 0], [34, 33, 1], [5, 31, 0], [24, 33, 0], [29, 28, 0]] as const) {
    props.push({ kind: big ? 'bigrock' : 'rock', x: tx * TILE + 8, y: ty * TILE + 13, seed: tx * 3 + ty });
    block(tx, ty);
    if (big) block(tx + 1, ty);
  }

  // mare : roseaux sur les bords, nénuphars sur l'eau
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      if (at(tx, ty) === 'o') {
        if (hash(tx, ty, 9) < 0.22) props.push({ kind: hash(tx, ty, 10) < 0.3 ? 'lilyflower' : 'lily', x: tx * TILE + 8, y: ty * TILE + 10, seed: tx * 5 + ty, flat: true });
        continue;
      }
      const nearPond = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => at(tx + dx, ty + dy) === 'o');
      if (nearPond && at(tx, ty) !== 'T' && hash(tx, ty, 11) < 0.3) props.push({ kind: 'reeds', x: tx * TILE + 8, y: ty * TILE + 12, seed: tx + ty * 3 });
    }
  }

  // la maison, sa boîte aux lettres, le potager clôturé
  props.push({ kind: 'cottage', x: (HOUSE.x + HOUSE.w / 2) * TILE, y: (HOUSE.y + HOUSE.h) * TILE + 6, seed: 1 });
  for (let tx = HOUSE.x; tx < HOUSE.x + HOUSE.w; tx++) block(tx, HOUSE.y + HOUSE.h - 1);
  props.push({ kind: 'mailbox', x: 12 * TILE + 4, y: 12 * TILE + 2, seed: 1 });
  block(12, 11);
  props.push({ kind: 'fence', x: 4 * TILE, y: 12 * TILE + 14, seed: 4 });
  props.push({ kind: 'bench', x: 20 * TILE, y: 17 * TILE + 12, seed: 1 });
  block(19, 17);
  block(20, 17);

  // l'aquarium du village
  const A = AQUARIUM;
  props.push({ kind: 'aquarium', x: (A.x + 3.5) * TILE, y: (A.y + A.h) * TILE + 4, seed: 1 });
  for (let ty = A.y + 3; ty < A.y + A.h; ty++) for (let tx = A.x; tx < A.x + A.w; tx++) block(tx, ty);
  // lanternes le long des chemins (elles s'allument le soir)
  for (const [tx, ty] of [[11.3, 17.4], [7.4, 23.4], [13.3, 25.3], [15.4, 31.2], [9.9, 10.7]]) {
    props.push({ kind: 'lantern', x: tx * TILE, y: ty * TILE, seed: 1 });
    block(Math.floor(tx), Math.floor(ty - 0.2));
  }
  props.push({ kind: 'lantern', x: (PIER.x + PIER.w) * TILE - 2, y: (PIER.y + PIER.h) * TILE - 2, seed: 1 });
  // coffre d'expédition et présentoir à graines
  props.push({ kind: 'bin', x: 10.9 * TILE, y: 11.9 * TILE, seed: 1 });
  block(10, 11);
  props.push({ kind: 'stand', x: 6.7 * TILE, y: 12.9 * TILE, seed: 1 });
  block(6, 12);

  // le ponton et la barque
  props.push({ kind: 'pier', x: (PIER.x + PIER.w / 2) * TILE, y: PIER.y * TILE, seed: 1, flat: true });
  props.push({ kind: 'boat', x: (PIER.x + PIER.w) * TILE + 20, y: (PIER.y + 4) * TILE, seed: 1, flat: true });
  return { props, walk };
}
