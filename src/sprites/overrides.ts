// Remplacement des sprites générés par de vrais fichiers PNG.
//
// Pour remplacer un sprite, placez l'image dans `public/sprites/` et ajoutez une entrée :
//   'fish-clown': { url: 'sprites/clown.png', frameWidth: 13, frameHeight: 8 },
// La clé est celle de la texture générée (voir sprites/index.ts) : fish-<espèce>,
// decor-<objet>, visitor-<n>, star-<id>, coin, heart…
// Les images doivent garder les mêmes frames (poissons : 2 frames, visiteurs : 3).

export interface SpriteOverride {
  url: string;
  frameWidth?: number;
  frameHeight?: number;
}

export const SPRITE_OVERRIDES: Record<string, SpriteOverride> = {};
