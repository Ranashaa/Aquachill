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
};
