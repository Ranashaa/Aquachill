// Visiteurs « stars » : des clins d'œil affectueux à la pop culture, avec des noms
// volontairement modifiés. Ils apparaissent de temps en temps et se collectionnent
// dans le Livre d'or.

export type StarId =
  | 'fray' | 'bob' | 'marius' | 'hadoque' | 'homere' | 'lynk'
  | 'pomyo' | 'doc' | 'totore' | 'custeau' | 'bendeur' | 'vadeur';

export interface Star {
  id: StarId;
  name: string;
  /** Clin d'œil (œuvre d'origine). */
  nod: string;
  quote: string;
  /** Niveau de tour requis pour qu'il puisse venir. */
  level: number;
  /** Indice affiché dans l'album tant que la star n'est pas venue. */
  hint: string;
  /** Couleur de fond de sa carte dans l'album. */
  color: string;
}

export const STARS: Star[] = [
  { id: 'fray', hint: 'Un livreur venu du futur, très rouquin.', color: '#ffd0b0', name: 'Fray', nod: 'Futurama', level: 1,
    quote: 'Tais-toi et prends mes pièces !' },
  { id: 'bob', hint: 'Il vit dans un ananas sous la mer.', color: '#bfe8ff', name: 'Bob l’Épongeux', nod: 'Bob l’éponge', level: 1,
    quote: 'Je suis prêt ! Je suis prêt ! Je suis prêt !' },
  { id: 'marius', hint: 'Un plombier moustachu qui saute partout.', color: '#ffd6d0', name: 'Marius le plombier', nod: 'Super Mario', level: 2,
    quote: 'C’est moi, Marius ! Wahou, des poissons !' },
  { id: 'hadoque', hint: 'Un vieux loup de mer au langage fleuri.', color: '#c8d8f0', name: 'Capitaine Hadoque', nod: 'Tintin', level: 2,
    quote: 'Mille milliards de mille bulles !' },
  { id: 'homere', hint: 'Un papa chauve qui adore les beignets.', color: '#fff0b0', name: 'Homère Simpsonne', nod: 'Les Simpson', level: 3,
    quote: 'Woo-hoo ! Mmmh… des beignets en forme de poisson…' },
  { id: 'lynk', hint: 'Un héros tout en vert, peu bavard.', color: '#d0f0c8', name: 'Lynk', nod: 'Zelda', level: 3,
    quote: 'Hyaaa ! … Tiens, pas de rubis dans ce bassin ?' },
  { id: 'pomyo', hint: 'Une petite fille-poisson qui rêvait d’être humaine.', color: '#ffd8e0', name: 'Pomyo', nod: 'Ponyo sur la falaise', level: 4,
    quote: 'Pomyo aime les poissons ! Et le jambon !' },
  { id: 'doc', hint: 'Un savant excentrique qui voyage dans le temps.', color: '#e8e0f8', name: 'Doc Brune', nod: 'Retour vers le futur', level: 4,
    quote: 'Nom de Zeus ! 1,21 gigabulles !' },
  { id: 'totore', hint: 'Un grand esprit de la forêt, tout doux.', color: '#d8f0d0', name: 'Totoré', nod: 'Mon voisin Totoro', level: 5,
    quote: 'Booooooh ! (il repart avec une feuille en guise de parapluie)' },
  { id: 'custeau', hint: 'Un explorateur des océans au bonnet rouge.', color: '#c8ecf8', name: 'Commandant Custeau', nod: 'Le Monde du silence', level: 5,
    quote: 'On aime ce qui nous a émerveillés, et on protège ce que l’on aime.' },
  { id: 'bendeur', hint: 'Un robot plieur au caractère bien trempé.', color: '#e0e4ea', name: 'Bendeur', nod: 'Futurama', level: 6,
    quote: 'J’vais construire mon propre aquarium. Avec des bulles et du blackjack !' },
  { id: 'vadeur', hint: 'Il respire très fort sous son casque noir.', color: '#d8d0e8', name: 'Dark Vadeur', nod: 'Star Wars (et Tiny Death Star !)', level: 7,
    quote: 'Kshhh… Je suis ton… soigneur. Kshhh…' },
];

export const STARS_BY_ID = Object.fromEntries(STARS.map((s) => [s.id, s])) as Record<StarId, Star>;
