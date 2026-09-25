export type BiomeId = 'reef' | 'amazon' | 'koi' | 'mangrove' | 'ice' | 'abyss';

/** Température d'un aquarium : 0 = fraîche, 1 = tempérée, 2 = chaude. */
export type Temp = 0 | 1 | 2;
export const TEMPS: Temp[] = [0, 1, 2];
export const TEMP_NAMES = ['Fraîche', 'Tempérée', 'Chaude'] as const;

export interface BiomePalette {
  wall: string;
  wallDark: string;
  wallLight: string;
  waterTop: string;
  waterBottom: string;
  sand: string;
  sandDark: string;
  sandLight: string;
  accent: string;
  algae: string;
  algaeDark: string;
}

export interface Biome {
  id: BiomeId;
  name: string;
  /** Nom court affiché sur la plaque de l'étage (pixel font, sans accent). */
  sign: string;
  description: string;
  /** Températures en °C correspondant à fraîche / tempérée / chaude. */
  tempsC: [number, number, number];
  palette: BiomePalette;
  /** Multiplicateur de gains des visiteurs. */
  income: number;
}

export const BIOMES: Record<BiomeId, Biome> = {
  reef: {
    id: 'reef',
    name: 'Récif corallien',
    sign: 'RECIF',
    description: 'Eaux tropicales limpides, coraux et anémones de l’Indo-Pacifique et des Caraïbes.',
    tempsC: [24, 26, 28],
    palette: {
      wall: '#f3dcc0', wallDark: '#d9b995', wallLight: '#fbeedd',
      waterTop: '#5fd6e8', waterBottom: '#1f7fb8',
      sand: '#f2e0b0', sandDark: '#d8bf85', sandLight: '#fff2cf',
      accent: '#ff8a5c', algae: '#7fbf5a', algaeDark: '#5a9a3e',
    },
    income: 1,
  },
  amazon: {
    id: 'amazon',
    name: 'Amazonie',
    sign: 'AMAZONIE',
    description: 'Eaux douces et ambrées, colorées par les feuilles mortes, sous la canopée.',
    tempsC: [24, 27, 30],
    palette: {
      wall: '#d7e3c2', wallDark: '#b0c496', wallLight: '#ebf2df',
      waterTop: '#9fc07a', waterBottom: '#5a6b3a',
      sand: '#c9a878', sandDark: '#9f7f55', sandLight: '#e0c79c',
      accent: '#e8a23a', algae: '#8fbf4a', algaeDark: '#6a9a30',
    },
    income: 1.5,
  },
  koi: {
    id: 'koi',
    name: 'Bassin koï',
    sign: 'BASSIN KOI',
    description: 'Un jardin d’eau japonais paisible, entre lanternes de pierre et nénuphars.',
    tempsC: [14, 18, 22],
    palette: {
      wall: '#efe4d6', wallDark: '#cdb9a2', wallLight: '#f8f1e8',
      waterTop: '#7fc4b0', waterBottom: '#2f6f6a',
      sand: '#b8b0a0', sandDark: '#8f8778', sandLight: '#d6cfc0',
      accent: '#d9463a', algae: '#8fb85a', algaeDark: '#688f3a',
    },
    income: 2,
  },
  mangrove: {
    id: 'mangrove',
    name: 'Mangrove',
    sign: 'MANGROVE',
    description: 'Racines de palétuviers et eaux saumâtres. Bientôt !',
    tempsC: [24, 27, 30],
    palette: {
      wall: '#dfe0c4', wallDark: '#b9ba98', wallLight: '#efefdc',
      waterTop: '#9ab89a', waterBottom: '#4a6a5a',
      sand: '#9a8a6a', sandDark: '#7a6a4a', sandLight: '#b8a888',
      accent: '#6aa05a', algae: '#8fb85a', algaeDark: '#688f3a',
    },
    income: 2.5,
  },
  ice: {
    id: 'ice',
    name: 'Banquise',
    sign: 'BANQUISE',
    description: 'Eaux glacées et lumière bleutée sous la glace. Bientôt !',
    tempsC: [-1, 1, 3],
    palette: {
      wall: '#e4eef6', wallDark: '#bccfe0', wallLight: '#f4f8fb',
      waterTop: '#bfe6f5', waterBottom: '#4a86b8',
      sand: '#e8eef2', sandDark: '#c0ccd6', sandLight: '#ffffff',
      accent: '#7ac0e8', algae: '#9ac0a0', algaeDark: '#789a80',
    },
    income: 3,
  },
  abyss: {
    id: 'abyss',
    name: 'Abysses',
    sign: 'ABYSSES',
    description: 'Le noir des profondeurs, illuminé par la bioluminescence. Bientôt !',
    tempsC: [2, 4, 6],
    palette: {
      wall: '#3a3656', wallDark: '#262240', wallLight: '#4e4a70',
      waterTop: '#1a2a5a', waterBottom: '#05081a',
      sand: '#3a3a4a', sandDark: '#2a2a36', sandLight: '#4a4a5c',
      accent: '#5ff0e0', algae: '#4a7a6a', algaeDark: '#2f5a4a',
    },
    income: 4,
  },
};

export function tempLabel(biome: BiomeId, t: Temp): string {
  return `${BIOMES[biome].tempsC[t]}°C`;
}
