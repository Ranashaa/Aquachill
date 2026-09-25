// Visiteurs façon Tiny Tower : gabarit 14×22 à grosse tête et contours sombres,
// recoloré à l'infini. 4 images : debout, marche ×2, de dos (en admiration).
// Les stars réutilisent le gabarit avec des lignes personnalisées.
import type { StarId } from '../../data/stars';
import { pick, seeded } from '../../systems/rng';
import { VISITOR_LOOKS } from '../../systems/visitors';
import type { SpriteDef } from '../SpriteFactory';

export type HairStyle = 'short' | 'long' | 'cap' | 'bun' | 'bald' | 'curly';

export interface PersonSpec {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  shirt: string;
  pants: string;
  shoes: string;
  cap?: string;
  dress?: boolean;
  /** Lignes remplacées (index → contenu), appliquées à toutes les images. */
  rows?: Record<number, string>;
  /** Couleurs supplémentaires pour les lignes personnalisées. */
  extra?: Record<string, string>;
  /** Sprite entièrement personnalisé (une image, animée par rebond). */
  custom?: string[];
}

export const OUTLINE = '#2b2238';

// o contour · H/h cheveux · S peau · E yeux · m bouche · c joues · T/t haut · P/p bas · F chaussures
const BASE = [
  '....oooooo....',
  '...oHHHHHHo...',
  '..oHHHHHHHho..',
  '..oHHHHHHHho..',
  '..oHSSSSSSHo..',
  '..oSSSSSSSSo..',
  '..oSSESSESSo..',
  '..oSSESSESSo..',
  '..ocSSSSSSco..',
  '..oSSSmmSSSo..',
  '...oSSSSSSo...',
  '....oooooo....',
  '...oTTTTTTo...',
  '..oTTTTTTTto..',
  '.oTToTTTTotto.',
  '.oTToTTTTotto.',
  '.oSSoPPPPoSSo.',
  '..ooPPPPPPoo..',
  '...oPPooPpo...',
  '...oPPooPpo...',
  '...oFFooFFo...',
  '...ooo..ooo...',
];

const LEGS: string[][] = [
  ['...oPPooPpo...', '...oPPooPpo...', '...oFFooFFo...', '...ooo..ooo...'],
  ['..oPPo..oPpo..', '..oPPo..oPpo..', '..oFFo..oFFo..', '..ooo....ooo..'],
  ['....oPPPPo....', '....oPPPpo....', '....oFFFFo....', '....oooooo....'],
];

const DRESS: Record<number, string> = {
  16: '.oSSoTTTToSSo.',
  17: '..oTTTTTTTTo..',
  18: '.oTTTTTTTTTto.',
  19: '..oooSooSooo..',
};

const DRESS_FEET: string[][] = [
  ['...oFFooFFo...', '...ooo..ooo...'],
  ['..oFFo..oFFo..', '..ooo....ooo..'],
  ['....oFFFFo....', '....oooooo....'],
];

function hairRows(style: HairStyle, rows: string[]): void {
  const set = (i: number, col: number, ch: string) => {
    rows[i] = rows[i].slice(0, col) + ch + rows[i].slice(col + 1);
  };
  switch (style) {
    case 'short':
      return;
    case 'long':
      for (let i = 5; i <= 9; i++) {
        set(i, 3, 'H');
        set(i, 10, 'H');
      }
      rows[10] = '..oHSSSSSSHo..';
      rows[11] = '..oHooooooHo..';
      rows[12] = '..oHTTTTTTHo..';
      return;
    case 'cap':
      rows[1] = '...oCCCCCCo...';
      rows[2] = '..oCCCCCCCKo..';
      rows[3] = '.oKKKKKKKKKKo.';
      return;
    case 'bun':
      rows[0] = '....oHHHHo....';
      rows[1] = '...oHHhHHHo...';
      return;
    case 'bald':
      rows[1] = '...oSSSSSSo...';
      rows[2] = '..oSSSSSSSso..';
      rows[3] = '..oSSSSSSSso..';
      return;
    case 'curly':
      rows[0] = '...oooooooo...';
      rows[1] = '..oHHhHHhHHo..';
      rows[2] = '.oHHHHHHHHHho.';
      rows[3] = '.oHhHHHHHHHho.';
      rows[4] = '.oHHSSSSSSHHo.';
      rows[5] = '.oHSSSSSSSSHo.';
      return;
  }
}

export function darken(hex: string, f = 0.78): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.round(v * f).toString(16).padStart(2, '0');
  return `#${c((n >> 16) & 255)}${c((n >> 8) & 255)}${c(n & 255)}`;
}

function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t).toString(16).padStart(2, '0');
  return `#${ch(16)}${ch(8)}${ch(0)}`;
}

/** Image de dos : le visage laisse place aux cheveux (ou au crâne). */
function backView(rows: string[], bald: boolean): string[] {
  return rows.map((row, i) => (i >= 4 && i <= 10 ? row.replace(/[SEmc]/g, bald ? 'S' : 'H') : row));
}

export function personFrames(spec: PersonSpec): SpriteDef[] {
  const cap = spec.cap ?? spec.shirt;
  const palette: Record<string, string> = {
    o: OUTLINE, E: OUTLINE, m: '#8a3a4a',
    H: spec.hair, h: darken(spec.hair), S: spec.skin, s: darken(spec.skin, 0.88), c: mixHex(spec.skin, '#ff8a9a', 0.35),
    T: spec.shirt, t: darken(spec.shirt), P: spec.pants, p: darken(spec.pants), F: spec.shoes,
    C: cap, K: darken(cap, 0.7),
    ...spec.extra,
  };
  if (spec.custom) return [{ palette, rows: spec.custom }];
  const rows = BASE.slice();
  hairRows(spec.hairStyle, rows);
  if (spec.dress) Object.assign(rows, DRESS);
  if (spec.rows) Object.assign(rows, spec.rows);
  const frames = [0, 1, 2].map((f) => {
    const r = rows.slice();
    if (spec.dress) {
      if (!spec.rows?.[20]) r[20] = DRESS_FEET[f][0];
      if (!spec.rows?.[21]) r[21] = DRESS_FEET[f][1];
    } else {
      for (let i = 0; i < 4; i++) if (!spec.rows?.[18 + i]) r[18 + i] = LEGS[f][i];
    }
    return { palette, rows: r };
  });
  frames.push({ palette, rows: backView(frames[0].rows, spec.hairStyle === 'bald') });
  return frames;
}

// --------------------------------------------------------- visiteurs lambda

const SKINS = ['#fbd9bc', '#f0c29a', '#d49a6a', '#a8704a', '#74482c'];
const HAIRS = ['#4a3222', '#7a4a26', '#23191a', '#f0cc6a', '#d0602e', '#c8c8c8', '#7a58c0', '#f08ab8', '#3a8ad8'];
const STYLES: HairStyle[] = ['short', 'short', 'long', 'long', 'cap', 'bun', 'bald', 'curly'];
const SHIRTS = ['#f0706a', '#5aa2f0', '#7ad07a', '#f8cc4a', '#b884e0', '#f8f4ea', '#4ac8c8', '#f8923a', '#e85a8a'];
const PANTS = ['#3a4a8a', '#6a543a', '#2a2a34', '#8a8a96', '#5a7a4a', '#4a6ab0'];
const SHOES = ['#2b2238', '#6a3a2a', '#f0f0f0', '#c04040'];

export function visitorLooks(): PersonSpec[] {
  const rng = seeded(2024);
  return Array.from({ length: VISITOR_LOOKS }, () => ({
    skin: pick(SKINS, rng),
    hair: pick(HAIRS, rng),
    hairStyle: pick(STYLES, rng),
    shirt: pick(SHIRTS, rng),
    pants: pick(PANTS, rng),
    shoes: pick(SHOES, rng),
    cap: pick(SHIRTS, rng),
    dress: rng() < 0.25,
  }));
}

// ------------------------------------------------------------------ stars

const SKIN = '#fbd9bc';

export const STAR_SPECS: Record<StarId, PersonSpec> = {
  // Livreur roux, veste rouge sur t-shirt blanc, jean
  fray: {
    skin: SKIN, hair: '#f07a2a', hairStyle: 'short', shirt: '#d8402f', pants: '#3f63b0', shoes: OUTLINE,
    extra: { w: '#f4f4f4' },
    rows: {
      4: '..oHHHSSSSHo..',
      13: '..oTTTwwTTto..', 14: '.oTToTwwTotto.', 15: '.oTToTwwTotto.',
    },
  },
  // Éponge jaune carrée, chemise blanche, cravate rouge, short marron
  bob: {
    skin: '#ffe14a', hair: '#ffe14a', hairStyle: 'short', shirt: '#f4f4f4', pants: '#9a6a30', shoes: OUTLINE,
    extra: { Y: '#ffe14a', y: '#c8b030', W: '#ffffff', B: '#3a8ad8', r: '#d83a3a', w: '#f4f4f4', N: '#9a6a30' },
    custom: [
      '.oooooooooooo.',
      '.oYYyYYYYyYYo.',
      '.oYWWWYYWWWYo.',
      '.oYWBWYYWBWYo.',
      '.oYWWWYYWWWYo.',
      '.oYYYYrrYYYYo.',
      '.oYrYYYYYYrYo.',
      '.oYYrrrrrrYYo.',
      '.oYYYwwwwYYYo.',
      '.oYYyYYYYyYYo.',
      '.oYYYYYYYYYYo.',
      '.owwwwrrwwwwo.',
      '.owwwwrrwwwwo.',
      '.oNNNNNNNNNNo.',
      '.oNNNNNNNNNNo.',
      '.oooooooooooo.',
      '...oYo..oYo...',
      '...oYo..oYo...',
      '...owo..owo...',
      '...owo..owo...',
      '..oFFo..oFFo..',
      '..oooo..oooo..',
    ],
  },
  // Plombier : casquette rouge, moustache, salopette bleue, gants blancs
  marius: {
    skin: SKIN, hair: '#5a3a1a', hairStyle: 'cap', cap: '#e03a2a', shirt: '#e03a2a', pants: '#2b5ad0', shoes: '#6a3a1a',
    extra: { w: '#ffffff', y: '#ffd23a', O: '#2b5ad0', m: '#3a2412' },
    rows: {
      2: '..oCCCwwCCKo..',
      9: '..ommmmmmmmo..',
      13: '..oTOTTTTOto..', 14: '.oTToOyyOotto.', 15: '.oTToOOOOotto.', 16: '.owwoOOOOowwo.', 17: '..ooOOOOOOoo..',
    },
  },
  // Capitaine : casquette marine à badge doré, barbe noire, pull bleu à ancre
  hadoque: {
    skin: SKIN, hair: '#1e1a18', hairStyle: 'cap', cap: '#1d2a4a', shirt: '#1e3f86', pants: '#333333', shoes: OUTLINE,
    extra: { y: '#ffd23a', B: '#1e1a18', K: '#111111' },
    rows: {
      2: '..oCCCyyCCCo..',
      8: '..oBSSSSSSBo..', 9: '..oBBBmmBBBo..', 10: '...oBBBBBBo...', 11: '....oBBBBo....',
      13: '..oTTTyyTTto..', 14: '.oTToyyyyotto.', 15: '.oTToTyyTotto.',
    },
  },
  // Chauve à la peau jaune, deux cheveux, gros yeux, barbe de trois jours
  homere: {
    skin: '#ffd94a', hair: '#2a2420', hairStyle: 'bald', shirt: '#f4f4ee', pants: '#4a78c8', shoes: '#555555',
    extra: { W: '#ffffff', b: '#c8a070' },
    rows: {
      0: '.....o..o.....',
      4: '..oHSSSSSSSo..',
      6: '..oSWWSSWWSo..', 7: '..oSWESSWESo..', 8: '..obbbSSbbbo..', 9: '..obbbmmbbbo..', 10: '...obbbbbbo...',
    },
  },
  // Héros au bonnet vert pointu, tunique verte, ceinture
  lynk: {
    skin: SKIN, hair: '#f0cc6a', hairStyle: 'short', shirt: '#3aa84a', pants: '#f0ece0', shoes: '#6a3a1a',
    extra: { G: '#3aa84a', b: '#6a3a1a' },
    rows: {
      1: '...oGGGGGGo...', 2: '..oGGGGGGGGoo.', 3: '..oHHHHHHHHGGo', 4: '..oHSSSSSSHoGo',
      16: '.oSSobbbboSSo.',
    },
  },
  // Petite fille-poisson aux cheveux rouges, robe rouge
  pomyo: {
    skin: SKIN, hair: '#e8453c', hairStyle: 'long', shirt: '#e8453c', pants: SKIN, shoes: '#e8453c', dress: true,
  },
  // Savant aux cheveux blancs en pétard, blouse blanche
  doc: {
    skin: SKIN, hair: '#f2f2f2', hairStyle: 'curly', shirt: '#f0f0f0', pants: '#555555', shoes: OUTLINE,
    extra: { r: '#e8883a' },
    rows: {
      0: '.o.oooooooo.o.',
      13: '..oTTTrrTTto..', 14: '.oTToTrrTotto.', 15: '.oTToTrrTotto.',
    },
  },
  // Grand esprit de la forêt, gris au ventre clair
  totore: {
    skin: '#8f97a3', hair: '#8f97a3', hairStyle: 'short', shirt: '#8f97a3', pants: '#8f97a3', shoes: OUTLINE,
    extra: { G: '#8f97a3', w: '#eee4c8', g: '#8f97a3', W: '#ffffff', k: OUTLINE },
    custom: [
      '..oo........oo..',
      '..oGo......oGo..',
      '..oGGooooooGGo..',
      '.oGGGGGGGGGGGGo.',
      '.oGWkGGGGGGWkGo.',
      '.oGGGGGkkGGGGGo.',
      'oGGwGGGGGGGGwGGo',
      'oGGGwwwwwwwwGGGo',
      'oGGwwwwwwwwwwGGo',
      'oGwwgwwgwwgwwwGo',
      'oGwwwwwwwwwwwwGo',
      'oGwwwgwwgwwgwwGo',
      'oGwwwwwwwwwwwwGo',
      'oGGwwwwwwwwwwGGo',
      'oGGGwwwwwwwwGGGo',
      '.oGGGGGGGGGGGGo.',
      '.oGGGGGGGGGGGGo.',
      '..oGGGGGGGGGGo..',
      '..oGGGo..oGGGo..',
      '..owGwo..owGwo..',
      '..ooooo..ooooo..',
      '................',
    ],
  },
  // Commandant au bonnet rouge, chemise bleu ciel
  custeau: {
    skin: SKIN, hair: '#b8b8b8', hairStyle: 'short', shirt: '#8fbfe8', pants: '#2a3f66', shoes: OUTLINE,
    extra: { R: '#d8342c', r: '#a82a24' },
    rows: { 1: '...oRRRRRRo...', 2: '..oRRRRRRRRo..', 3: '..orrrrrrrro..' },
  },
  // Robot gris à antenne, visière et grille
  bendeur: {
    skin: '#a9b4bf', hair: '#a9b4bf', hairStyle: 'short', shirt: '#a9b4bf', pants: '#a9b4bf', shoes: '#5d6670',
    extra: { G: '#a9b4bf', g: '#7d8894', V: '#2a2a30', y: '#fff4a0', m: '#e8e8e8' },
    rows: {
      0: '......oo......',
      1: '....oooooo....', 2: '...oGGGGGGo...', 3: '..oGGGGGGGgo..', 4: '..oVVVVVVVVo..', 5: '..oVyyVVyyVo..',
      6: '..oVVVVVVVVo..', 7: '..oGGGGGGGgo..', 8: '..oGmmmmmmgo..', 9: '..oGmmmmmmgo..', 10: '..oGGGGGGGgo..',
      11: '...oooooooo...',
      12: '...oGGGGGGo...', 13: '..oGGGGGGGgo..', 14: '.oGGoGGGGoggo.', 15: '.oGGoGGGGoggo.', 16: '.oGGoGGGGoGGo.',
      17: '..ooGGGGGGoo..',
    },
  },
  // Seigneur au casque noir évasé et au panneau lumineux
  vadeur: {
    skin: '#1a1a1e', hair: '#1a1a1e', hairStyle: 'short', shirt: '#1a1a1e', pants: '#1a1a1e', shoes: '#0a0a0c',
    extra: { K: '#1a1a1e', k: '#3a3a44', e: '#6a6a78', g: '#8a8a94', r: '#e83a3a', G: '#3ae86a', b: '#3a8ae8', o: '#000000' },
    rows: {
      1: '...oKKKKKKo...', 2: '..oKKKKKKKKo..', 3: '..oKkKKKKkKo..', 4: '.oKKeeKKeeKKo.', 5: '.oKKKKKKKKKKo.',
      6: '.oKKKggggKKKo.', 7: '.oKKKggggKKKo.', 8: 'oKKKKKKKKKKKKo', 9: 'oooooooooooooo', 10: '...oKKKKKKo...',
      12: '...oKKKKKKo...', 13: '..oKKKKKKKKo..', 14: '.oKKorGbKoKKo.', 15: '.oKKoKKKKoKKo.', 16: '.oKKoKKKKoKKo.',
      17: '..ooKKKKKKoo..',
    },
  },
};
