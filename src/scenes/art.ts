// Textures procédurales (fonds d'aquarium, bulle d'ascenseur, ciel…).
import type Phaser from 'phaser';
import { BIOMES, type BiomeId } from '../data/biomes';
import { hash01 } from '../systems/rng';
import { makeCanvasTexture } from '../sprites/SpriteFactory';

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const f = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `rgb(${f(r1, r2)},${f(g1, g2)},${f(b1, b2)})`;
}

export function hexNum(hex: string): number {
  return parseInt(hex.slice(1), 16);
}

export function sandHeight(h: number): number {
  return Math.max(4, Math.round(h * 0.13));
}

/** Fond d'aquarium : dégradé d'eau en bandes tramées, rayons de lumière, sable. */
export function tankBackground(textures: Phaser.Textures.TextureManager, biome: BiomeId, w: number, h: number): string {
  const key = `tankbg-${biome}-${w}x${h}`;
  makeCanvasTexture(textures, key, w, h, (ctx) => {
    const p = BIOMES[biome].palette;
    const sand = sandHeight(h);
    const water = h - sand;
    const bands = 7;
    for (let y = 0; y < water; y++) {
      const t = y / water;
      const band = Math.floor(t * bands);
      const frac = t * bands - band;
      for (let x = 0; x < w; x++) {
        // tramage ordonné entre deux bandes voisines
        const dither = ((x + y) % 2 === 0 ? 0.25 : 0.75) < frac ? 1 : 0;
        ctx.fillStyle = mix(p.waterTop, p.waterBottom, (band + dither) / bands);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // rayons de lumière diagonaux
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let r = 0; r < 4; r++) {
      const x0 = Math.floor(hash01(r + w) * w);
      const width = 3 + Math.floor(hash01(r * 7 + h) * 5);
      for (let y = 0; y < water * 0.8; y++) ctx.fillRect(x0 + Math.floor(y * 0.35), y, width, 1);
    }
    // ligne de surface
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(0, 0, w, 1);
    // sable
    for (let y = water; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const n = hash01(x * 131 + y * 71 + w);
        ctx.fillStyle = y === water ? p.sandLight : n < 0.12 ? p.sandDark : n > 0.93 ? p.sandLight : p.sand;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // relief du sable
    for (let x = 0; x < w; x++) {
      if (hash01(x * 17 + h) < 0.25) {
        ctx.fillStyle = p.sand;
        ctx.fillRect(x, water - 1, 1, 1);
      }
    }
  });
  return key;
}

/** Bulle d'ascenseur translucide sur socle de laiton. */
export function capsuleTexture(textures: Phaser.Textures.TextureManager): string {
  const key = 'capsule';
  makeCanvasTexture(textures, key, 20, 27, (ctx) => {
    const cx = 9.5;
    const cy = 11;
    for (let y = 0; y < 23; y++) {
      for (let x = 0; x < 20; x++) {
        const d = Math.hypot((x - cx) / 9.6, (y - cy) / 11.6);
        if (d > 1) continue;
        ctx.fillStyle = d > 0.88 ? 'rgba(43,34,56,0.9)' : d > 0.8 ? 'rgba(200,245,255,0.9)' : 'rgba(200,245,255,0.22)';
        ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fillRect(4, 5, 1, 4);
    ctx.fillRect(5, 4, 2, 1);
    // socle
    ctx.fillStyle = '#2b2238';
    ctx.fillRect(2, 21, 16, 6);
    ctx.fillStyle = '#e0b048';
    ctx.fillRect(3, 22, 14, 3);
    ctx.fillStyle = '#a87a28';
    ctx.fillRect(3, 25, 14, 1);
  });
  return key;
}

/** Halo lumineux doux (utilisé en mode additif). */
export function glowTexture(textures: Phaser.Textures.TextureManager, r = 24, color = '#ffe8a0'): string {
  const key = `glow-${r}-${color}`;
  const [cr, cg, cb] = hexToRgb(color);
  makeCanvasTexture(textures, key, r * 2, r * 2, (ctx) => {
    for (let y = 0; y < r * 2; y++) {
      for (let x = 0; x < r * 2; x++) {
        const d = Math.hypot(x + 0.5 - r, y + 0.5 - r) / r;
        if (d >= 1) continue;
        // paliers pour garder un rendu pixel
        const a = Math.round((1 - d) * (1 - d) * 4) / 4;
        if (a <= 0) continue;
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${a * 0.5})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
  return key;
}

/** Ciel en dégradé (fixe à l'écran). */
export function skyTexture(textures: Phaser.Textures.TextureManager, w: number, h: number): string {
  const key = `sky-${w}x${h}`;
  makeCanvasTexture(textures, key, w, h, (ctx) => {
    const bands = 8;
    for (let y = 0; y < h; y++) {
      const t = y / h;
      const band = Math.floor(t * bands);
      const frac = t * bands - band;
      for (let x = 0; x < w; x++) {
        const dither = ((x + y) % 2 === 0 ? 0.25 : 0.75) < frac ? 1 : 0;
        ctx.fillStyle = mix('#9fd8f0', '#e8f6f4', (band + dither) / bands);
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
  return key;
}

export function cloudTexture(textures: Phaser.Textures.TextureManager): string {
  const key = 'cloud';
  makeCanvasTexture(textures, key, 26, 9, (ctx) => {
    const rows = [
      '.........wwww.............',
      '.....wwwwwwwwww...........',
      '...wwwwwwwwwwwwww.wwww....',
      '..wwwwwwwwwwwwwwwwwwwwww..',
      '.wwwwwwwwwwwwwwwwwwwwwwww.',
      'wwwwwwwwwwwwwwwwwwwwwwwwww',
      'bbbbbbbbbbbbbbbbbbbbbbbbbb',
      '.bbbbbbbbbbbbbbbbbbbbbbbb.',
    ];
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        if (row[x] === '.') continue;
        ctx.fillStyle = row[x] === 'w' ? '#ffffff' : '#dcecf4';
        ctx.fillRect(x, y, 1, 1);
      }
    });
  });
  return key;
}

/** Reflets de lumière dansants (4 images en boucle, mode additif). */
export function causticTexture(textures: Phaser.Textures.TextureManager, w: number, h: number, k: number): string {
  const key = `caustic-${w}x${h}-${k}`;
  makeCanvasTexture(textures, key, w, h, (ctx) => {
    const ph = (k * Math.PI) / 2;
    const water = h - sandHeight(h);
    for (let y = 0; y < h; y++) {
      const depth = y < water ? 1 - y / water : 0.35;
      for (let x = 0; x < w; x++) {
        const v =
          Math.sin(x * 0.33 + y * 0.12 + ph) +
          Math.sin(x * 0.13 - y * 0.29 + ph * 1.3 + 1) +
          Math.sin((x + y) * 0.21 - ph * 0.7 + 2);
        if (Math.abs(v) > 0.22) continue;
        const a = Math.round(depth * 3) / 3;
        if (a <= 0) continue;
        ctx.fillStyle = `rgba(200,245,255,${0.35 * a + 0.1})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
  return key;
}
