import Phaser from 'phaser';
import { FLOOR_H, GAME_H, GAME_W, HUD_BOTTOM, HUD_TOP, LOBBY_H, SHAFT_W, SHAFT_X, STREET_H } from '../config';
import { BIOMES } from '../data/biomes';
import { services } from '../services';
import { starKey, textTexture, visitorKey } from '../sprites';
import { requirementStatus } from '../systems/progression';
import { visitX, type CoinDrop, type Visitor } from '../systems/visitors';
import { capsuleTexture, cloudTexture, hexNum, skyTexture } from './art';
import { TankView } from './TankView';

const ROOF_H = 26;
const INK = 0x3a3656;
const FRAME = 0x5a5078;
const FRAME_LIGHT = 0x7a70a0;
const DOOR_X = 13;
const ELEV_X = SHAFT_X + SHAFT_W / 2;
const CORRIDOR_X0 = 8;
const CORRIDOR_X1 = SHAFT_X - 4;

interface VisitorSprites {
  body: Phaser.GameObjects.Sprite;
  capsule: Phaser.GameObjects.Image;
  star?: Phaser.GameObjects.Image;
  lastX: number;
}

export const floorTop = (i: number) => -LOBBY_H - (i + 1) * FLOOR_H;
const floorFeet = (i: number) => floorTop(i) + FLOOR_H - 2;
const LOBBY_FEET = -3;

export class TowerScene extends Phaser.Scene {
  private tanks: TankView[] = [];
  private building: Phaser.GameObjects.GameObject[] = [];
  private visitors = new Map<number, VisitorSprites>();
  private drops = new Map<number, Phaser.GameObjects.Image>();
  private clouds: Phaser.GameObjects.Image[] = [];
  private drag = { active: false, startY: 0, startScroll: 0, moved: false, lastY: 0, lastT: 0 };
  private velocity = 0;
  private unsub: (() => void)[] = [];
  private buildSlot: { top: number; canBuild: boolean } | null = null;

  constructor() {
    super('Tower');
  }

  create(): void {
    const cam = this.cameras.main;
    cam.setRoundPixels(true);
    this.add.image(0, 0, skyTexture(this.textures, GAME_W, GAME_H)).setOrigin(0).setScrollFactor(0).setDepth(-100);
    const cloud = cloudTexture(this.textures);
    for (let i = 0; i < 6; i++) {
      this.clouds.push(
        this.add.image(Math.random() * GAME_W, -120 - i * 70, cloud).setScrollFactor(1, 0.5).setDepth(-90).setAlpha(0.9),
      );
    }
    capsuleTexture(this.textures);

    this.layout();
    cam.scrollY = this.maxScroll();

    this.setupInput();
    const sim = services.sim;
    this.unsub.push(
      sim.events.on('floorChanged', (i) => this.tanks[i]?.refresh()),
      sim.events.on('floorBuilt', (i) => {
        this.layout();
        this.tweens.add({ targets: cam, scrollY: floorTop(i) - 80, duration: 900, ease: 'Sine.easeInOut' });
        this.cameras.main.flash(300, 255, 255, 255);
      }),
      sim.events.on('identifyChanged', () => this.tanks.forEach((t) => t.refreshMarks())),
      sim.events.on('dropCollected', ({ drop, auto }) => this.animateCollect(drop, auto)),
      sim.events.on('coins', () => this.refreshBuildSlot()),
      sim.events.on('xp', () => this.refreshBuildSlot()),
    );
    this.events.on(Phaser.Scenes.Events.WAKE, () => {
      services.ui.setMode('tower');
      this.tanks.forEach((t) => t.refresh());
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsub.forEach((u) => u()));
    services.ui.setMode('tower');
  }

  // ----------------------------------------------------------------- mise en page

  private slotCount(): number {
    const n = services.sim.state.floors.length;
    return n + (requirementStatus(services.sim.state) ? 1 : 0);
  }

  private roofTop(): number {
    return -LOBBY_H - this.slotCount() * FLOOR_H - ROOF_H;
  }

  private minScroll(): number {
    return this.roofTop() - 70 - HUD_TOP;
  }

  private maxScroll(): number {
    return STREET_H + HUD_BOTTOM - GAME_H;
  }

  private layout(): void {
    this.tweens.killTweensOf(this.building);
    this.buildBadge = undefined;
    this.building.forEach((o) => o.destroy());
    this.building = [];
    this.tanks.forEach((t) => t.destroy());
    this.tanks = [];

    const cam = this.cameras.main;
    const top = this.minScroll();
    cam.setBounds(0, top, GAME_W, this.maxScroll() + GAME_H - top);

    this.drawStreet();
    this.drawLobby();
    services.sim.state.floors.forEach((floor, i) => this.drawFloor(i, floor.biome));
    this.drawBuildSlot();
    this.drawRoof();
  }

  private g(depth = 0): Phaser.GameObjects.Graphics {
    const g = this.add.graphics().setDepth(depth);
    this.building.push(g);
    return g;
  }

  private img(x: number, y: number, key: string, depth = 2): Phaser.GameObjects.Image {
    const im = this.add.image(Math.round(x), Math.round(y), key).setDepth(depth);
    this.building.push(im);
    return im;
  }

  private text(x: number, y: number, text: string, color = '#ffffff', shadow: string | null = '#3a3656', depth = 3) {
    const im = this.img(x, y, textTexture(this.textures, text, color, shadow), depth);
    return im;
  }

  private drawStreet(): void {
    const g = this.g(1);
    g.fillStyle(0xcfc8d8).fillRect(0, 0, GAME_W, 6);
    g.fillStyle(0xb0a8c0).fillRect(0, 5, GAME_W, 1);
    for (let x = 0; x < GAME_W; x += 12) g.fillStyle(0xb8b0c8).fillRect(x, 0, 1, 5);
    g.fillStyle(0x8fcf7a).fillRect(0, 6, GAME_W, STREET_H + 60);
    g.fillStyle(0x7abf6a);
    for (let i = 0; i < 70; i++) g.fillRect((i * 37) % GAME_W, 8 + ((i * 13) % 20), 1, 1);
    const flowers = [0xffb0d0, 0xfff08a, 0xffffff];
    for (let i = 0; i < 14; i++) {
      g.fillStyle(flowers[i % 3]).fillRect((i * 53 + 7) % GAME_W, 10 + ((i * 7) % 14), 1, 1);
    }
  }

  private drawShaft(g: Phaser.GameObjects.Graphics, top: number, h: number): void {
    g.fillStyle(0xd8f2f8).fillRect(SHAFT_X, top, SHAFT_W, h);
    g.fillStyle(0xbfe6f0).fillRect(SHAFT_X + 3, top, 1, h).fillRect(SHAFT_X + SHAFT_W - 4, top, 1, h);
    g.fillStyle(FRAME).fillRect(SHAFT_X, top, 1, h).fillRect(SHAFT_X + SHAFT_W - 1, top, 1, h);
    g.fillStyle(FRAME_LIGHT).fillRect(SHAFT_X + 1, top + h - 2, SHAFT_W - 2, 2);
    g.fillStyle(FRAME).fillRect(GAME_W - 4, top, 4, h);
  }

  private drawLobby(): void {
    const top = -LOBBY_H;
    const g = this.g(1);
    // murs et sol
    g.fillStyle(0xfbeedd).fillRect(0, top, SHAFT_X, LOBBY_H);
    g.fillStyle(0xf3dcc0);
    for (let x = 6; x < SHAFT_X; x += 10) g.fillRect(x, top + 2, 1, LOBBY_H - 14);
    for (let x = 0; x < SHAFT_X; x += 6) {
      g.fillStyle((x / 6) % 2 === 0 ? 0xe8d8c8 : 0xd8c4b0).fillRect(x, -12, 6, 6);
      g.fillStyle((x / 6) % 2 === 0 ? 0xd8c4b0 : 0xe8d8c8).fillRect(x, -6, 6, 6);
    }
    g.fillStyle(FRAME).fillRect(0, top, GAME_W, 2);
    g.fillStyle(FRAME).fillRect(0, top, 3, LOBBY_H);
    this.drawShaft(g, top, LOBBY_H);
    // porte d'entrée
    g.fillStyle(INK).fillRect(3, -40, 22, 28);
    g.fillStyle(0xbfe8f2).fillRect(5, -38, 8, 26).fillRect(15, -38, 8, 26);
    g.fillStyle(0xffffff).fillRect(6, -37, 1, 6).fillRect(16, -37, 1, 6);
    g.fillStyle(0xffd23a).fillRect(12, -26, 1, 3).fillRect(14, -26, 1, 3);
    // enseigne
    g.fillStyle(INK).fillRect(34, top + 7, 100, 18);
    g.fillStyle(0x5fc6d8).fillRect(35, top + 8, 98, 16);
    g.fillStyle(0x4ab0c4).fillRect(35, top + 22, 98, 2);
    const sign = this.text(84, top + 15, 'AQUACHILL', '#ffffff', '#2a7f90', 4);
    sign.setScale(2);
    // comptoir d'accueil
    g.fillStyle(0xc8865a).fillRect(66, -30, 44, 18);
    g.fillStyle(0xe0a070).fillRect(66, -30, 44, 3);
    g.fillStyle(0xa86a44).fillRect(68, -26, 40, 1);
    const clerk = this.add.sprite(88, -29, visitorKey(5), 0).setOrigin(0.5, 1).setDepth(1.5);
    this.building.push(clerk);
    // bocal sur le comptoir
    g.fillStyle(0xbfe8f2).fillRect(96, -36, 7, 6);
    g.fillStyle(0xff7b1c).fillRect(99, -33, 2, 1);
    g.fillStyle(0xffffff).fillRect(97, -35, 1, 2);
    // plantes en pot
    for (const px of [34, 128]) {
      g.fillStyle(0xc8653a).fillRect(px - 4, -20, 9, 8);
      g.fillStyle(0x5faf4a).fillRect(px - 5, -30, 11, 10);
      g.fillStyle(0x3f8f3a).fillRect(px - 2, -34, 5, 6).fillRect(px - 5, -26, 2, 3).fillRect(px + 4, -27, 2, 3);
    }
    this.text(84, -44, 'BIENVENUE', '#6a6690', null, 3);
  }

  private drawFloor(i: number, biome: keyof typeof BIOMES): void {
    const top = floorTop(i);
    const p = BIOMES[biome].palette;
    const g = this.g(1);
    g.fillStyle(hexNum(p.wall)).fillRect(0, top, SHAFT_X, FLOOR_H);
    g.fillStyle(hexNum(p.wallLight));
    for (let x = 4; x < SHAFT_X; x += 8) g.fillRect(x, top + 2, 1, 46);
    // sol
    g.fillStyle(hexNum(p.wallDark)).fillRect(0, top + 48, SHAFT_X, FLOOR_H - 48);
    g.fillStyle(hexNum(p.wallLight)).fillRect(0, top + 48, SHAFT_X, 1);
    for (let x = 0; x < SHAFT_X; x += 16) g.fillStyle(hexNum(p.wall)).fillRect(x + ((i * 5) % 16), top + 52, 10, 1);
    for (let x = 0; x < SHAFT_X; x += 16) g.fillStyle(hexNum(p.wall)).fillRect(x + 8, top + 57, 10, 1);
    // cadre de l'étage
    g.fillStyle(FRAME).fillRect(0, top, GAME_W, 2);
    g.fillStyle(FRAME).fillRect(0, top, 3, FLOOR_H);
    // lampes
    g.fillStyle(0xfff3b0);
    for (const x of [30, 73, 116]) g.fillRect(x - 2, top + 2, 5, 1);
    this.drawShaft(g, top, FLOOR_H);
    // aquarium : cadre, meuble
    const rect = { x: 8, y: top + 10, w: 130, h: 35 };
    g.fillStyle(INK).fillRect(rect.x - 2, rect.y - 3, rect.w + 4, rect.h + 5);
    g.fillStyle(0x6a6690).fillRect(rect.x - 3, rect.y - 3, rect.w + 6, 2);
    g.fillStyle(INK).fillRect(rect.x + 2, rect.y + rect.h + 2, rect.w - 4, 2);
    // plaque
    const sign = BIOMES[biome].sign;
    const sw = sign.length * 4 + 5;
    g.fillStyle(INK).fillRect(73 - Math.ceil(sw / 2) - 1, top + 2, sw + 2, 6);
    g.fillStyle(hexNum(p.accent)).fillRect(73 - Math.ceil(sw / 2), top + 2, sw, 5);
    this.text(73, top + 5, sign, '#ffffff', null, 3);
    // reflet de vitre (au-dessus des poissons)
    const glass = this.g(12);
    glass.fillStyle(0xffffff, 0.35).fillRect(rect.x + 4, rect.y + 2, 1, 8).fillRect(rect.x + 6, rect.y + 2, 1, 4);
    glass.fillStyle(0xffffff, 0.12).fillRect(rect.x + rect.w - 20, rect.y + 2, 6, rect.h - 8);

    this.tanks[i] = new TankView(this, i, rect, 5);
  }

  private drawBuildSlot(): void {
    const status = requirementStatus(services.sim.state);
    const i = services.sim.state.floors.length;
    this.buildSlot = null;
    if (!status) return;
    const top = floorTop(i);
    const g = this.g(1);
    g.fillStyle(0xf4efe6, 0.85).fillRect(0, top, SHAFT_X, FLOOR_H);
    // échafaudage
    g.fillStyle(0xd8a040);
    for (let x = 4; x < SHAFT_X; x += 22) g.fillRect(x, top, 2, FLOOR_H);
    for (let y = top + 8; y < top + FLOOR_H; y += 20) g.fillRect(0, y, SHAFT_X, 2);
    g.fillStyle(0xe8c070);
    for (let x = 4; x < SHAFT_X - 22; x += 22) {
      for (let k = 0; k < 20; k++) g.fillRect(x + k, top + 8 + k, 1, 1);
    }
    g.fillStyle(FRAME).fillRect(0, top, 3, FLOOR_H);
    this.drawShaft(g, top, FLOOR_H);

    const panel = this.g(3);
    panel.fillStyle(INK).fillRect(26, top + 18, 96, 30);
    panel.fillStyle(0xfdf6e8).fillRect(27, top + 19, 94, 28);
    const biome = BIOMES[status.entry.biome];
    if (status.entry.comingSoon) {
      this.text(74, top + 25, 'BIENTOT', '#e8883a', null, 4);
      this.text(74, top + 33, biome.sign, '#3a3656', null, 4);
      this.text(74, top + 41, 'EN CONSTRUCTION', '#6a6690', null, 4);
    } else {
      this.text(74, top + 25, 'NOUVEL ETAGE', '#e8883a', null, 4);
      this.text(74, top + 33, `${biome.sign} ?`, '#3a3656', null, 4);
      this.text(74, top + 41, 'TOUCHE ICI', '#6a6690', null, 4);
    }
    this.buildSlot = { top, canBuild: status.canBuild };
    this.refreshBuildSlot();
  }

  private buildBadge?: Phaser.GameObjects.Image;

  private refreshBuildSlot(): void {
    const status = requirementStatus(services.sim.state);
    if (!this.buildSlot || !status) return;
    const can = status.canBuild;
    if (can && !this.buildBadge) {
      this.buildBadge = this.img(118, this.buildSlot.top + 18, 'sparkle', 5);
      this.tweens.add({ targets: this.buildBadge, scale: 1.6, angle: 90, yoyo: true, repeat: -1, duration: 600 });
    } else if (!can && this.buildBadge) {
      this.tweens.killTweensOf(this.buildBadge);
      this.buildBadge.destroy();
      this.buildBadge = undefined;
    }
  }

  private drawRoof(): void {
    const top = this.roofTop();
    const g = this.g(1);
    g.fillStyle(FRAME).fillRect(0, top + ROOF_H - 4, GAME_W, 4);
    g.fillStyle(FRAME_LIGHT).fillRect(0, top + ROOF_H - 6, GAME_W, 2);
    // enseigne sur le toit
    g.fillStyle(INK).fillRect(40, top + 2, 70, 14);
    g.fillStyle(0xff8a5c).fillRect(41, top + 3, 68, 12);
    g.fillStyle(INK).fillRect(55, top + 16, 2, 4).fillRect(93, top + 16, 2, 4);
    this.text(75, top + 9, 'AQUACHILL', '#ffffff', '#b04a2a', 3);
    // antenne et drapeau
    g.fillStyle(INK).fillRect(150, top - 10, 1, 30);
    const flag = this.add.rectangle(151, top - 10, 8, 5, 0x5fc6d8).setOrigin(0).setDepth(2);
    this.building.push(flag);
    this.tweens.add({ targets: flag, scaleX: 0.7, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.easeInOut' });
  }

  // --------------------------------------------------------------------- entrées

  private setupInput(): void {
    const cam = this.cameras.main;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      services.audio.unlock();
      this.drag = { active: true, startY: p.y, startScroll: cam.scrollY, moved: false, lastY: p.y, lastT: p.time };
      this.velocity = 0;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.drag.active || !p.isDown) return;
      const dy = p.y - this.drag.startY;
      if (Math.abs(dy) > 4) this.drag.moved = true;
      if (this.drag.moved) {
        cam.scrollY = this.drag.startScroll - dy;
        const dt = Math.max(1, p.time - this.drag.lastT);
        this.velocity = (-(p.y - this.drag.lastY) / dt) * 1000;
        this.drag.lastY = p.y;
        this.drag.lastT = p.time;
      }
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (!this.drag.active) return;
      this.drag.active = false;
      if (!this.drag.moved) {
        const w = cam.getWorldPoint(p.x, p.y);
        this.handleTap(w.x, w.y);
      }
    });
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      cam.scrollY += dy * 0.3;
    });
  }

  private handleTap(x: number, y: number): void {
    const sim = services.sim;
    // pièces
    for (const [id, img] of this.drops) {
      if (Math.hypot(img.x - x, img.y - y) < 9) {
        sim.collectDrop(id);
        return;
      }
    }
    // stars
    for (const [id, vs] of this.visitors) {
      const v = sim.visitors.find((o) => o.id === id);
      if (v?.star && Math.hypot(vs.body.x - x, vs.body.y - 6 - y) < 9) {
        if (!sim.tapStar(id)) services.ui.showStarQuote(v.star);
        return;
      }
    }
    // étages
    const floors = sim.state.floors.length;
    for (let i = 0; i < floors; i++) {
      const top = floorTop(i);
      if (y >= top && y < top + FLOOR_H && x < SHAFT_X) {
        services.audio.play('bubble');
        this.openAquarium(i);
        return;
      }
    }
    if (this.buildSlot && y >= this.buildSlot.top && y < this.buildSlot.top + FLOOR_H) {
      services.audio.play('click');
      services.ui.openBuildPanel();
      return;
    }
    if (y >= -LOBBY_H && y < 0) services.ui.toast('Bienvenue à Aquachill ! Touche un aquarium pour t’en occuper.');
  }

  openAquarium(i: number): void {
    this.scene.launch('Aquarium', { floor: i });
    this.scene.sleep();
  }

  // --------------------------------------------------------------------- visiteurs

  private visitorPos(v: Visitor): { x: number; y: number; walking: boolean; inCapsule: boolean; alpha: number } {
    const k = Math.min(1, v.t / v.dur);
    const ease = Phaser.Math.Easing.Sine.InOut(k);
    switch (v.phase) {
      case 'walkIn':
        return { x: DOOR_X + (ELEV_X - DOOR_X) * k, y: LOBBY_FEET, walking: true, inCapsule: false, alpha: Math.min(1, k * 8) };
      case 'rideUp':
        return { x: ELEV_X, y: LOBBY_FEET + (floorFeet(v.floor) - LOBBY_FEET) * ease, walking: false, inCapsule: true, alpha: 1 };
      case 'visit': {
        const { x, walking } = visitX(v.seed, k);
        return { x: CORRIDOR_X0 + x * (CORRIDOR_X1 - CORRIDOR_X0), y: floorFeet(v.floor), walking, inCapsule: false, alpha: 1 };
      }
      case 'rideDown':
        return { x: ELEV_X, y: floorFeet(v.floor) + (LOBBY_FEET - floorFeet(v.floor)) * ease, walking: false, inCapsule: true, alpha: 1 };
      case 'walkOut':
        return { x: ELEV_X + (DOOR_X - ELEV_X) * k, y: LOBBY_FEET, walking: true, inCapsule: false, alpha: Math.min(1, (1 - k) * 8) };
    }
  }

  private syncVisitors(time: number): void {
    const sim = services.sim;
    const seen = new Set<number>();
    for (const v of sim.visitors) {
      seen.add(v.id);
      let vs = this.visitors.get(v.id);
      if (!vs) {
        const key = v.star ? starKey(v.star) : visitorKey(v.look);
        const body = this.add.sprite(0, 0, key, 0).setOrigin(0.5, 1).setDepth(20);
        const capsule = this.add.image(0, 0, 'capsule').setDepth(21).setVisible(false);
        vs = { body, capsule, lastX: 0 };
        if (v.star) {
          vs.star = this.add.image(0, 0, 'star').setDepth(22);
          this.tweens.add({ targets: vs.star, scale: 1.3, yoyo: true, repeat: -1, duration: 400 });
        }
        this.visitors.set(v.id, vs);
      }
      const pos = this.visitorPos(v);
      const x = Math.round(pos.x);
      const y = Math.round(pos.y);
      vs.body.setPosition(x, y).setAlpha(pos.alpha);
      const frames = vs.body.texture.frameTotal - 1;
      if (frames >= 3) vs.body.setFrame(pos.walking ? 1 + (Math.floor(time / 160 + v.id) % 2) : 0);
      else vs.body.y = y - (pos.walking ? Math.floor(time / 160) % 2 : 0);
      if (x !== vs.lastX) vs.body.setFlipX(x < vs.lastX);
      vs.lastX = x;
      vs.capsule.setVisible(pos.inCapsule).setPosition(x, y - 7);
      vs.star?.setPosition(x, y - vs.body.height - 4).setAlpha(pos.alpha).setVisible(!v.starTapped);
    }
    for (const [id, vs] of this.visitors) {
      if (seen.has(id)) continue;
      vs.body.destroy();
      vs.capsule.destroy();
      if (vs.star) {
        this.tweens.killTweensOf(vs.star);
        vs.star.destroy();
      }
      this.visitors.delete(id);
    }
  }

  private syncDrops(): void {
    for (const drop of services.sim.drops) {
      if (this.drops.has(drop.id)) continue;
      const x = Math.round(CORRIDOR_X0 + drop.x * (CORRIDOR_X1 - CORRIDOR_X0));
      const y = floorTop(drop.floor) + 50;
      const img = this.add.image(x, y, drop.star ? 'starcoin' : 'coin').setDepth(25);
      this.tweens.add({ targets: img, y: y - 3, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: img, scaleX: 0.3, yoyo: true, repeat: -1, duration: 500, delay: 300, repeatDelay: 1400 });
      this.drops.set(drop.id, img);
    }
  }

  private animateCollect(drop: CoinDrop, auto: boolean): void {
    const img = this.drops.get(drop.id);
    if (!img) return;
    this.drops.delete(drop.id);
    this.tweens.killTweensOf(img);
    if (!auto) services.audio.play('coin');
    const label = this.add.image(img.x, img.y - 6, textTexture(this.textures, `+${drop.amount}`, '#ffe066')).setDepth(26);
    this.tweens.add({
      targets: img,
      y: img.y - 16,
      alpha: 0,
      scale: auto ? 0.6 : 1.4,
      duration: 500,
      onComplete: () => img.destroy(),
    });
    this.tweens.add({ targets: label, y: label.y - 12, alpha: 0, duration: 900, delay: 200, onComplete: () => label.destroy() });
  }

  // -------------------------------------------------------------------- boucle

  update(time: number, delta: number): void {
    const dt = Math.min(delta, 100) / 1000;
    const cam = this.cameras.main;
    if (!this.drag.active && Math.abs(this.velocity) > 5) {
      cam.scrollY += this.velocity * dt;
      this.velocity *= Math.pow(0.04, dt);
    }
    for (const c of this.clouds) {
      c.x += dt * 2;
      if (c.x > GAME_W + 20) c.x = -20;
    }
    const view = cam.worldView;
    this.tanks.forEach((tank, i) => {
      const top = floorTop(i);
      tank.update(dt, top + FLOOR_H > view.y && top < view.bottom);
    });
    this.syncVisitors(time);
    this.syncDrops();
  }
}
