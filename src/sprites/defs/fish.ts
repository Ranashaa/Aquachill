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
  // ------------------------------------------------------------ Mangrove
  // Monodactylus argenteus : losange argenté, nageoires jaunes, barre noire
  monodactyle: {
    tail: 2,
    palette: { s: '#dfe6ea', y: '#ffd23a', t: '#e8e0a0', e: '#111111', k: '#2b2b30' },
    rows: [
      '......y.....',
      '.....yss....',
      '....sssss...',
      '...sssssks..',
      'tt.ssssskes.',
      'ttssssssksss',
      'tt.ssssskss.',
      '...sssssks..',
      '....sssss...',
      '.....yss....',
      '......y.....',
    ],
  },
  // Periophthalmus barbarus : yeux sur le dessus, brun tacheté
  periophtalme: {
    tail: 2,
    palette: { b: '#8a7a5a', B: '#5a4a30', l: '#c8b890', W: '#ffffff', k: '#111111', t: '#7a6a4a', m: '#5a4a30', f: '#6a5a3a' },
    rows: [
      '........WW...',
      '........kW...',
      't.bbbbbbbbbb.',
      'ttbBbbBbbbbbm',
      't.lllllllllb.',
      '....f....f...',
    ],
  },
  // Scatophagus argus : rond, bronze-vert à pois noirs
  scat: {
    tail: 1,
    palette: { g: '#9aa060', G: '#3a3a2a', t: '#b8b070', e: '#111111' },
    rows: [
      '....ggg....',
      '..gggGgg...',
      '.gGggggGg..',
      'tgggGgggGe.',
      'ttgGgggGggg',
      'tggggGgggg.',
      '.gGgggGgg..',
      '..ggGggg...',
      '....ggg....',
    ],
  },
  // Brachygobius doriae : bandes jaunes et noires
  gobie: {
    tail: 1,
    palette: { y: '#ffd23a', k: '#2a2420', e: '#ffffff' },
    rows: ['..yykk..', 'kkyykkye', 'kkyykkyy', '..yykk..'],
  },
  // Toxotes jaculatrix : argenté à taches noires
  archer: {
    tail: 2,
    palette: { s: '#e8eef0', k: '#2b2b30', l: '#f4f4ea', t: '#c8d0d0', e: '#111111' },
    rows: [
      '...kk..kk....',
      't.skksskksss.',
      'ttssssssssses',
      'ttsssssssssss',
      't.llllllllll.',
      '....l...l....',
    ],
  },
  // Lates calcarifer : grand, argenté, œil orangé
  barramundi: {
    tail: 3,
    palette: { g: '#a8b0b0', l: '#e0e4e0', t: '#90989a', r: '#e8783a' },
    rows: [
      '.......gggg.......',
      't...ggggggggggg...',
      'tt.gggggggggggggr.',
      'tttggggggggggggggg',
      'tt.lllllllllllllll',
      't...lllllllllll...',
      '......l....l......',
    ],
  },

  // ------------------------------------------------------------ Banquise
  // Boreogadus saida : fine, argent-brun, barbillon
  saida: {
    tail: 2,
    palette: { s: '#9aa0a0', o: '#8a9090', l: '#e0e4e8', t: '#8a9090', e: '#111111', b: '#c8c0a0' },
    rows: [
      '.....ooo......',
      't.ssssssssss..',
      'ttssssssssssse',
      't.lllllllllll.',
      '....ll...ll..b',
    ],
  },
  // Myoxocephalus quadricornis : grosse tête cornue, marbré
  chabot: {
    tail: 2,
    palette: { m: '#7a6a5a', M: '#4a3a2a', l: '#c8b8a0', h: '#5a4a3a', f: '#9a8a6a', t: '#6a5a4a', e: '#e8d060' },
    rows: [
      '........h.h..',
      '.....ffmmmm..',
      't.mmMmmMmmmmm',
      'ttmMmmMmmmeMm',
      't.lllllllllll',
      '...f...ff....',
    ],
  },
  // Cyclopterus lumpus : rond, bosselé, ventre orange
  lompe: {
    tail: 1,
    palette: { g: '#6a9a5a', G: '#4a7a3a', o: '#ff8a3a', t: '#5a8a4a', e: '#111111' },
    rows: [
      '...gGgGg...',
      '..gggGggg..',
      '.gGgggggGg.',
      'tggGgggggeg',
      'tgggggGgggg',
      '.gooooooog.',
      '..ooooooo..',
      '...ooooo...',
      '....ooo....',
    ],
  },
  // Salvelinus alpinus : dos sombre moucheté, ventre rouge
  omble: {
    tail: 2,
    palette: { g: '#4a6a4a', w: '#e8e0c8', r: '#e8603a', t: '#4a6a4a', e: '#111111' },
    rows: [
      '......gggg......',
      't..gggwgggwgg...',
      'ttgggggwggggggge',
      'ttrrrrrrrrrrrrrr',
      't..rrrrrrrrrrr..',
      '....w.....w.....',
    ],
  },
  // Anarhichas lupus : grosse tête, dents, rayures sombres
  loup: {
    tail: 2,
    palette: { b: '#7a8a9a', k: '#3a4a5a', l: '#b8c4cc', w: '#ffffff', m: '#3a4a5a', t: '#6a7a8a', e: '#111111' },
    rows: [
      '...kkkkkkkkkk.....',
      't.bbkbbbkbbbkbbb..',
      'ttbbkbbbkbbbkbbeb.',
      'ttbbkbbbkbbbkbbbwm',
      't.llllllllllllllw.',
      '...kkkkkkkkkkk....',
    ],
  },
  // Chaenocephalus aceratus : pâle, translucide, museau de crocodile
  poisson_glace: {
    tail: 2,
    palette: { w: '#e8f4f8', l: '#c8e0ec', k: '#2b3a4a', t: '#d8ecf4', e: '#111111' },
    rows: [
      '.....kkkk........',
      't..wwwwwwwww.....',
      'ttwwwwwwwwwwwewww',
      'ttlllllllllllllll',
      't..llllllllll....',
      '.....k...........',
    ],
  },

  // ------------------------------------------------------------- Abysses
  // Myctophum punctatum : sombre, photophores
  lanterne: {
    tail: 2,
    palette: { k: '#3a4a6a', W: '#bfe0ff', y: '#7af0ff', t: '#2a3a5a' },
    rows: ['....kkk....', 't.kkkkkkkk.', 'ttkkkkkkkWk', 't.kykykykyk', '...kkkkk...'],
  },
  // Argyropelecus aculeatus : argentée, yeux vers le haut, lumières ventrales
  hachette_abyssale: {
    tail: 2,
    palette: { s: '#c8d4e0', e: '#e0f4ff', y: '#7af0ff', t: '#8a9ab0' },
    rows: ['......ee.', 't.ssssss.', 'ttsssssss', 't.sssssss', '..ssssss.', '...sssss.', '...yyyyy.', '....yyy..'],
  },
  // Chauliodus sloani : long, sombre, crocs
  vipere: {
    tail: 2,
    palette: { b: '#2a3a5a', W: '#bfe0ff', w: '#ffffff', y: '#7af0ff', k: '#4a5a7a', t: '#2a3a5a' },
    rows: [
      '......k...........',
      '......kk..........',
      't.bbbbbbbbbbbbbbb.',
      'ttbbbbbbbbbbbbbWbw',
      't.byybyybyybyybbbw',
      '...............w.w',
    ],
  },
  // Macropinna microstoma : dôme transparent, yeux verts
  barreleye: {
    tail: 2,
    palette: { c: '#bfe8f0', G: '#6af06a', b: '#3a3a4a', m: '#5a5a6a', f: '#5a5a6a', t: '#3a3a4a' },
    rows: [
      '......cccc..',
      '.....cGccGc.',
      '.....cGccGc.',
      't.bbbbbbbbbc',
      'ttbbbbbbbbbm',
      't.bbbbbbbbb.',
      '...f....f...',
    ],
  },
  // Eurypharynx pelecanoides : bouche géante, queue lumineuse
  gulper: {
    tail: 3,
    palette: { p: '#ff6ab0', k: '#1e1e2a', e: '#bfe0ff', o: '#6a2a4a' },
    rows: [
      '..............kk....',
      '.............kkkkk..',
      'pk.kkkkkkkkkkkkekkkk',
      '.kk..........kkoooo.',
      '..............kkkkk.',
    ],
  },
  // Melanocetus johnsonii : ronde, noire, lanterne
  baudroie: {
    tail: 1,
    palette: { k: '#2a2632', y: '#bfffe0', e: '#8a8a9a', w: '#ffffff', t: '#2a2632' },
    rows: [
      '.......yy....',
      '........k....',
      '.........k...',
      '....kkkkkk...',
      '..kkkkkkkkkk.',
      't.kkkkkkkekkk',
      'tkkkkkkkkwwwk',
      't.kkkkkkkkkkk',
      '..kkkkkkkkk..',
      '....kkkkk....',
    ],
  },
};
