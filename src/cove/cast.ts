// Le soigneur et les habitants de la crique : apparence et place dans le monde.
import type { ActorSpec } from './actors';
import type { Npc } from './dialogue';

export type CastId = 'player' | Npc;

export const LOOKS: Record<Npc, ActorSpec> = {
  marcel: { skin: '#e8b48c', hair: '#c8c8d0', hairStyle: 'short', shirt: '#e0a040', pants: '#4a4a5e', shoes: '#3a2a20', cap: '#2e4e86', beard: '#dcdce4' },
  lila: { skin: '#a8704a', hair: '#2a1a1e', hairStyle: 'bun', shirt: '#ff7ab0', pants: '#ff7ab0', shoes: '#ffffff', dress: true },
  gobie: { skin: '#f6d6b8', hair: '#e8c060', hairStyle: 'long', shirt: '#f4f4f0', pants: '#4a5a80', shoes: '#6a3a2a', glasses: true },
  nina: { skin: '#fbdcc0', hair: '#7a5ac8', hairStyle: 'bob', shirt: '#44c4b8', pants: '#2a2a3a', shoes: '#f0f0f0', strap: '#2a2a34' },
  elio: { skin: '#d8a070', hair: '#4a2a1a', hairStyle: 'spiky', shirt: '#f4ece0', pants: '#6a4a3a', shoes: '#3a2a20', pin: ['#d60270', '#9b4f96', '#0038a8'] },
  maelle: { skin: '#f8d0b0', hair: '#d8562a', hairStyle: 'short', shirt: '#e83a3a', pants: '#2a3a5a', shoes: '#f0f0f0', pin: ['#d62900', '#ffffff', '#d462a6'] },
  yanis: { skin: '#7a4a2e', hair: '#1a1014', hairStyle: 'bob', shirt: '#3a6ad0', pants: '#3a2a2a', shoes: '#8a5a34', strap: '#8a5a34', pin: ['#078d70', '#ffffff', '#3d1a78'] },
  camille: { skin: '#e8c098', hair: '#e0e0ea', hairStyle: 'long', shirt: '#2a3a6a', pants: '#2a2a3a', shoes: '#4a3a2a', glasses: true, pin: ['#ff218c', '#ffd800', '#21b1ff'] },
};

/** Où chacun passe sa journée dans la crique (en tuiles) et vers où il regarde. */
export const SPOTS: Record<Npc, { x: number; y: number; dir: 'down' | 'right' | 'up' | 'left'; roam: number }> = {
  marcel: { x: 16.5, y: 42, dir: 'down', roam: 0 },
  lila: { x: 8, y: 32, dir: 'down', roam: 3 },
  gobie: { x: 20, y: 13.4, dir: 'right', roam: 1.5 },
  nina: { x: 24.5, y: 22.5, dir: 'down', roam: 1.5 },
  elio: { x: 22.5, y: 31.4, dir: 'down', roam: 1 },
  maelle: { x: 18.6, y: 35.2, dir: 'down', roam: 1 },
  yanis: { x: 18.4, y: 26.4, dir: 'down', roam: 0 },
  camille: { x: 31.5, y: 32.4, dir: 'down', roam: 1 },
};
