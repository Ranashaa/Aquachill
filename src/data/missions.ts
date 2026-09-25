// Objectifs doux : trois petites missions à la fois, sans limite de temps.

export type MissionKind =
  | 'feed' | 'pet' | 'clean' | 'identify' | 'decor' | 'hatch' | 'expedition' | 'visitors' | 'name' | 'breathe' | 'photo';

export interface MissionDef {
  kind: MissionKind;
  /** Texte avec {n} pour la cible. */
  text: string;
  targets: number[];
  /** Pièces par unité de cible. */
  reward: number;
}

export const MISSION_DEFS: MissionDef[] = [
  { kind: 'feed', text: 'Nourris tes poissons {n} fois', targets: [2, 3, 5], reward: 12 },
  { kind: 'pet', text: 'Fais {n} câlins à tes poissons', targets: [3, 5, 8], reward: 6 },
  { kind: 'clean', text: 'Rends {n} vitre(s) étincelante(s)', targets: [1, 2], reward: 25 },
  { kind: 'identify', text: 'Identifie {n} nouvelle(s) espèce(s)', targets: [1], reward: 40 },
  { kind: 'decor', text: 'Pose {n} objet(s) de décor', targets: [1, 2, 3], reward: 15 },
  { kind: 'hatch', text: 'Fais éclore {n} œuf(s)', targets: [1, 2], reward: 40 },
  { kind: 'expedition', text: 'Termine {n} expédition(s) en sous-marin', targets: [1], reward: 40 },
  { kind: 'visitors', text: 'Accueille {n} visiteurs', targets: [10, 20, 30], reward: 2 },
  { kind: 'name', text: 'Donne un nouveau nom à {n} poisson(s)', targets: [1], reward: 20 },
  { kind: 'breathe', text: 'Prends {n} moment(s) pour respirer', targets: [1], reward: 20 },
  { kind: 'photo', text: 'Prends {n} photo(s) souvenir', targets: [1], reward: 20 },
];

/** Durées de croissance (minutes réelles). */
export const GROWTH = {
  egg: 8,
  fry: 30,
  juvenile: 90,
};
