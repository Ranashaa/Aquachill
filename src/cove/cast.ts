// Le soigneur et les habitués de la crique : apparence et place dans le monde.
import type { ActorSpec } from './actors';

export type CastId = 'player' | 'marcel' | 'lila' | 'gobie' | 'nina';

export const LOOKS: Record<CastId, ActorSpec> = {
  player: { skin: '#f2c8a0', hair: '#7a4a2a', hairStyle: 'short', shirt: '#3ab0b8', pants: '#3a4a6e', shoes: '#5a3a2a', strap: '#8a5a34' },
  marcel: { skin: '#e8b48c', hair: '#c8c8d0', hairStyle: 'short', shirt: '#e0a040', pants: '#4a4a5e', shoes: '#3a2a20', cap: '#2e4e86', beard: '#dcdce4' },
  lila: { skin: '#a8704a', hair: '#2a1a1e', hairStyle: 'bun', shirt: '#ff7ab0', pants: '#ff7ab0', shoes: '#ffffff', dress: true },
  gobie: { skin: '#f6d6b8', hair: '#e8c060', hairStyle: 'long', shirt: '#f4f4f0', pants: '#4a5a80', shoes: '#6a3a2a', glasses: true },
  nina: { skin: '#fbdcc0', hair: '#7a5ac8', hairStyle: 'bob', shirt: '#44c4b8', pants: '#2a2a3a', shoes: '#f0f0f0', strap: '#2a2a34' },
};

/** Où chacun passe sa journée dans la crique (en tuiles) et vers où il regarde. */
export const SPOTS: Record<Exclude<CastId, 'player'>, { x: number; y: number; dir: 'down' | 'right' | 'up' | 'left'; roam: number }> = {
  marcel: { x: 16.5, y: 42, dir: 'down', roam: 0 },
  lila: { x: 8, y: 32, dir: 'down', roam: 3 },
  gobie: { x: 20, y: 13.4, dir: 'right', roam: 1.5 },
  nina: { x: 31.5, y: 31.5, dir: 'down', roam: 1 },
};
