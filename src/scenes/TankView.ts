// Contenu d'un aquarium (eau, décor, poissons, algues, bulles), utilisé à la fois
// dans la vue de la tour (miniature) et dans la vue détaillée d'un étage.
import Phaser from 'phaser';
import { ALGAE_COLS, ALGAE_ROWS } from '../config';
import { BIOMES } from '../data/biomes';
import { DECOR } from '../data/decor';
import { SPECIES_BY_ID, type Species } from '../data/species';
import { services } from '../services';
import { decorKey, fishTexture, textTexture } from '../sprites';
import type { FishInstance, FloorState } from '../state/GameState';
import { happiness } from '../systems/happiness';
import { hash01 } from '../systems/rng';
import { TANK_SLOTS } from '../config';
import { causticTexture, hexToRgb, sandHeight, tankBackground } from './art';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Flake {
  obj: Phaser.GameObjects.Rectangle;
  x: number;
  y: number;
  vy: number;
  life: number;
}

const STAGE_SCALE = { egg: 0, fry: 0.5, juvenile: 0.75, adult: 1 } as const;

class Swimmer {
  sprite: Phaser.GameObjects.Sprite;
  mark?: Phaser.GameObjects.Image;
  species: Species;
  tx = 0;
  ty = 0;
  idle = 0;
  animT = 0;
  frame = 0;
  burst = 0;
  /** Point d'intérêt (vitre touchée) pour les curieux. */
  lure: { x: number; y: number; t: number } | null = null;

  constructor(public view: TankView, public fish: FishInstance, rng: number) {
    this.species = SPECIES_BY_ID[fish.species];
    const [x, y] = view.randomPoint(this.species, rng);
    this.sprite = view.scene.add.sprite(x, y, fishTexture(fish), 0).setDepth(view.depth + 3);
    this.sprite.setFlipX(rng > 0.5);
    this.sync();
    this.pickTarget();
  }

  /** Met à jour l'apparence (croissance, variante). */
  sync(): void {
    this.sprite.setTexture(fishTexture(this.fish), this.frame);
    this.sprite.setScale(STAGE_SCALE[this.fish.stage] || 1);
  }

  get personality() {
    return this.fish.personality;
  }

  pickTarget(): void {
    const p = this.personality;
    const leader = this.species.school ? this.view.leaderOf(this) : p === 'sociable' ? this.view.friendOf(this) : null;
    if (leader) {
      this.tx = leader.sprite.x + (Math.random() - 0.5) * 14;
      this.ty = leader.sprite.y + (Math.random() - 0.5) * 8;
      [this.tx, this.ty] = this.view.clampToZone(this.species, this.tx, this.ty);
    } else if (p === 'timide' && Math.random() < 0.7) {
      // reste près d'une cachette
      const [hx, hy] = this.view.hidingSpot(this.fish.uid);
      [this.tx, this.ty] = this.view.clampToZone(this.species, hx + (Math.random() - 0.5) * 10, hy);
    } else {
      [this.tx, this.ty] = this.view.randomPoint(this.species, Math.random());
    }
    if (p === 'joueur' && Math.random() < 0.3) this.burst = 0.7;
  }

  update(dt: number, speedFactor: number): void {
    const s = this.sprite;
    const p = this.personality;
    // l'heure du repas : on file vers la paillette la plus proche
    const food = this.view.nearestFlake(s.x, s.y);
    if (food) {
      this.idle = 0;
      [this.tx, this.ty] = this.view.clampToZone(this.species, food.x, food.y);
      if (Math.hypot(food.x - s.x, food.y - s.y) < 3) this.view.eatFlake(food);
    } else if (this.lure) {
      this.lure.t -= dt;
      this.idle = 0;
      [this.tx, this.ty] = this.view.clampToZone(this.species, this.lure.x, this.lure.y);
      if (this.lure.t <= 0) this.lure = null;
    }
    this.burst = Math.max(0, this.burst - dt);
    let mult = food ? (p === 'gourmand' ? 3.4 : 2.2) : this.burst > 0 ? 2.8 : 1;
    if (p === 'timide') mult *= 0.8;
    if (this.fish.stage === 'fry') mult *= 1.2;
    const speed = this.species.speed * this.view.baseSpeed * speedFactor * mult;
    this.animT += dt * (0.8 + this.species.speed);
    if (this.animT > 0.3) {
      this.animT = 0;
      this.frame = 1 - this.frame;
      s.setFrame(this.idle > 0 && this.species.zone !== 'hover' ? 0 : this.frame);
    }
    if (this.idle > 0) {
      this.idle -= dt;
      if (this.species.zone === 'hover') s.y += Math.sin(performance.now() / 500 + this.fish.uid) * 0.02;
      this.moveMark();
      return;
    }
    const dx = this.tx - s.x;
    const dy = this.ty - s.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) {
      if (food || this.lure) return;
      let lazy = this.species.zone === 'bottom' || this.species.zone === 'hover' ? 0.7 : 0.35;
      if (p === 'paresseux') lazy = 0.85;
      if (Math.random() < lazy) this.idle = (0.6 + Math.random() * 2.2) * (p === 'paresseux' ? 2.5 : 1);
      this.pickTarget();
      return;
    }
    const step = Math.min(dist, speed * dt);
    s.x += (dx / dist) * step;
    s.y += (dy / dist) * step;
    if (Math.abs(dx) > 0.5) s.setFlipX(dx < 0);
    this.moveMark();
  }

  private moveMark(): void {
    const s = this.sprite;
    if (this.mark) this.mark.setPosition(Math.round(s.x), Math.round(s.y - s.displayHeight / 2 - 4));
  }

  destroy(): void {
    this.sprite.destroy();
    if (this.mark) {
      this.view.scene.tweens.killTweensOf(this.mark);
      this.mark.destroy();
    }
  }
}

export class TankView {
  readonly bg: Phaser.GameObjects.Image;
  private decor: Phaser.GameObjects.Sprite[] = [];
  private swayT = 0;
  private flakes: Flake[] = [];
  private feedQueue = 0;
  private feedT = 0;
  private autoFeedT = 30 + Math.random() * 60;
  private caustics?: Phaser.GameObjects.Image;
  private causticKeys: string[] = [];
  private causticT = 0;
  private causticFrame = 0;
  private swimmers: Swimmer[] = [];
  private eggs: Phaser.GameObjects.Image[] = [];
  private algaeTex: Phaser.Textures.CanvasTexture;
  private algaeImg: Phaser.GameObjects.Image;
  private algaeSig = '';
  private algaeTimer = 0;
  private fx: Phaser.GameObjects.GameObject[] = [];
  private bubbleT = 0;
  private heartT = 3;
  readonly sand: number;
  readonly baseSpeed: number;
  private static counter = 0;

  constructor(
    public scene: Phaser.Scene,
    public floorIndex: number,
    public rect: Rect,
    public depth = 0,
    private detailed = false,
  ) {
    const floor = this.floor;
    this.sand = sandHeight(rect.h);
    this.baseSpeed = detailed ? 5 : 3.5;
    this.bg = scene.add
      .image(rect.x, rect.y, tankBackground(scene.textures, floor.biome, rect.w, rect.h))
      .setOrigin(0)
      .setDepth(depth);
    const key = `algae-${TankView.counter++}`;
    this.algaeTex = scene.textures.createCanvas(key, rect.w, rect.h)!;
    this.algaeImg = scene.add.image(rect.x, rect.y, key).setOrigin(0).setDepth(depth + 6);
    this.causticKeys = [0, 1, 2, 3].map((k) => causticTexture(scene.textures, rect.w, rect.h, k));
    this.caustics = scene.add
      .image(rect.x, rect.y, this.causticKeys[0])
      .setOrigin(0)
      .setDepth(depth + 2)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(detailed ? 0.32 : 0.4);
    this.refresh();
  }

  get floor(): FloorState {
    return services.sim.state.floors[this.floorIndex];
  }

  // ------------------------------------------------------------- géométrie

  slotX(slot: number): number {
    return Math.round(this.rect.x + ((slot + 0.5) / TANK_SLOTS) * this.rect.w);
  }

  slotBottom(): number {
    return this.rect.y + this.rect.h - Math.floor(this.sand / 2);
  }

  zoneBounds(species: Species): { x0: number; x1: number; y0: number; y1: number } {
    const r = this.rect;
    const bottom = r.y + r.h - this.sand;
    const x0 = r.x + 8;
    const x1 = r.x + r.w - 8;
    switch (species.zone) {
      case 'bottom':
        return { x0, x1, y0: bottom - 5, y1: bottom - 2 };
      case 'surface':
        return { x0, x1, y0: r.y + 4, y1: r.y + Math.max(6, r.h * 0.25) };
      case 'hover':
        return { x0, x1, y0: r.y + r.h * 0.3, y1: bottom - 10 };
      default:
        return { x0, x1, y0: r.y + Math.max(5, r.h * 0.15), y1: bottom - 5 };
    }
  }

  randomPoint(species: Species, t: number): [number, number] {
    const b = this.zoneBounds(species);
    return [b.x0 + Math.random() * (b.x1 - b.x0), b.y0 + ((t * 7.13) % 1) * (b.y1 - b.y0)];
  }

  clampToZone(species: Species, x: number, y: number): [number, number] {
    const b = this.zoneBounds(species);
    return [Phaser.Math.Clamp(x, b.x0, b.x1), Phaser.Math.Clamp(y, b.y0, b.y1)];
  }

  leaderOf(sw: Swimmer): Swimmer | null {
    const first = this.swimmers.find((o) => o.species.id === sw.species.id);
    return first && first !== sw ? first : null;
  }

  /** Un autre poisson à accompagner (pour les sociables). */
  friendOf(sw: Swimmer): Swimmer | null {
    const others = this.swimmers.filter((o) => o !== sw);
    return others.length ? others[Math.floor(Math.random() * others.length)] : null;
  }

  /** Cachette préférée d'un poisson timide : près d'un objet de décor. */
  hidingSpot(uid: number): [number, number] {
    const used = this.floor.slots.map((id, i) => (id ? i : -1)).filter((i) => i >= 0);
    const slot = used.length ? used[uid % used.length] : Math.floor(TANK_SLOTS / 2);
    return [this.slotX(slot), this.rect.y + this.rect.h - this.sand - 8];
  }

  /** Les poissons curieux viennent voir l'endroit où l'on a touché la vitre. */
  lure(x: number, y: number): void {
    for (const sw of this.swimmers) {
      if (sw.personality === 'curieux' || Math.random() < 0.15) sw.lure = { x, y, t: 2.5 };
    }
  }

  /** Réaction à un câlin : petit saut, cœur et prénom. */
  petReaction(uid: number, gained: boolean): void {
    const sw = this.swimmers.find((o) => o.fish.uid === uid);
    if (!sw) return;
    const s = sw.sprite;
    sw.idle = 0.8;
    this.scene.tweens.add({ targets: s, y: s.y - 4, yoyo: true, duration: 180, ease: 'Sine.easeOut' });
    if (gained) this.spawnHeartAt(s.x, s.y - 6);
    const label = this.scene.add
      .image(Math.round(s.x), Math.round(s.y - s.displayHeight / 2 - 8), textTexture(this.scene.textures, sw.fish.name, '#ffffff', '#2b2238', 'small'))
      .setDepth(this.depth + 8);
    this.fx.push(label);
    this.scene.tweens.add({ targets: label, y: label.y - 6, alpha: 0, delay: 900, duration: 700, onComplete: () => this.removeFx(label) });
  }

  /** Coordonnées normalisées (u, v) d'un point du monde dans la vitre. */
  toUV(x: number, y: number): [number, number] {
    return [(x - this.rect.x) / this.rect.w, (y - this.rect.y) / this.rect.h];
  }

  contains(x: number, y: number): boolean {
    const r = this.rect;
    return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
  }

  fishAt(x: number, y: number, radius = 6): FishInstance | null {
    let best: Swimmer | null = null;
    let bestD = radius;
    for (const sw of this.swimmers) {
      const d = Math.hypot(sw.sprite.x - x, sw.sprite.y - y);
      if (d < bestD) {
        best = sw;
        bestD = d;
      }
    }
    return best?.fish ?? null;
  }

  // ------------------------------------------------------------ synchronisation

  /** Reconstruit décor et poissons à partir de l'état. */
  refresh(): void {
    const floor = this.floor;
    this.decor.forEach((d) => d.destroy());
    this.decor = [];
    floor.slots.forEach((id, i) => {
      if (!id) return;
      const item = DECOR[id];
      const img = this.scene.add.sprite(this.slotX(i), 0, decorKey(id), 0).setDepth(this.depth + 1);
      if (item.anchor === 'surface') {
        img.setOrigin(0.5, 0).setY(this.rect.y + (id === 'lily' ? -2 : 0));
        img.setDepth(this.depth + 5);
      } else {
        img.setOrigin(0.5, 1).setY(this.slotBottom());
        // les objets hauts peuvent dépasser : on les réduit dans les petits aquariums
        const maxH = this.rect.h - this.sand / 2 - 2;
        if (img.height > maxH) img.setScale(Math.max(0.5, maxH / img.height));
      }
      this.decor.push(img);
    });

    const swimming = floor.fish.filter((f) => f.stage !== 'egg');
    const present = new Set(swimming.map((f) => f.uid));
    this.swimmers = this.swimmers.filter((sw) => {
      if (present.has(sw.fish.uid)) return true;
      sw.destroy();
      return false;
    });
    for (const sw of this.swimmers) sw.sync();
    for (const fish of swimming) {
      if (!this.swimmers.some((sw) => sw.fish.uid === fish.uid)) {
        this.swimmers.push(new Swimmer(this, fish, hash01(fish.uid)));
      }
    }
    // œufs posés sur le sable
    this.eggs.forEach((e) => {
      this.scene.tweens.killTweensOf(e);
      e.destroy();
    });
    this.eggs = floor.fish
      .filter((f) => f.stage === 'egg')
      .map((f) => {
        const x = this.rect.x + 10 + hash01(f.uid * 3) * (this.rect.w - 20);
        const img = this.scene.add.image(Math.round(x), this.rect.y + this.rect.h - Math.floor(this.sand / 2), 'eggs')
          .setOrigin(0.5, 1).setDepth(this.depth + 2);
        if (!this.detailed) img.setScale(0.6);
        this.scene.tweens.add({ targets: img, angle: { from: -6, to: 6 }, yoyo: true, repeat: -1, duration: 400, repeatDelay: 2500 + hash01(f.uid) * 2000 });
        return img;
      });
    this.refreshMarks();
    this.drawAlgae(true);
  }

  /** Affiche un « ? » au-dessus des poissons à identifier. */
  refreshMarks(): void {
    const pending = new Set(services.sim.state.toIdentify);
    for (const sw of this.swimmers) {
      const need = pending.has(sw.fish.uid);
      if (need && !sw.mark) {
        sw.mark = this.scene.add.image(sw.sprite.x, sw.sprite.y - 8, 'question').setDepth(this.depth + 7);
        this.scene.tweens.add({ targets: sw.mark, scale: 1.15, yoyo: true, repeat: -1, duration: 500 });
      } else if (!need && sw.mark) {
        this.scene.tweens.killTweensOf(sw.mark);
        sw.mark.destroy();
        sw.mark = undefined;
      }
    }
  }

  // ------------------------------------------------------------------ algues

  drawAlgae(force = false): void {
    const algae = this.floor.algae;
    const sig = algae.map((v) => Math.round(v * 40)).join(',');
    if (!force && sig === this.algaeSig) return;
    this.algaeSig = sig;
    const { w, h } = this.rect;
    const ctx = this.algaeTex.getContext();
    ctx.clearRect(0, 0, w, h);
    const p = BIOMES[this.floor.biome].palette;
    const [r1, g1, b1] = hexToRgb(p.algae);
    const [r2, g2, b2] = hexToRgb(p.algaeDark);
    const sample = (x: number, y: number) => {
      const cx = Phaser.Math.Clamp((x / w) * ALGAE_COLS - 0.5, 0, ALGAE_COLS - 1);
      const cy = Phaser.Math.Clamp((y / h) * ALGAE_ROWS - 0.5, 0, ALGAE_ROWS - 1);
      const x0 = Math.floor(cx);
      const y0 = Math.floor(cy);
      const x1 = Math.min(ALGAE_COLS - 1, x0 + 1);
      const y1 = Math.min(ALGAE_ROWS - 1, y0 + 1);
      const fx = cx - x0;
      const fy = cy - y0;
      const v = (i: number, j: number) => algae[j * ALGAE_COLS + i];
      return (v(x0, y0) * (1 - fx) + v(x1, y0) * fx) * (1 - fy) + (v(x0, y1) * (1 - fx) + v(x1, y1) * fx) * fy;
    };
    const img = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const v = sample(x, y);
        if (v <= 0.02) continue;
        const n = hash01(x * 92821 + y * 68917 + this.floorIndex);
        const i = (y * w + x) * 4;
        if (n < v * 0.6) {
          const dark = hash01(x * 13 + y * 7) < 0.35;
          img.data[i] = dark ? r2 : r1;
          img.data[i + 1] = dark ? g2 : g1;
          img.data[i + 2] = dark ? b2 : b1;
          img.data[i + 3] = 150 + Math.round(v * 90);
        } else {
          img.data[i] = r1;
          img.data[i + 1] = g1;
          img.data[i + 2] = b1;
          img.data[i + 3] = Math.round(v * 45);
        }
      }
    }
    ctx.putImageData(img, 0, 0);
    this.algaeTex.refresh();
  }

  // ------------------------------------------------------------------ effets

  spawnBubble(x?: number): void {
    const r = this.rect;
    const bx = x ?? r.x + 6 + Math.random() * (r.w - 12);
    const by = r.y + r.h - this.sand;
    const obj = this.detailed
      ? this.scene.add.image(bx, by, 'bubble').setDepth(this.depth + 4).setAlpha(0.85)
      : this.scene.add.rectangle(bx, by, 1, 1, 0xe8fbff, 0.9).setOrigin(0).setDepth(this.depth + 4);
    this.fx.push(obj);
    this.scene.tweens.add({
      targets: obj,
      y: r.y + 2,
      x: bx + (Math.random() - 0.5) * 6,
      duration: (r.h / (this.detailed ? 22 : 14)) * 1000,
      ease: 'Sine.easeIn',
      onComplete: () => this.removeFx(obj),
    });
  }

  spawnHeart(): void {
    if (this.swimmers.length === 0) return;
    const sw = this.swimmers[Math.floor(Math.random() * this.swimmers.length)];
    this.spawnHeartAt(sw.sprite.x, sw.sprite.y - 5);
  }

  spawnHeartAt(x: number, y: number): void {
    const heart = this.scene.add.image(x, y, 'heart').setDepth(this.depth + 7);
    if (!this.detailed) heart.setScale(0.6);
    this.fx.push(heart);
    this.scene.tweens.add({
      targets: heart,
      y: heart.y - 10,
      alpha: 0,
      duration: 1400,
      onComplete: () => this.removeFx(heart),
    });
  }

  private removeFx(obj: Phaser.GameObjects.GameObject): void {
    obj.destroy();
    this.fx = this.fx.filter((o) => o !== obj);
  }

  // ------------------------------------------------------------------ repas

  /** Le soigneur verse quelques paillettes : les poissons accourent. */
  feed(): void {
    this.feedQueue += 8 + Math.floor(Math.random() * 6);
  }

  nearestFlake(x: number, y: number): Flake | null {
    let best: Flake | null = null;
    let bestD = Infinity;
    for (const f of this.flakes) {
      const d = Math.hypot(f.x - x, f.y - y);
      if (d < bestD) {
        best = f;
        bestD = d;
      }
    }
    return best;
  }

  eatFlake(f: Flake): void {
    f.obj.destroy();
    this.flakes = this.flakes.filter((o) => o !== f);
    if (Math.random() < 0.25) this.spawnHeart();
  }

  private updateFlakes(dt: number): void {
    const r = this.rect;
    if (this.feedQueue > 0) {
      this.feedT -= dt;
      if (this.feedT <= 0) {
        this.feedT = 0.12;
        this.feedQueue--;
        const x = r.x + r.w * (0.25 + Math.random() * 0.5);
        const colors = [0xe8a060, 0xc8783a, 0xf0d080];
        const obj = this.scene.add
          .rectangle(x, r.y + 1, 1, 1, colors[Math.floor(Math.random() * 3)])
          .setOrigin(0)
          .setDepth(this.depth + 4);
        this.flakes.push({ obj, x, y: r.y + 1, vy: 3 + Math.random() * 3, life: 16 });
      }
    }
    const floorY = r.y + r.h - this.sand - 1;
    for (const f of this.flakes) {
      f.life -= dt;
      if (f.y < floorY) {
        f.y = Math.min(floorY, f.y + f.vy * dt);
        f.x += Math.sin(f.life * 3 + f.vy) * dt * 2;
      }
      f.obj.setPosition(Math.round(f.x), Math.round(f.y)).setAlpha(Math.min(1, f.life));
    }
    for (const f of this.flakes.filter((o) => o.life <= 0)) this.eatFlake(f);
  }

  update(dt: number, visible = true): void {
    if (!visible) return;
    this.updateFlakes(dt);
    this.autoFeedT -= dt;
    if (this.autoFeedT <= 0) {
      this.autoFeedT = 70 + Math.random() * 80;
      if (this.floor.fish.length > 0) this.feed();
    }
    this.swayT += dt;
    if (this.swayT > 0.9) {
      this.swayT = 0;
      this.decor.forEach((d, i) => {
        if (d.texture.frameTotal > 2 && Math.random() < 0.7) d.setFrame(Number(d.frame.name) === 0 ? 1 : 0, false, false);
        void i;
      });
    }
    this.causticT += dt;
    if (this.causticT > 0.22) {
      this.causticT = 0;
      this.causticFrame = (this.causticFrame + 1) % this.causticKeys.length;
      this.caustics?.setTexture(this.causticKeys[this.causticFrame]);
    }
    const joy = happiness(this.floor);
    const speedFactor = 0.6 + 0.6 * joy;
    for (const sw of this.swimmers) sw.update(dt, speedFactor);

    this.bubbleT -= dt;
    if (this.bubbleT <= 0) {
      this.bubbleT = (this.detailed ? 0.5 : 1.2) + Math.random() * 1.5;
      const treasure = this.floor.slots.findIndex((id) => id === 'treasure');
      this.spawnBubble(treasure >= 0 && Math.random() < 0.5 ? this.slotX(treasure) : undefined);
    }
    this.heartT -= dt;
    if (this.heartT <= 0) {
      this.heartT = 3 + Math.random() * 5;
      if (joy >= 0.75) this.spawnHeart();
    }
    this.algaeTimer -= dt;
    if (this.algaeTimer <= 0) {
      this.algaeTimer = 1;
      this.drawAlgae();
    }
  }

  destroy(): void {
    this.bg.destroy();
    this.decor.forEach((d) => d.destroy());
    this.swimmers.forEach((s) => s.destroy());
    this.eggs.forEach((e) => e.destroy());
    this.scene.tweens.killTweensOf(this.fx);
    this.fx.forEach((o) => o.destroy());
    this.fx = [];
    this.algaeImg.destroy();
    this.caustics?.destroy();
    this.flakes.forEach((f) => f.obj.destroy());
    this.flakes = [];
    this.scene.textures.remove(this.algaeTex);
  }
}
