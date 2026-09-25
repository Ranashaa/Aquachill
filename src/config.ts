// Constantes globales du jeu. Toutes les dimensions sont en pixels « logiques ».

/** Résolution logique (portrait 9:16), agrandie à l'écran en pixels nets. */
export const GAME_W = 180;
export const GAME_H = 320;

/** Hauteur réservée par l'interface HTML (barre du haut / du bas), en pixels logiques. */
export const HUD_TOP = 22;
export const HUD_BOTTOM = 30;

/** Géométrie de la tour. */
export const FLOOR_H = 64;
export const LOBBY_H = 72;
export const STREET_H = 28;
export const SHAFT_X = 146; // début de la cage d'ascenseur
export const SHAFT_W = 30;

/** Aquariums. */
export const TANK_SLOTS = 6;
export const TANK_CAPACITY = 6;
export const ALGAE_COLS = 10;
export const ALGAE_ROWS = 8;
/** Temps (s) pour qu'une vitre propre devienne totalement sale. */
export const ALGAE_FULL_SECONDS = 30 * 60;

/** Absence : on simule au plus 2 h. */
export const OFFLINE_CAP_SECONDS = 2 * 3600;

/** Pièces : ramassage automatique au bout de N secondes. */
export const DROP_AUTO_COLLECT = 25;

export const SAVE_KEY = 'aquachill.save';
