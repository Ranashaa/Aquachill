// Chaque poisson a un prénom et un caractère qui influence sa façon de nager.

export type Personality = 'curieux' | 'timide' | 'gourmand' | 'joueur' | 'paresseux' | 'sociable';

export const PERSONALITIES: Record<Personality, { label: string; text: string }> = {
  curieux: { label: 'Curieux', text: 'Vient voir de près quand tu touches la vitre.' },
  timide: { label: 'Timide', text: 'Aime rester caché près du décor. Il faut l’apprivoiser.' },
  gourmand: { label: 'Gourmand', text: 'Toujours le premier à table !' },
  joueur: { label: 'Joueur', text: 'Fait des petites pointes de vitesse pour s’amuser.' },
  paresseux: { label: 'Paresseux', text: 'Adore faire la sieste entre deux longueurs.' },
  sociable: { label: 'Sociable', text: 'Nage volontiers à côté des autres.' },
};

export const PERSONALITY_LIST = Object.keys(PERSONALITIES) as Personality[];

export const FISH_NAMES = [
  'Pépite', 'Galet', 'Nougat', 'Cachou', 'Plume', 'Mochi', 'Biscotte', 'Caramel', 'Pistache', 'Réglisse',
  'Figue', 'Noisette', 'Praline', 'Myrtille', 'Pompon', 'Frimousse', 'Loupiote', 'Brindille', 'Grelot', 'Tartine',
  'Chouquette', 'Cannelle', 'Moustache', 'Filou', 'Zéphyr', 'Opale', 'Perle', 'Corail', 'Azur', 'Ondine',
  'Écume', 'Kiwi', 'Mangue', 'Papaye', 'Olive', 'Gaufre', 'Crumble', 'Macaron', 'Guimauve', 'Pollen',
  'Flocon', 'Nuage', 'Lutin', 'Gribouille', 'Titou', 'Lulu', 'Nini', 'Momo', 'Yuki', 'Hana',
  'Sora', 'Kumo', 'Taro', 'Bulle', 'Sirop', 'Clémentine', 'Bouton', 'Coquelicot', 'Lilas', 'Cerise',
];

/** Nombre de cœurs d'amitié (0 à 5) pour une amitié de 0 à 100. */
export function hearts(friendship: number): number {
  return Math.max(0, Math.min(5, Math.floor(friendship / 20)));
}
