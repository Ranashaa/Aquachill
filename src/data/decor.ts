import type { BiomeId } from './biomes';

export type DecorTag =
  | 'rock' | 'anemone' | 'coral' | 'seagrass' | 'gorgonian'
  | 'rocks' | 'sand' | 'plants' | 'tallplants' | 'floating' | 'roots' | 'leaves' | 'cave'
  | 'mud' | 'pebbles' | 'mussel' | 'lily' | 'lantern' | 'flow'
  | 'oyster' | 'branch' | 'ice' | 'floe' | 'kelp' | 'vent' | 'glow' | 'wreck' | 'bones'
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
  oyster: 'huîtres',
  branch: 'branches au-dessus de l’eau',
  ice: 'bloc de glace',
  floe: 'glace flottante',
  kelp: 'forêt de kelp',
  vent: 'cheminée hydrothermale',
  glow: 'lumière vivante',
  wreck: 'épave',
  bones: 'squelette de baleine',
  fun: 'objet décoratif',
};

export type DecorId =
  | 'live_rock' | 'anemone' | 'branch_coral' | 'brain_coral' | 'seagrass' | 'gorgonian' | 'giant_clam' | 'treasure'
  | 'stones' | 'sand_bank' | 'sword_plant' | 'vallisneria' | 'floating' | 'driftwood' | 'leaves' | 'slate_cave'
  | 'mud' | 'river_pebbles' | 'mussel' | 'lily' | 'iris' | 'lantern' | 'shishi' | 'bridge'
  | 'mangrove_roots' | 'mudflat' | 'oyster_bed' | 'overhang' | 'propagules' | 'brackish_stones' | 'fiddler_crab' | 'old_pirogue'
  | 'ice_block' | 'ice_floe' | 'kelp' | 'cold_stones' | 'ice_cave' | 'urchins' | 'old_anchor'
  | 'vent' | 'glow_coral' | 'abyss_rocks' | 'wreck' | 'whale_fall' | 'sea_pen' | 'glass_sponge';

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

  // --------------------------------------------------------------- Mangrove
  mangrove_roots: d({ id: 'mangrove_roots', name: 'Racines de palétuvier', biome: 'mangrove', price: 120, tags: ['roots'], anchor: 'bottom',
    blurb: 'Des racines-échasses qui protègent les alevins des prédateurs.' }),
  mudflat: d({ id: 'mudflat', name: 'Vasière', biome: 'mangrove', price: 80, tags: ['mud'], anchor: 'bottom',
    blurb: 'Une vase molle criblée de petits terriers de crabes.' }),
  oyster_bed: d({ id: 'oyster_bed', name: 'Banc d’huîtres', biome: 'mangrove', price: 110, tags: ['oyster'], anchor: 'bottom',
    blurb: 'Les huîtres de palétuvier filtrent et clarifient l’eau.' }),
  overhang: d({ id: 'overhang', name: 'Branche basse', biome: 'mangrove', price: 130, tags: ['branch'], anchor: 'surface',
    blurb: 'Une branche au ras de l’eau, où se posent les insectes.' }),
  propagules: d({ id: 'propagules', name: 'Jeunes palétuviers', biome: 'mangrove', price: 90, tags: ['plants'], anchor: 'bottom',
    blurb: 'Des graines qui germent déjà sur l’arbre avant de tomber.' }),
  brackish_stones: d({ id: 'brackish_stones', name: 'Pierres moussues', biome: 'mangrove', price: 70, tags: ['rocks'], anchor: 'bottom',
    blurb: 'Des pierres couvertes d’un fin tapis d’algues.' }),
  fiddler_crab: d({ id: 'fiddler_crab', name: 'Crabe violoniste', biome: 'mangrove', price: 100, tags: ['fun'], anchor: 'bottom',
    blurb: 'Il agite sa grosse pince comme un archet de violon.' }),
  old_pirogue: d({ id: 'old_pirogue', name: 'Vieille pirogue', biome: 'mangrove', price: 160, tags: ['fun'], anchor: 'bottom',
    blurb: 'Une barque oubliée, devenue un abri pour les poissons.' }),

  // --------------------------------------------------------------- Banquise
  ice_block: d({ id: 'ice_block', name: 'Bloc de glace', biome: 'ice', price: 140, tags: ['ice'], anchor: 'bottom',
    blurb: 'Un morceau de glace bleutée, vieux de plusieurs hivers.' }),
  ice_floe: d({ id: 'ice_floe', name: 'Glace flottante', biome: 'ice', price: 150, tags: ['floe'], anchor: 'surface',
    blurb: 'La banquise vue d’en dessous : un plafond de glace.' }),
  kelp: d({ id: 'kelp', name: 'Kelp', biome: 'ice', price: 110, tags: ['kelp', 'plants'], anchor: 'bottom',
    blurb: 'Une grande algue brune, véritable forêt sous-marine.' }),
  cold_stones: d({ id: 'cold_stones', name: 'Galets givrés', biome: 'ice', price: 90, tags: ['rocks'], anchor: 'bottom',
    blurb: 'Des pierres froides où l’on se camoufle.' }),
  ice_cave: d({ id: 'ice_cave', name: 'Grotte de glace', biome: 'ice', price: 180, tags: ['cave'], anchor: 'bottom',
    blurb: 'Une cachette bleue et silencieuse.' }),
  urchins: d({ id: 'urchins', name: 'Oursins', biome: 'ice', price: 100, tags: ['fun'], anchor: 'bottom',
    blurb: 'Des boules de piquants qui broutent les algues.' }),
  old_anchor: d({ id: 'old_anchor', name: 'Vieille ancre', biome: 'ice', price: 140, tags: ['fun'], anchor: 'bottom',
    blurb: 'Perdue par un brise-glace, il y a bien longtemps.' }),

  // ---------------------------------------------------------------- Abysses
  vent: d({ id: 'vent', name: 'Cheminée hydrothermale', biome: 'abyss', price: 200, tags: ['vent'], anchor: 'bottom',
    blurb: 'Une source d’eau chaude chargée de minéraux, oasis de vie dans le noir.' }),
  glow_coral: d({ id: 'glow_coral', name: 'Corail luminescent', biome: 'abyss', price: 160, tags: ['glow'], anchor: 'bottom',
    blurb: 'Des branches qui brillent d’une douce lueur bleue.' }),
  abyss_rocks: d({ id: 'abyss_rocks', name: 'Roches volcaniques', biome: 'abyss', price: 100, tags: ['rocks'], anchor: 'bottom',
    blurb: 'Des roches noires nées de la lave du fond des océans.' }),
  wreck: d({ id: 'wreck', name: 'Épave', biome: 'abyss', price: 240, tags: ['wreck'], anchor: 'bottom',
    blurb: 'La coque d’un vieux navire, couchée dans le silence.' }),
  whale_fall: d({ id: 'whale_fall', name: 'Squelette de baleine', biome: 'abyss', price: 220, tags: ['bones'], anchor: 'bottom',
    blurb: 'Une baleine tombée au fond nourrit la vie pendant des décennies.' }),
  sea_pen: d({ id: 'sea_pen', name: 'Plume de mer', biome: 'abyss', price: 150, tags: ['glow', 'plants'], anchor: 'bottom',
    blurb: 'Un cousin des coraux, en forme de plume, qui s’illumine quand on le touche.' }),
  glass_sponge: d({ id: 'glass_sponge', name: 'Éponge de verre', biome: 'abyss', price: 180, tags: ['fun'], anchor: 'bottom',
    blurb: 'Son squelette est fait de silice, comme du verre.' }),
};

export const DECOR_LIST = Object.values(DECOR);

export function decorForBiome(biome: BiomeId): DecorItem[] {
  return DECOR_LIST.filter((it) => it.biome === biome);
}
