// Le soigneur : on touche un endroit, il y marche tout seul (et prend
// l'ascenseur-bulle si besoin), puis fait l'action prévue en arrivant.
import Phaser from 'phaser';
import { FLOOR_H, ROOM_X0, ROOM_X1 } from '../config';
import { floorTop } from './building';

export const SHAFT_CX = 17;
export const LOBBY_FEET = -3;
export const feetY = (floor: number) => (floor < 0 ? LOBBY_FEET : floorTop(floor) + FLOOR_H - 2);

/** Limites de marche : dans une salle d'étage, ou dans le hall (sans passer les portes). */
export function clampX(floor: number, x: number): number {
  return Phaser.Math.Clamp(x, ROOM_X0 + 6, floor < 0 ? 200 : ROOM_X1 - 8);
}

type Step = { kind: 'walk'; x: number } | { kind: 'ride'; floor: number };

export class Keeper {
  floor = -1;
  body: Phaser.GameObjects.Sprite;
  private capsule: Phaser.GameObjects.Image;
  private shadow: Phaser.GameObjects.Ellipse;
  private path: Step[] = [];
  private onArrive: (() => void) | null = null;
  private riding = false;
  private marker: Phaser.GameObjects.Image | null = null;
  speed = 40;

  constructor(private scene: Phaser.Scene, x = 150) {
    this.shadow = scene.add.ellipse(x, LOBBY_FEET, 12, 3, 0x2b2238, 0.25).setDepth(20.5);
    this.body = scene.add.sprite(x, LOBBY_FEET, 'keeper', 0).setOrigin(0.5, 1).setDepth(21);
    this.capsule = scene.add.image(0, 0, 'capsule').setOrigin(0.5, 1).setDepth(22).setVisible(false);
  }

  get x(): number {
    return this.body.x;
  }

  get y(): number {
    return this.body.y;
  }

  get busy(): boolean {
    return this.path.length > 0;
  }

  /** Aller à (étage, x), puis `then`. */
  goTo(floor: number, x: number, then: (() => void) | null = null): void {
    const tx = Math.round(clampX(floor, x));
    this.path = [];
    if (floor !== this.floor || this.riding) {
      if (!this.riding) this.path.push({ kind: 'walk', x: SHAFT_CX });
      this.path.push({ kind: 'ride', floor }, { kind: 'walk', x: tx });
    } else {
      this.path.push({ kind: 'walk', x: tx });
    }
    this.onArrive = then;
    this.showMarker(tx, feetY(floor));
  }

  private showMarker(x: number, y: number): void {
    this.marker?.destroy();
    const m = this.scene.add.image(x, y + 1, 'sparkle').setDepth(19).setAlpha(0.9);
    this.marker = m;
    this.scene.tweens.add({ targets: m, scale: 1.6, alpha: 0, duration: 700, onComplete: () => m.destroy() });
  }

  /** Téléporte (après une nuit de sommeil, par exemple). */
  place(floor: number, x: number): void {
    this.path = [];
    this.onArrive = null;
    this.riding = false;
    this.floor = floor;
    this.body.setPosition(x, feetY(floor)).setFrame(0);
    this.capsule.setVisible(false);
  }

  /** Petite animation de travail (soin, récolte). */
  work(): void {
    this.body.setFrame(3);
    this.scene.tweens.add({ targets: this.body, y: this.body.y - 2, yoyo: true, duration: 120, repeat: 1 });
    this.scene.time.delayedCall(500, () => this.body.active && !this.busy && this.body.setFrame(0));
  }

  update(dt: number, time: number): void {
    const step = this.path[0];
    const b = this.body;
    if (!step) {
      this.shadow.setPosition(b.x, b.y);
      return;
    }
    if (step.kind === 'walk') {
      const dx = step.x - b.x;
      const move = this.speed * dt;
      if (Math.abs(dx) <= move) {
        b.x = step.x;
        this.next();
      } else {
        b.x += Math.sign(dx) * move;
        b.setFlipX(dx < 0);
      }
      b.setFrame(this.path.length ? 1 + (Math.floor(time / 140) % 2) : 0);
      this.capsule.setVisible(false);
    } else {
      this.riding = true;
      b.x = SHAFT_CX;
      const ty = feetY(step.floor);
      const dy = ty - b.y;
      const move = 150 * dt;
      if (Math.abs(dy) <= move) {
        b.y = ty;
        this.floor = step.floor;
        this.riding = false;
        this.next();
      } else {
        b.y += Math.sign(dy) * move;
      }
      b.setFrame(0);
      this.capsule.setVisible(this.riding).setPosition(SHAFT_CX, b.y + 3);
    }
    b.setPosition(Math.round(b.x), Math.round(b.y));
    this.shadow.setPosition(b.x, b.y).setVisible(!this.riding);
  }

  private next(): void {
    this.path.shift();
    if (this.path.length) return;
    this.body.setFrame(0);
    const fn = this.onArrive;
    this.onArrive = null;
    fn?.();
  }

  destroy(): void {
    this.body.destroy();
    this.capsule.destroy();
    this.shadow.destroy();
    this.marker?.destroy();
  }
}
