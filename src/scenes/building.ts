// Dessin de l'immeuble : cage d'ascenseur, bandeaux, salles thématiques, hall, chantier, toit, rue.
import Phaser from 'phaser';
import { FLOOR_H, GAME_W, LOBBY_H, ROOM_X0, ROOM_X1, SHAFT_W, STREET_H } from '../config';
import type { BiomeId } from '../data/biomes';
import { textTexture } from '../sprites';
import { measureText, type FontId } from '../sprites/font';
import { hash01 } from '../systems/rng';
import { glowTexture } from './art';
import type { Rect } from './TankView';

export const INK = 0x2b2238;
const SLAB = 0x3a3654;
const BRASS = 0xe0b048;
const BRASS_DARK = 0xa87a28;
const ROOM_W = ROOM_X1 - ROOM_X0;

export const floorTop = (i: number) => -LOBBY_H - (i + 1) * FLOOR_H;
/** Rectangle de l'eau de l'aquarium d'un étage. */
export const tankRect = (top: number): Rect => ({ x: 66, y: top + 22, w: 132, h: 40 });

/** Crée et mémorise les objets d'affichage (pour pouvoir tout reconstruire). */
export class Painter {
  objs: Phaser.GameObjects.GameObject[] = [];
  glows: Phaser.GameObjects.Image[] = [];
  shades: Phaser.GameObjects.Rectangle[] = [];
  timers: Phaser.Time.TimerEvent[] = [];

  constructor(public scene: Phaser.Scene) {}

  g(depth = 1): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics().setDepth(depth);
    this.objs.push(g);
    return g;
  }

  img(x: number, y: number, key: string, depth = 2, ox = 0.5, oy = 0.5): Phaser.GameObjects.Image {
    const im = this.scene.add.image(Math.round(x), Math.round(y), key).setOrigin(ox, oy).setDepth(depth);
    this.objs.push(im);
    return im;
  }

  sprite(x: number, y: number, key: string, depth = 2): Phaser.GameObjects.Sprite {
    const sp = this.scene.add.sprite(Math.round(x), Math.round(y), key, 0).setOrigin(0.5, 1).setDepth(depth);
    this.objs.push(sp);
    return sp;
  }

  text(
    x: number, y: number, str: string,
    opts: { color?: string; shadow?: string | null; font?: FontId; depth?: number; ox?: number } = {},
  ): Phaser.GameObjects.Image {
    const key = textTexture(this.scene.textures, str, opts.color ?? '#ffffff', opts.shadow === undefined ? '#2b2238' : opts.shadow, opts.font ?? 'big');
    return this.img(x, y, key, opts.depth ?? 4, opts.ox ?? 0, 0);
  }

  /** Halo lumineux dont l'intensité suit la nuit. */
  glow(x: number, y: number, r = 24, color = '#ffe8a0', depth = 13): Phaser.GameObjects.Image {
    const im = this.img(x, y, glowTexture(this.scene.textures, r, color), depth);
    im.setBlendMode(Phaser.BlendModes.ADD);
    this.glows.push(im);
    return im;
  }

  /** Action répétée (supprimée avec le reste lors d'une reconstruction). */
  every(ms: number, fn: () => void): void {
    this.timers.push(this.scene.time.addEvent({ delay: ms, loop: true, callback: fn }));
  }

  /** Ombre portée au sol sous un meuble. */
  floorShadow(x: number, y: number, w: number): void {
    const g = this.g(14);
    g.fillStyle(0x2b2238, 0.22).fillEllipse(x, y, w, 4);
  }

  /** Lampe suspendue qui se balance doucement. */
  swingingLamp(x: number, y: number, key: string, depth: number): void {
    const lamp = this.img(x, y, key, depth, 0.5, 0);
    this.scene.tweens.add({
      targets: lamp, angle: { from: -3, to: 3 }, yoyo: true, repeat: -1,
      duration: 1600 + Math.random() * 800, ease: 'Sine.easeInOut', delay: Math.random() * 1000,
    });
  }

  /** Pénombre nocturne sur une zone (le contenu des aquariums, au-dessus, reste éclairé). */
  shade(x: number, y: number, w: number, h: number): void {
    const r = this.scene.add.rectangle(x, y, w, h, 0x140f3a, 0).setOrigin(0).setDepth(4.5);
    this.objs.push(r);
    this.shades.push(r);
  }

  setNight(night: number): void {
    for (const gl of this.glows) gl.setAlpha(night * 0.6).setVisible(night > 0.05);
    for (const sh of this.shades) sh.setFillStyle(0x140f3a, night * 0.32);
  }

  clear(): void {
    this.scene.tweens.killTweensOf(this.objs);
    this.objs.forEach((o) => o.destroy());
    this.objs = [];
    this.glows = [];
    this.shades = [];
    this.timers.forEach((t) => t.remove());
    this.timers = [];
  }
}

// ------------------------------------------------------------------- utilitaires

function rect(g: Phaser.GameObjects.Graphics, color: number, x: number, y: number, w: number, h: number, alpha = 1) {
  g.fillStyle(color, alpha).fillRect(x, y, w, h);
}

/** Rectangle avec contour sombre. */
function box(g: Phaser.GameObjects.Graphics, color: number, x: number, y: number, w: number, h: number) {
  rect(g, INK, x, y, w, h);
  rect(g, color, x + 1, y + 1, w - 2, h - 2);
}

// ------------------------------------------------------------------ ascenseur

/** Cage de l'ascenseur-bulle : mur de briques et colonne d'eau. */
export function drawShaft(p: Painter, top: number, h: number, label: string | null): void {
  const g = p.g(3);
  rect(g, 0x4a4262, 0, top, SHAFT_W, h);
  for (let y = top; y < top + h; y += 4) {
    const row = Math.floor((y - top) / 4);
    for (let x = (row % 2) * 4 - 4; x < SHAFT_W; x += 8) {
      const x0 = Math.max(0, x);
      const x1 = Math.min(SHAFT_W, x + 7);
      if (x1 > x0) rect(g, 0x57506f, x0, y, x1 - x0, 3);
    }
  }
  // colonne d'eau
  rect(g, INK, 5, top, 1, h);
  rect(g, INK, 28, top, 1, h);
  rect(g, 0x5fc0e0, 6, top, 22, h, 0.9);
  rect(g, 0x9fe0f4, 8, top, 2, h, 0.8);
  rect(g, 0x3a98c8, 25, top, 2, h, 0.8);
  // anneau de laiton au sol de l'étage et plaque d'étage
  rect(g, INK, 3, top + h - 4, 28, 4);
  rect(g, BRASS, 4, top + h - 3, 26, 2);
  rect(g, BRASS_DARK, 4, top + h - 2, 26, 1);
  if (label) {
    box(g, BRASS, 10, top + 14, 14, 11);
    p.text(17, top + 16, label, { color: '#2b2238', shadow: null, font: 'small', depth: 4, ox: 0.5 });
    // porte vers la salle
    rect(g, INK, 28, top + h - 30, 6, 27);
    rect(g, BRASS, 29, top + h - 29, 5, 1);
  }
}

// -------------------------------------------------------------------- bandeaux

/** Couleur du bandeau selon le type d'étage (comme les catégories de Tiny Tower). */
export const BANNER_COLORS: Record<string, number> = {
  reef: 0x2a8a9e, amazon: 0x3f8a3a, koi: 0xa8363a, lobby: 0x5a4a8a, build: 0x5a5670, soon: 0xc8642a,
};

export function drawBanner(p: Painter, top: number, title: string, bg = SLAB, color = '#ffffff'): void {
  const g = p.g(3);
  const light = Phaser.Display.Color.ValueToColor(bg).lighten(18).color;
  const dark = Phaser.Display.Color.ValueToColor(bg).darken(18).color;
  rect(g, bg, ROOM_X0, top, GAME_W - ROOM_X0, 11);
  rect(g, light, ROOM_X0, top, GAME_W - ROOM_X0, 1);
  rect(g, dark, ROOM_X0, top + 9, GAME_W - ROOM_X0, 1);
  rect(g, INK, ROOM_X0, top + 10, GAME_W - ROOM_X0, 1);
  p.text(ROOM_X0 + 5, top + 2, title, { color, depth: 4 });
}

/** Mur extérieur à droite de la tour (bord de l'immeuble). */
function drawOuterWall(p: Painter, top: number, h: number, night: number): void {
  const g = p.g(3);
  rect(g, 0x6a6488, ROOM_X1, top, GAME_W - ROOM_X1, h);
  rect(g, 0x8a84a8, ROOM_X1, top, 1, h);
  rect(g, INK, ROOM_X1 - 1, top, 1, h);
  rect(g, night > 0.4 ? 0xffe08a : 0xbfe0f0, ROOM_X1 + 3, top + 20, 2, h - 40);
}

// ----------------------------------------------------------------- salles

export interface Theme {
  frame: number;
  frameDark: number;
  cabinet: number;
  lamp: 'room-lamp' | 'room-paperlantern' | 'room-stormlamp';
}

const THEMES: Record<string, Theme> = {
  reef: { frame: BRASS, frameDark: BRASS_DARK, cabinet: 0x5a8aa8, lamp: 'room-lamp' },
  amazon: { frame: 0x8a5a34, frameDark: 0x5a3a22, cabinet: 0x7a5a34, lamp: 'room-stormlamp' },
  koi: { frame: 0x3a2a2a, frameDark: 0x8a2a2a, cabinet: 0x5a3a22, lamp: 'room-paperlantern' },
};

/** Zone de mur : de y0 (plafond) à y1 (sol), puis 8 px de sol. */
interface Area {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

function drawReefWall(g: Phaser.GameObjects.Graphics, a: Area) {
  const w = a.x1 - a.x0;
  const wains = a.y1 - 24;
  // papier peint turquoise à écailles
  rect(g, 0x3fb4c6, a.x0, a.y0, w, wains - a.y0);
  for (let y = a.y0 + 2; y < wains - 2; y += 6) {
    for (let x = a.x0 + ((y / 6) % 2) * 4; x < a.x1; x += 8) {
      rect(g, 0x62cbd8, x, y, 5, 1);
      rect(g, 0x62cbd8, x - 1, y + 1, 1, 2);
      rect(g, 0x62cbd8, x + 5, y + 1, 1, 2);
      rect(g, 0x35a0b2, x + 1, y + 3, 3, 1);
    }
  }
  // frise de cordage
  rect(g, 0xe8d0a0, a.x0, wains - 3, w, 2);
  for (let x = a.x0; x < a.x1; x += 3) rect(g, 0xb8945a, x, wains - 3, 1, 2);
  // lambris bleu marine
  rect(g, 0x2f5a8a, a.x0, wains, w, 24);
  for (let x = a.x0 + 3; x < a.x1; x += 8) rect(g, 0x264a74, x, wains + 2, 1, 22);
  rect(g, 0x4a7ab0, a.x0, wains, w, 1);
  rect(g, INK, a.x0, wains - 1, w, 1);
  // pont de bateau
  rect(g, 0xd09a5a, a.x0, a.y1, w, 8);
  for (let x = a.x0; x < a.x1; x += 14) rect(g, 0xa8743a, x + ((x / 14) % 2) * 7, a.y1 + 2, 1, 5);
  rect(g, 0xa8743a, a.x0, a.y1 + 4, w, 1);
  rect(g, 0xf0c080, a.x0, a.y1, w, 1);
}

function drawAmazonWall(g: Phaser.GameObjects.Graphics, a: Area) {
  const w = a.x1 - a.x0;
  const glassH = 18;
  rect(g, 0xbfeccf, a.x0, a.y0, w, glassH);
  for (let x = a.x0; x < a.x1; x += 16) rect(g, 0x3f6a2a, x, a.y0, 2, glassH);
  rect(g, 0x3f6a2a, a.x0, a.y0 + 9, w, 1);
  rect(g, 0xffffff, a.x0 + 6, a.y0 + 2, 1, 5, 0.7);
  const py = a.y0 + glassH;
  const wains = a.y1 - 22;
  // papier peint vert à feuilles de palmier
  rect(g, 0x3f9a4a, a.x0, py, w, wains - py);
  for (let y = py + 4; y < wains - 4; y += 12) {
    for (let x = a.x0 + ((y / 12) % 2) * 9; x < a.x1; x += 18) {
      rect(g, 0x5ab85a, x, y + 3, 7, 1);
      for (let k = 0; k < 4; k++) rect(g, 0x5ab85a, x + 1 + k * 2, y + 1 + (k % 2), 1, 2);
      rect(g, 0x2f7a3a, x + 3, y + 4, 1, 3);
    }
  }
  rect(g, 0x3f6a2a, a.x0, py - 1, w, 2);
  // lambris en bois de teck
  for (let x = a.x0; x < a.x1; x += 6) rect(g, (x / 6) % 2 ? 0x9a6a3a : 0x8a5a2e, x, wains, 6, 22);
  rect(g, 0xc8904a, a.x0, wains, w, 1);
  rect(g, INK, a.x0, wains - 1, w, 1);
  rect(g, 0x6a4a2a, a.x0, a.y1, w, 8);
  for (let x = a.x0; x < a.x1; x += 11) rect(g, 0x4a321e, x, a.y1 + 3, 6, 1);
  rect(g, 0x8a6a3a, a.x0, a.y1, w, 1);
}

function drawKoiWall(g: Phaser.GameObjects.Graphics, a: Area) {
  const w = a.x1 - a.x0;
  const wains = a.y1 - 22;
  // cloisons shoji lumineuses entre des piliers laqués
  rect(g, 0xfff4dc, a.x0, a.y0, w, wains - a.y0);
  for (let x = a.x0; x < a.x1; x += 12) rect(g, 0x9a6a3a, x, a.y0, 1, wains - a.y0);
  for (let y = a.y0 + 10; y < wains; y += 10) rect(g, 0x9a6a3a, a.x0, y, w, 1);
  rect(g, 0x5a2e1e, a.x0, a.y0, w, 4);
  rect(g, 0x7a3e26, a.x0, a.y0 + 4, w, 1);
  for (let x = a.x0; x < a.x1; x += 48) {
    rect(g, INK, x, a.y0, 6, a.y1 - a.y0);
    rect(g, 0xc0402e, x + 1, a.y0, 4, a.y1 - a.y0);
    rect(g, 0xe0604a, x + 1, a.y0, 1, a.y1 - a.y0);
  }
  // soubassement sombre à motif de vagues seigaiha
  rect(g, 0x5a3a26, a.x0, wains, w, 22);
  for (let y = wains + 3; y < a.y1 - 2; y += 5) {
    for (let x = a.x0 + ((y - wains) % 10 ? 4 : 0); x < a.x1; x += 8) {
      rect(g, 0x7a5236, x, y, 5, 1);
      rect(g, 0x7a5236, x + 1, y - 1, 3, 1);
    }
  }
  rect(g, 0x8a6246, a.x0, wains, w, 1);
  rect(g, INK, a.x0, wains - 1, w, 1);
  // tatamis
  rect(g, 0xc8c47a, a.x0, a.y1, w, 8);
  for (let x = a.x0; x < a.x1; x += 32) rect(g, 0x3a5a2a, x, a.y1, 2, 8);
  for (let x = a.x0; x < a.x1; x += 3) rect(g, 0xb4b06a, x, a.y1 + 2, 1, 5);
  rect(g, 0x3a5a2a, a.x0, a.y1, w, 1);
}

/** Mur et sol thématiques d'un biome sur une zone donnée. */
export function drawThemeWall(g: Phaser.GameObjects.Graphics, biome: BiomeId, a: Area): void {
  if (biome === 'amazon') drawAmazonWall(g, a);
  else if (biome === 'koi') drawKoiWall(g, a);
  else drawReefWall(g, a);
}

export function themeOf(biome: BiomeId): Theme {
  return THEMES[biome] ?? THEMES.reef;
}

/** Cadre épais de l'aquarium et meuble en dessous. */
export function drawTankFrame(g: Phaser.GameObjects.Graphics, r: Rect, theme: Theme, cabinetH = 11): void {
  rect(g, INK, r.x - 5, r.y - 5, r.w + 10, r.h + 10);
  rect(g, theme.frame, r.x - 4, r.y - 4, r.w + 8, r.h + 8);
  rect(g, theme.frameDark, r.x - 4, r.y + r.h + 2, r.w + 8, 2);
  rect(g, INK, r.x - 1, r.y - 1, r.w + 2, r.h + 2);
  const cy = r.y + r.h + 5;
  box(g, theme.cabinet, r.x - 2, cy, r.w + 4, cabinetH);
  rect(g, INK, r.x + r.w / 2, cy + 2, 1, cabinetH - 3);
  rect(g, BRASS, r.x + r.w / 2 - 4, cy + cabinetH / 2, 2, 2);
  rect(g, BRASS, r.x + r.w / 2 + 3, cy + cabinetH / 2, 2, 2);
}

/** Dessine une salle d'aquarium complète (sans son contenu vivant). */
export function drawRoom(p: Painter, top: number, biome: BiomeId, night: number): Rect {
  const theme = themeOf(biome);
  const g = p.g(1);
  drawThemeWall(g, biome, { x0: ROOM_X0, x1: ROOM_X1, y0: top + 11, y1: top + 88 });
  rect(g, INK, ROOM_X0, top + 95, ROOM_W, 1);
  // ombres de plafond et d'angles pour donner du volume
  rect(g, 0x000000, ROOM_X0, top + 11, ROOM_W, 3, 0.14);
  rect(g, 0x000000, ROOM_X0, top + 14, ROOM_W, 3, 0.06);
  rect(g, 0x000000, ROOM_X0, top + 11, 4, 77, 0.1);
  rect(g, 0x000000, ROOM_X1 - 4, top + 11, 4, 77, 0.1);
  rect(g, 0xffffff, ROOM_X0, top + 88, ROOM_W, 1, 0.25);

  // aquarium encastré : cadre épais, meuble
  const r = tankRect(top);
  drawTankFrame(p.g(4), r, theme);
  // reflets de vitre (au-dessus des poissons)
  const glass = p.g(12);
  glass.fillStyle(0xffffff, 0.35).fillRect(r.x + 4, r.y + 2, 1, 10).fillRect(r.x + 6, r.y + 2, 1, 5);
  glass.fillStyle(0xffffff, 0.12).fillRect(r.x + r.w - 24, r.y + 2, 7, r.h - 8);

  // lampes au-dessus de l'aquarium
  p.shade(ROOM_X0, top + 11, ROOM_W, 85);
  for (const lx of [r.x + 30, r.x + r.w - 30]) {
    if (theme.lamp === 'room-lamp') p.img(lx, top + 11, theme.lamp, 5, 0.5, 0);
    else p.swingingLamp(lx, top + 11, theme.lamp, 5);
    p.glow(lx, top + 18, 12);
    // flaque de lumière au sol
    p.glow(lx, top + 91, 16).setScale(1.6, 0.3);
  }
  // ombre de l'aquarium sur le sol
  p.floorShadow(r.x + r.w / 2, top + 90, r.w);

  // mobilier thématique (côtés gauche et droit)
  const L = ROOM_X0 + 15;
  const R = ROOM_X1 - 14;
  if (biome === 'reef') {
    p.img(L, top + 36, 'room-porthole', 2);
    p.img(R, top + 14, 'room-net', 2, 0.5, 0);
    p.img(R, top + 50, 'room-lifebuoy', 2);
    p.floorShadow(R - 1, top + 94, 26);
    p.img(ROOM_X1 - 2, top + 94, 'room-bench', 15, 1, 1);
  } else if (biome === 'amazon') {
    for (let x = ROOM_X0; x < ROOM_X1; x += 40) p.img(x, top + 11, 'room-vines', 6, 0, 0);
    p.img(L, top + 30, 'room-butterfly', 2);
    p.img(L, top + 94, 'room-fern', 15, 0.5, 1);
    const toucan = p.sprite(R, top + 53, 'room-toucan', 2);
    p.every(2600 + Math.random() * 1500, () => {
      if (!toucan.active) return;
      toucan.setFrame(1);
      p.scene.time.delayedCall(160, () => toucan.active && toucan.setFrame(0));
    });
    p.floorShadow(L, top + 94, 16);
    p.floorShadow(R, top + 94, 16);
    p.img(R, top + 94, 'room-crate', 15, 0.5, 1);
  } else {
    p.img(L, top + 16, 'room-scroll', 2, 0.5, 0);
    p.floorShadow(L, top + 94, 20);
    p.floorShadow(R, top + 94, 14);
    const st = p.g(15);
    box(st, 0x5a3a22, L - 9, top + 80, 18, 14);
    p.img(L, top + 81, 'room-bonsai', 15, 0.5, 1);
    p.img(R, top + 94, 'room-bamboo', 15, 0.5, 1);
  }
  drawOuterWall(p, top, FLOOR_H, night);
  return r;
}

// ------------------------------------------------------------------------ hall

export function drawLobby(p: Painter, night: number, name: string, subDocked: boolean): void {
  const top = -LOBBY_H;
  drawShaft(p, top, LOBBY_H, 'RDC');
  drawBanner(p, top, `ACCUEIL · ${name}`, BANNER_COLORS.lobby, '#ffe08a');
  const g = p.g(1);
  // papier peint doré à motif damassé, soubassement en marbre
  rect(g, 0xe8b86a, ROOM_X0, top + 11, ROOM_W, LOBBY_H - 23);
  for (let y = top + 14; y < -30; y += 10) {
    for (let x = ROOM_X0 + ((y / 10) % 2) * 6; x < ROOM_X1; x += 12) {
      rect(g, 0xd49a4a, x + 2, y, 2, 1);
      rect(g, 0xd49a4a, x + 1, y + 1, 4, 1);
      rect(g, 0xd49a4a, x + 2, y + 2, 2, 1);
      rect(g, 0xf4d08a, x + 2, y + 1, 1, 1);
    }
  }
  rect(g, 0xf6ecdc, ROOM_X0, -30, ROOM_W, 18);
  for (let i = 0; i < 16; i++) rect(g, 0xe0d0b8, ROOM_X0 + Math.floor(hash01(i * 7) * ROOM_W), -28 + Math.floor(hash01(i * 3) * 14), 4, 1);
  rect(g, 0x8a3a3a, ROOM_X0, -31, ROOM_W, 2);
  rect(g, 0x000000, ROOM_X0, top + 11, ROOM_W, 3, 0.14);
  // grande baie en arche avec vue sur la mer
  const ax = 118;
  const aw = 76;
  const ay = top + 22;
  const ah = 58;
  for (let y = 0; y < ah; y++) {
    for (let x = 0; x < aw; x++) {
      const dx = x - aw / 2 + 0.5;
      const archY = y < aw / 2 ? aw / 2 - Math.sqrt(Math.max(0, (aw / 2) ** 2 - dx * dx)) : 0;
      if (y < archY - 3) continue;
      const border = y < archY || x < 3 || x >= aw - 3;
      const t = y / ah;
      const water = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(0x6ad0ee), Phaser.Display.Color.ValueToColor(0x1f6fa8), 1, t);
      const c = border ? (y < archY - 1 || x < 1 || x >= aw - 1 ? INK : BRASS)
        : Phaser.Display.Color.GetColor(water.r, water.g, water.b);
      rect(g, c, ax + x, ay + y, 1, 1);
    }
  }
  // rayons et silhouettes de poissons dans la baie
  g.fillStyle(0xffffff, 0.12);
  for (let k = 0; k < 3; k++) for (let y = 0; y < 40; y++) g.fillRect(ax + 18 + k * 18 + Math.floor(y * 0.3), ay + 8 + y, 3, 1);
  g.fillStyle(0x1a4a70, 0.7);
  for (const [fx, fy] of [[ax + 20, ay + 34], [ax + 44, ay + 26], [ax + 54, ay + 44]]) {
    g.fillRect(fx, fy, 6, 2).fillRect(fx - 2, fy - 1, 2, 4).fillRect(fx + 1, fy - 1, 3, 1);
  }
  // le petit sous-marin amarré derrière la baie
  if (subDocked) {
    const sub = p.img(ax + aw / 2, ay + ah - 16, 'sub', 2);
    p.scene.tweens.add({ targets: sub, y: sub.y - 2, yoyo: true, repeat: -1, duration: 1400, ease: 'Sine.easeInOut' });
  }
  // colonnes
  for (const cx of [ROOM_X0 + 4, 106, 197]) {
    rect(g, INK, cx - 1, top + 11, 10, LOBBY_H - 23);
    rect(g, 0xece0cc, cx, top + 11, 8, LOBBY_H - 23);
    rect(g, 0xd8c8ae, cx + 6, top + 11, 2, LOBBY_H - 23);
    box(g, BRASS, cx - 2, top + 11, 12, 5);
    box(g, BRASS, cx - 2, -17, 12, 5);
  }
  // squelette de baleine suspendu
  const wx = 42;
  const wy = top + 16;
  g.fillStyle(0x6a6488).fillRect(wx + 14, top + 11, 1, 5).fillRect(wx + 54, top + 11, 1, 6);
  p.img(wx, wy, 'room-whale', 2, 0, 0);
  // sol en damier
  for (let x = ROOM_X0; x < ROOM_X1; x += 8) {
    rect(g, (x / 8) % 2 ? 0xe8dcc8 : 0xd4c4ac, x, -12, 8, 4);
    rect(g, (x / 8) % 2 ? 0xd4c4ac : 0xe8dcc8, x, -8, 8, 5);
  }
  rect(g, 0xf6ecdc, ROOM_X0, -12, ROOM_W, 1);
  rect(g, INK, ROOM_X0, -1, ROOM_W, 1);
  // réceptionniste et comptoir d'accueil
  p.sprite(77, -24, 'visitor-5', 15.5);
  const d = p.g(16);
  box(d, 0xb07a4a, 50, -34, 54, 26);
  rect(d, BRASS, 51, -33, 52, 2);
  rect(d, 0x8a5a34, 54, -28, 46, 1);
  for (let x = 58; x < 100; x += 10) rect(d, 0x9a6a3a, x, -26, 6, 14);
  p.text(77, -24, 'INFOS', { color: '#ffe08a', font: 'small', depth: 17, ox: 0.5 });
  rect(d, BRASS, 92, -38, 5, 3);
  rect(d, INK, 94, -39, 1, 1);
  // portes d'entrée vitrées
  const e = p.g(2);
  box(e, BRASS, 206, -48, 26, 44);
  rect(e, 0xbfe8f2, 208, -46, 10, 40);
  rect(e, 0xbfe8f2, 220, -46, 10, 40);
  rect(e, 0xffffff, 210, -44, 1, 10);
  rect(e, 0xffffff, 222, -44, 1, 10);
  rect(e, INK, 218, -46, 2, 40);
  p.text(219, -56, 'ENTREE', { color: '#2b2238', shadow: null, font: 'small', depth: 3, ox: 0.5 });
  // plantes
  p.img(122, -4, 'room-fern', 15, 0.5, 1).setDepth(15);
  // lustres
  p.shade(ROOM_X0, top + 11, ROOM_W, LOBBY_H - 11);
  for (const lx of [72, 160]) {
    p.img(lx, top + 11, 'room-lamp', 5, 0.5, 0);
    p.glow(lx, top + 20, 16);
  }
  drawOuterWall(p, top, LOBBY_H, night);
}

// --------------------------------------------------------------------- chantier

export interface BuildSlotInfo {
  comingSoon: boolean;
  canBuild: boolean;
  biomeName: string;
  biomeSign: string;
  reqText: string;
}

export function drawBuildSlot(p: Painter, top: number, info: BuildSlotInfo, night: number): void {
  drawShaft(p, top, FLOOR_H, null);
  drawBanner(p, top, info.comingSoon ? `BIENTOT : ${info.biomeSign}` : 'CHANTIER', info.comingSoon ? BANNER_COLORS.soon : BANNER_COLORS.build);
  const g = p.g(1);
  // béton et briques apparentes
  rect(g, 0xb8b4c4, ROOM_X0, top + 11, ROOM_W, 85);
  for (let i = 0; i < 30; i++) {
    const x = ROOM_X0 + Math.floor(hash01(i * 3 + top) * (ROOM_W - 10));
    const y = top + 14 + Math.floor(hash01(i * 7 + top) * 60);
    rect(g, 0xa8a4b8, x, y, 8, 3);
    rect(g, 0x9894a8, x, y + 3, 8, 1);
  }
  rect(g, 0x8a8498, ROOM_X0, top + 88, ROOM_W, 8);
  rect(g, INK, ROOM_X0, top + 95, ROOM_W, 1);
  drawOuterWall(p, top, FLOOR_H, night);

  if (info.comingSoon) {
    // bâche orange comme sur les chantiers
    const t = p.g(6);
    rect(t, INK, ROOM_X0 + 4, top + 14, ROOM_W - 8, 72);
    rect(t, 0xf08a3a, ROOM_X0 + 5, top + 15, ROOM_W - 10, 70);
    for (let x = ROOM_X0 + 10; x < ROOM_X1 - 8; x += 12) rect(t, 0xe07a2a, x, top + 15, 2, 70);
    const cx = ROOM_X0 + ROOM_W / 2;
    const cy = top + 48;
    for (let k = 0; k < 16; k++) {
      rect(t, 0xffc070, cx - k, cy - 16 + k, 2 * k + 1, 1);
      rect(t, 0xffc070, cx - (15 - k), cy + k, 2 * (15 - k) + 1, 1);
    }
    p.text(cx, cy - 3, info.biomeName, { color: '#ffffff', depth: 7, ox: 0.5 });
    return;
  }
  // piliers de béton, porte, plan au mur
  const s = p.g(2);
  for (const px of [ROOM_X0 + 10, ROOM_X1 - 22]) {
    box(s, 0xa8a4b8, px, top + 11, 12, 77);
    rect(s, 0xc8c4d4, px + 1, top + 11, 2, 76);
  }
  const doorX = ROOM_X0 + ROOM_W / 2 - 9;
  rect(s, INK, doorX, top + 50, 18, 38);
  rect(s, 0x1a1428, doorX + 1, top + 51, 16, 37);
  box(s, 0x2a6ad8, ROOM_X1 - 62, top + 26, 28, 18);
  s.lineStyle(1, 0xbfe0ff, 1).strokeRect(ROOM_X1 - 58, top + 30, 12, 8).strokeRect(ROOM_X1 - 46, top + 33, 8, 5);
  // panneau d'information du chantier
  const bx = ROOM_X0 + 30;
  const by = top + 20;
  const reqW = Math.max(62, measureText(info.reqText, 'small') + 10);
  box(s, INK, bx, by, reqW, 24);
  rect(s, info.canBuild ? 0x3aa84a : 0xffc83a, bx + 1, by + 1, reqW - 2, 22);
  for (let x = bx + 1; x < bx + reqW - 1; x += 6) rect(s, INK, x, by + 1, 3, 2);
  p.text(bx + reqW / 2, by + 6, info.canBuild ? 'PRET !' : 'IL MANQUE', { color: '#2b2238', shadow: null, font: 'small', depth: 9, ox: 0.5 });
  p.text(bx + reqW / 2, by + 14, info.reqText, { color: '#2b2238', shadow: null, font: 'small', depth: 9, ox: 0.5 });
  // ouvriers et caisses
  p.floorShadow(ROOM_X0 + 30, top + 94, 16);
  p.img(ROOM_X0 + 30, top + 94, 'room-crate', 15, 0.5, 1);
  const w1 = p.sprite(ROOM_X0 + 62, top + 94, 'worker-0', 16);
  const w2 = p.sprite(ROOM_X1 - 44, top + 94, 'worker-1', 16);
  p.scene.tweens.add({ targets: w1, x: w1.x + 30, yoyo: true, repeat: -1, duration: 3500, ease: 'Sine.easeInOut' });
  p.every(350, () => w1.active && w1.setFrame(1 + (Math.floor(p.scene.time.now / 350) % 2)));
  p.scene.tweens.add({ targets: w2, y: w2.y - 1, yoyo: true, repeat: -1, duration: 500, delay: 200 });
}

// -------------------------------------------------------------------------- toit

export interface RoofInfo {
  /** Texte du grand panneau (prix du prochain étage) ou null pour l'enseigne. */
  price: number | null;
  name: string;
  canBuild: boolean;
}

/** Toit : dalle béton, piliers, filet de sécurité, cabanon, panneau du chantier et grue. */
export function drawRoof(p: Painter, top: number, info: RoofInfo, night: number): void {
  const deck = top + 40;
  const g = p.g(2);
  // dalle
  rect(g, INK, 0, deck, GAME_W, 10);
  rect(g, 0xb8b4c4, 0, deck + 1, GAME_W, 8);
  rect(g, 0xd8d4e0, 0, deck + 1, GAME_W, 2);
  rect(g, 0x9894a8, 0, deck + 7, GAME_W, 2);
  // cage d'ascenseur qui dépasse
  rect(g, INK, 0, top + 16, SHAFT_W + 1, deck - top - 15);
  rect(g, 0x57506f, 0, top + 17, SHAFT_W, deck - top - 17);
  rect(g, 0x5fc0e0, 6, top + 22, 22, deck - top - 22, 0.9);
  rect(g, BRASS, 2, top + 17, 30, 3);
  // cabanon d'accès avec porte bleue
  box(g, 0xc8c4d4, 38, top + 8, 30, 32);
  rect(g, 0xe0dcea, 39, top + 9, 28, 2);
  box(g, 0x4a8ad8, 45, top + 18, 14, 22);
  rect(g, 0x7ab0f0, 46, top + 19, 2, 20);
  rect(g, 0xffffff, 55, top + 29, 2, 2);
  // filet de sécurité rouge entre des piliers de béton
  for (let x = 70; x < GAME_W; x += 2) {
    for (let y = deck - 12; y < deck; y += 2) rect(g, 0xd8403a, x + ((y / 2) % 2), y, 1, 1);
  }
  rect(g, 0xa82a2a, 70, deck - 12, GAME_W - 70, 1);
  for (const px of [70, 108, 146, 184, 222]) {
    box(g, 0xa8a4b8, px, deck - 18, 11, 18);
    rect(g, 0xc8c4d4, px + 1, deck - 17, 9, 2);
  }
  // accessoires : caisse, casque, boîte à outils
  box(g, 0xc8964a, 196, deck - 11, 16, 11);
  rect(g, 0xd83a2a, 203, deck - 10, 2, 9);
  rect(g, INK, 200, deck - 14, 9, 3);
  rect(g, 0xffc83a, 201, deck - 14, 7, 2);
  box(g, 0x3aa84a, 160, deck - 7, 14, 7);
  rect(g, INK, 165, deck - 9, 4, 2);

  // grand panneau : prix du prochain étage, ou enseigne
  const sx = 84;
  const sw = 104;
  const sy = top - 22;
  rect(g, 0x9a7040, sx + 18, sy + 30, 4, deck - sy - 30);
  rect(g, 0x9a7040, sx + sw - 22, sy + 30, 4, deck - sy - 30);
  if (info.price !== null) {
    rect(g, INK, sx, sy, sw, 31);
    rect(g, 0xffffff, sx + 1, sy + 1, sw - 2, 29);
    rect(g, info.canBuild ? 0x2a6ad8 : 0x6a6690, sx + 3, sy + 3, sw - 6, 25);
    p.text(sx + sw / 2, sy + 6, 'CONSTRUIRE', { color: '#ffffff', depth: 4, ox: 0.5 });
    const label = info.price.toLocaleString('fr-FR').replace(/\s/g, ' ');
    const t = p.text(sx + sw / 2 + 5, sy + 17, label, { color: '#ffffff', depth: 4, ox: 0.5 });
    p.img(t.x - t.width / 2 - 6, sy + 20, 'coin', 4);
  } else {
    box(g, 0xff7a5a, sx, sy + 4, sw, 25);
    rect(g, 0xffa080, sx + 2, sy + 6, sw - 4, 1);
    p.text(sx + sw / 2, sy + 12, info.name, { color: '#ffffff', shadow: '#a0402a', depth: 4, ox: 0.5 });
    if (night > 0.3) p.glow(sx + sw / 2, sy + 16, 40, '#ffb090', 3);
  }
  // antenne clignotante
  rect(g, INK, 232, top - 10, 1, 50);
  const beacon = p.scene.add.rectangle(232, top - 11, 3, 3, 0xff4a4a).setDepth(4);
  p.objs.push(beacon);
  p.scene.tweens.add({ targets: beacon, alpha: 0.15, yoyo: true, repeat: -1, duration: 700 });
  // grue avec crochet qui se balance
  if (info.price !== null) {
    const c = p.g(1);
    const cx = 212;
    const craneTop = top - 70;
    for (let y = craneTop; y < deck; y++) {
      rect(c, 0xff9a2a, cx, y, 1, 1);
      rect(c, 0xff9a2a, cx + 9, y, 1, 1);
      if ((y - craneTop) % 10 === 0) rect(c, 0xff9a2a, cx, y, 10, 1);
      const k = (y - craneTop) % 10;
      rect(c, 0xd8781a, cx + k, y, 1, 1);
    }
    rect(c, INK, cx - 150, craneTop - 1, 175, 5);
    rect(c, 0xff9a2a, cx - 149, craneTop, 173, 3);
    for (let x = cx - 148; x < cx + 22; x += 5) rect(c, 0xd8781a, x, craneTop + 1, 2, 1);
    box(c, 0x3a3654, cx + 12, craneTop + 3, 12, 8);
    const hook = p.scene.add.container(cx - 110, craneTop + 3).setDepth(1);
    const cable = p.scene.add.rectangle(0, 0, 1, 26, INK).setOrigin(0.5, 0);
    const ball = p.scene.add.rectangle(0, 26, 5, 5, 0x3a3654).setOrigin(0.5, 0);
    const hk = p.scene.add.rectangle(0, 31, 2, 4, INK).setOrigin(0.5, 0);
    hook.add([cable, ball, hk]);
    p.objs.push(hook);
    p.scene.tweens.add({ targets: hook, angle: { from: -6, to: 6 }, yoyo: true, repeat: -1, duration: 1800, ease: 'Sine.easeInOut' });
  }
}

// -------------------------------------------------------------------------- rue

export function drawStreet(p: Painter): Phaser.GameObjects.Rectangle {
  const g = p.g(1);
  rect(g, 0xd0c8d8, 0, 0, GAME_W, 9);
  for (let x = 0; x < GAME_W; x += 12) rect(g, 0xb8b0c8, x, 0, 1, 8);
  rect(g, 0xe8e0f0, 0, 0, GAME_W, 1);
  rect(g, 0x8a8498, 0, 9, GAME_W, 2);
  rect(g, 0x4a4658, 0, 11, GAME_W, STREET_H + 80);
  for (let x = 6; x < GAME_W; x += 24) rect(g, 0xe8e0a0, x, 22, 12, 2);
  // voile nocturne sur la rue
  const shade = p.scene.add.rectangle(0, 0, GAME_W, STREET_H + 80, 0x0a0820, 0).setOrigin(0).setDepth(1.5);
  p.objs.push(shade);
  return shade;
}
