import type Phaser from 'phaser';
import type { DecorId } from '../data/decor';
import type { SpeciesId } from '../data/species';
import type { StarId } from '../data/stars';
import { DECOR_SPRITES } from './defs/decor';
import { FISH_SPRITES } from './defs/fish';
import { personFrames, STAR_SPECS, visitorLooks } from './defs/people';
import { UI_SPRITES } from './defs/ui';
import { drawText, GLYPH_H, measureText } from './font';
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
}

/** Texture de texte pixel (mise en cache par contenu et couleur). */
export function textTexture(
  textures: Phaser.Textures.TextureManager,
  text: string,
  color = '#ffffff',
  shadow: string | null = '#3a3656',
): string {
  const key = `txt:${color}:${shadow}:${text}`;
  if (textures.exists(key)) return key;
  const w = Math.max(1, measureText(text) + (shadow ? 1 : 0));
  const h = GLYPH_H + (shadow ? 1 : 0);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  if (shadow) drawText(ctx, text, 1, 1, shadow);
  drawText(ctx, text, 0, 0, color);
  registerFrames(textures, key, [canvas]);
  return key;
}

export { defToCanvas };
