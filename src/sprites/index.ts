import type Phaser from 'phaser';
import type { DecorId } from '../data/decor';
import type { SpeciesId } from '../data/species';
import type { StarId } from '../data/stars';
import { DECOR_SPRITES } from './defs/decor';
import { FISH_SPRITES } from './defs/fish';
import { personFrames, STAR_SPECS, visitorLooks } from './defs/people';
import { ROOM_SPRITES } from './defs/room';
import { UI_SPRITES } from './defs/ui';
import { drawText, fontHeight, measureText, type FontId } from './font';
import {
  defToCanvas, fishSecondFrame, registerDef, registerFrames, registerSilhouette,
} from './SpriteFactory';

export const fishKey = (id: SpeciesId) => `fish-${id}`;
export const decorKey = (id: DecorId) => `decor-${id}`;
export const visitorKey = (look: number) => `visitor-${look}`;
export const starKey = (id: StarId) => `star-${id}`;

/** Génère toutes les textures pixel art du jeu. */
export function generateTextures(textures: Phaser.Textures.TextureManager): void {
  for (const [id, def] of Object.entries(FISH_SPRITES)) {
    const key = fishKey(id as SpeciesId);
    registerDef(textures, key, def, fishSecondFrame(def));
    registerSilhouette(key, def, '#3a3656');
  }
  for (const [id, def] of Object.entries(DECOR_SPRITES)) registerDef(textures, decorKey(id as DecorId), def);
  visitorLooks().forEach((spec, i) => registerDef(textures, visitorKey(i), ...personFrames(spec)));
  for (const [id, spec] of Object.entries(STAR_SPECS)) {
    const frames = personFrames(spec);
    registerDef(textures, starKey(id as StarId), ...frames);
    registerSilhouette(starKey(id as StarId), frames[0], '#3a3656');
  }
  for (const [key, def] of Object.entries(UI_SPRITES)) registerDef(textures, key, def);
  for (const [key, def] of Object.entries(ROOM_SPRITES)) registerDef(textures, `room-${key}`, def);
  // ouvriers du chantier : casque jaune et gilet orange
  WORKERS.forEach((spec, i) => registerDef(textures, `worker-${i}`, ...personFrames(spec)));
}

const WORKERS = [
  { skin: '#f0c29a', hair: '#4a3222', hairStyle: 'cap' as const, cap: '#ffc83a', shirt: '#ff8a2a', pants: '#3a4a8a', shoes: '#6a3a2a' },
  { skin: '#a8704a', hair: '#23191a', hairStyle: 'cap' as const, cap: '#ffc83a', shirt: '#ff8a2a', pants: '#3a4a8a', shoes: '#2b2238' },
];

/** Texture de texte pixel (mise en cache par contenu, couleur et police). */
export function textTexture(
  textures: Phaser.Textures.TextureManager,
  text: string,
  color = '#ffffff',
  shadow: string | null = '#2b2238',
  font: FontId = 'big',
): string {
  const key = `txt:${font}:${color}:${shadow}:${text}`;
  if (textures.exists(key)) return key;
  const w = Math.max(1, measureText(text, font) + (shadow ? 1 : 0));
  const h = fontHeight(font) + (shadow ? 1 : 0);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  if (shadow) drawText(ctx, text, 1, 1, shadow, font);
  drawText(ctx, text, 0, 0, color, font);
  registerFrames(textures, key, [canvas]);
  return key;
}

export { defToCanvas };
