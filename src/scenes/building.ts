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
const SLAB_LIGHT = 0x5a5478;
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

export function drawBanner(p: Painter, top: number, title: string, color = '#ffffff'): void {
  const g = p.g(3);
  rect(g, SLAB, ROOM_X0, top, GAME_W - ROOM_X0, 11);
  rect(g, SLAB_LIGHT, ROOM_X0, top, GAME_W - ROOM_X0, 1);
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
  const wains = a.y1 - 26;
  rect(g, 0xe6f4f7, a.x0, a.y0, w, a.y1 - a.y0);
  for (let y = a.y0 + 5; y < wains - 2; y += 6) rect(g, 0xd4ebf0, a.x0, y, w, 1);
  for (let x = a.x0; x < a.x1; x++) rect(g, 0x9fd4e4, x, wains - 6 + Math.round(Math.sin(x / 5) * 1.5), 1, 2);
  rect(g, 0x6fa8c0, a.x0, wains, w, 26);
  for (let x = a.x0 + 3; x < a.x1; x += 6) rect(g, 0x5a90a8, x, wains + 1, 1, 25);
  rect(g, 0xf4fbfc, a.x0, wains, w, 1);
  rect(g, INK, a.x0, wains - 1, w, 1);
  rect(g, 0xc89a6a, a.x0, a.y1, w, 8);
  for (let x = a.x0; x < a.x1; x += 14) rect(g, 0xa87a4a, x + ((x / 14) % 2) * 7, a.y1 + 2, 1, 5);
  rect(g, 0xe0b88a, a.x0, a.y1, w, 1);
}

function drawAmazonWall(g: Phaser.GameObjects.Graphics, a: Area) {
  const w = a.x1 - a.x0;
  const glassH = 22;
  rect(g, 0xcfeede, a.x0, a.y0, w, glassH);
  for (let x = a.x0; x < a.x1; x += 16) rect(g, 0x5a7a3a, x, a.y0, 2, glassH);
  rect(g, 0x5a7a3a, a.x0, a.y0 + 10, w, 1);
  rect(g, 0xffffff, a.x0 + 6, a.y0 + 2, 1, 6, 0.6);
  const py = a.y0 + glassH;
  for (let x = a.x0; x < a.x1; x += 6) rect(g, (x / 6) % 2 ? 0xb8905a : 0xa88050, x, py, 6, a.y1 - py);
  for (let x = a.x0; x < a.x1; x += 6) rect(g, 0x8a6a3a, x, py + Math.floor(hash01(x) * (a.y1 - py - 4)), 6, 1);
  rect(g, 0x5a7a3a, a.x0, py - 1, w, 2);
  rect(g, 0x8a6a3a, a.x0, a.y1, w, 8);
  for (let x = a.x0; x < a.x1; x += 11) rect(g, 0x6a4a2a, x, a.y1 + 3, 6, 1);
  rect(g, 0xa8885a, a.x0, a.y1, w, 1);
}

function drawKoiWall(g: Phaser.GameObjects.Graphics, a: Area) {
  const w = a.x1 - a.x0;
  const wains = a.y1 - 22;
  rect(g, 0xf6eedc, a.x0, a.y0, w, wains - a.y0);
  for (let x = a.x0; x < a.x1; x += 14) rect(g, 0x8a6a4a, x, a.y0, 1, wains - a.y0);
  for (let y = a.y0 + 11; y < wains; y += 11) rect(g, 0x8a6a4a, a.x0, y, w, 1);
  rect(g, 0x5a3a22, a.x0, a.y0, w, 3);
  for (let x = a.x0; x < a.x1; x += 56) rect(g, 0x5a3a22, x, a.y0, 3, a.y1 - a.y0);
  rect(g, 0x8a5a34, a.x0, wains, w, 22);
  rect(g, 0x6a4424, a.x0, wains, w, 1);
  rect(g, 0xd0cc90, a.x0, a.y1, w, 8);
  for (let x = a.x0; x < a.x1; x += 32) rect(g, 0x5a6a3a, x, a.y1, 1, 8);
  rect(g, 0x5a6a3a, a.x0, a.y1, w, 1);
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
    p.img(lx, top + 11, theme.lamp, 5, 0.5, 0);
    p.glow(lx, top + 18, 12);
  }

  // mobilier thématique (côtés gauche et droit)
  const L = ROOM_X0 + 15;
  const R = ROOM_X1 - 14;
  if (biome === 'reef') {
    p.img(L, top + 36, 'room-porthole', 2);
    p.img(R, top + 14, 'room-net', 2, 0.5, 0);
    p.img(R, top + 50, 'room-lifebuoy', 2);
    p.img(ROOM_X1 - 2, top + 94, 'room-bench', 15, 1, 1);
  } else if (biome === 'amazon') {
    for (let x = ROOM_X0; x < ROOM_X1; x += 40) p.img(x, top + 11, 'room-vines', 6, 0, 0);
    p.img(L, top + 30, 'room-butterfly', 2);
    p.img(L, top + 94, 'room-fern', 15, 0.5, 1);
    p.img(R, top + 46, 'room-toucan', 2);
    p.img(R, top + 94, 'room-crate', 15, 0.5, 1);
  } else {
    p.img(L, top + 16, 'room-scroll', 2, 0.5, 0);
    const st = p.g(15);
    box(st, 0x5a3a22, L - 9, top + 80, 18, 14);
    p.img(L, top + 81, 'room-bonsai', 15, 0.5, 1);
    p.img(R, top + 94, 'room-bamboo', 15, 0.5, 1);
  }
  drawOuterWall(p, top, FLOOR_H, night);
  return r;
}

// ------------------------------------------------------------------------ hall

export function drawLobby(p: Painter, night: number): void {
  const top = -LOBBY_H;
  drawShaft(p, top, LOBBY_H, 'RDC');
  drawBanner(p, top, 'ACCUEIL', '#ffe08a');
  const g = p.g(1);
  // mur en marbre
  rect(g, 0xf6ecdc, ROOM_X0, top + 11, ROOM_W, LOBBY_H - 11);
  for (let i = 0; i < 40; i++) {
    const x = ROOM_X0 + Math.floor(hash01(i * 7) * ROOM_W);
    const y = top + 14 + Math.floor(hash01(i * 13) * 70);
    rect(g, 0xe8dcc6, x, y, 3 + Math.floor(hash01(i) * 5), 1);
  }
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
  drawBanner(p, top, info.comingSoon ? `BIENTOT : ${info.biomeSign}` : 'NOUVEL ETAGE', info.comingSoon ? '#ffb070' : '#ffe08a');
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
  // échafaudage
  const s = p.g(2);
  for (let x = ROOM_X0 + 8; x < ROOM_X1; x += 38) rect(s, 0xd8a040, x, top + 11, 2, 77);
  for (let y = top + 30; y < top + 88; y += 26) rect(s, 0xd8a040, ROOM_X0, y, ROOM_W, 2);
  // ouvriers et caisses
  p.img(ROOM_X0 + 26, top + 94, 'room-crate', 15, 0.5, 1);
  const w1 = p.sprite(ROOM_X0 + 50, top + 94, 'worker-0', 16);
  const w2 = p.sprite(ROOM_X1 - 30, top + 94, 'worker-1', 16);
  p.scene.tweens.add({ targets: w1, y: w1.y - 1, yoyo: true, repeat: -1, duration: 400 });
  p.scene.tweens.add({ targets: w2, y: w2.y - 1, yoyo: true, repeat: -1, duration: 500, delay: 200 });
  // gros bouton
  const bx = ROOM_X0 + ROOM_W / 2 - 46;
  const by = top + 26;
  const b = p.g(8);
  const main = info.canBuild ? 0xff7a3a : 0x8a86a0;
  const light = info.canBuild ? 0xffa870 : 0xa8a4bc;
  const dark = info.canBuild ? 0xc0501a : 0x6a6680;
  rect(b, INK, bx, by, 92, 22);
  rect(b, main, bx + 1, by + 1, 90, 19);
  rect(b, light, bx + 2, by + 2, 88, 2);
  rect(b, dark, bx + 1, by + 18, 90, 2);
  p.text(bx + 46, by + 7, 'CONSTRUIRE', { color: '#ffffff', depth: 9, ox: 0.5 });
  const reqW = measureText(info.reqText, 'small') + 8;
  const plate = p.g(8);
  box(plate, 0x3a3654, bx + 46 - reqW / 2, by + 25, reqW, 9);
  p.text(bx + 46, by + 27, info.reqText, { color: info.canBuild ? '#9fef9f' : '#ffe08a', shadow: null, font: 'small', depth: 9, ox: 0.5 });
}

// -------------------------------------------------------------------------- toit

export function drawRoof(p: Painter, top: number, withCrane: boolean, night: number): void {
  const g = p.g(2);
  // dalle et parapet
  rect(g, INK, 0, top + 40, GAME_W, 10);
  rect(g, 0x6a6488, 0, top + 41, GAME_W, 8);
  rect(g, 0x8a84a8, 0, top + 41, GAME_W, 1);
  for (let x = 4; x < GAME_W; x += 16) rect(g, 0x5a5478, x, top + 44, 8, 3);
  // cage d'ascenseur qui dépasse
  rect(g, INK, 0, top + 18, SHAFT_W + 2, 23);
  rect(g, 0x57506f, 1, top + 19, SHAFT_W, 22);
  rect(g, 0x5fc0e0, 6, top + 24, 22, 17, 0.9);
  rect(g, BRASS, 3, top + 19, 30, 3);
  // enseigne lumineuse
  const sx = 78;
  const sw = 108;
  rect(g, INK, sx + 16, top + 30, 2, 11);
  rect(g, INK, sx + sw - 18, top + 30, 2, 11);
  box(g, 0xff7a5a, sx, top + 6, sw, 25);
  rect(g, 0xffa080, sx + 2, top + 8, sw - 4, 1);
  p.text(sx + sw / 2, top + 13, 'AQUACHILL', { color: '#ffffff', shadow: '#a0402a', depth: 4, ox: 0.5 });
  for (let x = sx + 3; x < sx + sw - 2; x += 5) {
    for (const y of [top + 4, top + 32]) {
      const bulb = p.scene.add.rectangle(x, y, 1, 1, 0xfff3a0).setDepth(4);
      p.objs.push(bulb);
      if (night > 0.3) p.scene.tweens.add({ targets: bulb, alpha: 0.2, yoyo: true, repeat: -1, duration: 500, delay: (x * 37) % 500 });
    }
  }
  if (night > 0.3) p.glow(sx + sw / 2, top + 18, 40, '#ffb090', 3);
  // antenne
  rect(g, INK, 222, top - 6, 1, 47);
  rect(g, INK, 218, top + 20, 9, 1);
  const beacon = p.scene.add.rectangle(222, top - 7, 3, 3, 0xff4a4a).setDepth(4);
  p.objs.push(beacon);
  p.scene.tweens.add({ targets: beacon, alpha: 0.15, yoyo: true, repeat: -1, duration: 700 });
  // grue du chantier
  if (withCrane) {
    const c = p.g(1);
    const cx = 196;
    for (let y = top - 60; y < top + 41; y += 1) {
      rect(c, 0xffb030, cx, y, 1, 1);
      rect(c, 0xffb030, cx + 7, y, 1, 1);
      if ((y - top) % 8 === 0) rect(c, 0xffb030, cx, y, 8, 1);
      if ((y - top + 4) % 8 === 0) for (let k = 0; k < 8; k++) rect(c, 0xd89020, cx + k, y + Math.floor(k / 2), 1, 1);
    }
    rect(c, 0xffb030, cx - 70, top - 62, 90, 3);
    for (let x = cx - 70; x < cx + 20; x += 6) rect(c, 0xd89020, x, top - 60, 3, 1);
    rect(c, 0x3a3654, cx + 10, top - 60, 8, 6);
    rect(c, INK, cx - 50, top - 59, 1, 30);
    box(c, 0xb07a4a, cx - 56, top - 30, 13, 8);
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
