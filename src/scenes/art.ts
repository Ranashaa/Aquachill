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

/** Bulle d'ascenseur translucide. */
export function capsuleTexture(textures: Phaser.Textures.TextureManager): string {
  const key = 'capsule';
  makeCanvasTexture(textures, key, 15, 17, (ctx) => {
    const cx = 7;
    const cy = 8;
    for (let y = 0; y < 17; y++) {
      for (let x = 0; x < 15; x++) {
        const d = Math.hypot((x - cx) / 7.3, (y - cy) / 8.3);
        if (d > 1) continue;
        if (d > 0.86) ctx.fillStyle = 'rgba(120,200,230,0.95)';
        else ctx.fillStyle = 'rgba(190,240,255,0.28)';
        ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(3, 4, 1, 3);
    ctx.fillRect(4, 3, 2, 1);
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
