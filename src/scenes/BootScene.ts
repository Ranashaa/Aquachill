import Phaser from 'phaser';
import { DECOR_LIST } from '../data/decor';
import { SPECIES } from '../data/species';
import { STARS } from '../data/stars';
import { decorKey, fishKey, generateTextures, starKey, visitorKey } from '../sprites';
import { SPRITE_OVERRIDES } from '../sprites/overrides';
import { spriteCanvasSize, spriteUrl } from '../sprites/SpriteFactory';
import { h } from '../ui/dom';
import { VISITOR_LOOKS } from '../systems/visitors';
import { UI_SPRITES } from '../sprites/defs/ui';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    for (const [key, o] of Object.entries(SPRITE_OVERRIDES)) {
      if (o.frameWidth) {
        this.load.spritesheet(key, o.url, { frameWidth: o.frameWidth, frameHeight: o.frameHeight ?? o.frameWidth });
      } else {
        this.load.image(key, o.url);
      }
    }
  }

  create(): void {
    generateTextures(this.textures);
    if (new URLSearchParams(location.search).has('gallery')) {
      showGallery();
      return;
    }
    this.scene.start('Tower');
  }
}

/** Page de test visuelle : `?gallery` affiche tous les sprites générés. */
function showGallery(): void {
  const keys = [
    ...SPECIES.map((s) => [fishKey(s.id), s.name] as const),
    ...SPECIES.map((s) => [`${fishKey(s.id)}-sil`, 'silhouette'] as const),
    ...DECOR_LIST.map((d) => [decorKey(d.id), d.name] as const),
    ...Array.from({ length: VISITOR_LOOKS }, (_, i) => [visitorKey(i), `visiteur ${i}`] as const),
    ...STARS.map((s) => [starKey(s.id), s.name] as const),
    ...Object.keys(UI_SPRITES).map((k) => [k, k] as const),
  ];
  const grid = h('div', { class: 'gallery' });
  for (const [key, label] of keys) {
    const { w, h: hh } = spriteCanvasSize(key);
    const frames = key.startsWith('fish-') && !key.endsWith('sil') ? [0, 1] : key.startsWith('visitor') || key.startsWith('star-') ? [0, 1, 2] : [0];
    grid.append(
      h('figure', null,
        ...frames.map((f) => h('img', { src: spriteUrl(key, f), style: `width:${w * 4}px;height:${hh * 4}px` })),
        label),
    );
  }
  document.getElementById('ui')!.replaceChildren(grid);
}
