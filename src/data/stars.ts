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
}

export const STARS: Star[] = [
  { id: 'fray', name: 'Fray', nod: 'Futurama', level: 1,
    quote: 'Tais-toi et prends mes pièces !' },
  { id: 'bob', name: 'Bob l’Épongeux', nod: 'Bob l’éponge', level: 1,
    quote: 'Je suis prêt ! Je suis prêt ! Je suis prêt !' },
  { id: 'marius', name: 'Marius le plombier', nod: 'Super Mario', level: 2,
    quote: 'C’est moi, Marius ! Wahou, des poissons !' },
  { id: 'hadoque', name: 'Capitaine Hadoque', nod: 'Tintin', level: 2,
    quote: 'Mille milliards de mille bulles !' },
  { id: 'homere', name: 'Homère Simpsonne', nod: 'Les Simpson', level: 3,
    quote: 'Woo-hoo ! Mmmh… des beignets en forme de poisson…' },
  { id: 'lynk', name: 'Lynk', nod: 'Zelda', level: 3,
    quote: 'Hyaaa ! … Tiens, pas de rubis dans ce bassin ?' },
  { id: 'pomyo', name: 'Pomyo', nod: 'Ponyo sur la falaise', level: 4,
    quote: 'Pomyo aime les poissons ! Et le jambon !' },
  { id: 'doc', name: 'Doc Brune', nod: 'Retour vers le futur', level: 4,
    quote: 'Nom de Zeus ! 1,21 gigabulles !' },
  { id: 'totore', name: 'Totoré', nod: 'Mon voisin Totoro', level: 5,
    quote: 'Booooooh ! (il repart avec une feuille en guise de parapluie)' },
  { id: 'custeau', name: 'Commandant Custeau', nod: 'Le Monde du silence', level: 5,
    quote: 'On aime ce qui nous a émerveillés, et on protège ce que l’on aime.' },
  { id: 'bendeur', name: 'Bendeur', nod: 'Futurama', level: 6,
    quote: 'J’vais construire mon propre aquarium. Avec des bulles et du blackjack !' },
  { id: 'vadeur', name: 'Dark Vadeur', nod: 'Star Wars (et Tiny Death Star !)', level: 7,
    quote: 'Kshhh… Je suis ton… soigneur. Kshhh…' },
];

export const STARS_BY_ID = Object.fromEntries(STARS.map((s) => [s.id, s])) as Record<StarId, Star>;
