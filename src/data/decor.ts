import type { BiomeId } from './biomes';

export type DecorTag =
  | 'rock' | 'anemone' | 'coral' | 'seagrass' | 'gorgonian'
  | 'rocks' | 'sand' | 'plants' | 'tallplants' | 'floating' | 'roots' | 'leaves' | 'cave'
  | 'mud' | 'pebbles' | 'mussel' | 'lily' | 'lantern' | 'flow'
  | 'fun';

/** Noms lisibles des tags, utilisés dans les fiches du carnet. */
export const TAG_NAMES: Record<DecorTag, string> = {
  rock: 'roche vivante',
  anemone: 'anémone',
  coral: 'corail',
  seagrass: 'herbier',
  gorgonian: 'gorgone',
  rocks: 'galets',
  sand: 'sable fin',
  plants: 'plantes',
  tallplants: 'grandes plantes',
  floating: 'plantes flottantes',
  roots: 'racines',
  leaves: 'feuilles mortes',
  cave: 'grotte',
  mud: 'vase',
  pebbles: 'galets de rivière',
  mussel: 'moule d’eau douce',
  lily: 'nénuphar',
  lantern: 'lanterne de pierre',
  flow: 'courant d’eau',
  fun: 'objet décoratif',
};

export type DecorId =
  | 'live_rock' | 'anemone' | 'branch_coral' | 'brain_coral' | 'seagrass' | 'gorgonian' | 'giant_clam' | 'treasure'
  | 'stones' | 'sand_bank' | 'sword_plant' | 'vallisneria' | 'floating' | 'driftwood' | 'leaves' | 'slate_cave'
  | 'mud' | 'river_pebbles' | 'mussel' | 'lily' | 'iris' | 'lantern' | 'shishi' | 'bridge';

export interface DecorItem {
  id: DecorId;
  name: string;
  biome: BiomeId;
  price: number;
  tags: DecorTag[];
  /** 'bottom' = posé sur le sable, 'surface' = flotte en haut de l'eau. */
  anchor: 'bottom' | 'surface';
  blurb: string;
}

const d = (item: DecorItem) => item;

export const DECOR: Record<DecorId, DecorItem> = {
  // --- Récif ---
  live_rock: d({ id: 'live_rock', name: 'Roche vivante', biome: 'reef', price: 30, tags: ['rock'], anchor: 'bottom',
    blurb: 'Couverte d’algues calcaires roses et de micro-vie.' }),
  anemone: d({ id: 'anemone', name: 'Anémone', biome: 'reef', price: 40, tags: ['anemone'], anchor: 'bottom',
    blurb: 'Ses tentacules urticants protègent ceux qui savent s’y lover.' }),
  branch_coral: d({ id: 'branch_coral', name: 'Corail branchu', biome: 'reef', price: 60, tags: ['coral'], anchor: 'bottom',
    blurb: 'Un buisson de corail, parfait pour se cacher.' }),
  brain_coral: d({ id: 'brain_coral', name: 'Corail cerveau', biome: 'reef', price: 50, tags: ['coral'], anchor: 'bottom',
    blurb: 'Ses sillons rappellent un cerveau. Il pousse très lentement.' }),
  seagrass: d({ id: 'seagrass', name: 'Herbier', biome: 'reef', price: 45, tags: ['seagrass', 'plants'], anchor: 'bottom',
    blurb: 'Des plantes à fleurs marines, nurserie de l’océan.' }),
  gorgonian: d({ id: 'gorgonian', name: 'Gorgone', biome: 'reef', price: 80, tags: ['gorgonian'], anchor: 'bottom',
    blurb: 'Un éventail de corail souple qui filtre le courant.' }),
  giant_clam: d({ id: 'giant_clam', name: 'Bénitier', biome: 'reef', price: 70, tags: ['fun'], anchor: 'bottom',
    blurb: 'Un coquillage géant aux lèvres bleu électrique.' }),
  treasure: d({ id: 'treasure', name: 'Coffre au trésor', biome: 'reef', price: 90, tags: ['fun'], anchor: 'bottom',
    blurb: 'Un classique ! Il fait des bulles de temps en temps.' }),

  // --- Amazonie ---
  stones: d({ id: 'stones', name: 'Galets ronds', biome: 'amazon', price: 30, tags: ['rocks'], anchor: 'bottom',
    blurb: 'Des pierres polies par le courant.' }),
  sand_bank: d({ id: 'sand_bank', name: 'Banc de sable fin', biome: 'amazon', price: 35, tags: ['sand'], anchor: 'bottom',
    blurb: 'Doux pour les barbillons fouisseurs.' }),
  sword_plant: d({ id: 'sword_plant', name: 'Échinodorus', biome: 'amazon', price: 40, tags: ['plants'], anchor: 'bottom',
    blurb: 'La « plante épée » d’Amazonie, aux larges feuilles.' }),
  vallisneria: d({ id: 'vallisneria', name: 'Vallisnérie', biome: 'amazon', price: 55, tags: ['tallplants', 'plants'], anchor: 'bottom',
    blurb: 'De longs rubans verts qui ondulent jusqu’à la surface.' }),
  floating: d({ id: 'floating', name: 'Plantes flottantes', biome: 'amazon', price: 50, tags: ['floating', 'plants'], anchor: 'surface',
    blurb: 'Des laitues d’eau qui tamisent la lumière.' }),
  driftwood: d({ id: 'driftwood', name: 'Racine', biome: 'amazon', price: 70, tags: ['roots'], anchor: 'bottom',
    blurb: 'Une racine immergée qui teinte l’eau couleur thé.' }),
  leaves: d({ id: 'leaves', name: 'Feuilles mortes', biome: 'amazon', price: 40, tags: ['leaves'], anchor: 'bottom',
    blurb: 'Une litière de feuilles qui acidifie doucement l’eau.' }),
  slate_cave: d({ id: 'slate_cave', name: 'Grotte d’ardoise', biome: 'amazon', price: 90, tags: ['cave'], anchor: 'bottom',
    blurb: 'Un abri sombre et étroit, très recherché.' }),

  // --- Bassin koï ---
  mud: d({ id: 'mud', name: 'Fond vaseux', biome: 'koi', price: 40, tags: ['mud'], anchor: 'bottom',
    blurb: 'Une vase douce où l’on peut s’enfouir.' }),
  river_pebbles: d({ id: 'river_pebbles', name: 'Galets de rivière', biome: 'koi', price: 45, tags: ['pebbles'], anchor: 'bottom',
    blurb: 'Couverts d’une fine pellicule d’algues à brouter.' }),
  mussel: d({ id: 'mussel', name: 'Moule d’eau douce', biome: 'koi', price: 60, tags: ['mussel'], anchor: 'bottom',
    blurb: 'Elle filtre l’eau… et sert parfois de nurserie !' }),
  lily: d({ id: 'lily', name: 'Nénuphar', biome: 'koi', price: 70, tags: ['lily', 'plants'], anchor: 'surface',
    blurb: 'Une ombre fraîche et une jolie fleur rose.' }),
  iris: d({ id: 'iris', name: 'Iris d’eau', biome: 'koi', price: 50, tags: ['plants'], anchor: 'bottom',
    blurb: 'Des feuilles en lames et une fleur violette.' }),
  lantern: d({ id: 'lantern', name: 'Lanterne de pierre', biome: 'koi', price: 120, tags: ['lantern'], anchor: 'bottom',
    blurb: 'Un tōrō, lanterne traditionnelle des jardins japonais.' }),
  shishi: d({ id: 'shishi', name: 'Shishi-odoshi', biome: 'koi', price: 110, tags: ['flow'], anchor: 'bottom',
    blurb: 'Une fontaine de bambou qui fait « toc » en basculant.' }),
  bridge: d({ id: 'bridge', name: 'Petit pont rouge', biome: 'koi', price: 150, tags: ['fun'], anchor: 'bottom',
    blurb: 'Un mini pont laqué, pour la photo.' }),
};

export const DECOR_LIST = Object.values(DECOR);

export function decorForBiome(biome: BiomeId): DecorItem[] {
  return DECOR_LIST.filter((it) => it.biome === biome);
}
