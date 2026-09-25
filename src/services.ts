import type Phaser from 'phaser';
import type { AudioEngine } from './audio/AudioEngine';
import type { Sim } from './systems/Sim';
import type { UI } from './ui/UI';

/** Services partagés entre scènes et interface, initialisés dans main.ts. */
export const services = {} as {
  game: Phaser.Game;
  sim: Sim;
  audio: AudioEngine;
  ui: UI;
};
