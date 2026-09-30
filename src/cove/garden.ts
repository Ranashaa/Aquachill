// Le potager du soigneur : graines, arrosage, récolte, coffre d'expédition
// vendu la nuit, et cadeaux aux habitués. Logique pure, sans Phaser.
import type { Line, Npc, Relation } from './dialogue';
import { HEART, MAX_HEARTS } from './dialogue';

export type Crop = 'radis' | 'fraise' | 'tournesol' | 'lavande';

export interface CropInfo {
  name: string;
  plural: string;
  /** Jours d'arrosage avant la récolte. */
  days: number;
  seed: number;
  sell: number;
  /** Repousse en N jours après la récolte. */
  regrow?: number;
  blurb: string;
}

export const CROPS: Record<Crop, CropInfo> = {
  radis: { name: 'Radis', plural: 'radis', days: 2, seed: 10, sell: 28, blurb: 'Prêt en 2 jours. Croquant et un peu piquant.' },
  fraise: { name: 'Fraise', plural: 'fraises', days: 3, seed: 20, sell: 40, regrow: 2, blurb: 'Prête en 3 jours, puis repousse tous les 2 jours.' },
  tournesol: { name: 'Tournesol', plural: 'tournesols', days: 4, seed: 25, sell: 75, blurb: 'Prêt en 4 jours. Il suit le soleil.' },
  lavande: { name: 'Lavande', plural: 'lavandes', days: 3, seed: 15, sell: 45, blurb: 'Prête en 3 jours. Sent bon les vacances.' },
};
export const CROP_LIST = Object.keys(CROPS) as Crop[];

export const PLOT_COLS = 4;
export const PLOT_ROWS = 3;
/** Coin haut-gauche du potager (en tuiles). */
export const PLOT_X = 2;
export const PLOT_Y = 13;

export interface Plot {
  crop: Crop | null;
  grown: number;
  watered: boolean;
}

export interface Farm {
  coins: number;
  seeds: Partial<Record<Crop, number>>;
  bag: Partial<Record<Crop, number>>;
  bin: Partial<Record<Crop, number>>;
  plots: Plot[];
  /** Dernier jour où chaque habitué a reçu un cadeau. */
  gifted: Partial<Record<Npc, number>>;
}

export const newFarm = (): Farm => ({
  coins: 100,
  seeds: { radis: 3, fraise: 1 },
  bag: {},
  bin: {},
  plots: Array.from({ length: PLOT_COLS * PLOT_ROWS }, () => ({ crop: null, grown: 0, watered: false })),
  gifted: {},
});

export const plotIndex = (tx: number, ty: number): number | null => {
  const x = tx - PLOT_X;
  const y = ty - PLOT_Y;
  return x >= 0 && y >= 0 && x < PLOT_COLS && y < PLOT_ROWS ? y * PLOT_COLS + x : null;
};

export const isReady = (p: Plot) => !!p.crop && p.grown >= CROPS[p.crop].days;
/** Stade visuel : 0 graine, 1 pousse, 2 plante, 3 prête. */
export function stage(p: Plot): 0 | 1 | 2 | 3 {
  if (!p.crop) return 0;
  if (isReady(p)) return 3;
  const k = p.grown / CROPS[p.crop].days;
  return k === 0 ? 0 : k < 0.5 ? 1 : 2;
}

const add = (bag: Partial<Record<Crop, number>>, c: Crop, n: number) => {
  bag[c] = (bag[c] ?? 0) + n;
  if (!bag[c]) delete bag[c];
};

export function buySeed(f: Farm, c: Crop): boolean {
  if (f.coins < CROPS[c].seed) return false;
  f.coins -= CROPS[c].seed;
  add(f.seeds, c, 1);
  return true;
}

/** Planter compte comme l'arrosage du jour. */
export function plant(f: Farm, i: number, c: Crop): boolean {
  const p = f.plots[i];
  if (!p || p.crop || !(f.seeds[c]! > 0)) return false;
  add(f.seeds, c, -1);
  f.plots[i] = { crop: c, grown: 0, watered: true };
  return true;
}

export function water(f: Farm, i: number): boolean {
  const p = f.plots[i];
  if (!p?.crop || p.watered || isReady(p)) return false;
  p.watered = true;
  return true;
}

export function harvest(f: Farm, i: number): Crop | null {
  const p = f.plots[i];
  if (!p || !isReady(p)) return null;
  const c = p.crop!;
  add(f.bag, c, 1);
  const regrow = CROPS[c].regrow;
  f.plots[i] = regrow ? { crop: c, grown: CROPS[c].days - regrow, watered: false } : { crop: null, grown: 0, watered: false };
  return c;
}

export function ship(f: Farm, c: Crop, n = 1): number {
  const k = Math.min(n, f.bag[c] ?? 0);
  if (k <= 0) return 0;
  add(f.bag, c, -k);
  add(f.bin, c, k);
  return k;
}

export function unship(f: Farm, c: Crop): void {
  const k = f.bin[c] ?? 0;
  add(f.bin, c, -k);
  add(f.bag, c, k);
}

export const binValue = (f: Farm) => CROP_LIST.reduce((s, c) => s + (f.bin[c] ?? 0) * CROPS[c].sell, 0);

export interface NightRecap {
  sold: { crop: Crop; qty: number; coins: number }[];
  total: number;
  grew: number;
  ready: number;
}

/** La nuit : les plantes arrosées poussent, le coffre est vendu. */
export function night(f: Farm): NightRecap {
  const recap: NightRecap = { sold: [], total: 0, grew: 0, ready: 0 };
  for (const p of f.plots) {
    if (p.crop && p.watered && !isReady(p)) {
      p.grown++;
      recap.grew++;
      if (isReady(p)) recap.ready++;
    }
    p.watered = false;
  }
  for (const c of CROP_LIST) {
    const qty = f.bin[c] ?? 0;
    if (!qty) continue;
    const coins = qty * CROPS[c].sell;
    recap.sold.push({ crop: c, qty, coins });
    recap.total += coins;
  }
  f.coins += recap.total;
  f.bin = {};
  return recap;
}

// ------------------------------------------------------------------ cadeaux

export type Taste = 'love' | 'like' | 'neutral';

const TASTES: Record<Npc, { love: Crop[]; like: Crop[]; replies: Record<Taste, Line[]> }> = {
  elio: {
    love: ['fraise'], like: ['lavande'],
    replies: {
      love: [{ text: 'Des fraises ! Demain, tarte aux fraises à la buvette. Et la première part est pour toi.', mood: 'happy' }],
      like: [{ text: 'De la lavande… Un pain à la lavande, ça existe ? Ça va exister.', mood: 'happy' }],
      neutral: [{ text: 'Merci ! Je trouverai bien une recette.', mood: 'neutral' }],
    },
  },
  maelle: {
    love: ['radis'], like: ['tournesol'],
    replies: {
      love: [{ text: 'Des radis ! Le meilleur casse-croûte en mer. Tu as tout compris.', mood: 'happy' }],
      like: [{ text: 'Un tournesol. Je vais l’accrocher au mât. La mouette va être jalouse.', mood: 'happy' }],
      neutral: [{ text: 'Merci. C’est gentil d’avoir pensé à moi.', mood: 'blush' }],
    },
  },
  yanis: {
    love: ['tournesol'], like: ['fraise'],
    replies: {
      love: [{ text: 'Un tournesol ! Il va me regarder jouer. Enfin un public qui ne s’envole pas.', mood: 'happy' }],
      like: [{ text: 'Une fraise. Il y a une chanson là-dedans, je la sens.', mood: 'happy' }],
      neutral: [{ text: 'Merci ! Je vais la poser sur ma guitare, pour l’inspiration.', mood: 'neutral' }],
    },
  },
  camille: {
    love: ['lavande'], like: ['radis'],
    replies: {
      love: [{ text: 'De la lavande… Ça sent comme les nuits d’été en haut du phare. Merci.', mood: 'blush' }],
      like: [{ text: 'Un radis ! Bouée va essayer de le voler. Je le défendrai.', mood: 'happy' }],
      neutral: [{ text: 'Merci. Je le garde près de la lampe.', mood: 'neutral' }],
    },
  },
  marcel: {
    love: ['radis'], like: ['lavande'],
    replies: {
      love: [{ text: 'Des radis ! Comme ceux du jardin de Josiane…', mood: 'surprised' }, { text: 'Merci, [petit|petite|gamin·e]. Vraiment.', mood: 'blush' }],
      like: [{ text: 'De la lavande. Josiane va croire que j’ai une admiratrice.', mood: 'happy' }],
      neutral: [{ text: 'Hmpf. C’est gentil. Je ne sais pas quoi en faire, mais c’est gentil.', mood: 'neutral' }],
    },
  },
  lila: {
    love: ['fraise'], like: ['tournesol'],
    replies: {
      love: [{ text: 'UNE FRAISE ! C’est le plus beau jour de ma vie !', mood: 'surprised' }, { text: 'Je la partage avec Gérard. Enfin, un tout petit bout.', mood: 'happy' }],
      like: [{ text: 'Un tournesol ! Il est plus grand que moi. Presque.', mood: 'happy' }],
      neutral: [{ text: 'Oh. Merci. …Ça se mange ?', mood: 'neutral' }],
    },
  },
  gobie: {
    love: ['lavande'], like: ['radis'],
    replies: {
      love: [{ text: 'Lavandula angustifolia ! Un spécimen parfait !', mood: 'surprised' }, { text: 'Je vais la faire sécher dans mon carnet. Si je retrouve mon carnet.', mood: 'blush' }],
      like: [{ text: 'Un radis ! Raphanus sativus. Croquant, scientifiquement parlant.', mood: 'happy' }],
      neutral: [{ text: 'Merci ! Je vais l’étudier. Sous toutes les coutures.', mood: 'neutral' }],
    },
  },
  nina: {
    love: ['tournesol'], like: ['fraise'],
    replies: {
      love: [{ text: 'Un tournesol… Regarde comme il attrape la lumière !', mood: 'surprised' }, { text: 'Tu viens de me donner ma prochaine photo. Merci.', mood: 'blush' }],
      like: [{ text: 'Une fraise ! Photo d’abord, dégustation ensuite.', mood: 'happy' }],
      neutral: [{ text: 'Merci ! Je trouverai bien un angle.', mood: 'neutral' }],
    },
  },
};

export const tasteOf = (npc: Npc, c: Crop): Taste => (TASTES[npc].love.includes(c) ? 'love' : TASTES[npc].like.includes(c) ? 'like' : 'neutral');
export const GIFT_POINTS: Record<Taste, number> = { love: 80, like: 45, neutral: 20 };
export const canGift = (f: Farm, npc: Npc, day: number) => f.gifted[npc] !== day && CROP_LIST.some((c) => (f.bag[c] ?? 0) > 0);

export function giveGift(f: Farm, rel: Relation, npc: Npc, c: Crop, day: number): { taste: Taste; reply: Line[] } | null {
  if (f.gifted[npc] === day || !(f.bag[c]! > 0)) return null;
  add(f.bag, c, -1);
  f.gifted[npc] = day;
  const taste = tasteOf(npc, c);
  rel.points = Math.min(MAX_HEARTS * HEART, rel.points + GIFT_POINTS[taste]);
  return { taste, reply: TASTES[npc].replies[taste] };
}
