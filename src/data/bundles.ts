// Le Grand Bassin du hall, vieil aquarium public en ruine, se restaure lot par lot
// (à la manière du Centre communautaire de Stardew Valley).
import type { CropId } from './garden';

export type BundleId = 'corail' | 'soins' | 'amis';

export type Requirement =
  | { kind: 'item'; crop: CropId; qty: number }
  | { kind: 'counter'; counter: 'feed' | 'tend' | 'harvest' | 'ship'; qty: number; label: string }
  | { kind: 'friends'; hearts: number; qty: number };

export interface Bundle {
  id: BundleId;
  name: string;
  blurb: string;
  needs: Requirement[];
  rewardText: string;
  reward: { coins?: number; seeds?: Partial<Record<CropId, number>>; boots?: boolean };
}

export const BUNDLES: Bundle[] = [
  {
    id: 'corail', name: 'Lot du jardin de corail',
    blurb: 'Des boutures pour faire renaître les pierres du Grand Bassin.',
    needs: [
      { kind: 'item', crop: 'zoanthus', qty: 2 },
      { kind: 'item', crop: 'acropora', qty: 1 },
    ],
    rewardText: '150 pièces et 3 boutures de corail champignon',
    reward: { coins: 150, seeds: { champignon: 3 } },
  },
  {
    id: 'soins', name: 'Lot du soigneur',
    blurb: 'Montrer qu’on sait prendre soin des lieux.',
    needs: [
      { kind: 'counter', counter: 'feed', qty: 5, label: 'Nourrir les poissons' },
      { kind: 'counter', counter: 'tend', qty: 6, label: 'Soigner des boutures' },
    ],
    rewardText: 'Les bottes de soigneur (tu marches plus vite)',
    reward: { boots: true, coins: 50 },
  },
  {
    id: 'amis', name: 'Lot de l’amitié',
    blurb: 'Un aquarium public, c’est d’abord des gens qui s’y retrouvent.',
    needs: [{ kind: 'friends', hearts: 2, qty: 2 }],
    rewardText: '300 pièces',
    reward: { coins: 300 },
  },
];

export const BUNDLES_BY_ID = Object.fromEntries(BUNDLES.map((b) => [b.id, b])) as Record<BundleId, Bundle>;
