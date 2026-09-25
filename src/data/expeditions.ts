// Expéditions du petit sous-marin : il part explorer un milieu et rapporte un œuf.
import type { BiomeId } from './biomes';

export type DestinationId = 'lagon' | 'rionegro' | 'torrent';

export interface Destination {
  id: DestinationId;
  name: string;
  biome: BiomeId;
  /** Durée en minutes réelles. */
  minutes: number;
  blurb: string;
  /** Cartes postales : une est tirée au sort à chaque retour. */
  postcards: string[];
}

export const DESTINATIONS: Destination[] = [
  {
    id: 'lagon', name: 'Lagon corallien', biome: 'reef', minutes: 10,
    blurb: 'Des eaux turquoise peu profondes, abritées par une barrière de corail.',
    postcards: [
      'Vu une tortue verte brouter un herbier. Elle ne m’a même pas regardé !',
      'Les coraux sont des animaux : chaque « branche » abrite des milliers de minuscules polypes.',
      'Un banc de poissons-perroquets croquait le corail. Leur « sable » recrache… fait les plages blanches !',
      'Le récif chantait : crevettes qui claquent, poissons qui grognent. La mer n’est pas silencieuse.',
    ],
  },
  {
    id: 'rionegro', name: 'Rio Negro', biome: 'amazon', minutes: 20,
    blurb: 'Une rivière aux eaux noires comme du thé, qui inonde la forêt une partie de l’année.',
    postcards: [
      'L’eau est si sombre que la lumière disparaît à un mètre. Les néons brillent comme des lucioles.',
      'Pendant la crue, les poissons nagent entre les troncs de la forêt inondée !',
      'Aperçu un dauphin rose de l’Amazone. Oui, rose !',
      'Les feuilles mortes libèrent des tanins : c’est ce qui colore l’eau et la rend acide.',
    ],
  },
  {
    id: 'torrent', name: 'Torrent de montagne', biome: 'koi', minutes: 30,
    blurb: 'Une rivière claire et fraîche qui dévale entre les galets, au pied des cerisiers.',
    postcards: [
      'Les ayus remontent le courant comme de petites flèches argentées.',
      'Un martin-pêcheur a plongé juste devant le hublot. Quelle précision !',
      'L’eau est si froide et si claire qu’on voit chaque galet du fond.',
      'Des pétales de cerisier flottaient à la surface. Les poissons croyaient à un repas.',
    ],
  },
];

export const DESTINATIONS_BY_ID = Object.fromEntries(DESTINATIONS.map((d) => [d.id, d])) as Record<DestinationId, Destination>;
