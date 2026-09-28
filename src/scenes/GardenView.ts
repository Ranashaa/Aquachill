// Ce qui vit autour des aquariums : bacs de culture, coffre d'expédition,
// boîte aux lettres, Grand Bassin du hall et habitués du jour.
import Phaser from 'phaser';
import { LOBBY_H, ROOM_X0, ROOM_X1 } from '../config';
import { cropsForBiome, bundlesDone, isReady, plotStage, villagerSpot } from '../systems/farm';
import { VILLAGER_LIST, type VillagerId } from '../data/villagers';
import { services } from '../services';
import { cropKey, textTexture, villagerKey } from '../sprites';
import { floorTop } from './building';
import { feetY } from './Keeper';

export const TUB_XS = [96, 132, 168];
export const BIN_X = 182;
export const MAILBOX_X = 203;
export const DESK_X = 110;
/** La grande baie du hall, qui est en fait le vieux Grand Bassin à restaurer. */
export const BASSIN = { x: 118, y: -LOBBY_H + 22, w: 76, h: 58 };

export type Hit =
  | { kind: 'tub'; floor: number; index: number; x: number }
  | { kind: 'villager'; id: VillagerId; floor: number; x: number }
  | { kind: 'bin' | 'mailbox' | 'desk' | 'bassin'; x: number };

export const hasGarden = (biome: string) => cropsForBiome(biome).length > 0;

export class GardenView {
  private objs: Phaser.GameObjects.GameObject[] = [];
  private people = new Map<VillagerId, { sprite: Phaser.GameObjects.Sprite; mark: Phaser.GameObjects.Image; floor: number }>();
  private spotKey = '';

  constructor(private scene: Phaser.Scene) {}

  private add<T extends Phaser.GameObjects.GameObject>(o: T): T {
    this.objs.push(o);
    return o;
  }

  draw(): void {
    this.scene.tweens.killTweensOf(this.objs);
    this.objs.forEach((o) => o.destroy());
    this.objs = [];
    const s = services.sim.state;
    const sc = this.scene;
    s.floors.forEach((floor, i) => {
      if (!hasGarden(floor.biome)) return;
      const base = floorTop(i) + 95;
      floor.plots.forEach((plot, k) => {
        const x = TUB_XS[k];
        this.add(sc.add.ellipse(x, base - 1, 24, 4, 0x2b2238, 0.22).setDepth(14));
        const needsCare = !!plot.crop && !plot.tendedToday && !isReady(plot);
        this.add(sc.add.image(x, base, needsCare ? 'tub-dry' : 'tub').setOrigin(0.5, 1).setDepth(16));
        if (plot.crop) {
          const crop = this.add(sc.add.image(x, base - 6, cropKey(plot.crop, plotStage(plot))).setOrigin(0.5, 1).setDepth(15.5));
          if (isReady(plot)) {
            sc.tweens.add({ targets: crop, scaleY: 1.06, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.easeInOut' });
            const sp = this.add(sc.add.image(x + 7, base - 17, 'sparkle').setDepth(17));
            sc.tweens.add({ targets: sp, alpha: 0.2, yoyo: true, repeat: -1, duration: 600 });
          } else if (needsCare) {
            const d = this.add(sc.add.image(x, base - 20, 'ico-drop').setDepth(17));
            sc.tweens.add({ targets: d, y: d.y - 2, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.easeInOut' });
          }
        } else {
          const sp = this.add(sc.add.image(x, base - 11, 'ico-sprout').setDepth(17).setAlpha(0.55));
          sc.tweens.add({ targets: sp, alpha: 0.25, yoyo: true, repeat: -1, duration: 1400 });
        }
      });
    });

    // --- hall : Grand Bassin, coffre, boîte aux lettres
    const done = bundlesDone(s);
    const B = BASSIN;
    if (done < 3) {
      // eau trouble et planches : chaque lot rendu éclaircit le bassin
      const murk = sc.add.rectangle(B.x + 3, B.y + 20, B.w - 6, B.h - 20, 0x4a5a3a, 0.62 - done * 0.18).setOrigin(0).setDepth(2.5);
      this.add(murk);
      const g = this.add(sc.add.graphics().setDepth(2.6));
      if (done === 0) {
        for (const y of [B.y + 30, B.y + 44]) {
          g.fillStyle(0x2b2238).fillRect(B.x + 4, y - 1, B.w - 8, 7);
          g.fillStyle(0xa8743a).fillRect(B.x + 5, y, B.w - 10, 5);
          g.fillStyle(0x8a5a2a).fillRect(B.x + 5, y + 4, B.w - 10, 1);
          g.fillStyle(0x4a2a1a).fillRect(B.x + 10, y + 2, 1, 1).fillRect(B.x + B.w - 12, y + 2, 1, 1);
        }
      }
      g.fillStyle(0xffffff, 0.35);
      for (let k = 0; k < 3 - done; k++) g.fillRect(B.x + 14 + k * 20, B.y + 24 + (k % 2) * 8, 1, 6).fillRect(B.x + 15 + k * 20, B.y + 30 + (k % 2) * 8, 1, 4);
    } else {
      for (let k = 0; k < 6; k++) {
        const b = this.add(sc.add.rectangle(B.x + 10 + k * 11, B.y + B.h, 1, 1, 0xe8fbff, 0.8).setDepth(2.6));
        sc.tweens.add({ targets: b, y: B.y + 20, duration: 2600 + k * 300, repeat: -1, delay: k * 400 });
      }
    }
    const plaque = textTexture(sc.textures, done >= 3 ? 'GRAND BASSIN' : `GRAND BASSIN ${done}/3`, '#ffe08a', '#2b2238', 'small');
    this.add(sc.add.image(B.x + B.w / 2, -26, plaque).setDepth(3));

    this.add(sc.add.ellipse(BIN_X, -2, 18, 3, 0x2b2238, 0.25).setDepth(14));
    this.add(sc.add.image(BIN_X, -1, 'shipbin').setOrigin(0.5, 1).setDepth(16));
    if (Object.keys(s.shipBin).length) {
      const c = this.add(sc.add.image(BIN_X, -14, 'coin').setDepth(17));
      sc.tweens.add({ targets: c, y: c.y - 2, yoyo: true, repeat: -1, duration: 600 });
    }
    const unread = s.mail.some((m) => !m.read);
    this.add(sc.add.image(MAILBOX_X, -1, unread ? 'mailbox-flag' : 'mailbox').setOrigin(0.5, 1).setDepth(16));
    if (unread) {
      const l = this.add(sc.add.image(MAILBOX_X, -21, 'ico-letter').setDepth(17));
      sc.tweens.add({ targets: l, y: l.y - 2, yoyo: true, repeat: -1, duration: 500 });
    }
    this.spotKey = '';
  }

  /** Place les habitués présents aujourd'hui (et les fait disparaître la nuit). */
  syncVillagers(time: number): void {
    const s = services.sim.state;
    const spots = VILLAGER_LIST.map((v) => ({ v, spot: villagerSpot(s, v.id) }));
    const key = spots.map(({ spot, v }) => `${spot?.floor}:${spot?.x}:${s.villagers[v.id].talkedToday}`).join('|') + s.floors.length;
    if (key !== this.spotKey) {
      this.spotKey = key;
      for (const p of this.people.values()) {
        p.sprite.destroy();
        p.mark.destroy();
      }
      this.people.clear();
      for (const { v, spot } of spots) {
        if (!spot) continue;
        const x = spot.floor < 0 ? ROOM_X0 + spot.x * (ROOM_X1 - ROOM_X0) : ROOM_X0 + 12 + spot.x * (ROOM_X1 - ROOM_X0 - 24);
        const sprite = this.scene.add.sprite(Math.round(x), feetY(spot.floor), villagerKey(v.id), 0).setOrigin(0.5, 1).setDepth(19.5);
        sprite.setFlipX(spot.x > 0.5 && spot.floor >= 0);
        const talked = s.villagers[v.id].talkedToday;
        const mark = this.scene.add.image(sprite.x, sprite.y - 27, talked ? 'ico-heart' : textTexture(this.scene.textures, '!', '#ffe066'))
          .setDepth(19.6).setAlpha(talked ? 0 : 1);
        this.people.set(v.id, { sprite, mark, floor: spot.floor });
      }
    }
    // petite vie : ils regardent l'aquarium de temps en temps
    for (const [id, p] of this.people) {
      const phase = Math.floor(time / 2600 + id.length) % 3;
      p.sprite.setFrame(phase === 2 ? 3 : 0);
      p.mark.y = p.sprite.y - 27 - (Math.floor(time / 400) % 2);
    }
  }

  villagerPos(id: VillagerId): { floor: number; x: number } | null {
    const p = this.people.get(id);
    return p ? { floor: p.floor, x: p.sprite.x } : null;
  }

  /** Que touche-t-on en (x, y) ? */
  hitTest(x: number, y: number): Hit | null {
    for (const [id, p] of this.people) {
      if (Math.abs(p.sprite.x - x) < 9 && y < p.sprite.y + 2 && y > p.sprite.y - 26) return { kind: 'villager', id, floor: p.floor, x: p.sprite.x };
    }
    const s = services.sim.state;
    for (let i = 0; i < s.floors.length; i++) {
      if (!hasGarden(s.floors[i].biome)) continue;
      const base = floorTop(i) + 95;
      if (y < base - 22 || y > base + 1) continue;
      const k = TUB_XS.findIndex((tx) => Math.abs(tx - x) <= 12);
      if (k >= 0) return { kind: 'tub', floor: i, index: k, x: TUB_XS[k] };
    }
    if (y >= -LOBBY_H && y < 0) {
      if (Math.abs(x - BIN_X) < 10 && y > -16) return { kind: 'bin', x: BIN_X - 12 };
      if (Math.abs(x - MAILBOX_X) < 7 && y > -24) return { kind: 'mailbox', x: MAILBOX_X - 10 };
      if (x >= 48 && x <= 106 && y > -44) return { kind: 'desk', x: DESK_X };
      if (x >= BASSIN.x && x <= BASSIN.x + BASSIN.w && y >= BASSIN.y && y < -24) return { kind: 'bassin', x: BASSIN.x + BASSIN.w / 2 };
    }
    return null;
  }

  destroy(): void {
    this.objs.forEach((o) => o.destroy());
    for (const p of this.people.values()) {
      p.sprite.destroy();
      p.mark.destroy();
    }
  }
}
