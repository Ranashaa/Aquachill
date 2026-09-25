import Phaser from 'phaser';
import { TANK_SLOTS } from '../config';
import { services } from '../services';
import { drawTankFrame, drawThemeWall, themeOf } from './building';
import { TankView } from './TankView';

const W = 120; // largeur visible en pixels « art » (zoom ×2)
const H = 214;
const RECT = { x: 8, y: 26, w: 104, h: 116 };
const FLOOR_Y = 172;

export type AquariumMode = 'view' | 'decor';

export class AquariumScene extends Phaser.Scene {
  floorIndex = 0;
  mode: AquariumMode = 'view';
  private tank!: TankView;
  private markers: Phaser.GameObjects.GameObject[] = [];
  private unsub: (() => void)[] = [];
  private pointer = { down: false, moved: false, x: 0, y: 0 };

  constructor() {
    super('Aquarium');
  }

  init(data: { floor: number }): void {
    this.floorIndex = data.floor;
    this.mode = 'view';
    this.markers = [];
    this.unsub = [];
  }

  create(): void {
    const cam = this.cameras.main;
    cam.setZoom(2).centerOn(W / 2, H / 2).setRoundPixels(true);
    const floor = services.sim.state.floors[this.floorIndex];
    const theme = themeOf(floor.biome);

    const g = this.add.graphics();
    drawThemeWall(g, floor.biome, { x0: -10, x1: W + 10, y0: 0, y1: FLOOR_Y });
    g.fillStyle(0x2b2238).fillRect(-10, FLOOR_Y + 8, W + 20, 60);
    g.fillStyle(0x3a3654).fillRect(-10, FLOOR_Y + 9, W + 20, 60);
    drawTankFrame(this.add.graphics().setDepth(4), RECT, theme, 18);
    for (const lx of [RECT.x + 22, RECT.x + RECT.w - 22]) this.add.image(lx, 11, theme.lamp).setOrigin(0.5, 0).setDepth(4);
    this.add.graphics().setDepth(4).fillStyle(0x2b2238).fillRect(-10, 10, W + 20, 1);

    this.tank = new TankView(this, this.floorIndex, RECT, 5, true);

    const glass = this.add.graphics().setDepth(12);
    glass.fillStyle(0xffffff, 0.3).fillRect(RECT.x + 3, RECT.y + 3, 1, 14).fillRect(RECT.x + 5, RECT.y + 3, 1, 7);
    glass.fillStyle(0xffffff, 0.1).fillRect(RECT.x + RECT.w - 16, RECT.y + 3, 5, RECT.h - 16);

    this.setupInput();
    const sim = services.sim;
    this.unsub.push(
      sim.events.on('floorChanged', (i) => {
        if (i !== this.floorIndex) return;
        this.tank.refresh();
        this.drawMarkers();
        services.ui.refreshAquariumHud();
      }),
      sim.events.on('identifyChanged', () => this.tank.refreshMarks()),
      sim.events.on('cleaned', ({ floor }) => {
        if (floor === this.floorIndex) this.celebrateClean();
      }),
    );
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsub.forEach((u) => u());
      this.tank.destroy();
    });
    services.ui.setMode('aquarium', this.floorIndex);
  }

  setMode(mode: AquariumMode): void {
    this.mode = mode;
    this.drawMarkers();
  }

  back(): void {
    services.audio.play('bubble');
    this.scene.stop();
    this.scene.wake('Tower');
  }

  // --------------------------------------------------------------- emplacements

  private drawMarkers(): void {
    this.tweens.killTweensOf(this.markers);
    this.markers.forEach((m) => m.destroy());
    this.markers = [];
    if (this.mode !== 'decor') return;
    const floor = services.sim.state.floors[this.floorIndex];
    const y = this.tank.slotBottom();
    for (let i = 0; i < TANK_SLOTS; i++) {
      const x = this.tank.slotX(i);
      const g = this.add.graphics().setDepth(11);
      const filled = !!floor.slots[i];
      g.lineStyle(1, filled ? 0xffffff : 0xffe066, 0.9);
      g.strokeRect(x - 6, y - 12, 12, 12);
      if (!filled) {
        g.fillStyle(0xffe066, 1).fillRect(x - 2, y - 6, 5, 1).fillRect(x, y - 8, 1, 5);
      }
      this.tweens.add({ targets: g, alpha: 0.4, yoyo: true, repeat: -1, duration: 600 });
      this.markers.push(g);
    }
  }

  // ----------------------------------------------------------------- entrées

  private setupInput(): void {
    const cam = this.cameras.main;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      services.audio.unlock();
      const w = cam.getWorldPoint(p.x, p.y);
      this.pointer = { down: true, moved: false, x: w.x, y: w.y };
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.pointer.down || !p.isDown) return;
      const w = cam.getWorldPoint(p.x, p.y);
      if (!this.pointer.moved && Math.hypot(w.x - this.pointer.x, w.y - this.pointer.y) > 2) this.pointer.moved = true;
      if (this.pointer.moved && this.mode === 'view') this.scrub(w.x, w.y);
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (!this.pointer.down) return;
      this.pointer.down = false;
      if (this.pointer.moved) return;
      const w = cam.getWorldPoint(p.x, p.y);
      this.tap(w.x, w.y);
    });
  }

  private tap(x: number, y: number): void {
    if (!this.tank.contains(x, y)) return;
    if (this.mode === 'decor') {
      const slot = Phaser.Math.Clamp(Math.floor(((x - RECT.x) / RECT.w) * TANK_SLOTS), 0, TANK_SLOTS - 1);
      services.audio.play('click');
      services.ui.openDecorPanel(this.floorIndex, slot);
      return;
    }
    const fish = this.tank.fishAt(x, y, 8);
    if (fish) {
      services.audio.play('bubble');
      if (services.sim.state.toIdentify.includes(fish.uid)) services.ui.openIdentify(fish.uid);
      else services.ui.openSpeciesSheet(fish.species);
      return;
    }
    this.scrub(x, y);
  }

  private scrub(x: number, y: number): void {
    if (!this.tank.contains(x, y)) return;
    const [u, v] = this.tank.toUV(x, y);
    const removed = services.sim.scrubAt(this.floorIndex, u, v);
    if (removed > 0.01) {
      services.audio.play('scrub');
      this.tank.drawAlgae();
      this.sparkle(x, y);
    }
  }

  private sparkle(x: number, y: number): void {
    for (let i = 0; i < 2; i++) {
      const s = this.add
        .rectangle(x + (Math.random() - 0.5) * 8, y + (Math.random() - 0.5) * 8, 1, 1, 0xffffff)
        .setDepth(13);
      this.tweens.add({ targets: s, alpha: 0, y: s.y - 4, duration: 400, onComplete: () => s.destroy() });
    }
  }

  private celebrateClean(): void {
    services.audio.play('clean');
    for (let i = 0; i < 14; i++) {
      const s = this.add
        .image(RECT.x + Math.random() * RECT.w, RECT.y + Math.random() * RECT.h, 'sparkle')
        .setDepth(13)
        .setScale(0.2);
      this.tweens.add({
        targets: s,
        scale: 1,
        alpha: 0,
        angle: 90,
        duration: 700,
        delay: i * 40,
        onComplete: () => s.destroy(),
      });
    }
  }

  update(_time: number, delta: number): void {
    this.tank.update(Math.min(delta, 100) / 1000);
  }
}
