import { SAVE_KEY } from '../config';
import { createNewState, SAVE_VERSION, type GameState } from './GameState';

/** Migrations successives : MIGRATIONS[n] transforme une sauvegarde v(n) en v(n+1). */
const MIGRATIONS: Record<number, (data: any) => any> = {};

export function migrate(data: any): GameState {
  let version = typeof data?.version === 'number' ? data.version : 0;
  let out = data;
  while (version < SAVE_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) throw new Error(`Pas de migration depuis la version ${version}`);
    out = step(out);
    version++;
    out.version = version;
  }
  // Complète les champs manquants avec les valeurs par défaut (tolérance aux anciennes sauvegardes).
  const defaults = createNewState(out.savedAt ?? Date.now());
  return {
    ...defaults,
    ...out,
    settings: { ...defaults.settings, ...out.settings },
    stats: { ...defaults.stats, ...out.stats },
  };
}

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function loadGame(): GameState | null {
  const raw = storage()?.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    return migrate(JSON.parse(raw));
  } catch (err) {
    console.warn('Sauvegarde illisible, nouvelle partie.', err);
    return null;
  }
}

export function saveGame(state: GameState, now = Date.now()): void {
  state.savedAt = now;
  try {
    storage()?.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Impossible de sauvegarder.', err);
  }
}

export function clearSave(): void {
  try {
    storage()?.removeItem(SAVE_KEY);
  } catch {
    /* rien */
  }
}
