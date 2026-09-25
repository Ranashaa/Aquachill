// Constantes globales du jeu. Toutes les dimensions sont en pixels « logiques ».

/** Résolution logique (portrait 9:16), agrandie à l'écran en pixels nets. */
export const GAME_W = 240;
export const GAME_H = 427;
/** Largeur de référence de l'interface HTML (unité CSS --px = largeur écran / UI_W). */
export const UI_W = 180;

/** Hauteur réservée par l'interface HTML (barre du haut / du bas), en pixels logiques. */
export const HUD_TOP = 30;
export const HUD_BOTTOM = 40;

/** Géométrie de la tour. */
export const FLOOR_H = 96;
export const LOBBY_H = 112;
export const STREET_H = 34;
/** Colonne d'eau de l'ascenseur-bulle, à gauche de la tour. */
export const SHAFT_X = 0;
export const SHAFT_W = 34;
/** Bords intérieurs des pièces. */
export const ROOM_X0 = SHAFT_W;
export const ROOM_X1 = GAME_W - 8;

/** Aquariums. */
export const TANK_SLOTS = 6;
export const TANK_CAPACITY = 8;
export const ALGAE_COLS = 10;
export const ALGAE_ROWS = 8;
/** Temps (s) pour qu'une vitre propre devienne totalement sale. */
export const ALGAE_FULL_SECONDS = 30 * 60;

/** Absence : on simule au plus 2 h. */
export const OFFLINE_CAP_SECONDS = 2 * 3600;

/** Pièces : ramassage automatique au bout de N secondes. */
export const DROP_AUTO_COLLECT = 8;

export const SAVE_KEY = 'aquachill.save';
