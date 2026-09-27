// Variantes de couleur rares, obtenues par la reproduction ou les expéditions.
// Inspirées de vraies variétés quand elles existent.
import type { SpeciesId } from './species';

export interface Variant {
  name: string;
  /** Couleurs remplacées dans la palette du sprite. */
  palette: Record<string, string>;
  note: string;
}

export const VARIANTS: Record<SpeciesId, Variant> = {
  demoiselle: { name: 'Mauve', palette: { B: '#8a6af0', d: '#5a3ac4', l: '#b8a8ff' }, note: 'Une teinte lavande très recherchée.' },
  clown: { name: 'Noir « Darwin »', palette: { O: '#3a3040' }, note: 'Existe vraiment : on le trouve près de Darwin, en Australie.' },
  gramma: { name: 'Rose', palette: { P: '#ff6aa0', p: '#d84a80' }, note: 'Un gramma aux reflets roses.' },
  chirurgien: { name: 'Ventre jaune', palette: { B: '#2c5fe0', b: '#ffd02b' }, note: 'Les individus de l’océan Indien ont souvent le ventre jaune.' },
  mandarin: { name: 'Rouge', palette: { B: '#c83a2a', G: '#e8883a' }, note: 'La forme rouge est bien réelle et rarissime.' },
  hippocampe: { name: 'Rouge corail', palette: { y: '#e8453c', Y: '#ff8a7a', o: '#b83028' }, note: 'Les hippocampes changent de couleur selon leur humeur.' },
  neon: { name: 'Diamant', palette: { c: '#e8fbff', r: '#c8d8ff' }, note: 'Une forme d’élevage aux reflets argentés.' },
  corydoras: { name: 'Ambré', palette: { k: '#c87a2a' }, note: 'Un panda aux taches couleur caramel.' },
  hachette: { name: 'Doré', palette: { M: '#c8a040', s: '#f0e8c0' }, note: 'Des marbrures dorées.' },
  scalaire: { name: 'Doré', palette: { k: '#f0d890', s: '#f4c84a' }, note: 'Le scalaire doré est une variété d’élevage classique.' },
  discus: { name: 'Sang de pigeon', palette: { o: '#e83a5a', b: '#ffd0e0' }, note: 'Nom d’une célèbre variété de discus rouge et crème.' },
  pleco: { name: 'Lavande', palette: { k: '#5a3a7a' }, note: 'Des rayures violettes, jamais vues dans le Xingu !' },
  medaka: { name: 'Blanc', palette: { y: '#f4f0e0', Y: '#ffffff', t: '#e8e8e0' }, note: 'Le médaka blanc est élevé au Japon depuis des siècles.' },
  dojo: { name: 'Doré', palette: { b: '#f0c040', B: '#e0a030', l: '#fff0b0', t: '#e0b040', k: '#e0b040' }, note: 'La loche dorée est une forme d’élevage appréciée.' },
  bouviere: { name: 'Azur', palette: { P: '#8ad0f0', p: '#5aa0d8' }, note: 'Des reflets bleu ciel.' },
  ryukin: { name: 'Calico', palette: { R: '#e86a2c', W: '#9ab8f0' }, note: 'Les ryukin calico mêlent orange, blanc et bleu.' },
  ayu: { name: 'Doré', palette: { g: '#c8b060', o: '#d8c070' }, note: 'Un ayu au dos doré.' },
  kohaku: { name: 'Showa', palette: { W: '#2a2430', w: '#3a3440', T: '#e8e0d8' }, note: 'Le showa, koï noir à taches rouges et blanches.' },
  monodactyle: { name: 'Doré', palette: { s: '#f0dc9a' }, note: 'Un reflet doré au lieu de l’argent.' },
  periophtalme: { name: 'Bleu électrique', palette: { B: '#3a6ad8' }, note: 'Certains périophtalmes ont de vraies taches bleues.' },
  scat: { name: 'Rouge', palette: { g: '#c8704a' }, note: 'Le « scat rouge » existe : son dos prend des teintes orangées.' },
  gobie: { name: 'Orange', palette: { y: '#ff9a3a' }, note: 'Un bourdon couleur mandarine.' },
  archer: { name: 'Doré', palette: { s: '#f0e0a0', l: '#fff4d0' }, note: 'Un archer aux reflets dorés.' },
  barramundi: { name: 'Albinos', palette: { g: '#f0e8e0', l: '#ffffff', t: '#e8d8d0' }, note: 'Les barramundis albinos existent, très rares.' },
  saida: { name: 'Pâle', palette: { s: '#d8dcdc' }, note: 'Une morue presque blanche comme la glace.' },
  chabot: { name: 'Rouille', palette: { m: '#a8603a', M: '#6a3a22' }, note: 'Des taches couleur rouille.' },
  lompe: { name: 'Bleu', palette: { g: '#4a7ac8', G: '#2a5aa8', t: '#3a6ab8' }, note: 'Les lompes peuvent être bleues, vertes ou roses !' },
  omble: { name: 'Doré', palette: { g: '#b8a04a', r: '#ffb040' }, note: 'Un omble couleur de soleil de minuit.' },
  loup: { name: 'Tacheté', palette: { k: '#6a4a3a', b: '#a89a8a' }, note: 'Son cousin, le loup tacheté, porte des taches brunes.' },
  poisson_glace: { name: 'Cristal', palette: { w: '#ffffff', l: '#e8f8ff', k: '#6ab0e0' }, note: 'Encore plus transparent, presque invisible.' },
  lanterne: { name: 'Rose', palette: { y: '#ff8ae0' }, note: 'Des lumières roses au lieu de bleues.' },
  hachette_abyssale: { name: 'Doré', palette: { s: '#f0d890' }, note: 'Un éclat doré dans le noir.' },
  vipere: { name: 'Pourpre', palette: { b: '#4a2a5a', y: '#ff8ae0' }, note: 'Une vipère aux lumières roses.' },
  barreleye: { name: 'Œil d’or', palette: { G: '#ffd23a' }, note: 'Des yeux dorés dans son dôme.' },
  gulper: { name: 'Lumière bleue', palette: { p: '#7af0ff' }, note: 'Sa queue brille en bleu.' },
  baudroie: { name: 'Lanterne verte', palette: { y: '#8aff8a' }, note: 'Une lanterne vert pâle.' },
};
