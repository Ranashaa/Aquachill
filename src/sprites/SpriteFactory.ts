// Génère les sprites pixel art à partir de grilles de caractères + palettes.
// Chaque sprite est enregistré sous une clé de texture Phaser : pour le remplacer
// plus tard par un vrai PNG, il suffit de charger une image sous la même clé
// (voir overrides.ts) — la génération est alors ignorée pour cette clé.

import type Phaser from 'phaser';

export interface SpriteDef {
  palette: Record<string, string>;
  rows: string[];
}

export interface FishSpriteDef extends SpriteDef {
  /** Nombre de colonnes (à gauche) formant la queue, animées en 2e image. */
  tail: number;
  /** Caractère de palette qui « clignote » (nageoire) en 2e image. */
  flutter?: string;
}

export function defSize(def: SpriteDef): { w: number; h: number } {
  return { w: Math.max(...def.rows.map((r) => r.length)), h: def.rows.length };
}

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** Dessine une grille dans un contexte. `color` force une couleur unique (silhouette). */
export function paint(
  ctx: CanvasRenderingContext2D,
  def: SpriteDef,
  ox = 0,
  oy = 0,
  color?: string,
): void {
  def.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const c = color ?? def.palette[ch];
      if (!c) continue;
      ctx.fillStyle = c;
      ctx.fillRect(ox + x, oy + y, 1, 1);
    }
  });
}

export function defToCanvas(def: SpriteDef, color?: string): HTMLCanvasElement {
  const { w, h } = defSize(def);
  const c = makeCanvas(w, h);
  paint(c.getContext('2d')!, def, 0, 0, color);
  return c;
}

/** 2e image d'un poisson : la queue se décale d'un pixel, la nageoire clignote. */
export function fishSecondFrame(def: FishSpriteDef): SpriteDef {
  const rows = def.rows.map((row, y) => {
    let out = '';
    for (let x = 0; x < row.length; x++) {
      let ch = row[x];
      if (x < def.tail) ch = def.rows[y - 1]?.[x] ?? '.';
      if (def.flutter && ch === def.flutter) ch = '.';
      out += ch;
    }
    return out;
  });
  return { palette: def.palette, rows };
}

// ---------------------------------------------------------------- registre

const canvasRegistry = new Map<string, HTMLCanvasElement[]>();
const urlCache = new Map<string, string>();

/** Enregistre une suite d'images comme texture Phaser avec des frames 0..n-1. */
export function registerFrames(
  textures: Phaser.Textures.TextureManager,
  key: string,
  frames: HTMLCanvasElement[],
): void {
  canvasRegistry.set(key, frames);
  if (textures.exists(key)) return; // remplacé par un vrai sprite (override)
  const w = Math.max(...frames.map((f) => f.width));
  const h = Math.max(...frames.map((f) => f.height));
  const sheet = makeCanvas(w * frames.length, h);
  const ctx = sheet.getContext('2d')!;
  frames.forEach((f, i) => ctx.drawImage(f, i * w, 0));
  const tex = textures.addCanvas(key, sheet)!;
  frames.forEach((_, i) => tex.add(i, 0, i * w, 0, w, h));
}

export function registerDef(textures: Phaser.Textures.TextureManager, key: string, ...defs: SpriteDef[]): void {
  registerFrames(textures, key, defs.map((d) => defToCanvas(d)));
}

/** Enregistre aussi une silhouette (pour le carnet) sous `${key}-sil`. */
export function registerSilhouette(key: string, def: SpriteDef, color: string): void {
  canvasRegistry.set(`${key}-sil`, [defToCanvas(def, color)]);
}

/** URL d'image (data:) d'un sprite, pour l'interface HTML. */
export function spriteUrl(key: string, frame = 0): string {
  const cacheKey = `${key}#${frame}`;
  const cached = urlCache.get(cacheKey);
  if (cached) return cached;
  const canvas = canvasRegistry.get(key)?.[frame];
  if (!canvas) return '';
  const url = canvas.toDataURL();
  urlCache.set(cacheKey, url);
  return url;
}

export function spriteCanvasSize(key: string): { w: number; h: number } {
  const c = canvasRegistry.get(key)?.[0];
  return c ? { w: c.width, h: c.height } : { w: 0, h: 0 };
}

export function makeCanvasTexture(
  textures: Phaser.Textures.TextureManager,
  key: string,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
): void {
  if (textures.exists(key)) return;
  const c = makeCanvas(w, h);
  draw(c.getContext('2d')!);
  canvasRegistry.set(key, [c]);
  textures.addCanvas(key, c);
}
