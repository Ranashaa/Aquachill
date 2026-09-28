// Le jardin aquatique : de vraies boutures de coraux et de plantes, à cultiver
// dans les bacs au pied des aquariums, puis à récolter et expédier.
import type { BiomeId } from './biomes';

export type CropId =
  | 'zoanthus' | 'acropora' | 'champignon'
  | 'cabomba' | 'riccia' | 'echinodorus'
  | 'mousse' | 'lotus' | 'marimo';

export interface Crop {
  id: CropId;
  name: string;
  biome: BiomeId;
  /** Jours de soin avant la récolte. */
  days: number;
  seedPrice: number;
  sellPrice: number;
  /** Repousse après la récolte (sans racheter de bouture). */
  regrow: boolean;
  /** Couleurs de la pousse : principale, ombre, pointe. */
  colors: [string, string, string];
  fact: string;
}

export const CROPS: Record<CropId, Crop> = {
  zoanthus: {
    id: 'zoanthus', name: 'Zoanthes', biome: 'reef', days: 2, seedPrice: 10, sellPrice: 28, regrow: true,
    colors: ['#3fd0a0', '#1f8a6a', '#ffd23a'],
    fact: 'Cousins des anémones, les zoanthes vivent en colonies serrées : quelques polypes peuvent finir par couvrir tout un rocher.',
  },
  acropora: {
    id: 'acropora', name: 'Acropora', biome: 'reef', days: 3, seedPrice: 20, sellPrice: 55, regrow: false,
    colors: ['#8ab8ff', '#4a78c8', '#e0f0ff'],
    fact: 'C’est le grand bâtisseur des récifs. Des « jardiniers du corail » replantent ses boutures pour restaurer les récifs abîmés.',
  },
  champignon: {
    id: 'champignon', name: 'Corail champignon', biome: 'reef', days: 4, seedPrice: 35, sellPrice: 90, regrow: false,
    colors: ['#e05aa0', '#a03a78', '#ffb0d8'],
    fact: 'Ce corail sans squelette peut se décoller et se déplacer lentement pour trouver un meilleur coin.',
  },
  cabomba: {
    id: 'cabomba', name: 'Cabomba', biome: 'amazon', days: 2, seedPrice: 8, sellPrice: 22, regrow: true,
    colors: ['#6fcf5a', '#3f8f3a', '#b8f08a'],
    fact: 'Ses feuilles découpées en éventail lui donnent l’air d’une plume verte. Elle pousse vite et offre des cachettes aux alevins.',
  },
  riccia: {
    id: 'riccia', name: 'Riccia', biome: 'amazon', days: 2, seedPrice: 12, sellPrice: 30, regrow: true,
    colors: ['#9fe05a', '#5a9a2a', '#d8ff9a'],
    fact: 'Une plante sans racine ni fleur, cousine des mousses, qui forme des tapis flottants où les poissons aiment se cacher.',
  },
  echinodorus: {
    id: 'echinodorus', name: 'Échinodorus', biome: 'amazon', days: 3, seedPrice: 18, sellPrice: 48, regrow: false,
    colors: ['#4aaf4a', '#2a7a2a', '#8ad86a'],
    fact: 'La « plante épée » d’Amazonie. Elle produit de petites plantules sur ses tiges, qui deviennent de nouvelles plantes.',
  },
  mousse: {
    id: 'mousse', name: 'Mousse de Java', biome: 'koi', days: 2, seedPrice: 10, sellPrice: 26, regrow: true,
    colors: ['#5a9a4a', '#2f6a2a', '#8ac86a'],
    fact: 'Elle s’accroche à tout, pierres comme bois, et se contente de très peu de lumière. Les crevettes adorent y fouiller.',
  },
  lotus: {
    id: 'lotus', name: 'Lotus', biome: 'koi', days: 4, seedPrice: 30, sellPrice: 85, regrow: false,
    colors: ['#ff9ac8', '#d05a90', '#fff0f8'],
    fact: 'Ses feuilles sont si imperméables que l’eau y roule en perles en emportant la poussière : c’est « l’effet lotus ».',
  },
  marimo: {
    id: 'marimo', name: 'Marimo', biome: 'koi', days: 5, seedPrice: 40, sellPrice: 120, regrow: false,
    colors: ['#3a8a3a', '#1f5a2a', '#6ac05a'],
    fact: 'Des boules d’algue qui roulent au fond des lacs. Au Japon, elles sont protégées et passent pour porter bonheur.',
  },
};

export const CROP_LIST = Object.values(CROPS);

export const PLOTS_PER_FLOOR = 3;

export const SEASONS = ['Printemps', 'Été', 'Automne', 'Hiver'] as const;
export const DAYS_PER_SEASON = 28;
/** Heure de réveil et durée d'une minute de jeu en secondes réelles. */
export const DAY_START = 6 * 60;
export const DAY_END = 24 * 60;
export const REAL_SECONDS_PER_GAME_MINUTE = 0.7;
