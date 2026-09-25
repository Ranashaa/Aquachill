// Visiteurs : un gabarit de personnage 9×13 recoloré, avec 3 images (debout, marche ×2).
// Les stars réutilisent le gabarit avec des lignes personnalisées.
import type { StarId } from '../../data/stars';
import { seeded, pick } from '../../systems/rng';
import { VISITOR_LOOKS } from '../../systems/visitors';
import type { SpriteDef } from '../SpriteFactory';

type HairStyle = 'short' | 'long' | 'cap' | 'bun' | 'bald';

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
  /** Sprite entièrement personnalisé (une seule image, animé par rebond). */
  custom?: string[];
}

const BASE = [
  '.........',
  '...HHH...',
  '..HHHHH..',
  '..HESEH..',
  '...SSS...',
  '..TTTTT..',
  '.TTTTTTT.',
  '.S.TTT.S.',
  '...PPP...',
  '..PP.PP..',
  '..PP.PP..',
  '..FF.FF..',
  '.........',
];

const LEGS = [
  ['..PP.PP..', '..PP.PP..', '..FF.FF..'],
  ['..PP.PP..', '.PP...PP.', '.FF...FF.'],
  ['...PPP...', '...PPP...', '...FFF...'],
];

const DRESS_LEGS = [
  ['..TTTTT..', '...S.S...', '..FF.FF..'],
  ['..TTTTT..', '..S...S..', '.FF...FF.'],
  ['..TTTTT..', '...SSS...', '...FFF...'],
];

function hairRows(style: HairStyle): Record<number, string> {
  switch (style) {
    case 'short': return {};
    case 'long': return { 4: '..HSSSH..', 5: '..HTTTH..' };
    case 'cap': return { 1: '...CCC...', 2: '..CCCCCC.', 3: '..HESEH..' };
    case 'bun': return { 0: '....H....' };
    case 'bald': return { 1: '...SSS...', 2: '..SSSSS..' };
  }
}

export function personFrames(spec: PersonSpec): SpriteDef[] {
  const palette: Record<string, string> = {
    H: spec.hair, S: spec.skin, E: '#1e1a24', T: spec.shirt, P: spec.pants, F: spec.shoes,
    C: spec.cap ?? spec.shirt, ...spec.extra,
  };
  if (spec.custom) return [{ palette, rows: spec.custom }];
  const rows = BASE.slice();
  Object.assign(rows, hairRows(spec.hairStyle));
  if (spec.dress) rows[8] = '..TTTTT..';
  if (spec.rows) Object.assign(rows, spec.rows);
  const legs = spec.dress ? DRESS_LEGS : LEGS;
  return legs.map((leg) => {
    const r = rows.slice();
    for (let i = 0; i < 3; i++) if (!spec.rows?.[9 + i]) r[9 + i] = leg[i];
    return { palette, rows: r };
  });
}

// --------------------------------------------------------- visiteurs lambda

const SKINS = ['#f6d2b0', '#e8b890', '#c98e62', '#a0673e', '#6e4426'];
const HAIRS = ['#3a2a1e', '#6b4226', '#1e1a18', '#e8c46a', '#c8552a', '#b8b8b8', '#6a4aa8', '#e87aa8'];
const STYLES: HairStyle[] = ['short', 'short', 'long', 'long', 'cap', 'bun', 'bald'];
const SHIRTS = ['#e8605a', '#5a9ae8', '#7ac87a', '#f0c24a', '#b07ad8', '#f4f0e8', '#4ac0c0', '#f08a3a'];
const PANTS = ['#3a4a7a', '#5a4a3a', '#2a2a30', '#8a8a90', '#6a8a5a'];
const SHOES = ['#2a2020', '#5a3a2a', '#e8e8e8'];

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

const SKIN = '#f6d2b0';

export const STAR_SPECS: Record<StarId, PersonSpec> = {
  // Livreur roux, veste rouge sur t-shirt blanc, jean
  fray: {
    skin: SKIN, hair: '#f07a2a', hairStyle: 'short', shirt: '#d8402f', pants: '#3f63b0', shoes: '#222222',
    extra: { w: '#f4f4f4' },
    rows: { 1: '...HHHH..', 5: '..TTwTT..', 6: '.TTTwTTT.' },
  },
  // Éponge jaune carrée, chemise blanche, cravate rouge, short marron
  bob: {
    skin: '#ffe14a', hair: '#ffe14a', hairStyle: 'short', shirt: '#f4f4f4', pants: '#ffe14a', shoes: '#222222',
    extra: { Y: '#ffe14a', y: '#c8b030', W: '#ffffff', B: '#3a8ad8', r: '#d83a3a', N: '#9a6a30' },
    rows: {
      1: '.YyYYYyY.',
      2: '.YWWYWWY.',
      3: '.YWBYBWY.',
      4: '.YYrrrYY.',
      5: '.YYYYYYY.',
      6: '.WWWrWWW.',
      7: '.NNNNNNN.',
      8: '..NN.NN..',
    },
  },
  // Plombier : casquette rouge, moustache, salopette bleue
  marius: {
    skin: SKIN, hair: '#5a3a1a', hairStyle: 'cap', cap: '#e03a2a', shirt: '#e03a2a', pants: '#2b5ad0', shoes: '#6a3a1a',
    extra: { m: '#3a2412', O: '#2b5ad0', y: '#ffd23a' },
    rows: { 4: '..mmmmm..', 5: '..OTTTO..', 6: '.TOOyOOT.', 7: '.S.OOO.S.', 8: '...OOO...' },
  },
  // Capitaine : casquette marine, barbe noire, pull bleu à ancre
  hadoque: {
    skin: SKIN, hair: '#1e1a18', hairStyle: 'cap', cap: '#1d2a4a', shirt: '#1e3f86', pants: '#333333', shoes: '#1a1a1a',
    extra: { B: '#1e1a18', a: '#ffd23a', w: '#f4f4f4' },
    rows: { 1: '...wCw...', 4: '..BBSBB..', 6: '.TTTaTTT.' },
  },
  // Chauve à la peau jaune, deux cheveux, barbe de trois jours, chemise blanche
  homere: {
    skin: '#ffd94a', hair: '#2a2420', hairStyle: 'bald', shirt: '#f4f4ee', pants: '#4a78c8', shoes: '#555555',
    extra: { s: '#b89a6a', W: '#ffffff' },
    rows: { 0: '...H.H...', 1: '..HSSS...', 3: '..SWSWS..', 4: '..sssss..' },
  },
  // Héros au bonnet vert pointu, tunique verte
  lynk: {
    skin: SKIN, hair: '#e8c46a', hairStyle: 'short', shirt: '#3aa84a', pants: '#eeeeee', shoes: '#6a3a1a',
    extra: { G: '#3aa84a', b: '#6a3a1a' },
    rows: { 0: '...GGG...', 1: '..GGGGG..', 2: '.GHHHHHG.', 3: 'G.HESEH..', 8: '..bbbbb..' },
  },
  // Petite fille-poisson aux cheveux rouges, robe rouge
  pomyo: {
    skin: SKIN, hair: '#e8453c', hairStyle: 'long', shirt: '#e8453c', pants: SKIN, shoes: '#e8453c', dress: true,
  },
  // Savant aux cheveux blancs en pétard, blouse blanche
  doc: {
    skin: SKIN, hair: '#f2f2f2', hairStyle: 'short', shirt: '#f0f0f0', pants: '#555555', shoes: '#1a1a1a',
    extra: { o: '#e8883a' },
    rows: { 1: 'H.HHHHH.H', 2: '.HHHHHHH.', 3: '.HHESEHH.', 5: '..TToTT..', 6: '.TTToTTT.' },
  },
  // Grand esprit de la forêt, gris au ventre clair
  totore: {
    skin: '#8f97a3', hair: '#8f97a3', hairStyle: 'short', shirt: '#8f97a3', pants: '#8f97a3', shoes: '#222222',
    extra: { g: '#8f97a3', w: '#eee4c8', W: '#8f97a3', k: '#222222', e: '#ffffff' },
    custom: [
      '..g.....g..',
      '..gg...gg..',
      '.ggggggggg.',
      '.gekgggekg.',
      'gggggkggggg',
      'ggwwwwwwwgg',
      'gwwWwWwWwwg',
      'gwwwwwwwwwg',
      'gwwWwWwWwwg',
      'gwwwwwwwwwg',
      '.gwwwwwwwg.',
      '..ggggggg..',
      '..kg...gk..',
    ],
  },
  // Commandant au bonnet rouge, chemise bleu ciel
  custeau: {
    skin: SKIN, hair: '#b8b8b8', hairStyle: 'short', shirt: '#8fbfe8', pants: '#2a3f66', shoes: '#1a1a1a',
    extra: { R: '#d8342c' },
    rows: { 0: '...RR....', 1: '..RRRR...', 2: '..RRRRR..' },
  },
  // Robot gris à antenne, visière et grille
  bendeur: {
    skin: '#a9b4bf', hair: '#a9b4bf', hairStyle: 'short', shirt: '#a9b4bf', pants: '#a9b4bf', shoes: '#6d7680',
    extra: { G: '#a9b4bf', a: '#6d7680', V: '#2a2a30', y: '#fff4a0', m: '#e8e8e8' },
    rows: {
      0: '....a....',
      1: '...GGG...',
      2: '..GGGGG..',
      3: '..VyVyV..',
      4: '..GmmmG..',
      5: '..GGGGG..',
      6: '.GGGGGGG.',
      7: '.G.GGG.G.',
      8: '...GGG...',
    },
  },
  // Seigneur au casque noir et au panneau lumineux
  vadeur: {
    skin: '#1a1a1e', hair: '#1a1a1e', hairStyle: 'short', shirt: '#1a1a1e', pants: '#1a1a1e', shoes: '#0a0a0c',
    extra: { K: '#1a1a1e', e: '#6a6a78', g: '#8a8a94', r: '#e83a3a', G: '#3ae86a', b: '#3a8ae8' },
    rows: {
      0: '...KKK...',
      1: '..KKKKK..',
      2: '.KKKKKKK.',
      3: '.KKeKeKK.',
      4: '.KKgggKK.',
      5: '..KKKKK..',
      6: '.KKrGbKK.',
      7: '.K.KKK.K.',
      8: '...KKK...',
    },
  },
};
