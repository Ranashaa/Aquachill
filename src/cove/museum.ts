// Le musée-aquarium de la crique, façon Animal Crossing : on sauve des créatures
// (une mission chacune), on les soigne quelques jours à l'infirmerie, puis elles
// rejoignent leur bassin. On creuse aussi la plage pour trouver des fossiles :
// les squelettes du musée se complètent pièce par pièce. Logique pure.
import { hash } from './raster';

export type Habitat = 'mare' | 'rivage' | 'large';

export interface Creature {
  id: string;
  name: string;
  habitat: Habitat;
  /** Où la trouver dans la crique (tuile), pour les missions de la mare et du rivage. */
  spot?: [number, number];
  /** Comment on la sauve, et combien de gestes il faut. */
  rescue: { verb: string; taps: number; story: string; done: string };
  careDays: number;
  fact: string;
}

const C = (c: Creature) => c;

export const CREATURES: Creature[] = [
  C({ id: 'crabe', name: 'Crabe vert', habitat: 'rivage', spot: [10, 33], careDays: 2,
    rescue: { verb: 'Démêler le filet', taps: 4, story: 'Un crabe vert s’est pris la pince dans un vieux filet, sur la plage, près de l’eau.', done: 'La pince est libre ! Le crabe claque des pinces, reconnaissant. Enfin, on suppose.' },
    fact: 'Le crabe vert marche de côté parce que ses pattes se plient mieux dans ce sens. Il peut perdre une pince… et la faire repousser !' }),
  C({ id: 'koi', name: 'Carpe koï', habitat: 'mare', spot: [19, 11], careDays: 2,
    rescue: { verb: 'Attraper à l’épuisette', taps: 3, story: 'Une koï de la mare a une nageoire abîmée. Elle nage tout doucement près du bord.', done: 'Tu la glisses dans un seau d’eau de la mare. Elle te regarde, très digne.' },
    fact: 'Au Japon, la koï est un symbole de persévérance : on raconte qu’elle remonte les cascades pour devenir dragon.' }),
  C({ id: 'etoile', name: 'Étoile de mer', habitat: 'rivage', spot: [27, 33], careDays: 2,
    rescue: { verb: 'La soulever doucement', taps: 3, story: 'Une étoile de mer s’est retrouvée au sec, loin de l’eau, près des rochers.', done: 'Elle est toute molle mais vivante. Vite, un seau d’eau de mer !' },
    fact: 'L’étoile de mer n’a pas de cerveau, mais elle a un œil au bout de chaque bras. Et si elle perd un bras, il repousse.' }),
  C({ id: 'epinoche', name: 'Épinoche', habitat: 'mare', spot: [24, 16], careDays: 2,
    rescue: { verb: 'L’attraper à l’épuisette', taps: 3, story: 'Une petite épinoche s’est coincée dans une flaque qui s’assèche, au bord de la mare.', done: 'Hop, dans le seau ! Elle hérisse ses épines, vexée.' },
    fact: 'Chez l’épinoche, c’est le papa qui construit le nid avec des algues, et qui garde les œufs en les ventilant avec ses nageoires.' }),
  C({ id: 'bernard', name: 'Bernard-l’ermite', habitat: 'rivage', spot: [29, 34], careDays: 2,
    rescue: { verb: 'L’aider à sortir du pot', taps: 4, story: 'Un bernard-l’ermite a pris un vieux pot de yaourt pour coquille. Il est coincé dedans !', done: 'Libéré ! Il file vers un vrai coquillage. Il a meilleur goût, franchement.' },
    fact: 'Le bernard-l’ermite n’a pas de coquille à lui : il emprunte celle d’un escargot de mer, et déménage quand il grandit.' }),
  C({ id: 'hippocampe', name: 'Hippocampe moucheté', habitat: 'rivage', spot: [16, 39], careDays: 3,
    rescue: { verb: 'Le recueillir', taps: 3, story: 'Marcel a vu un hippocampe épuisé, accroché à un poteau sous le ponton.', done: 'Tu le recueilles dans tes mains en coupe. Il enroule sa queue autour de ton doigt.' },
    fact: 'Chez l’hippocampe, c’est le mâle qui porte les bébés dans une poche ventrale. Il peut en mettre au monde des centaines d’un coup.' }),
  C({ id: 'grenouille', name: 'Grenouille verte', habitat: 'mare', spot: [31, 13], careDays: 2,
    rescue: { verb: 'La décrocher des ronces', taps: 3, story: 'Une grenouille s’est emmêlée dans des ronces, près de la mare. Elle coasse à l’aide !', done: 'Libre ! Elle fait un bond dans ta main et ne bouge plus. C’est de la confiance.' },
    fact: 'Les grenouilles boivent par la peau : elles n’ont jamais besoin d’ouvrir la bouche pour boire.' }),
  C({ id: 'crevette', name: 'Crevette grise', habitat: 'rivage', spot: [20, 34], careDays: 2,
    rescue: { verb: 'L’attraper au filet', taps: 3, story: 'Des crevettes grises se sont retrouvées piégées dans une flaque chaude, au milieu de la plage.', done: 'Tu les ramènes dans un seau frais. Elles frétillent de soulagement.' },
    fact: 'La crevette grise s’enfouit dans le sable le jour et sort la nuit. Elle change de couleur pour se fondre dans le décor.' }),
  C({ id: 'triton', name: 'Triton marbré', habitat: 'mare', spot: [32, 11], careDays: 3,
    rescue: { verb: 'Soulever la planche', taps: 4, story: 'Un triton est coincé sous une vieille planche tombée, à la lisière de la forêt.', done: 'La planche bascule. Le triton, un peu aplati mais vivant, te remercie à sa façon : il cligne des yeux.' },
    fact: 'Le triton peut faire repousser une patte, une queue… et même une partie de son cœur ou de ses yeux !' }),
  C({ id: 'blennie', name: 'Blennie', habitat: 'rivage', spot: [33, 34], careDays: 2,
    rescue: { verb: 'La remettre à l’eau', taps: 3, story: 'Une blennie a sauté hors de sa flaque, sur les rochers du phare. Camille l’a vue.', done: 'Tu la ramènes dans ton seau. Elle a une tête de clown fatigué.' },
    fact: 'La blennie peut rester hors de l’eau un moment et sautille de flaque en flaque à marée basse.' }),
  C({ id: 'ecrevisse', name: 'Écrevisse à pattes blanches', habitat: 'mare', spot: [22, 8], careDays: 3,
    rescue: { verb: 'La récupérer', taps: 3, story: 'Une écrevisse à pattes blanches, très rare, s’est aventurée hors de l’eau pendant la nuit.', done: 'Tu la saisis délicatement par le dos. Elle agite les pinces, pour la forme.' },
    fact: 'L’écrevisse à pattes blanches ne vit que dans les eaux très pures. En voir une, c’est bon signe pour la mare !' }),
  C({ id: 'tanche', name: 'Tanche', habitat: 'mare', spot: [27, 15], careDays: 2,
    rescue: { verb: 'L’attraper à l’épuisette', taps: 4, story: 'La Pr Gobie a repéré une tanche prise dans un sac plastique au fond de la mare.', done: 'Tu retires le sac. La tanche file dans le seau. La Pr Gobie applaudit de loin.' },
    fact: 'On surnomme la tanche « le poisson médecin » : on racontait autrefois que les autres poissons venaient se frotter à son mucus pour guérir.' }),
  // --- le large : sauvés en mer, au hasard
  C({ id: 'bar', name: 'Bar', habitat: 'large', careDays: 2, rescue: { verb: 'Couper le filet', taps: 4, story: '', done: '' }, fact: 'Le bar chasse en bande près des côtes, dans les vagues. Les pêcheurs l’appellent « le loup ».' }),
  C({ id: 'maquereau', name: 'Maquereau', habitat: 'large', careDays: 2, rescue: { verb: 'Couper le filet', taps: 3, story: '', done: '' }, fact: 'Le maquereau n’a pas de vessie natatoire : il doit nager sans arrêt pour ne pas couler.' }),
  C({ id: 'raie', name: 'Raie brunette', habitat: 'large', careDays: 3, rescue: { verb: 'Décrocher l’hameçon', taps: 4, story: '', done: '' }, fact: 'La raie est une cousine du requin. Elle « vole » sous l’eau en ondulant ses grandes nageoires.' }),
  C({ id: 'poulpe', name: 'Poulpe', habitat: 'large', careDays: 3, rescue: { verb: 'L’aider à sortir du casier', taps: 5, story: '', done: '' }, fact: 'Le poulpe a trois cœurs, du sang bleu, et neuf « cerveaux » : un central et un dans chaque bras.' }),
  C({ id: 'seiche', name: 'Seiche', habitat: 'large', careDays: 2, rescue: { verb: 'Démêler le filet', taps: 4, story: '', done: '' }, fact: 'La seiche change de couleur en une fraction de seconde. Elle fait même défiler des vagues de couleur sur sa peau.' }),
  C({ id: 'tortue', name: 'Tortue caouanne', habitat: 'large', careDays: 4, rescue: { verb: 'Couper les cordages', taps: 6, story: '', done: '' }, fact: 'La tortue caouanne traverse des océans entiers et revient pondre sur la plage où elle est née, trente ans plus tard.' }),
  C({ id: 'mole', name: 'Poisson-lune', habitat: 'large', careDays: 4, rescue: { verb: 'Le guider vers le large', taps: 5, story: '', done: '' }, fact: 'Le poisson-lune est le plus lourd des poissons osseux : plus d’une tonne ! Il se nourrit surtout de méduses.' }),
];

export const CREATURE_BY_ID = Object.fromEntries(CREATURES.map((c) => [c.id, c])) as Record<string, Creature>;
export const MISSION_ORDER = CREATURES.filter((c) => c.habitat !== 'large').map((c) => c.id);
export const SEA_UNLOCK = 5;
export const HABITAT_NAMES: Record<Habitat, string> = { mare: 'La mare', rivage: 'Le rivage', large: 'Le large' };

// ------------------------------------------------------------ fossiles et trésors

export type Skeleton = 'trex' | 'plesio';
export const SKELETON_PARTS = ['crane', 'machoire', 'cou', 'dos', 'cotes', 'bassin', 'pattes', 'queue'] as const;
export type Part = (typeof SKELETON_PARTS)[number];

export const SKELETONS: Record<Skeleton, { name: string; parts: Record<Part, string>; fact: string }> = {
  trex: {
    name: 'Tyrannosaure',
    parts: { crane: 'Crâne', machoire: 'Mâchoire', cou: 'Vertèbres du cou', dos: 'Colonne vertébrale', cotes: 'Côtes', bassin: 'Bassin', pattes: 'Pattes', queue: 'Queue' },
    fact: 'Le tyrannosaure avait des dents longues comme des bananes, et des bras si courts qu’il ne pouvait pas se gratter le nez.',
  },
  plesio: {
    name: 'Plésiosaure',
    parts: { crane: 'Crâne', machoire: 'Mâchoire', cou: 'Long cou', dos: 'Colonne vertébrale', cotes: 'Côtes', bassin: 'Bassin', pattes: 'Nageoires', queue: 'Queue' },
    fact: 'Le plésiosaure, cousin marin des dinosaures, « volait » sous l’eau avec quatre grandes nageoires, comme une tortue géante au long cou.',
  },
};

export const TREASURES: { id: string; name: string; fact: string }[] = [
  { id: 'ammonite', name: 'Ammonite', fact: 'Cousine lointaine du poulpe, l’ammonite vivait dans une coquille en spirale. Elle a disparu avec les dinosaures.' },
  { id: 'trilobite', name: 'Trilobite', fact: 'Le trilobite a arpenté les fonds marins pendant 270 millions d’années. Il avait des yeux… en cristal de calcite !' },
  { id: 'megalodon', name: 'Dent de mégalodon', fact: 'Le mégalodon, requin géant, avait des dents grandes comme une main. Il mesurait jusqu’à 18 mètres.' },
  { id: 'oursin', name: 'Oursin fossile', fact: 'Autrefois, on appelait ces oursins fossiles « pierres de tonnerre » et on les posait sur les fenêtres contre la foudre.' },
  { id: 'ambre', name: 'Ambre', fact: 'L’ambre est de la résine d’arbre fossilisée. Certains morceaux renferment des insectes vieux de millions d’années.' },
  { id: 'nautile', name: 'Coquille de nautile', fact: 'Le nautile existe depuis 500 millions d’années. Sa coquille suit presque parfaitement une spirale.' },
  { id: 'crinoide', name: 'Crinoïde', fact: 'Le crinoïde ressemble à une fleur, mais c’est un animal : un cousin de l’étoile de mer, fixé au fond par une tige.' },
];

export type FindId = `${Skeleton}:${Part}` | `tresor:${string}`;

export function findName(id: FindId): string {
  const [kind, key] = id.split(':');
  if (kind === 'tresor') return TREASURES.find((t) => t.id === key)?.name ?? key;
  const sk = SKELETONS[kind as Skeleton];
  return `${sk.parts[key as Part]} de ${sk.name.toLowerCase()}`;
}

export const ALL_FINDS: FindId[] = [
  ...(['trex', 'plesio'] as const).flatMap((s) => SKELETON_PARTS.map((p) => `${s}:${p}` as FindId)),
  ...TREASURES.map((t) => `tresor:${t.id}` as FindId),
];

// ------------------------------------------------------------------ état

export interface Museum {
  donated: string[];
  finds: FindId[];
  /** Objets trouvés, pas encore donnés. */
  bag: FindId[];
  /** Mission en cours : trouver la créature, la ramener, puis la soigner. */
  mission: { creature: string; stage: 'find' | 'carry' | 'care'; cared: number; lastCare: number } | null;
  lastSeaDay: number;
  dugToday: { day: number; spots: number[] };
  metOctave: boolean;
}

export const newMuseum = (): Museum => ({ donated: [], finds: [], bag: [], mission: null, lastSeaDay: 0, dugToday: { day: 0, spots: [] }, metOctave: false });

export const nextMissionCreature = (m: Museum): string | null => MISSION_ORDER.find((id) => !m.donated.includes(id)) ?? null;
export const seaUnlocked = (m: Museum) => m.donated.length >= SEA_UNLOCK;
export const canSail = (m: Museum, day: number) => seaUnlocked(m) && !m.mission && m.lastSeaDay !== day && CREATURES.some((c) => c.habitat === 'large' && !m.donated.includes(c.id));

/** Octave confie la mission suivante (si l'infirmerie est libre). */
export function assignMission(m: Museum): string | null {
  if (m.mission) return null;
  const id = nextMissionCreature(m);
  if (!id) return null;
  m.mission = { creature: id, stage: 'find', cared: 0, lastCare: 0 };
  return id;
}

export function rescued(m: Museum): boolean {
  if (m.mission?.stage !== 'find') return false;
  m.mission.stage = 'carry';
  return true;
}

export function admit(m: Museum): boolean {
  if (m.mission?.stage !== 'carry') return false;
  m.mission.stage = 'care';
  return true;
}

/** Un soin par jour. Renvoie vrai quand la créature est guérie. */
export function care(m: Museum, day: number): 'done-today' | 'better' | 'healed' | null {
  const ms = m.mission;
  if (ms?.stage !== 'care') return null;
  if (ms.lastCare === day) return 'done-today';
  ms.lastCare = day;
  ms.cared++;
  return ms.cared >= CREATURE_BY_ID[ms.creature].careDays ? 'healed' : 'better';
}

export function release(m: Museum): string | null {
  const ms = m.mission;
  if (ms?.stage !== 'care' || ms.cared < CREATURE_BY_ID[ms.creature].careDays) return null;
  m.donated.push(ms.creature);
  m.mission = null;
  return ms.creature;
}

/** Sortie en mer : une créature du large au hasard, encore absente de l'aquarium. */
export function sail(m: Museum, day: number, rng: () => number): string | null {
  if (!canSail(m, day)) return null;
  const pool = CREATURES.filter((c) => c.habitat === 'large' && !m.donated.includes(c.id));
  const c = pool[Math.floor(rng() * pool.length)];
  m.lastSeaDay = day;
  m.mission = { creature: c.id, stage: 'find', cared: 0, lastCare: 0 };
  return c.id;
}

// ------------------------------------------------------------------ fouilles

export const DIG_SPOTS_PER_DAY = 3;

/** Les points à creuser du jour (indices dans la liste des emplacements possibles). */
export function digSpots(day: number, candidates: number): number[] {
  const out: number[] = [];
  for (let k = 0; out.length < Math.min(DIG_SPOTS_PER_DAY, candidates) && k < 50; k++) {
    const i = Math.floor(hash(day, k, 77) * candidates);
    if (!out.includes(i)) out.push(i);
  }
  return out;
}

/** Creuser : d'abord ce qui manque au musée, parfois un doublon (qu'Octave rachète). */
export function dig(m: Museum, day: number, spot: number, rng: () => number): { find: FindId; duplicate: boolean } | null {
  if (m.dugToday.day !== day) m.dugToday = { day, spots: [] };
  if (m.dugToday.spots.includes(spot)) return null;
  m.dugToday.spots.push(spot);
  const missing = ALL_FINDS.filter((f) => !m.finds.includes(f) && !m.bag.includes(f));
  const duplicate = !missing.length || rng() < 0.15;
  const find = duplicate ? ALL_FINDS[Math.floor(rng() * ALL_FINDS.length)] : missing[Math.floor(rng() * missing.length)];
  if (!duplicate) m.bag.push(find);
  return { find, duplicate };
}

/** Donner au musée tout ce qu'on a trouvé. */
export function donateFinds(m: Museum): FindId[] {
  const given = m.bag.filter((f) => !m.finds.includes(f));
  m.finds.push(...given);
  m.bag = [];
  return given;
}

export const skeletonProgress = (m: Museum, s: Skeleton) => SKELETON_PARTS.filter((p) => m.finds.includes(`${s}:${p}`)).length;
