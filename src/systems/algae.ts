import { ALGAE_COLS, ALGAE_FULL_SECONDS, ALGAE_ROWS } from '../config';
import { DECOR } from '../data/decor';
import type { FloorState } from '../state/GameState';
import { hash01 } from './rng';

/**
 * Les plantes concurrencent les algues pour les nutriments : chaque plante
 * ralentit la pousse de 10 % (jusqu'à 30 %).
 */
export function algaeGrowthFactor(floor: FloorState): number {
  const plants = floor.slots.filter((id) => id && DECOR[id].tags.includes('plants')).length;
  return 1 - Math.min(0.3, plants * 0.1);
}

/** Fait pousser les algues de `dt` secondes. Chaque cellule a sa propre vitesse. */
export function growAlgae(floor: FloorState, dt: number, floorIndex = 0): void {
  const base = (dt / ALGAE_FULL_SECONDS) * algaeGrowthFactor(floor);
  for (let i = 0; i < floor.algae.length; i++) {
    const row = Math.floor(i / ALGAE_COLS);
    // Les coins et le bas de la vitre se salissent un peu plus vite.
    const edge = row === ALGAE_ROWS - 1 || i % ALGAE_COLS === 0 || i % ALGAE_COLS === ALGAE_COLS - 1 ? 1.25 : 1;
    const speed = (0.55 + 0.9 * hash01(i * 31 + floorIndex * 977)) * edge;
    floor.algae[i] = Math.min(1, floor.algae[i] + base * speed);
  }
}

/** Propreté moyenne : 1 = vitre impeccable, 0 = couverte d'algues. */
export function cleanliness(floor: FloorState): number {
  if (floor.algae.length === 0) return 1;
  const dirt = floor.algae.reduce((a, b) => a + b, 0) / floor.algae.length;
  return 1 - dirt;
}

/**
 * Frotte la vitre autour du point (u, v) exprimé en coordonnées normalisées [0,1].
 * Retourne la quantité d'algues retirée.
 */
export function scrub(floor: FloorState, u: number, v: number, radius = 0.12, strength = 0.5): number {
  let removed = 0;
  for (let row = 0; row < ALGAE_ROWS; row++) {
    for (let col = 0; col < ALGAE_COLS; col++) {
      const cu = (col + 0.5) / ALGAE_COLS;
      const cv = (row + 0.5) / ALGAE_ROWS;
      const dist = Math.hypot(cu - u, (cv - v) * 0.8);
      if (dist > radius) continue;
      const i = row * ALGAE_COLS + col;
      const before = floor.algae[i];
      const amount = strength * (1 - dist / radius) + 0.15;
      floor.algae[i] = Math.max(0, before - amount);
      removed += before - floor.algae[i];
    }
  }
  return removed;
}
