// Recherche de chemin A* sur la grille de tuiles (8 directions, sans couper les coins),
// puis lissage par ligne de vue pour une marche naturelle.

export type Grid = boolean[][];
export interface Pt {
  x: number;
  y: number;
}

const inside = (g: Grid, x: number, y: number) => y >= 0 && y < g.length && x >= 0 && x < g[0].length;
export const walkable = (g: Grid, x: number, y: number) => inside(g, x, y) && g[y][x];

/** Tuile praticable la plus proche d'une tuile donnée (recherche en spirale). */
export function nearestWalkable(g: Grid, x: number, y: number, maxR = 8): Pt | null {
  if (walkable(g, x, y)) return { x, y };
  for (let r = 1; r <= maxR; r++) {
    let best: Pt | null = null;
    let bestD = Infinity;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || !walkable(g, x + dx, y + dy)) continue;
        const d = dx * dx + dy * dy;
        if (d < bestD) {
          bestD = d;
          best = { x: x + dx, y: y + dy };
        }
      }
    }
    if (best) return best;
  }
  return null;
}

export function findPath(g: Grid, from: Pt, to: Pt): Pt[] | null {
  if (!walkable(g, to.x, to.y) || !walkable(g, from.x, from.y)) return null;
  const W = g[0].length;
  const key = (x: number, y: number) => y * W + x;
  const open: { x: number; y: number; f: number }[] = [{ ...from, f: 0 }];
  const gScore = new Map<number, number>([[key(from.x, from.y), 0]]);
  const came = new Map<number, number>();
  const h = (x: number, y: number) => {
    const dx = Math.abs(x - to.x);
    const dy = Math.abs(y - to.y);
    return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
  };
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
    const cur = open.splice(bi, 1)[0];
    if (cur.x === to.x && cur.y === to.y) {
      const path: Pt[] = [];
      let k: number | undefined = key(cur.x, cur.y);
      while (k !== undefined) {
        path.unshift({ x: k % W, y: Math.floor(k / W) });
        k = came.get(k);
      }
      return path;
    }
    const cg = gScore.get(key(cur.x, cur.y))!;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = cur.x + dx;
        const ny = cur.y + dy;
        if (!walkable(g, nx, ny)) continue;
        if (dx && dy && (!walkable(g, cur.x + dx, cur.y) || !walkable(g, cur.x, cur.y + dy))) continue;
        const ng = cg + (dx && dy ? Math.SQRT2 : 1);
        const k = key(nx, ny);
        if (ng >= (gScore.get(k) ?? Infinity)) continue;
        gScore.set(k, ng);
        came.set(k, key(cur.x, cur.y));
        const f = ng + h(nx, ny);
        const existing = open.find((o) => o.x === nx && o.y === ny);
        if (existing) existing.f = f;
        else open.push({ x: nx, y: ny, f });
      }
    }
  }
  return null;
}

/** Vrai si le segment entre deux centres de tuiles ne traverse que des tuiles praticables (avec une marge). */
export function lineOfSight(g: Grid, a: Pt, b: Pt): boolean {
  const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 4);
  for (let i = 0; i <= steps; i++) {
    const t = steps ? i / steps : 0;
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    for (const [ox, oy] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) {
      if (!walkable(g, Math.round(x + ox), Math.round(y + oy))) return false;
    }
  }
  return true;
}

/** Retire les points intermédiaires inutiles. */
export function smoothPath(g: Grid, path: Pt[]): Pt[] {
  if (path.length <= 2) return path;
  const out: Pt[] = [path[0]];
  let anchor = 0;
  for (let i = 2; i < path.length; i++) {
    if (!lineOfSight(g, path[anchor], path[i])) {
      out.push(path[i - 1]);
      anchor = i - 1;
    }
  }
  out.push(path[path.length - 1]);
  return out;
}
