// Ton personnage : prénom, apparence, genre et attirance. Les répliques s'accordent
// à ton genre, et les romances ne sont possibles que si l'attirance est réciproque.
import type { ActorSpec, Hair } from './actors';

export type Gender = 'f' | 'm' | 'n';
export type Attraction = 'f' | 'm' | 'all' | 'none';

export interface Profile {
  name: string;
  gender: Gender;
  attraction: Attraction;
  skin: string;
  hair: string;
  hairStyle: Hair;
  outfit: string;
}

export const GENDERS: { id: Gender; label: string }[] = [
  { id: 'f', label: 'Une femme' },
  { id: 'm', label: 'Un homme' },
  { id: 'n', label: 'Non-binaire' },
];

export const ATTRACTIONS: { id: Attraction; label: string }[] = [
  { id: 'f', label: 'Les femmes' },
  { id: 'm', label: 'Les hommes' },
  { id: 'all', label: 'Tout le monde' },
  { id: 'none', label: 'Personne (amitié seulement)' },
];

export const SKINS = ['#fbdcc0', '#f2c8a0', '#e0a878', '#b87a50', '#8a5634', '#5e3a24'];
export const HAIRS = ['#2a1a1e', '#6a3a22', '#a86a3a', '#e8c060', '#c8c8d0', '#d85a3a', '#7a5ac8', '#3aa0a0'];
export const HAIR_STYLES: { id: Hair; label: string }[] = [
  { id: 'short', label: 'Court' },
  { id: 'spiky', label: 'En bataille' },
  { id: 'bob', label: 'Carré' },
  { id: 'long', label: 'Long' },
  { id: 'bun', label: 'Chignon' },
];
export const OUTFITS = ['#3ab0b8', '#e8584a', '#f0b030', '#5a9a4a', '#7a6ad8', '#ff8ab0', '#3a4a6e'];

export const defaultProfile = (): Profile => ({
  name: 'Soigneur', gender: 'n', attraction: 'all', skin: SKINS[1], hair: HAIRS[1], hairStyle: 'short', outfit: OUTFITS[0],
});

export function playerLook(p: Profile): ActorSpec {
  return {
    skin: p.skin, hair: p.hair, hairStyle: p.hairStyle, shirt: p.outfit, pants: '#3a4a6e', shoes: '#5a3a2a', strap: '#8a5a34',
  };
}

/** Qui attire `a` peut-il être attiré par une personne de genre `g` ? */
export function attractedTo(a: Attraction, g: Gender): boolean {
  if (a === 'none') return false;
  if (a === 'all') return true;
  return a === g;
}

/**
 * Accorde un texte au genre du joueur : « [m|f|n] » choisit la forme masculine, féminine
 * ou neutre, et « {nom} » est remplacé par le prénom.
 */
export function fill(text: string, p: Profile): string {
  return text
    .replace(/\[([^|\]]*)\|([^|\]]*)\|([^\]]*)\]/g, (_, m, f, n) => (p.gender === 'm' ? m : p.gender === 'f' ? f : n))
    .replace(/\{nom\}/g, p.name);
}
