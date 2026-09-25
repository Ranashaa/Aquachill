import Phaser from 'phaser';
import { FLOOR_H, GAME_H, GAME_W, HUD_BOTTOM, HUD_TOP, LOBBY_H, ROOM_X0, ROOM_X1, STREET_H, TANK_CAPACITY } from '../config';
import { BIOMES } from '../data/biomes';
import { services } from '../services';
import { starKey, textTexture, visitorKey } from '../sprites';
import { discoveredCount } from '../state/GameState';
import { happiness } from '../systems/happiness';
import { levelForXp, requirementStatus } from '../systems/progression';
import { visitX, VISITOR_LOOKS, type CoinDrop, type Visitor } from '../systems/visitors';
import { capsuleTexture } from './art';
import {
  BANNER_COLORS, drawBanner, drawBuildSlot, drawLobby, drawRoof, drawRoom, drawShaft, drawStreet, floorTop, Painter, tankRect,
} from './building';
import { Environment } from './Environment';
import { TankView } from './TankView';

const ROOF_H = 50;
const SHAFT_CX = 17;
const DOOR_X = 219;
const CORR_L = ROOM_X0 + 8;
const CORR_R = ROOM_X1 - 12;

interface VisitorSprites {
  body: Phaser.GameObjects.Sprite;
  capsule: Phaser.GameObjects.Image;
  star?: Phaser.GameObjects.Image;
  lastX: number;
  thought?: Phaser.GameObjects.Container;
  nextThought: number;
}

const floorFeet = (i: number) => floorTop(i) + FLOOR_H - 2;
const LOBBY_FEET = -3;

/** Position horizontale dans une salle : 1 = près de l'ascenseur (à gauche). */
const corridorX = (f: number) => CORR_R - f * (CORR_R - CORR_L);

export class TowerScene extends Phaser.Scene {
  private painter!: Painter;
  private env!: Environment;
  private tanks: TankView[] = [];
  private banners: Phaser.GameObjects.GameObject[][] = [];
  private visitors = new Map<number, VisitorSprites>();
  private drops = new Map<number, Phaser.GameObjects.Image>();
  private streetShade?: Phaser.GameObjects.Rectangle;
  private drag = { active: false, startY: 0, startScroll: 0, moved: false, lastY: 0, lastT: 0 };
  private velocity = 0;
  private unsub: (() => void)[] = [];
  private buildTop: number | null = null;
  private night = 0;
  private bannerTimer = 0;
  private bubbleTimer = 0;

  constructor() {
    super('Tower');
  }

  create(): void {
    const cam = this.cameras.main;
    cam.setRoundPixels(true);
    this.painter = new Painter(this);
    this.env = new Environment(this);
    this.night = this.env.night;
    capsuleTexture(this.textures);

    this.layout();
    cam.scrollY = this.maxScroll();

    this.setupInput();
    const sim = services.sim;
    this.unsub.push(
      sim.events.on('floorChanged', (i) => {
        this.tanks[i]?.refresh();
        this.drawBannerInfo(i);
      }),
      sim.events.on('floorBuilt', (i) => {
        this.layout();
        this.tweens.add({ targets: cam, scrollY: floorTop(i) - 120, duration: 900, ease: 'Sine.easeInOut' });
        cam.flash(300, 255, 255, 255);
      }),
      sim.events.on('identifyChanged', () => this.tanks.forEach((t) => t.refreshMarks())),
      sim.events.on('dropCollected', ({ drop, auto }) => this.animateCollect(drop, auto)),
      sim.events.on('levelUp', () => this.layout()),
      sim.events.on('towerRenamed', () => this.layout()),
      sim.events.on('expeditionStarted', () => this.layout()),
      sim.events.on('expeditionDone', () => this.layout()),
    );
    let lastCanBuild = !!requirementStatus(sim.state)?.canBuild;
    this.unsub.push(sim.events.on('coins', () => {
      const can = !!requirementStatus(sim.state)?.canBuild;
      if (can !== lastCanBuild) {
        lastCanBuild = can;
        this.layout();
      }
    }));
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
    return this.roofTop() - 90 - HUD_TOP;
  }

  private maxScroll(): number {
    return STREET_H + HUD_BOTTOM - GAME_H;
  }

  private layout(): void {
    const p = this.painter;
    p.clear();
    this.tanks.forEach((t) => t.destroy());
    this.tanks = [];
    this.banners.forEach((b) => b.forEach((o) => o.destroy()));
    this.banners = [];

    const cam = this.cameras.main;
    const top = this.minScroll();
    cam.setBounds(0, top, GAME_W, this.maxScroll() + GAME_H - top);
    this.env.anchor(this.roofTop());

    const sim = services.sim;
    this.streetShade = drawStreet(p);
    drawLobby(p, this.night, sim.state.towerName, !sim.state.expedition);
    sim.state.floors.forEach((floor, i) => {
      const t = floorTop(i);
      drawShaft(p, t, FLOOR_H, String(i + 1));
      drawBanner(p, t, BIOMES[floor.biome].sign, BANNER_COLORS[floor.biome] ?? BANNER_COLORS.build);
      const rect = drawRoom(p, t, floor.biome, this.night);
      this.tanks[i] = new TankView(this, i, rect, 5);
      this.drawBannerInfo(i);
    });

    const status = requirementStatus(sim.state);
    this.buildTop = null;
    if (status) {
      const t = floorTop(sim.state.floors.length);
      const req = status.entry.req;
      const reqText = status.canBuild
        ? 'TOUCHE LE PANNEAU'
        : [
            !status.levelOk ? `NIVEAU ${req.level}` : null,
            !status.speciesOk ? `${req.species} ESPECES` : null,
            !status.coinsOk ? `${req.coins} P.` : null,
          ].filter(Boolean).join(' · ');
      drawBuildSlot(p, t, {
        comingSoon: !!status.entry.comingSoon,
        canBuild: status.canBuild,
        biomeName: BIOMES[status.entry.biome].name,
        biomeSign: BIOMES[status.entry.biome].sign,
        reqText,
      }, this.night);
      this.buildTop = t;
    }
    const buildable = status && !status.entry.comingSoon ? status : null;
    drawRoof(p, this.roofTop(), { price: buildable ? buildable.entry.req.coins : null, canBuild: !!buildable?.canBuild, name: sim.state.towerName }, this.night);
    this.applyNight();
  }

  /** Étoiles de bonheur et nombre de poissons sur le bandeau d'un étage. */
  private drawBannerInfo(i: number): void {
    this.banners[i]?.forEach((o) => o.destroy());
    const floor = services.sim.state.floors[i];
    if (!floor) return;
    const top = floorTop(i);
    const objs: Phaser.GameObjects.GameObject[] = [];
    const starsOn = Math.max(1, Math.round(happiness(floor) * 5));
    const sx = ROOM_X0 + 10 + BIOMES[floor.biome].sign.length * 6;
    for (let k = 0; k < 5; k++) {
      objs.push(this.add.image(sx + k * 6, top + 3, k < starsOn ? 'star5' : 'star5off').setOrigin(0).setDepth(4));
    }
    const count = `${floor.fish.length}/${TANK_CAPACITY}`;
    const key = textTexture(this.textures, count, '#bfefff', '#2b2238');
    objs.push(this.add.image(GAME_W - 5, top + 2, key).setOrigin(1, 0).setDepth(4));
    objs.push(this.add.image(GAME_W - 8 - this.textures.get(key).getSourceImage().width, top + 5, 'fishicon').setOrigin(1, 0.5).setDepth(4));
    this.banners[i] = objs;
  }

  private applyNight(): void {
    this.painter.setNight(this.night);
    this.streetShade?.setFillStyle(0x0a0820, this.night * 0.55);
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
    for (const [id, img] of this.drops) {
      if (Math.hypot(img.x - x, img.y - y) < 10) {
        sim.collectDrop(id);
        return;
      }
    }
    for (const [id, vs] of this.visitors) {
      const v = sim.visitors.find((o) => o.id === id);
      if (v?.star && Math.abs(vs.body.x - x) < 9 && y < vs.body.y + 2 && y > vs.body.y - 26) {
        if (!sim.tapStar(id)) services.ui.showStarQuote(v.star);
        return;
      }
    }
    for (let i = 0; i < sim.state.floors.length; i++) {
      const top = floorTop(i);
      if (y >= top && y < top + FLOOR_H && x >= ROOM_X0) {
        services.audio.play('bubble');
        this.openAquarium(i);
        return;
      }
    }
    const onRoofSign = y >= this.roofTop() - 24 && y < this.roofTop() + 40 && x > 80 && x < 192;
    if (this.buildTop !== null && ((y >= this.buildTop && y < this.buildTop + FLOOR_H) || onRoofSign)) {
      services.audio.play('click');
      services.ui.openBuildPanel();
      return;
    }
    if (y >= -LOBBY_H && y < 0) {
      const s = sim.state;
      services.ui.toast(
        `Bienvenue ! Tour niveau ${levelForXp(s.xp)} · ${s.stats.visitors} visiteurs · ${discoveredCount(s)} espèces.`,
      );
    }
  }

  openAquarium(i: number): void {
    this.scene.launch('Aquarium', { floor: i });
    this.scene.sleep();
  }

  // --------------------------------------------------------------------- visiteurs

  private visitorPos(v: Visitor) {
    const k = Math.min(1, v.t / v.dur);
    const ease = Phaser.Math.Easing.Sine.InOut(k);
    const fade = (a: number) => Math.min(1, a * 8);
    switch (v.phase) {
      case 'walkIn':
        return { x: DOOR_X + (SHAFT_CX - DOOR_X) * k, y: LOBBY_FEET, walking: true, back: false, inCapsule: k > 0.93, alpha: fade(k) };
      case 'rideUp':
        return { x: SHAFT_CX, y: LOBBY_FEET + (floorFeet(v.floor) - LOBBY_FEET) * ease, walking: false, back: false, inCapsule: true, alpha: 1 };
      case 'visit': {
        const { x, walking } = visitX(v.seed, k);
        let px = corridorX(x);
        // sortie et retour dans la bulle
        if (k < 0.04) px = SHAFT_CX + (corridorX(visitX(v.seed, 0.04).x) - SHAFT_CX) * (k / 0.04);
        if (k > 0.97) {
          const from = corridorX(visitX(v.seed, 0.97).x);
          px = from + (SHAFT_CX - from) * ((k - 0.97) / 0.03);
        }
        const out = k < 0.04 || k > 0.97;
        return { x: px, y: floorFeet(v.floor), walking: walking || out, back: !walking && !out, inCapsule: false, alpha: 1 };
      }
      case 'rideDown':
        return { x: SHAFT_CX, y: floorFeet(v.floor) + (LOBBY_FEET - floorFeet(v.floor)) * ease, walking: false, back: false, inCapsule: true, alpha: 1 };
      case 'walkOut':
        return { x: SHAFT_CX + (DOOR_X - SHAFT_CX) * k, y: LOBBY_FEET, walking: true, back: false, inCapsule: k < 0.07, alpha: fade(1 - k) };
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
        const capsule = this.add.image(0, 0, 'capsule').setOrigin(0.5, 1).setDepth(21).setVisible(false);
        vs = { body, capsule, lastX: 0, nextThought: time + 3000 + Math.random() * 5000 };
        if (v.star) {
          vs.star = this.add.image(0, 0, 'star').setDepth(22);
          this.tweens.add({ targets: vs.star, scale: 1.3, yoyo: true, repeat: -1, duration: 400 });
        }
        this.visitors.set(v.id, vs);
      }
      const pos = this.visitorPos(v);
      const x = Math.round(pos.x);
      const y = Math.round(pos.y);
      vs.body.setPosition(x, y).setAlpha(pos.alpha).setDepth(pos.inCapsule ? 19 : 20);
      const frames = vs.body.texture.frameTotal - 1;
      if (frames >= 4) {
        vs.body.setFrame(pos.walking ? 1 + (Math.floor(time / 150 + v.id) % 2) : pos.back ? 3 : 0);
      } else if (pos.walking) {
        vs.body.y = y - (Math.floor(time / 150) % 2);
      }
      if (x !== vs.lastX) vs.body.setFlipX(x < vs.lastX);
      vs.lastX = x;
      vs.capsule.setVisible(pos.inCapsule).setPosition(SHAFT_CX, y + 3);
      vs.star?.setPosition(x, y - vs.body.height - 5).setAlpha(pos.alpha).setVisible(!v.starTapped);
      // bulles de pensée et photos pendant qu'ils admirent
      if (pos.back && time > vs.nextThought) {
        vs.nextThought = time + 5000 + Math.random() * 7000;
        this.think(vs, v.floor);
      }
      vs.thought?.setPosition(x, y - vs.body.height - (vs.star ? 12 : 3));
    }
    for (const [id, vs] of this.visitors) {
      if (seen.has(id)) continue;
      vs.body.destroy();
      vs.capsule.destroy();
      if (vs.star) {
        this.tweens.killTweensOf(vs.star);
        vs.star.destroy();
      }
      vs.thought?.destroy();
      this.visitors.delete(id);
    }
  }

  private think(vs: VisitorSprites, floor: number): void {
    vs.thought?.destroy();
    const photo = Math.random() < 0.18;
    const icons = ['ico-heart', 'ico-heart', 'ico-fish', 'ico-wow', 'ico-note', 'ico-star'];
    const icon = photo ? 'ico-camera' : icons[Math.floor(Math.random() * icons.length)];
    const c = this.add.container(vs.body.x, vs.body.y, [
      this.add.image(0, 0, 'thought').setOrigin(0.5, 1),
      this.add.image(0, -7, icon).setOrigin(0.5, 0.5),
    ]).setDepth(23).setScale(0);
    vs.thought = c;
    this.tweens.add({ targets: c, scale: 1, duration: 180, ease: 'Back.easeOut' });
    this.time.delayedCall(2200, () => {
      if (!c.active) return;
      this.tweens.add({ targets: c, alpha: 0, duration: 250, onComplete: () => c.destroy() });
    });
    if (photo) {
      this.time.delayedCall(500, () => {
        const r = tankRect(floorTop(floor));
        const flash = this.add.rectangle(r.x, r.y, r.w, r.h, 0xffffff, 0.7).setOrigin(0).setDepth(13);
        this.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });
      });
    }
  }

  // ----------------------------------------------------------------------- rue

  private street: { obj: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image; vx: number; kind: 'walker' | 'car' | 'bird' }[] = [];
  private streetT = 2;
  private birdT = 5;

  private updateStreet(dt: number, time: number): void {
    this.streetT -= dt;
    if (this.streetT <= 0) {
      this.streetT = 3 + Math.random() * 6;
      const dir = Math.random() < 0.5 ? 1 : -1;
      if (Math.random() < 0.35) {
        const tints = [0xffffff, 0x9fd0ff, 0xb8f0a0, 0xfff09a, 0xe0b8ff];
        const car = this.add.image(dir > 0 ? -20 : GAME_W + 20, 31, 'car').setOrigin(0.5, 1).setDepth(18)
          .setFlipX(dir < 0).setTint(tints[Math.floor(Math.random() * tints.length)]);
        this.street.push({ obj: car, vx: dir * (35 + Math.random() * 20), kind: 'car' });
      } else {
        const look = Math.floor(Math.random() * VISITOR_LOOKS);
        const w = this.add.sprite(dir > 0 ? -10 : GAME_W + 10, 8, visitorKey(look), 1).setOrigin(0.5, 1).setDepth(18);
        w.setFlipX(dir < 0);
        this.street.push({ obj: w, vx: dir * (14 + Math.random() * 8), kind: 'walker' });
      }
    }
    this.birdT -= dt;
    if (this.birdT <= 0) {
      this.birdT = 8 + Math.random() * 12;
      if (this.night < 0.5) {
        const dir = Math.random() < 0.5 ? 1 : -1;
        const b = this.add.image(dir > 0 ? -6 : GAME_W + 6, this.roofTop() - 20 - Math.random() * 70, 'bird').setDepth(-80);
        this.street.push({ obj: b, vx: dir * (22 + Math.random() * 10), kind: 'bird' });
      }
    }
    for (const it of this.street) {
      it.obj.x += it.vx * dt;
      if (it.kind === 'walker') (it.obj as Phaser.GameObjects.Sprite).setFrame(1 + (Math.floor(time / 170) % 2));
      if (it.kind === 'bird') {
        it.obj.setTexture(Math.floor(time / 220) % 2 ? 'bird' : 'bird2');
        it.obj.y += Math.sin(time / 300) * 0.05;
      }
    }
    this.street = this.street.filter((it) => {
      if (it.obj.x > -30 && it.obj.x < GAME_W + 30) return true;
      it.obj.destroy();
      return false;
    });
  }

  private syncDrops(): void {
    for (const drop of services.sim.drops) {
      if (this.drops.has(drop.id)) continue;
      const x = Math.round(corridorX(drop.x));
      const y = floorTop(drop.floor) + 72;
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
    const label = this.add.image(img.x, img.y - 8, textTexture(this.textures, `+${drop.amount}`, '#ffe066')).setDepth(26);
    this.tweens.add({ targets: img, y: img.y - 16, alpha: 0, scale: auto ? 0.6 : 1.4, duration: 500, onComplete: () => img.destroy() });
    this.tweens.add({ targets: label, y: label.y - 12, alpha: 0, duration: 900, delay: 200, onComplete: () => label.destroy() });
  }

  /** Bulles qui montent dans la colonne d'eau de l'ascenseur. */
  private shaftBubbles(dt: number): void {
    this.bubbleTimer -= dt;
    if (this.bubbleTimer > 0) return;
    this.bubbleTimer = 0.25;
    const view = this.cameras.main.worldView;
    const b = this.add.rectangle(8 + Math.floor(Math.random() * 18), view.bottom, Math.random() < 0.3 ? 2 : 1, Math.random() < 0.3 ? 2 : 1, 0xe8fbff, 0.8).setDepth(3.5);
    this.tweens.add({
      targets: b,
      y: Math.max(view.y, this.roofTop() + 24),
      duration: 3000 + Math.random() * 2000,
      onComplete: () => b.destroy(),
    });
  }

  // ------------------------------------------------------------------------ boucle

  update(time: number, delta: number): void {
    const dt = Math.min(delta, 100) / 1000;
    const cam = this.cameras.main;
    if (!this.drag.active && Math.abs(this.velocity) > 5) {
      cam.scrollY += this.velocity * dt;
      this.velocity *= Math.pow(0.04, dt);
    }
    this.env.update(dt);
    if (Math.abs(this.env.night - this.night) > 0.05) {
      this.night = this.env.night;
      this.layout();
    }
    const view = cam.worldView;
    this.tanks.forEach((tank, i) => {
      const top = floorTop(i);
      tank.update(dt, top + FLOOR_H > view.y && top < view.bottom);
    });
    this.bannerTimer -= dt;
    if (this.bannerTimer <= 0) {
      this.bannerTimer = 5;
      services.sim.state.floors.forEach((_, i) => this.drawBannerInfo(i));
    }
    this.shaftBubbles(dt);
    this.updateStreet(dt, time);
    this.syncVisitors(time);
    this.syncDrops();
  }
}
