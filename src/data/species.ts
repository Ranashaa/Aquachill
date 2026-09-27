import type { BiomeId, Temp } from './biomes';
import type { DecorTag } from './decor';

export type SpeciesId =
  | 'demoiselle' | 'clown' | 'gramma' | 'chirurgien' | 'mandarin' | 'hippocampe'
  | 'neon' | 'corydoras' | 'hachette' | 'scalaire' | 'discus' | 'pleco'
  | 'medaka' | 'dojo' | 'bouviere' | 'ryukin' | 'ayu' | 'kohaku'
  | 'monodactyle' | 'periophtalme' | 'scat' | 'gobie' | 'archer' | 'barramundi'
  | 'saida' | 'chabot' | 'lompe' | 'omble' | 'loup' | 'poisson_glace'
  | 'lanterne' | 'hachette_abyssale' | 'vipere' | 'barreleye' | 'gulper' | 'baudroie';

export type Rarity = 'common' | 'uncommon' | 'rare';
export const RARITY_NAMES: Record<Rarity, string> = {
  common: 'Commune',
  uncommon: 'Peu commune',
  rare: 'Rare',
};
export const RARITY_WEIGHT: Record<Rarity, number> = { common: 10, uncommon: 5, rare: 2 };

/** Zone de nage préférée : influence le comportement dans l'aquarium. */
export type SwimZone = 'middle' | 'bottom' | 'surface' | 'hover';

export interface Species {
  id: SpeciesId;
  name: string;
  scientific: string;
  biome: BiomeId;
  rarity: Rarity;
  /** Températures acceptées. */
  temps: Temp[];
  /** Tags de décor tous nécessaires pour attirer l'espèce. */
  needs: DecorTag[];
  zone: SwimZone;
  /** Vitesse de nage relative (1 = normal). */
  speed: number;
  /** Nage en banc avec ses congénères. */
  school?: boolean;
  size: string;
  origin: string;
  /** Trait distinctif, utilisé dans le mini-jeu d'identification. */
  trait: string;
  /** Indice affiché sur la silhouette du carnet. */
  hint: string;
  /** Anecdote éducative. */
  fact: string;
}

const ALL: Temp[] = [0, 1, 2];

export const SPECIES: Species[] = [
  // ---------------- Récif corallien ----------------
  {
    id: 'demoiselle', name: 'Demoiselle bleue', scientific: 'Chrysiptera cyanea', biome: 'reef', rarity: 'common',
    temps: ALL, needs: [], zone: 'middle', speed: 1.2,
    size: '8 cm', origin: 'Océan Indien et Pacifique ouest',
    trait: 'Bleu électrique, queue orange',
    hint: 'Pas difficile : elle vient dans n’importe quel récif.',
    fact: 'Seuls les mâles arborent une queue orange vif ; celle des femelles est transparente. Malgré sa petite taille, elle défend farouchement son coin de récif.',
  },
  {
    id: 'clown', name: 'Poisson-clown', scientific: 'Amphiprion ocellaris', biome: 'reef', rarity: 'common',
    temps: ALL, needs: ['anemone'], zone: 'middle', speed: 0.9,
    size: '11 cm', origin: 'Asie du Sud-Est et nord de l’Australie',
    trait: 'Orange à trois bandes blanches',
    hint: 'Cherche un abri qui pique, pour s’y blottir.',
    fact: 'Il vit en symbiose avec une anémone : un mucus le protège de ses cellules urticantes. Tous naissent mâles ; le plus gros du groupe devient femelle.',
  },
  {
    id: 'gramma', name: 'Gramma royal', scientific: 'Gramma loreto', biome: 'reef', rarity: 'common',
    temps: ALL, needs: ['rock'], zone: 'middle', speed: 1,
    size: '8 cm', origin: 'Mer des Caraïbes',
    trait: 'Moitié violet, moitié jaune',
    hint: 'Aime se faufiler sous les roches.',
    fact: 'Il nage toujours le ventre tourné vers la roche, même la tête en bas sous les surplombs ! Le mâle construit un nid d’algues dans une crevasse.',
  },
  {
    id: 'chirurgien', name: 'Chirurgien bleu', scientific: 'Paracanthurus hepatus', biome: 'reef', rarity: 'uncommon',
    temps: [1, 2], needs: ['coral'], zone: 'middle', speed: 1.1,
    size: '30 cm', origin: 'Indo-Pacifique',
    trait: 'Bleu roi, motif noir en « palette », queue jaune',
    hint: 'Se cache entre les branches de corail, dans une eau pas trop fraîche.',
    fact: 'Son nom vient de deux épines tranchantes comme des scalpels à la base de sa queue. Effrayé, il se glisse dans le corail et peut même faire le mort, couché sur le flanc.',
  },
  {
    id: 'mandarin', name: 'Poisson-mandarin', scientific: 'Synchiropus splendidus', biome: 'reef', rarity: 'rare',
    temps: [2], needs: ['rock', 'coral'], zone: 'bottom', speed: 0.5,
    size: '6 cm', origin: 'Pacifique ouest',
    trait: 'Bleu et orange à motifs ondulés',
    hint: 'Picore sur la roche vivante, près du corail, dans une eau bien chaude.',
    fact: 'C’est l’un des très rares vertébrés à fabriquer un vrai pigment bleu. Sans écailles, il se protège grâce à un mucus malodorant et picore sans cesse de minuscules crustacés.',
  },
  {
    id: 'hippocampe', name: 'Hippocampe jaune', scientific: 'Hippocampus kuda', biome: 'reef', rarity: 'rare',
    temps: [0, 1], needs: ['seagrass', 'gorgonian'], zone: 'hover', speed: 0.35,
    size: '17 cm', origin: 'Indo-Pacifique, herbiers et lagons',
    trait: 'Nage à la verticale, tête de cheval',
    hint: 'S’accroche aux herbiers et aux gorgones, dans une eau pas trop chaude.',
    fact: 'Chez les hippocampes, c’est le mâle qui porte les œufs dans une poche ventrale, puis met au monde des centaines de petits. Sa queue préhensile lui sert d’ancre.',
  },

  // ---------------- Amazonie ----------------
  {
    id: 'neon', name: 'Néon cardinal', scientific: 'Paracheirodon axelrodi', biome: 'amazon', rarity: 'common',
    temps: ALL, needs: [], zone: 'middle', speed: 1.3, school: true,
    size: '5 cm', origin: 'Rio Negro et Orénoque',
    trait: 'Bande bleue fluo et ventre rouge',
    hint: 'Vient dans n’importe quel coin d’Amazonie.',
    fact: 'Sa bande bleue iridescente aide le banc à rester groupé dans les eaux sombres « couleur thé ». Contrairement au néon bleu, son rouge court sur toute la longueur du ventre.',
  },
  {
    id: 'corydoras', name: 'Corydoras panda', scientific: 'Corydoras panda', biome: 'amazon', rarity: 'common',
    temps: ALL, needs: ['sand'], zone: 'bottom', speed: 0.8, school: true,
    size: '5 cm', origin: 'Pérou, bassin de l’Ucayali',
    trait: 'Blanc avec un masque noir autour des yeux',
    hint: 'Fouille le sable fin avec ses moustaches.',
    fact: 'Il fouille le sable avec ses barbillons sensibles et file parfois à la surface avaler une bulle d’air : il peut respirer par l’intestin !',
  },
  {
    id: 'hachette', name: 'Poisson-hachette marbré', scientific: 'Carnegiella strigata', biome: 'amazon', rarity: 'common',
    temps: ALL, needs: ['floating'], zone: 'surface', speed: 1,
    size: '3,5 cm', origin: 'Bassin amazonien',
    trait: 'Ventre en carène, dos plat, marbré',
    hint: 'Reste juste sous les plantes flottantes.',
    fact: 'Sa carène abrite de puissants muscles : pour fuir un prédateur, il bondit hors de l’eau et file sur plusieurs mètres en rasant la surface.',
  },
  {
    id: 'scalaire', name: 'Scalaire', scientific: 'Pterophyllum scalare', biome: 'amazon', rarity: 'uncommon',
    temps: [1, 2], needs: ['tallplants'], zone: 'middle', speed: 0.6,
    size: '15 cm (20 cm de haut)', origin: 'Bassin amazonien',
    trait: 'Très haut et plat, rayé verticalement',
    hint: 'Se faufile entre les grandes plantes, en eau tempérée ou chaude.',
    fact: 'Son corps plat et ses bandes verticales le camouflent parmi les tiges. Les couples sont fidèles et surveillent ensemble leurs œufs collés sur une feuille.',
  },
  {
    id: 'discus', name: 'Discus', scientific: 'Symphysodon aequifasciatus', biome: 'amazon', rarity: 'rare',
    temps: [2], needs: ['roots', 'leaves'], zone: 'middle', speed: 0.5,
    size: '15 cm', origin: 'Amazonie centrale',
    trait: 'Rond comme un disque, lignes turquoise',
    hint: 'Racines, feuilles mortes et eau très chaude.',
    fact: 'Les parents nourrissent leurs alevins avec un mucus sécrété par leur peau, une sorte de « lait » ! Il apprécie une eau chaude, douce et acide.',
  },
  {
    id: 'pleco', name: 'Pléco zèbre', scientific: 'Hypancistrus zebra', biome: 'amazon', rarity: 'rare',
    temps: [2], needs: ['cave', 'rocks'], zone: 'bottom', speed: 0.4,
    size: '8 cm', origin: 'Rio Xingu (Brésil) uniquement',
    trait: 'Rayé noir et blanc, vit collé au fond',
    hint: 'Grottes, galets et eau chaude.',
    fact: 'On ne le trouve que dans un tronçon du Rio Xingu, dans les crevasses d’un courant puissant. Sa bouche en ventouse l’accroche aux pierres. Il est menacé par le barrage de Belo Monte.',
  },

  // ---------------- Bassin koï ----------------
  {
    id: 'medaka', name: 'Médaka', scientific: 'Oryzias latipes', biome: 'koi', rarity: 'common',
    temps: ALL, needs: [], zone: 'surface', speed: 1.2, school: true,
    size: '4 cm', origin: 'Japon, Corée, Chine',
    trait: 'Petit, doré, gros yeux, bouche vers le haut',
    hint: 'Vient dans n’importe quel bassin.',
    fact: 'En 1994, des médakas ont voyagé à bord de la navette Columbia : ce furent les premiers vertébrés à se reproduire en orbite ! Leurs œufs transparents aident beaucoup les scientifiques.',
  },
  {
    id: 'dojo', name: 'Loche dojo', scientific: 'Misgurnus anguillicaudatus', biome: 'koi', rarity: 'common',
    temps: ALL, needs: ['mud'], zone: 'bottom', speed: 0.7,
    size: '15 cm', origin: 'Asie de l’Est',
    trait: 'Allongée comme une anguille, barbillons',
    hint: 'Adore s’enfouir dans la vase.',
    fact: 'Surnommée « loche météo » : sensible à la pression de l’air, elle s’agite avant les orages. Elle peut aussi avaler de l’air et respirer par l’intestin.',
  },
  {
    id: 'bouviere', name: 'Bouvière rose', scientific: 'Rhodeus ocellatus', biome: 'koi', rarity: 'uncommon',
    temps: ALL, needs: ['mussel'], zone: 'middle', speed: 1,
    size: '6 cm', origin: 'Chine, Corée, Japon',
    trait: 'Reflets rose et violet, liseré rouge',
    hint: 'Ses petits ont besoin d’un coquillage.',
    fact: 'La femelle pond ses œufs à l’intérieur d’une moule d’eau douce grâce à un long tube ! Les alevins grandissent à l’abri du coquillage avant d’en sortir.',
  },
  {
    id: 'ryukin', name: 'Poisson rouge ryukin', scientific: 'Carassius auratus', biome: 'koi', rarity: 'uncommon',
    temps: [1, 2], needs: ['lily'], zone: 'middle', speed: 0.6,
    size: '20 cm', origin: 'Chine, puis Japon (îles Ryūkyū)',
    trait: 'Rond avec une bosse et une queue double voilée',
    hint: 'Aime nager sous les nénuphars, pas en eau trop froide.',
    fact: 'Le poisson rouge est sélectionné en Chine depuis plus de mille ans. Et non, il n’a pas une mémoire de 3 secondes : il retient des choses pendant des mois !',
  },
  {
    id: 'ayu', name: 'Ayu', scientific: 'Plecoglossus altivelis', biome: 'koi', rarity: 'rare',
    temps: [0], needs: ['pebbles', 'flow'], zone: 'middle', speed: 1.4,
    size: '25 cm', origin: 'Rivières du Japon, de Corée et de Chine',
    trait: 'Fin et olive, tache jaune derrière l’ouïe',
    hint: 'Galets, courant d’eau et fraîcheur.',
    fact: 'Surnommé « poisson parfumé » : sa chair sent la pastèque ou le concombre, à cause des algues qu’il broute sur les galets. Chacun défend son petit territoire de pierres.',
  },
  {
    id: 'kohaku', name: 'Koï kohaku', scientific: 'Cyprinus rubrofuscus', biome: 'koi', rarity: 'rare',
    temps: [0, 1], needs: ['lantern', 'lily'], zone: 'middle', speed: 0.5,
    size: '60 à 90 cm', origin: 'Japon (carpe domestiquée)',
    trait: 'Grand, blanc à taches rouges',
    hint: 'Lanterne de pierre et nénuphars, dans une eau fraîche.',
    fact: 'Les koïs vivent plusieurs dizaines d’années ; la célèbre Hanako aurait atteint 226 ans (un âge très discuté !). Le kohaku, blanc à taches rouges, est l’une des variétés les plus anciennes.',
  },

  // ---------------- Mangrove ----------------
  {
    id: 'monodactyle', name: 'Monodactyle argenté', scientific: 'Monodactylus argenteus', biome: 'mangrove', rarity: 'common',
    temps: ALL, needs: [], zone: 'middle', speed: 1, school: true,
    size: '25 cm', origin: 'Estuaires de l’Indo-Pacifique',
    trait: 'Losange argenté, nageoires jaunes',
    hint: 'Vient dans n’importe quelle mangrove.',
    fact: 'Il passe sans souci de l’eau douce à l’eau de mer : les jeunes remontent les rivières, les adultes retournent vers la mer. Son corps argenté renvoie la lumière comme un miroir.',
  },
  {
    id: 'periophtalme', name: 'Périophtalme', scientific: 'Periophthalmus barbarus', biome: 'mangrove', rarity: 'common',
    temps: ALL, needs: ['mud'], zone: 'bottom', speed: 0.7,
    size: '16 cm', origin: 'Côtes d’Afrique de l’Ouest',
    trait: 'Gros yeux sur le dessus de la tête, vit sur la vase',
    hint: 'Adore se promener sur la vase.',
    fact: 'Ce poisson passe plus de temps hors de l’eau que dedans ! Il respire aussi par la peau, garde de l’eau dans ses ouïes et marche sur la vase en s’appuyant sur ses nageoires.',
  },
  {
    id: 'scat', name: 'Argus vert', scientific: 'Scatophagus argus', biome: 'mangrove', rarity: 'common',
    temps: ALL, needs: ['roots'], zone: 'middle', speed: 0.8,
    size: '30 cm', origin: 'Indo-Pacifique',
    trait: 'Rond, bronze-vert à pois noirs',
    hint: 'Traîne entre les racines des palétuviers.',
    fact: 'Son nom scientifique signifie « mangeur de crottes » : il avale tout ce qui tombe dans l’eau et fait le ménage ! Il supporte l’eau douce comme l’eau salée.',
  },
  {
    id: 'gobie', name: 'Gobie bourdon', scientific: 'Brachygobius doriae', biome: 'mangrove', rarity: 'uncommon',
    temps: ALL, needs: ['oyster'], zone: 'bottom', speed: 0.9,
    size: '4 cm', origin: 'Bornéo et Asie du Sud-Est',
    trait: 'Minuscule, rayé jaune et noir',
    hint: 'Se pose sur les coquillages.',
    fact: 'Il porte les couleurs d’un bourdon ! Ses nageoires ventrales soudées forment une petite ventouse pour se poser sur les coquilles et les racines.',
  },
  {
    id: 'archer', name: 'Poisson-archer', scientific: 'Toxotes jaculatrix', biome: 'mangrove', rarity: 'uncommon',
    temps: [1, 2], needs: ['branch'], zone: 'surface', speed: 1,
    size: '30 cm', origin: 'Mangroves de l’Indo-Pacifique',
    trait: 'Argenté à taches noires, bouche pointue',
    hint: 'Guette les insectes posés sur les branches basses.',
    fact: 'Il crache un jet d’eau précis jusqu’à deux mètres pour faire tomber les insectes posés sur les feuilles, en corrigeant même la déviation de la lumière à la surface !',
  },
  {
    id: 'barramundi', name: 'Barramundi', scientific: 'Lates calcarifer', biome: 'mangrove', rarity: 'rare',
    temps: [2], needs: ['roots', 'oyster'], zone: 'middle', speed: 0.7,
    size: '60 cm à 1,2 m', origin: 'Australie et Asie du Sud-Est',
    trait: 'Grand, argenté, œil qui brille',
    hint: 'Racines, huîtres et eau bien chaude.',
    fact: 'Son nom vient d’une langue aborigène d’Australie. Il naît mâle et devient femelle en vieillissant. Ses yeux renvoient la lumière et semblent briller dans la pénombre.',
  },

  // ---------------- Banquise ----------------
  {
    id: 'saida', name: 'Morue polaire', scientific: 'Boreogadus saida', biome: 'ice', rarity: 'common',
    temps: ALL, needs: [], zone: 'middle', speed: 1.1, school: true,
    size: '25 cm', origin: 'Océan Arctique',
    trait: 'Fine, argent-brun, petit barbillon',
    hint: 'Vient sous n’importe quelle banquise.',
    fact: 'Elle vit sous la glace et fabrique une protéine « antigel » qui empêche son sang de geler. C’est le repas préféré des phoques et des bélugas.',
  },
  {
    id: 'chabot', name: 'Chabot à quatre cornes', scientific: 'Myoxocephalus quadricornis', biome: 'ice', rarity: 'common',
    temps: ALL, needs: ['rocks'], zone: 'bottom', speed: 0.5,
    size: '30 cm', origin: 'Côtes de l’Arctique',
    trait: 'Grosse tête cornue, tacheté, posé au fond',
    hint: 'Se confond avec les pierres du fond.',
    fact: 'Quatre petites bosses osseuses sur sa tête lui ont donné son nom. Immobile sur le fond, il ressemble à un caillou et attend patiemment qu’une proie passe.',
  },
  {
    id: 'lompe', name: 'Lompe', scientific: 'Cyclopterus lumpus', biome: 'ice', rarity: 'common',
    temps: ALL, needs: ['kelp'], zone: 'bottom', speed: 0.5,
    size: '30 cm', origin: 'Atlantique Nord et Arctique',
    trait: 'Rond et bosselé, ventre orange',
    hint: 'Aime les forêts de kelp.',
    fact: 'Ses nageoires ventrales forment une ventouse pour s’accrocher aux rochers malgré les vagues. C’est le papa, au ventre orange, qui garde les œufs.',
  },
  {
    id: 'omble', name: 'Omble chevalier', scientific: 'Salvelinus alpinus', biome: 'ice', rarity: 'uncommon',
    temps: [0, 1], needs: ['floe'], zone: 'middle', speed: 1,
    size: '60 cm', origin: 'Lacs et côtes de l’Arctique',
    trait: 'Dos sombre moucheté, ventre rouge',
    hint: 'Nage à l’ombre de la glace flottante, dans une eau très froide.',
    fact: 'C’est le poisson d’eau douce qui vit le plus au nord de la planète. À la saison des amours, le ventre des mâles devient rouge vif.',
  },
  {
    id: 'loup', name: 'Loup de mer', scientific: 'Anarhichas lupus', biome: 'ice', rarity: 'rare',
    temps: [0, 1], needs: ['cave', 'rocks'], zone: 'bottom', speed: 0.5,
    size: '1 m', origin: 'Atlantique Nord',
    trait: 'Grosse tête, dents saillantes, rayures sombres',
    hint: 'Une grotte, des pierres et une eau très froide.',
    fact: 'Ses dents puissantes broient coquillages et oursins. Malgré son air féroce, il est plutôt calme, et le couple veille ensemble sur ses œufs.',
  },
  {
    id: 'poisson_glace', name: 'Poisson des glaces', scientific: 'Chaenocephalus aceratus', biome: 'ice', rarity: 'rare',
    temps: [0], needs: ['ice', 'floe'], zone: 'middle', speed: 0.6,
    size: '70 cm', origin: 'Océan Austral (Antarctique)',
    trait: 'Pâle et translucide, museau de crocodile',
    hint: 'De la glace partout, et l’eau la plus froide possible.',
    fact: 'Son sang est transparent : il n’a pas d’hémoglobine ! L’eau glacée de l’Antarctique contient tellement d’oxygène qu’il peut s’en passer.',
  },

  // ---------------- Abysses ----------------
  {
    id: 'lanterne', name: 'Poisson-lanterne', scientific: 'Myctophum punctatum', biome: 'abyss', rarity: 'common',
    temps: ALL, needs: [], zone: 'middle', speed: 1, school: true,
    size: '11 cm', origin: 'Atlantique, de la surface à 1 000 m',
    trait: 'Sombre, points lumineux sur le ventre',
    hint: 'Vient dans n’importe quel abysse.',
    fact: 'Les poissons-lanternes sont parmi les vertébrés les plus nombreux de la planète. Chaque nuit, ils remontent vers la surface pour manger, puis redescendent à l’aube.',
  },
  {
    id: 'hachette_abyssale', name: 'Hachette des profondeurs', scientific: 'Argyropelecus aculeatus', biome: 'abyss', rarity: 'common',
    temps: ALL, needs: ['glow'], zone: 'middle', speed: 0.8,
    size: '8 cm', origin: 'Tous les océans',
    trait: 'Argentée, yeux tournés vers le haut',
    hint: 'Attirée par les lumières vivantes.',
    fact: 'Les lumières de son ventre imitent la faible lueur venue d’en haut : vue d’en dessous, elle devient invisible. Ses yeux en tube regardent vers la surface.',
  },
  {
    id: 'vipere', name: 'Poisson-vipère', scientific: 'Chauliodus sloani', biome: 'abyss', rarity: 'uncommon',
    temps: ALL, needs: ['rocks'], zone: 'middle', speed: 0.8,
    size: '30 cm', origin: 'Tous les océans, jusqu’à 2 000 m',
    trait: 'Long et sombre, crocs immenses',
    hint: 'Rôde près des roches volcaniques.',
    fact: 'Ses crocs sont si longs qu’ils dépassent de sa bouche fermée ! Une petite lumière au bout de sa nageoire dorsale lui sert d’appât.',
  },
  {
    id: 'barreleye', name: 'Poisson à tête transparente', scientific: 'Macropinna microstoma', biome: 'abyss', rarity: 'uncommon',
    temps: ALL, needs: ['glow', 'bones'], zone: 'hover', speed: 0.4,
    size: '15 cm', origin: 'Pacifique Nord',
    trait: 'Tête en dôme transparent, yeux verts dedans',
    hint: 'Flotte près des lumières et d’un squelette de baleine.',
    fact: 'Sa tête est un dôme transparent : ses yeux verts pivotent à l’intérieur pour regarder vers le haut ou devant lui. Les deux « yeux » visibles à l’avant sont en fait ses narines !',
  },
  {
    id: 'gulper', name: 'Grand-gosier', scientific: 'Eurypharynx pelecanoides', biome: 'abyss', rarity: 'rare',
    temps: [0, 1], needs: ['wreck'], zone: 'middle', speed: 0.5,
    size: '75 cm', origin: 'Tous les océans, jusqu’à 3 000 m',
    trait: 'Bouche géante, queue fine lumineuse',
    hint: 'Ondule autour d’une épave, dans le froid.',
    fact: 'Sa bouche immense se déplie comme un filet pour engloutir l’eau et les proies. Le bout de sa longue queue porte une petite lumière rose.',
  },
  {
    id: 'baudroie', name: 'Baudroie abyssale', scientific: 'Melanocetus johnsonii', biome: 'abyss', rarity: 'rare',
    temps: [0], needs: ['vent', 'bones'], zone: 'bottom', speed: 0.4,
    size: '18 cm', origin: 'Tous les océans, jusqu’à 4 000 m',
    trait: 'Ronde et noire, lanterne sur la tête',
    hint: 'Une cheminée chaude, un squelette de baleine, et l’eau la plus froide.',
    fact: 'La femelle attire ses proies avec une lanterne sur la tête, allumée par des bactéries lumineuses. Le mâle, minuscule, doit la retrouver dans le noir total.',
  },
];

export const SPECIES_BY_ID = Object.fromEntries(SPECIES.map((s) => [s.id, s])) as Record<SpeciesId, Species>;

export function speciesForBiome(biome: BiomeId): Species[] {
  return SPECIES.filter((s) => s.biome === biome);
}

export function wikiUrl(s: Species): string {
  return `https://fr.wikipedia.org/w/index.php?search=${encodeURIComponent(s.scientific)}`;
}
