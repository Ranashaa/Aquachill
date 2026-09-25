// Sprites des poissons, tête à droite. Couleurs et motifs fidèles aux vraies espèces.
import type { SpeciesId } from '../../data/species';
import type { FishSpriteDef } from '../SpriteFactory';

export const FISH_SPRITES: Record<SpeciesId, FishSpriteDef> = {
  // Chrysiptera cyanea : bleu électrique, queue orange (mâle)
  demoiselle: {
    tail: 2,
    palette: { d: '#2346c4', B: '#3f7df5', l: '#8cb8ff', o: '#ff9a3c', e: '#101428' },
    rows: [
      '......dd....',
      '....ddBBd...',
      'oo.dBBBBBB..',
      'ooBBBBBBBeB.',
      'oo.BlBBBBBBB',
      '....lBBBBl..',
      '......ll....',
    ],
  },
  // Amphiprion ocellaris : orange, trois bandes blanches liserées de noir
  clown: {
    tail: 2,
    palette: { O: '#ff7b1c', W: '#fff8ee', k: '#231a24', e: '#101010' },
    rows: [
      '......kkk....',
      'k...kkOWOk...',
      'Ok.kWOOWOOWO.',
      'OOkWWOOWWOWeO',
      'OOkWWOOWWOWOO',
      'Ok.kWOOWOOWO.',
      'k...kOkWkOk..',
      '......k......',
    ],
  },
  // Gramma loreto : avant violet, arrière jaune, tache noire sur la dorsale
  gramma: {
    tail: 2,
    palette: { P: '#b24be0', p: '#8a2fc0', y: '#ffd43b', k: '#1a1020', e: '#120a18' },
    rows: [
      '......ppkp..',
      '..yyyypPPp..',
      'yyyyyyPPPPP.',
      'yyyyyyPPPeP.',
      'yyyyyyPPPPPP',
      '..yyyyPPPp..',
      '....yy.pp...',
    ],
  },
  // Paracanthurus hepatus : bleu roi, motif noir « palette », queue jaune
  chirurgien: {
    tail: 3,
    palette: { B: '#2c5fe0', b: '#5b8cff', k: '#141633', Y: '#ffd02b', e: '#0d0d1a' },
    rows: [
      '......kkkkk....',
      '....kkBBBBBk...',
      'Y..kBBkkkkBbB..',
      'YY.BBBkBBBkkBB.',
      'YYYBBkBBBBBBBeB',
      'YY.BBBkkkkkBYBB',
      'Y..kBBBBBBBBBB.',
      '....kkBBBBBk...',
      '.......kkk.....',
    ],
  },
  // Synchiropus splendidus : bleu, vert et orange en ondulations
  mandarin: {
    tail: 2,
    palette: { B: '#2a74d8', o: '#ff8a2a', G: '#2fc08a', e: '#101010' },
    rows: [
      '....o..o......',
      '...oBoGBo.....',
      'o.oBoBGoBoB...',
      'BoGoBBoGoBBoB.',
      'oBoBoGBoBoBeBo',
      'BoGoBoBoGoBBB.',
      'o.oBoGoBoBo...',
      '...o.o.o.o....',
    ],
  },
  // Hippocampus kuda : jaune, vertical, museau tubulaire, queue enroulée
  hippocampe: {
    tail: 0,
    flutter: 'f',
    palette: { y: '#f2b632', Y: '#ffd978', f: '#fff0c0', e: '#2a1a08', o: '#d9902a' },
    rows: [
      '..oy....',
      '.yyyy...',
      '.yeyyyyy',
      '.yyy....',
      '..yy....',
      '.yyYy...',
      'fyyYYy..',
      'fyyYYy..',
      '.yyYYy..',
      '..yyy...',
      '...yy...',
      '....y...',
      '....y.y.',
      '.....y..',
    ],
  },
  // Paracheirodon axelrodi : bande bleu fluo, rouge sur tout le ventre
  neon: {
    tail: 2,
    palette: { s: '#9fb8c8', c: '#36e0ff', r: '#ff3348', t: '#c7d6e0', e: '#101010' },
    rows: [
      '....ss.....',
      't.sccccccs.',
      'ttcccccccec',
      't.rrrrrrrr.',
      '...rrrrr...',
    ],
  },
  // Corydoras panda : blanc rosé, masque noir, dorsale noire, tache à la queue
  corydoras: {
    tail: 2,
    palette: { w: '#f3ece6', k: '#1e1a1f', p: '#e9c7c0', e: '#c9a03a', b: '#d8c0a8' },
    rows: [
      '.....kk....',
      '....wkkw...',
      'k.kwwwwkkw.',
      'kkkwwwwkekw',
      'k.wwwwwwkww',
      '...pwpwpw.b',
    ],
  },
  // Carnegiella strigata : dos plat, carène ventrale, marbrures brunes
  hachette: {
    tail: 2,
    palette: { s: '#d7dde0', M: '#5a4a3a', t: '#bfc9cf', e: '#111111' },
    rows: [
      't.sssssssss',
      'tssMssMsses',
      't.sMsMMssss',
      '...MMsssMs.',
      '....sMsMs..',
      '.....sMs...',
      '......s....',
    ],
  },
  // Pterophyllum scalare : très haut, argenté, bandes verticales noires, œil rouge
  scalaire: {
    tail: 2,
    palette: { s: '#e6e8e3', k: '#2b2b30', t: '#cfd6d8', e: '#b02020', f: '#dfe3e0' },
    rows: [
      '...k.........',
      '...kk........',
      '...kks.......',
      '...ksss......',
      '...ksskss....',
      '..kssskssss..',
      'ttksssksssss.',
      'ttksssksssses',
      'ttksssksssss.',
      '..kssskssss..',
      '...ksskss....',
      '...ksss......',
      '...kks.f.....',
      '...kk...f....',
      '...k.....f...',
    ],
  },
  // Symphysodon aequifasciatus : disque brun-orangé, lignes turquoise, œil rouge
  discus: {
    tail: 1,
    palette: { o: '#d9652b', b: '#4fb6e8', t: '#d98a4a', e: '#e02828' },
    rows: [
      '....oooo....',
      '..oobbbboo..',
      '.obboooobbo.',
      'tobooboobbbo',
      'tboboobooobo',
      'tobobobboeob',
      'tbooboobooob',
      'tobboobboobo',
      '.obboooobbo.',
      '..oobbbboo..',
      '....oooo....',
    ],
  },
  // Hypancistrus zebra : rayures noires et blanches, fond
  pleco: {
    tail: 1,
    palette: { w: '#f0efe8', k: '#1a1a1e', e: '#d8d0c0' },
    rows: [
      '....kkwkk......',
      'k.wwwwwwwwwww..',
      'kwkkkkkkkkkkkww',
      'kkwwwwwwwwwwwew',
      'kwkkkkkkkkkwkkk',
      'k..wkw.wkw.....',
    ],
  },
  // Oryzias latipes (himedaka) : petit, doré, gros œil
  medaka: {
    tail: 2,
    palette: { y: '#ffb347', Y: '#ffd08a', t: '#ffc98a', W: '#ffffff', e: '#1a1a1a' },
    rows: [
      '...yyy....',
      't.yyyyyyy.',
      'ttyyyyyyWe',
      't.YYYYYYY.',
      '....YY....',
    ],
  },
  // Misgurnus anguillicaudatus : long, brun olive tacheté, barbillons
  dojo: {
    tail: 2,
    palette: { b: '#9c8456', B: '#5e4b30', l: '#d7c79e', t: '#8a7650', e: '#111111', k: '#8a7650' },
    rows: [
      '......kk........',
      'tbbbbbbbbbbbbbb.',
      'tbBbBbbBbbBbbbeb',
      '.lllllllllllllbb',
    ],
  },
  // Rhodeus ocellatus : reflets rose-violet, liseré rouge, trait turquoise
  bouviere: {
    tail: 2,
    palette: { P: '#e68ab8', p: '#b96ad6', r: '#ff4f5e', c: '#54d6c9', e: '#111111' },
    rows: [
      '....rppr...',
      'r.pPPPPPPp.',
      'rrPccccPPeP',
      'r.pPPPPPPPP',
      '...rPPPPr..',
      '....rr.....',
    ],
  },
  // Carassius auratus ryukin : rond, bosse, double queue voilée
  ryukin: {
    tail: 3,
    palette: { R: '#e8352c', W: '#fff2e2', T: '#ff8a6a', e: '#111111' },
    rows: [
      '.....RRR....',
      '....RRWWR...',
      'TT.RRWWWWR..',
      'TTTRRRWWWWR.',
      'TTTRRRRWWeRR',
      'TTTRRRRWWWR.',
      'TT.RRRRRWR..',
      'T...RRRRR...',
      '......RR....',
    ],
  },
  // Plecoglossus altivelis : fin, olive, tache jaune derrière l'ouïe
  ayu: {
    tail: 2,
    palette: { g: '#8fa37e', l: '#d9e0cf', Y: '#ffd83a', y: '#e8cf6a', o: '#9bb07a', t: '#b2b88a', e: '#111111' },
    rows: [
      '.....ooo......',
      't.ggggggggggg.',
      'ttgggggggYggeg',
      't.lllllllllll.',
      '....yy..yy....',
    ],
  },
  // Koï kohaku : blanc à grandes taches rouges
  kohaku: {
    tail: 2,
    palette: { W: '#fbf8f2', w: '#e8e2d8', R: '#e03a2a', T: '#f3ece0', e: '#111111' },
    rows: [
      '........www.......',
      '....wWWWRRRWWw....',
      'T..WWRRRRWWWRRRW..',
      'TTWWRRRRWWWWRRRWeW',
      'TTWWWRRWWWWWWRWWWW',
      'T..WWWWWWWWWWWWW..',
      '....wWWWWWWWWw....',
      '......ww...ww.....',
    ],
  },
};
