// La crique vue de dessus : on touche un endroit, le soigneur y marche ; en arrivant
// près d'un habitué ou de la mare, la caméra se rapproche (le « focus »).
import Phaser from 'phaser';
import type { GroundArt } from './ground';
import { AQUARIUM, HOUSE, MAP_ROWS, TILE, WORLD_H, WORLD_W, PIER } from './map';
import * as G from './garden';
import { dateText, DAY_LATE, DAY_MAX, DAY_START, hourOf, lighting, newClock, present, tick, timeText, type Clock } from './time';
import {
  aquariumHall, bench, boat, bush, butterfly, cottage, cropArt, fence, flowerPatch, itemIcon, koiTop, lantern, lilypad, mailbox, oak, pier, pine,
  kiosk, lighthouse, reeds, rock, seedIcon, seedStand, shippingBin, type KoiPattern,
} from './props';
import { defaultProfile, fill, playerLook, type Profile } from './profile';
import { openCreator, openSocial } from './panels';
import { textTexture } from '../sprites';
import type { Raster } from './raster';
import { buildWorld, type Prop, type World } from './world';
import { actorSheet, frameIndex, type Dir } from './actors';
import { LOOKS, SPOTS, type CastId } from './cast';
import { MOODS, portrait } from './portraits';
import { findPath, nearestWalkable, smoothPath, walkable, type Pt } from './pathfind';
import {
  CHARACTERS, choose, confess, CONFESS, finishSmallTalk, greet, hearts, newRelation, nextConversation, type Line, type Npc, type Relation,
} from './dialogue';
import { DialogueUI, type MenuOption } from './DialogueUI';
import * as MU from './museum';
import { CREATURES, SKELETON_PARTS, TREASURES } from './museum';
import { creatureArt, digSpotArt, ghostPart, netArt, octaveSprite, skeletonPart, treasureArt } from './museumArt';
import {
  DESK, ENTRY, EXIT, INFIRMARY, inMuseum, M_H, M_ROW0, M_W, M_Y, museumWalk, PEDESTALS, renderMuseum, TANKS, VITRINE,
} from './museumMap';
import { rescueOverlay } from './panels';
import type { AudioEngine } from '../audio/AudioEngine';

/** Enregistre une ou plusieurs images (côte à côte) comme texture Phaser à plusieurs frames. */
export function addRaster(scene: Phaser.Scene, key: string, frames: Raster | Raster[]): void {
  if (scene.textures.exists(key)) return;
  const list = Array.isArray(frames) ? frames : [frames];
  const w = list[0].w;
  const h = list[0].h;
  const canvas = document.createElement('canvas');
  canvas.width = w * list.length;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  list.forEach((r, i) => ctx.drawImage(r.toCanvas(), i * w, 0));
  const tex = scene.textures.addCanvas(key, canvas)!;
  list.forEach((_, i) => tex.add(i, 0, i * w, 0, w, h));
}

const SAVE_KEY = 'aquachill.cove';
const NPCS = Object.keys(CHARACTERS) as Npc[];

interface Walker {
  id: CastId;
  sprite: Phaser.GameObjects.Sprite;
  path: Pt[];
  dir: Dir;
  flip: boolean;
  speed: number;
  onArrive: (() => void) | null;
  home?: Pt;
  roam?: number;
  idleUntil?: number;
  busy?: boolean;
  emote?: Phaser.GameObjects.Image;
}

interface Koi {
  sprite: Phaser.GameObjects.Sprite;
  x: number;
  y: number;
  angle: number;
  speed: number;
  target: Pt;
  full: number;
}

interface Save {
  rel: Record<Npc, Relation>;
  x: number;
  y: number;
  clock: Clock;
  farm: G.Farm;
  profile?: Profile;
  museum: MU.Museum;
}

const iconCache = new Map<string, string>();
function iconUrl(key: string, make: () => Raster): string {
  let u = iconCache.get(key);
  if (!u) {
    u = make().toCanvas().toDataURL();
    iconCache.set(key, u);
  }
  return u;
}
const itemUrl = (c: G.Crop) => iconUrl(`item-${c}`, () => itemIcon(c));
const seedUrl = (c: G.Crop) => iconUrl(`seed-${c}`, () => seedIcon(c));

function loadSave(): Save {
  const fresh: Save = {
    rel: Object.fromEntries(NPCS.map((n) => [n, newRelation()])) as Record<Npc, Relation>,
    x: 9.5 * TILE, y: 12.5 * TILE, clock: newClock(), farm: G.newFarm(), museum: MU.newMuseum(),
  };
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return fresh;
    const data = JSON.parse(raw) as Partial<Save>;
    return { ...fresh, ...data, rel: { ...fresh.rel, ...data.rel }, farm: { ...fresh.farm, ...data.farm }, museum: { ...fresh.museum, ...data.museum } };
  } catch {
    return fresh;
  }
}

export class CoveScene extends Phaser.Scene {
  private art!: GroundArt;
  private world!: World;
  private waterImg!: Phaser.GameObjects.Image;
  private waterFrame = 0;
  private swaying: Phaser.GameObjects.Sprite[] = [];
  private player!: Walker;
  private npcs = new Map<Npc, Walker>();
  private koi: Koi[] = [];
  private food: { x: number; y: number; img: Phaser.GameObjects.Image }[] = [];
  private mode: 'walk' | 'talk' | 'pond' = 'walk';
  private save!: Save;
  private ui!: DialogueUI;
  private vignette!: HTMLElement;
  private hint!: HTMLElement;
  private rodLine!: Phaser.GameObjects.Graphics;
  private bobber!: Phaser.GameObjects.Arc;
  private down = { x: 0, y: 0, t: 0 };
  private lightRect!: Phaser.GameObjects.Rectangle;
  private glows: { img: Phaser.GameObjects.Image; base: number }[] = [];
  private fireflies: { img: Phaser.GameObjects.Image; x: number; y: number; t: number }[] = [];
  private plotObjs: Phaser.GameObjects.GameObject[] = [];
  private hud!: { root: HTMLElement; date: HTMLElement; time: HTMLElement; sun: HTMLElement; coins: HTMLElement };
  private veil!: HTMLElement;
  private sleeping = false;
  private hudT = 0;
  private uiRoot!: HTMLElement;
  private beam?: Phaser.GameObjects.Image;

  private get profile(): Profile {
    return this.save.profile ?? defaultProfile();
  }

  /** Création (ou retouche) du personnage. */
  private editProfile(first: boolean): void {
    this.mode = 'talk';
    this.updateHud(true);
    openCreator(this.uiRoot, this.profile, first, (p) => {
      this.save.profile = p;
      this.textures.remove('actor-player');
      addRaster(this, 'actor-player', actorSheet(playerLook(p)));
      this.player.sprite.setTexture('actor-player', frameIndex(this.player.dir, 0));
      this.mode = 'walk';
      this.persist();
      this.updateHud(true);
      if (first) this.showHint(`Bienvenue dans la crique, ${p.name} ! Touche un endroit pour t’y promener`, 4500);
    });
  }

  private openSocial(): void {
    if (this.mode !== 'walk' || this.ui.open) return;
    this.mode = 'talk';
    this.updateHud(true);
    openSocial(this.uiRoot, this.save.rel, this.profile, () => {
      this.mode = 'walk';
      this.updateHud(true);
    }, () => this.editProfile(false));
  }

  constructor(private audio?: AudioEngine, private groundArt?: GroundArt) {
    super('Cove');
  }

  create(): void {
    if (new URLSearchParams(location.search).has('sheet')) {
      this.showSheets();
      return;
    }
    this.save = loadSave();
    this.art = this.groundArt!;
    this.textures.addCanvas('cove-ground', this.art.base);
    this.art.water.forEach((c, i) => this.textures.addCanvas(`cove-water-${i}`, c));
    this.add.image(0, 0, 'cove-ground').setOrigin(0).setDepth(-10);
    this.waterImg = this.add.image(0, 0, 'cove-water-0').setOrigin(0).setDepth(-8);
    this.time.addEvent({
      delay: 420, loop: true, callback: () => {
        this.waterFrame = (this.waterFrame + 1) % this.art.water.length;
        this.waterImg.setTexture(`cove-water-${this.waterFrame}`);
      },
    });
    this.world = buildWorld();
    // l'intérieur du musée est posé sous la crique, dans la même grille
    while (this.world.walk.length < M_ROW0) this.world.walk.push(this.world.walk[0].map(() => false));
    this.world.walk.push(...museumWalk());
    this.textures.addCanvas('museum-bg', renderMuseum().toCanvas());
    this.add.image(0, M_Y, 'museum-bg').setOrigin(0).setDepth(-10);
    for (const p of this.world.props) this.placeProp(p);
    this.time.addEvent({
      delay: 700, loop: true, callback: () => {
        const t = this.time.now / 1000;
        for (const s of this.swaying) {
          const gust = Math.sin(t * 0.8 + s.x / 60) + Math.sin(t * 1.9 + s.y / 40) * 0.5;
          s.setFrame(gust > 0.7 ? 1 : 0);
        }
      },
    });

    this.makeEmotes();
    addRaster(this, 'actor-player', actorSheet(playerLook(this.profile)));
    for (const id of NPCS) addRaster(this, `actor-${id}`, actorSheet(LOOKS[id]));
    this.player = this.makeWalker('player', this.save.x, this.save.y, 'down');
    this.player.speed = 52;
    for (const id of NPCS) {
      const s = SPOTS[id];
      const w = this.makeWalker(id, s.x * TILE, s.y * TILE, s.dir === 'left' ? 'right' : s.dir);
      w.flip = s.dir === 'left';
      w.home = { x: Math.floor(s.x), y: Math.floor(s.y) };
      w.roam = s.roam;
      w.speed = 22;
      w.idleUntil = this.time.now + 2000 + Math.random() * 4000;
      this.npcs.set(id, w);
      if (!this.save.rel[id].seen.includes('intro')) this.emote(w, 'excl');
    }
    this.setupFishing();
    this.spawnKoi();
    this.spawnLife();
    this.setupLighting();
    this.drawPlots();

    // interface HTML (dialogues, vignette du focus)
    const root = document.getElementById('ui')!;
    root.className = 'cove';
    root.style.display = '';
    root.replaceChildren();
    this.vignette = document.createElement('div');
    this.vignette.className = 'focus-vignette';
    this.hint = document.createElement('div');
    this.hint.className = 'cove-hint';
    this.veil = document.createElement('div');
    this.veil.className = 'night-veil';
    root.append(this.vignette, this.hint, this.makeHud(), this.veil);
    this.ui = new DialogueUI(root, (t) => fill(t, this.profile));
    this.uiRoot = root;

    const cam = this.cameras.main;
    this.setArea(inMuseum(this.player.sprite.y) ? 'museum' : 'cove');
    this.drawMuseum();
    this.drawCoveExtras();
    cam.setRoundPixels(true);
    cam.startFollow(this.player.sprite, true, 0.12, 0.12, 0, 12);
    cam.centerOn(this.player.sprite.x, this.player.sprite.y);

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.audio?.unlock();
      this.down = { x: p.x, y: p.y, t: p.downTime };
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (Math.hypot(p.x - this.down.x, p.y - this.down.y) > 8) return;
      const w = cam.getWorldPoint(p.x, p.y);
      this.tap(w.x, w.y);
    });
    this.time.addEvent({ delay: 5000, loop: true, callback: () => this.persist() });
    window.addEventListener('pagehide', () => this.persist());
    if (!this.save.profile) {
      this.time.delayedCall(300, () => this.editProfile(true));
    } else {
      this.showHint('Touche un endroit pour t’y promener', 3500);
    }
  }

  // ------------------------------------------------------------ personnages

  private makeWalker(id: CastId, x: number, y: number, dir: Dir): Walker {
    const sprite = this.add.sprite(Math.round(x), Math.round(y), `actor-${id}`, frameIndex(dir, 0)).setOrigin(0.5, 1).setDepth(y);
    return { id, sprite, path: [], dir, flip: false, speed: 40, onArrive: null };
  }

  private tileOf(w: Walker): Pt {
    return { x: Math.floor(w.sprite.x / TILE), y: Math.floor((w.sprite.y - 2) / TILE) };
  }

  /** Marche jusqu'à la tuile `to` (ou la plus proche praticable), puis `then`. */
  private walkTo(w: Walker, to: Pt, then: (() => void) | null = null, exact?: { x: number; y: number }): boolean {
    const grid = this.world.walk;
    const from = nearestWalkable(grid, this.tileOf(w).x, this.tileOf(w).y, 3);
    const goal = nearestWalkable(grid, to.x, to.y, 6);
    if (!from || !goal) return false;
    const raw = findPath(grid, from, goal);
    if (!raw) return false;
    const pts = smoothPath(grid, raw).slice(1).map((p) => ({ x: p.x * TILE + 8, y: p.y * TILE + 12 }));
    if (exact && goal.x === to.x && goal.y === to.y) {
      if (pts.length) pts[pts.length - 1] = exact;
      else pts.push(exact);
    }
    w.path = pts;
    w.onArrive = then;
    if (!pts.length) {
      w.onArrive = null;
      then?.();
    }
    return true;
  }

  private stepWalker(w: Walker, dt: number, time: number): void {
    const target = w.path[0];
    const s = w.sprite;
    if (!target) {
      s.setFrame(frameIndex(w.dir, 0)).setFlipX(w.flip);
      return;
    }
    const dx = target.x - s.x;
    const dy = target.y - s.y;
    const dist = Math.hypot(dx, dy);
    const move = w.speed * dt;
    if (dist <= move) {
      s.setPosition(target.x, target.y);
      w.path.shift();
      if (!w.path.length) {
        s.setFrame(frameIndex(w.dir, 0));
        const cb = w.onArrive;
        w.onArrive = null;
        cb?.();
      }
    } else {
      s.x += (dx / dist) * move;
      s.y += (dy / dist) * move;
      if (Math.abs(dx) > Math.abs(dy) * 0.8) {
        w.dir = 'right';
        w.flip = dx < 0;
      } else w.dir = dy < 0 ? 'up' : 'down';
      s.setFrame(frameIndex(w.dir, Math.floor(time / (w.speed > 30 ? 130 : 180)) % 4)).setFlipX(w.flip);
    }
    s.setDepth(s.y);
    if (w.emote) w.emote.setPosition(Math.round(s.x), Math.round(s.y - 28));
  }

  private face(w: Walker, x: number, y: number): void {
    const dx = x - w.sprite.x;
    const dy = y - w.sprite.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      w.dir = 'right';
      w.flip = dx < 0;
    } else w.dir = dy < 0 ? 'up' : 'down';
    w.sprite.setFrame(frameIndex(w.dir, 0)).setFlipX(w.flip);
  }

  private makeEmotes(): void {
    for (const kind of ['excl', 'heart', 'cloud'] as const) {
      const g = this.make.graphics({}, false);
      g.fillStyle(0x2a1e2c).fillRoundedRect(0, 0, 11, 10, 3).fillTriangle(4, 9, 7, 9, 5, 12);
      g.fillStyle(0xffffff).fillRoundedRect(1, 1, 9, 8, 2);
      if (kind === 'excl') g.fillStyle(0xe8453c).fillRect(5, 2, 1, 4).fillRect(5, 7, 1, 1);
      if (kind === 'heart') g.fillStyle(0xff4a6a).fillRect(3, 3, 2, 2).fillRect(6, 3, 2, 2).fillRect(3, 4, 5, 2).fillRect(4, 6, 3, 1).fillRect(5, 7, 1, 1);
      if (kind === 'cloud') g.fillStyle(0x8a8aa0).fillRect(3, 4, 5, 2).fillRect(4, 3, 2, 1).fillRect(2, 5, 7, 1).fillStyle(0x5a5a70).fillRect(4, 7, 1, 1).fillRect(7, 7, 1, 1);
      g.generateTexture(`emote-${kind}`, 11, 13);
      g.destroy();
    }
  }

  /** Petite bulle au-dessus d'un personnage : ! (a quelque chose à dire), cœur, nuage. */
  private emote(w: Walker, kind: 'excl' | 'heart' | 'cloud' | null): void {
    w.emote?.destroy();
    w.emote = undefined;
    if (!kind) return;
    const key = `emote-${kind}`;
    const s = w.sprite;
    const img = this.add.image(Math.round(s.x), Math.round(s.y - 28), key).setDepth(9999).setScale(0);
    this.tweens.add({ targets: img, scale: 1, duration: 220, ease: 'Back.easeOut' });
    if (kind === 'excl') this.tweens.add({ targets: img, y: '-=2', yoyo: true, repeat: -1, duration: 500, delay: 220 });
    else this.time.delayedCall(1800, () => img.active && this.tweens.add({ targets: img, alpha: 0, duration: 300, onComplete: () => img.destroy() }));
    w.emote = img;
  }

  // ------------------------------------------------------------- toucher

  private tap(x: number, y: number): void {
    if (this.ui.open || this.rescuing) return;
    if (this.area === 'museum') {
      if (this.mode === 'walk') this.museumTap(x, y);
      return;
    }
    if (this.mode === 'pond') {
      if (this.art.ids[Math.floor(y) * WORLD_W + Math.floor(x)] === 5) this.dropFood(x, y);
      else this.unfocus();
      return;
    }
    if (this.mode !== 'walk') return;
    // une mission, un point à creuser, la barque (prioritaires quand on vise juste)
    if (this.tapExtras(x, y)) return;
    // un habitué ?
    for (const [id, w] of this.npcs) {
      const s = w.sprite;
      if (!s.visible) continue;
      if (Math.abs(x - s.x) < 10 && y < s.y + 3 && y > s.y - 26) {
        this.approach(id, w);
        return;
      }
    }
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(y / TILE);
    if (this.tapObject(x, y, tx, ty)) return;
    const id = this.art.ids[Math.floor(y) * WORLD_W + Math.floor(x)];
    if (id === 5) {
      // la mare : on s'approche du bord, puis on se penche sur l'eau
      this.walkTo(this.player, { x: tx, y: ty }, () => this.focusPond(x, y));
      return;
    }
    this.walkTo(this.player, { x: tx, y: ty }, null, walkable(this.world.walk, tx, ty) ? { x, y: Math.max(y, ty * TILE + 6) } : undefined);
    this.ripple(x, y);
  }

  private ripple(x: number, y: number): void {
    const c = this.add.circle(x, y, 3, 0xffffff, 0).setStrokeStyle(1, 0xffffff, 0.8).setDepth(-7);
    this.tweens.add({ targets: c, scale: 2.2, alpha: 0, duration: 450, onComplete: () => c.destroy() });
  }

  private approach(id: Npc, w: Walker): void {
    const t = this.tileOf(w);
    const p = this.tileOf(this.player);
    // la case voisine libre la plus proche du soigneur
    // de préférence à côté (pas au-dessus ni en dessous : les silhouettes se chevaucheraient)
    const cost = (q: Pt) => Math.hypot(q.x - p.x, q.y - p.y) + (q.y !== t.y ? 2.5 : 0);
    const options = [[-1, 0], [1, 0], [0, 1], [0, -1], [-1, 1], [1, 1]]
      .map(([dx, dy]) => ({ x: t.x + dx, y: t.y + dy }))
      .filter((q) => walkable(this.world.walk, q.x, q.y))
      .sort((a, b) => cost(a) - cost(b));
    const goal = options[0] ?? t;
    w.busy = true;
    w.path = [];
    this.walkTo(this.player, goal, () => this.talkTo(id, w));
  }

  // --------------------------------------------------------------- focus

  private focusOn(x: number, y: number, zoom: number, lift: number): void {
    const cam = this.cameras.main;
    cam.stopFollow();
    cam.pan(x, y + lift, 700, 'Sine.easeInOut');
    cam.zoomTo(zoom, 700, 'Sine.easeInOut');
    this.vignette.classList.add('on');
  }

  private unfocus(): void {
    const cam = this.cameras.main;
    this.mode = 'walk';
    this.vignette.classList.remove('on');
    this.hint.classList.remove('on');
    cam.zoomTo(1, 600, 'Sine.easeInOut');
    cam.pan(this.player.sprite.x, this.player.sprite.y - 12, 600, 'Sine.easeInOut', false, (_c, done) => {
      if (done === 1) cam.startFollow(this.player.sprite, true, 0.12, 0.12, 0, 12);
    });
    this.persist();
  }

  private showHint(text: string, ms = 0): void {
    this.hint.textContent = text;
    this.hint.classList.add('on');
    if (ms) this.time.delayedCall(ms, () => this.hint.classList.remove('on'));
  }

  private talkTo(id: Npc, w: Walker): void {
    this.mode = 'talk';
    this.face(this.player, w.sprite.x, w.sprite.y);
    this.face(w, this.player.sprite.x, this.player.sprite.y);
    this.emote(w, null);
    const midX = (w.sprite.x + this.player.sprite.x) / 2;
    const midY = (w.sprite.y + this.player.sprite.y) / 2 - 12;
    this.focusOn(midX, midY, 3, 40);
    const rel = this.save.rel[id];
    const today = new Date().toDateString();
    const gain = greet(rel, today);
    const anyoneDating = NPCS.some((n) => n !== id && this.save.rel[n].dating);
    const conv = nextConversation(id, rel, Date.now(), this.profile, anyoneDating);
    const script = conv.kind === 'topic' ? { lines: conv.topic.lines, topic: conv.topic } : { lines: conv.lines };
    this.time.delayedCall(450, () => {
      this.ui.show(id, rel, script, {
        onChoice: (choice) => {
          if (conv.kind !== 'topic') return;
          if (choice.flag === CONFESS) {
            const res = confess(id, rel, this.profile);
            rel.lastTopicAt = Date.now();
            this.emote(w, res.accepted ? 'heart' : null);
            this.audio?.play(res.accepted ? 'levelUp' : 'chime');
            this.persist();
            return res.lines;
          }
          if (conv.topic.id === 'romance') rel.asked = true;
          const before = hearts(rel);
          choose(rel, conv.topic, choice, Date.now());
          this.emote(w, choice.delta > 0 ? 'heart' : choice.delta < 0 ? 'cloud' : null);
          if (hearts(rel) > before) this.audio?.play('levelUp');
          else this.audio?.play(choice.delta > 0 ? 'chime' : 'click');
          this.persist();
        },
        gift: G.canGift(this.save.farm, id, this.save.clock.day) ? {
          items: G.CROP_LIST.filter((c) => (this.save.farm.bag[c] ?? 0) > 0)
            .map((c) => ({ key: c, label: `${G.CROPS[c].name} (×${this.save.farm.bag[c]})`, icon: itemUrl(c) })),
          give: (key) => {
            const res = G.giveGift(this.save.farm, rel, id, key as G.Crop, this.save.clock.day);
            if (!res) return null;
            this.emote(w, res.taste === 'neutral' ? null : 'heart');
            this.audio?.play(res.taste === 'love' ? 'levelUp' : 'chime');
            this.persist();
            this.updateHud(true);
            return { lines: res.reply, delta: G.GIFT_POINTS[res.taste] };
          },
        } : undefined,
        onClose: () => {
          if (conv.kind === 'small') finishSmallTalk(rel);
          w.busy = false;
          w.idleUntil = this.time.now + 3000;
          this.unfocus();
        },
      });
      if (gain) this.audio?.play('bubble');
    });
  }

  // ----------------------------------------------------------------- la mare

  private spawnKoi(): void {
    const patterns: KoiPattern[] = ['kohaku', 'showa', 'yamabuki', 'kohaku', 'shiro'];
    patterns.forEach((pat, i) => {
      const key = `koi-${pat}-${i}`;
      addRaster(this, key, koiTop(pat, i * 7 + 1));
      const start = this.randomPondPoint();
      const sprite = this.add.sprite(start.x, start.y, key, 0).setDepth(-9).setAlpha(0.92);
      this.koi.push({ sprite, x: start.x, y: start.y, angle: Math.random() * 6.28, speed: 8 + Math.random() * 5, target: this.randomPondPoint(), full: 0 });
    });
  }

  private randomPondPoint(): Pt {
    for (let k = 0; k < 400; k++) {
      const x = 20 * TILE + Math.random() * 13 * TILE;
      const y = 8 * TILE + Math.random() * 8 * TILE;
      const i = Math.floor(y) * WORLD_W + Math.floor(x);
      if (this.art.ids[i] === 5 && this.art.distLand[i] > 6) return { x, y };
    }
    return { x: 26 * TILE, y: 11 * TILE };
  }

  private updateKoi(dt: number, time: number): void {
    for (const k of this.koi) {
      // la nourriture la plus proche attire
      let target = k.target;
      let hungry = false;
      if (this.food.length && k.full <= 0) {
        const f = this.food.reduce((a, b) => (Math.hypot(a.x - k.x, a.y - k.y) < Math.hypot(b.x - k.x, b.y - k.y) ? a : b));
        target = f;
        hungry = true;
      }
      const want = Math.atan2(target.y - k.y, target.x - k.x);
      let diff = want - k.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      k.angle += Math.max(-2.2 * dt, Math.min(2.2 * dt, diff));
      const speed = hungry ? 22 : k.speed;
      const nx = k.x + Math.cos(k.angle) * speed * dt;
      const ny = k.y + Math.sin(k.angle) * speed * dt;
      const i = Math.floor(ny) * WORLD_W + Math.floor(nx);
      if (this.art.ids[i] === 5 && this.art.distLand[i] > 3) {
        k.x = nx;
        k.y = ny;
      } else {
        k.target = this.randomPondPoint();
        k.angle += Math.PI * 0.5;
      }
      if (!hungry && Math.hypot(k.target.x - k.x, k.target.y - k.y) < 6) k.target = this.randomPondPoint();
      if (hungry) {
        const f = this.food.find((q) => Math.hypot(q.x - k.x, q.y - k.y) < 4);
        if (f) {
          this.food = this.food.filter((q) => q !== f);
          f.img.destroy();
          k.full = 6;
          this.audio?.play('bubble');
          const heart = this.add.image(k.x, k.y - 4, 'emote-heart').setDepth(9999).setScale(0.6);
          this.tweens.add({ targets: heart, y: heart.y - 10, alpha: 0, duration: 900, onComplete: () => heart.destroy() });
          this.ripple(k.x, k.y);
        }
      }
      k.full -= dt;
      k.sprite.setPosition(Math.round(k.x), Math.round(k.y)).setRotation(k.angle).setFrame(Math.floor(time / (hungry ? 150 : 320) + k.speed) % 2);
    }
  }

  private focusPond(x: number, y: number): void {
    this.mode = 'pond';
    this.face(this.player, x, y);
    const px = (x + this.player.sprite.x) / 2;
    const py = (y + this.player.sprite.y) / 2;
    this.focusOn(px, py, 2.6, 0);
    this.showHint('Touche l’eau pour nourrir les koïs · la berge pour repartir');
  }

  private dropFood(x: number, y: number): void {
    this.audio?.play('click');
    for (let k = 0; k < 3; k++) {
      const fx = x + (Math.random() - 0.5) * 8;
      const fy = y + (Math.random() - 0.5) * 6;
      const img = this.add.image(fx, fy - 6, '__WHITE').setDisplaySize(1, 1).setTint(0xc8864a).setDepth(-7.5);
      this.tweens.add({ targets: img, y: fy, duration: 250 + k * 60, ease: 'Quad.easeIn' });
      this.food.push({ x: fx, y: fy, img });
    }
    this.ripple(x, y);
    this.hint.classList.remove('on');
  }

  // -------------------------------------------------------------- ambiance

  private setupFishing(): void {
    const m = this.npcs.get('marcel')!;
    this.rodLine = this.add.graphics().setDepth(m.sprite.y + 1);
    this.bobber = this.add.circle(m.sprite.x + 3, m.sprite.y + 34, 1.5, 0xe8453c).setDepth(-7).setStrokeStyle(1, 0xffffff);
    this.tweens.add({ targets: this.bobber, y: this.bobber.y + 1, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.easeInOut' });
    this.time.addEvent({ delay: 5200, loop: true, callback: () => this.bobber.active && this.ripple(this.bobber.x, this.bobber.y) });
  }

  private drawRod(): void {
    const m = this.npcs.get('marcel')!;
    const g = this.rodLine;
    g.clear();
    if (m.dir !== 'down' || m.path.length) {
      this.bobber.setVisible(false);
      return;
    }
    this.bobber.setVisible(true);
    const hx = m.sprite.x + 4;
    const hy = m.sprite.y - 8;
    const tipX = hx + 6;
    const tipY = hy + 14;
    g.lineStyle(1, 0x7a4a2a).lineBetween(hx, hy, tipX, tipY);
    g.lineStyle(1, 0xffffff, 0.6).lineBetween(tipX, tipY, this.bobber.x, this.bobber.y);
  }

  private spawnLife(): void {
    const colors = ['#ffd23a', '#ffffff', '#ff9ac8', '#8ab8ff'];
    colors.forEach((c, i) => addRaster(this, `butterfly-${i}`, butterfly(c)));
    for (let k = 0; k < 7; k++) {
      const b = this.add.sprite(0, 0, `butterfly-${k % colors.length}`, 0).setDepth(9000);
      const home = { x: (4 + Math.random() * 28) * TILE, y: (16 + Math.random() * 10) * TILE };
      let t = Math.random() * 100;
      this.time.addEvent({
        delay: 50, loop: true, callback: () => {
          t += 0.05;
          b.setPosition(Math.round(home.x + Math.sin(t * 0.7 + k) * 30 + Math.sin(t * 2.3) * 6), Math.round(home.y + Math.cos(t * 0.5 + k) * 18 + Math.sin(t * 3.1) * 4));
          b.setFrame(Math.floor(t * 8) % 2);
        },
      });
    }
    // ombres de nuages qui glissent sur la crique
    for (let k = 0; k < 3; k++) {
      const shadow = this.add.ellipse(Math.random() * WORLD_W, Math.random() * WORLD_H, 140, 70, 0x1a2a4a, 0.09).setDepth(9500);
      const speed = 6 + Math.random() * 4;
      this.time.addEvent({
        delay: 50, loop: true, callback: () => {
          shadow.x += speed * 0.05;
          shadow.y += speed * 0.02;
          if (shadow.x > WORLD_W + 80) {
            shadow.x = -80;
            shadow.y = Math.random() * WORLD_H;
          }
        },
      });
    }
    // Yanis joue : des notes s'envolent de sa guitare
    const g = this.make.graphics({}, false);
    g.fillStyle(0x2a1e2c).fillRect(3, 0, 1, 6).fillRect(3, 0, 3, 1).fillRect(5, 0, 1, 2).fillRect(1, 5, 3, 2);
    g.generateTexture('note', 7, 8);
    g.destroy();
    this.time.addEvent({
      delay: 1600, loop: true, callback: () => {
        const y = this.npcs.get('yanis');
        if (!y || !y.sprite.visible || y.busy || y.path.length) return;
        const n = this.add.image(y.sprite.x + 5, y.sprite.y - 14, 'note').setDepth(9990).setTint([0xffffff, 0xffe08a, 0xffb0d0][Math.floor(Math.random() * 3)]);
        this.tweens.add({ targets: n, x: n.x + 6 + Math.random() * 8, y: n.y - 18, alpha: 0, duration: 1800, ease: 'Sine.easeOut', onComplete: () => n.destroy() });
      },
    });
    // de temps en temps, le flash de Nina
    this.time.addEvent({
      delay: 7000, loop: true, callback: () => {
        const n = this.npcs.get('nina')!;
        if (n.busy || n.path.length) return;
        const f = this.add.circle(n.sprite.x + (n.flip ? -5 : 5), n.sprite.y - 12, 3, 0xffffff, 0.95).setDepth(9999);
        this.tweens.add({ targets: f, scale: 3, alpha: 0, duration: 250, onComplete: () => f.destroy() });
      },
    });
  }

  private roam(w: Walker, time: number): void {
    if (w.busy || w.path.length || !w.home || !w.roam || time < (w.idleUntil ?? 0)) return;
    w.idleUntil = time + 3500 + Math.random() * 5000;
    const r = w.roam;
    const to = { x: Math.round(w.home.x + (Math.random() * 2 - 1) * r), y: Math.round(w.home.y + (Math.random() * 2 - 1) * r * 0.6) };
    if (walkable(this.world.walk, to.x, to.y)) this.walkTo(w, to);
  }

  // ------------------------------------------------------------------ boucle

  update(time: number, delta: number): void {
    if (!this.player) return;
    const dt = Math.min(delta, 100) / 1000;
    const clock = this.save.clock;
    if (!this.ui.open && !this.sleeping) {
      const wasLate = clock.minute >= DAY_LATE;
      tick(clock, dt);
      if (!wasLate && clock.minute >= DAY_LATE) this.showHint('Minuit… Il serait temps de rentrer dormir.', 5000);
      if (clock.minute >= DAY_MAX) this.sleep(true);
    }
    this.updateLighting(time);
    this.updateSchedules();
    this.hudT -= dt;
    if (this.hudT <= 0) this.updateHud();
    this.stepWalker(this.player, dt, time);
    for (const [id, w] of this.npcs) {
      if (!w.busy) this.roam(w, time);
      this.stepWalker(w, dt, time);
      if (!w.busy && !w.path.length && id !== 'marcel' && id !== 'gobie' && time > (w.idleUntil ?? 0) - 2500) {
        const s = SPOTS[id];
        w.dir = s.dir === 'left' ? 'right' : s.dir;
      }
    }
    this.drawRod();
    this.updateKoi(dt, time);
    if (this.area === 'museum') this.updateTanks(dt, time);
  }

  private persist(): void {
    if (!this.player) return;
    this.save.x = this.player.sprite.x;
    this.save.y = this.player.sprite.y;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.save));
    } catch {
      /* rien */
    }
  }

  // ------------------------------------------------------------ le musée

  private area: 'cove' | 'museum' = 'cove';
  private rescuing = false;
  private questEl?: HTMLElement;
  private museumObjs: Phaser.GameObjects.GameObject[] = [];
  private swimmers: { s: Phaser.GameObjects.Sprite; x0: number; x1: number; y: number; vx: number; bottom: boolean; t: number }[] = [];
  private extras: Phaser.GameObjects.GameObject[] = [];
  private digCandidates: Pt[] = [];

  private setArea(a: 'cove' | 'museum'): void {
    this.area = a;
    const cam = this.cameras.main;
    if (a === 'museum') cam.setBounds(0, M_Y, M_W, M_H);
    else cam.setBounds(0, 0, WORLD_W, WORLD_H);
    cam.startFollow(this.player.sprite, true, 0.12, 0.12, 0, 12);
    cam.centerOn(this.player.sprite.x, this.player.sprite.y);
  }

  private fadeTo(then: () => void): void {
    const cam = this.cameras.main;
    this.mode = 'talk';
    cam.fadeOut(350, 20, 12, 30);
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      then();
      cam.fadeIn(400, 20, 12, 30);
      this.mode = 'walk';
      this.updateHud(true);
    });
  }

  private enterMuseum(): void {
    this.audio?.play('bubble');
    this.fadeTo(() => {
      this.player.path = [];
      this.player.sprite.setPosition(ENTRY.col * TILE + 8, M_Y + ENTRY.row * TILE + 12);
      this.face(this.player, this.player.sprite.x, this.player.sprite.y - 20);
      this.setArea('museum');
      this.drawMuseum();
      this.persist();
      if (!this.save.museum.metOctave) this.showHint('Octave, le conservateur, t’attend à son bureau', 3500);
    });
  }

  private exitMuseum(): void {
    this.fadeTo(() => {
      this.player.path = [];
      this.player.sprite.setPosition(AQUARIUM.doorX * TILE, (AQUARIUM.doorY + 0.6) * TILE);
      this.face(this.player, this.player.sprite.x, this.player.sprite.y + 20);
      this.setArea('cove');
      this.persist();
    });
  }

  /** Squelettes, trésors, créatures dans les bassins, Octave et le patient de l'infirmerie. */
  private drawMuseum(): void {
    this.museumObjs.forEach((o) => o.destroy());
    this.museumObjs = [];
    this.swimmers = [];
    const m = this.save.museum;
    const add = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      this.museumObjs.push(o);
      return o;
    };
    // squelettes : pièces données en os, pièces manquantes en pointillés
    for (const sk of ['trex', 'plesio'] as const) {
      const ped = PEDESTALS[sk];
      const ox = sk === 'trex' ? ped.x - 12 : ped.x - 16;
      const oy = M_Y + ped.y - (sk === 'trex' ? 70 : 58);
      for (const part of SKELETON_PARTS) {
        const have = m.finds.includes(`${sk}:${part}`);
        const key = `sk-${sk}-${part}-${have ? 1 : 0}`;
        addRaster(this, key, have ? skeletonPart(sk, part) : ghostPart(sk, part));
        add(this.add.image(ox, oy, key).setOrigin(0).setDepth(M_Y + ped.y + 30));
      }
      const n = MU.skeletonProgress(m, sk);
      add(this.add.image(ped.x + 48, M_Y + ped.y + 38, textTexture(this.textures, `${n}/8`, '#3a2a1a', null, 'small')).setDepth(M_Y + ped.y + 31));
    }
    // trésors dans la vitrine
    TREASURES.forEach((t, i) => {
      if (!m.finds.includes(`tresor:${t.id}`)) return;
      addRaster(this, `tr-${t.id}`, treasureArt(t.id));
      add(this.add.image(M_Y ? VITRINE.x + 18 + i * 30 : 0, M_Y + VITRINE.y + 14, `tr-${t.id}`).setDepth(M_Y + 60));
    });
    // créatures dans leurs bassins
    for (const tank of TANKS) {
      const list = CREATURES.filter((c) => c.habitat === tank.habitat && m.donated.includes(c.id));
      list.forEach((c, k) => {
        addRaster(this, `cr-${c.id}`, creatureArt(c.id));
        const bottom = ['crabe', 'etoile', 'bernard', 'ecrevisse', 'triton', 'crevette'].includes(c.id);
        const sprite = add(this.add.sprite(0, 0, `cr-${c.id}`, 0).setDepth(M_Y + 300));
        const hw = sprite.width / 2;
        const swimmersList = list.filter((x) => !['crabe', 'etoile', 'bernard', 'ecrevisse', 'triton', 'crevette'].includes(x.id));
        const lane = swimmersList.indexOf(c);
        const span = tank.h - 14 - sprite.height;
        const y = bottom
          ? M_Y + tank.y + tank.h - 4 - sprite.height / 2
          : M_Y + tank.y + 4 + sprite.height / 2 + (swimmersList.length > 1 ? (lane / (swimmersList.length - 1)) * Math.max(0, span) : span / 2);
        this.swimmers.push({ s: sprite, x0: tank.x + hw + 1, x1: tank.x + tank.w - hw - 1, y, vx: (bottom ? 3 : 8 + (k % 3) * 3) * (k % 2 ? -1 : 1), bottom, t: k * 1.7 });
        sprite.setPosition(tank.x + tank.w * ((k + 1) / (list.length + 1)), y);
      });
      const label = textTexture(this.textures, MU.HABITAT_NAMES[tank.habitat].toUpperCase(), '#3a2a1a', null, 'small');
      add(this.add.image(tank.x + tank.w / 2, M_Y + tank.y + tank.h + 6, label).setDepth(M_Y + 301));
    }
    // Octave derrière son bureau
    addRaster(this, 'octave', octaveSprite());
    const oct = add(this.add.sprite(DESK.x + 24, M_Y + DESK.y + 6, 'octave', 0).setOrigin(0.5, 1).setDepth(M_Y + DESK.y + 6));
    this.time.addEvent({ delay: 600, loop: true, callback: () => oct.active && oct.setFrame((oct.frame.name as unknown as number) === 1 ? 0 : 1) });
    if (!m.metOctave || (!m.mission && MU.nextMissionCreature(m)) || m.mission?.stage === 'carry' || m.bag.length) {
      const e = add(this.add.image(oct.x, oct.y - 28, 'emote-excl').setDepth(9999));
      this.tweens.add({ targets: e, y: e.y - 2, yoyo: true, repeat: -1, duration: 500 });
    }
    // le patient de l'infirmerie
    if (m.mission?.stage === 'care') {
      const c = MU.CREATURE_BY_ID[m.mission.creature];
      addRaster(this, `cr-${c.id}`, creatureArt(c.id));
      const p = add(this.add.sprite(INFIRMARY.x, M_Y + INFIRMARY.y, `cr-${c.id}`, 0).setDepth(M_Y + INFIRMARY.y + 20));
      this.tweens.add({ targets: p, y: p.y - 1.5, yoyo: true, repeat: -1, duration: 1200, ease: 'Sine.easeInOut' });
      if (m.mission.lastCare !== this.save.clock.day) {
        const e = add(this.add.image(INFIRMARY.x, M_Y + INFIRMARY.y - 20, 'emote-excl').setDepth(9999));
        this.tweens.add({ targets: e, y: e.y - 2, yoyo: true, repeat: -1, duration: 500 });
      }
    }
  }

  /** Petit geste de travail : on se penche, on se relève. */
  private workAnim(): void {
    const s = this.player.sprite;
    this.tweens.add({ targets: s, y: s.y + 2, yoyo: true, repeat: 1, duration: 120 });
  }

  private updateTanks(dt: number, time: number): void {
    for (const f of this.swimmers) {
      f.s.x += f.vx * dt;
      if (f.s.x < f.x0 || f.s.x > f.x1) {
        f.vx = -f.vx;
        f.s.x = Phaser.Math.Clamp(f.s.x, f.x0, f.x1);
      }
      f.s.setFlipX(f.vx < 0);
      f.s.y = f.y + (f.bottom ? 0 : Math.sin(time / 900 + f.t) * 3);
      f.s.setFrame(Math.floor(time / (f.bottom ? 500 : 260) + f.t) % 2);
    }
  }

  private museumTap(x: number, y: number): void {
    const ly = y - M_Y;
    const go = (c: number, r: number, then: () => void) => this.walkTo(this.player, { x: c, y: M_ROW0 + r }, then);
    if (Math.abs(x - (DESK.x + 24)) < 28 && ly > DESK.y - 24 && ly < DESK.y + 34) {
      go(3, 33, () => {
        this.face(this.player, DESK.x + 24, M_Y + DESK.y);
        this.talkOctave();
      });
      return;
    }
    if (Math.abs(x - INFIRMARY.x) < 26 && ly > INFIRMARY.y - 28 && ly < INFIRMARY.y + 14) {
      go(11, 33, () => {
        this.face(this.player, INFIRMARY.x, M_Y + INFIRMARY.y);
        this.infirmary();
      });
      return;
    }
    for (const t of TANKS) {
      if (x >= t.x - 3 && x < t.x + t.w + 3 && ly >= t.y - 10 && ly < t.y + t.h + 14) {
        go(Math.floor((t.x + t.w / 2) / TILE), 18, () => {
          this.face(this.player, x, y - 30);
          this.tankInfo(t.habitat);
        });
        return;
      }
    }
    for (const sk of ['trex', 'plesio'] as const) {
      const p = PEDESTALS[sk];
      if (x >= p.x && x < p.x + 96 && ly >= p.y - 80 && ly < p.y + 48) {
        go(Math.floor((p.x + 48) / TILE), 11, () => {
          this.face(this.player, p.x + 48, M_Y + p.y);
          this.skeletonInfo(sk);
        });
        return;
      }
    }
    if (ly < VITRINE.y + VITRINE.h + 10) {
      go(7, 3, () => {
        this.face(this.player, x, M_Y);
        this.vitrineInfo();
      });
      return;
    }
    if (ly >= EXIT.row * TILE - 10 && x >= 6 * TILE && x < 9 * TILE) {
      go(EXIT.col, EXIT.row, () => this.exitMuseum());
      return;
    }
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(y / TILE);
    this.walkTo(this.player, { x: tx, y: ty });
    this.ripple(x, y);
  }

  /** Octave parle (portrait de poulpe), puis `then`. */
  private octaveSay(lines: Line[], then: () => void = () => this.unfocusIfTalking()): void {
    this.mode = 'talk';
    this.ui.show('octave', newRelation(), { lines }, { onChoice: () => undefined, onClose: then }, { name: 'Octave', role: 'Conservateur du musée' });
  }

  private unfocusIfTalking(): void {
    if (this.mode === 'talk') this.unfocus();
  }

  private talkOctave(): void {
    const m = this.save.museum;
    this.focusOn(DESK.x + 24, M_Y + DESK.y, 2.6, 40);
    if (!m.metOctave) {
      m.metOctave = true;
      this.persist();
      this.octaveSay([
        { text: 'Ah ! Un visiteur ! Bienvenue au musée de la crique !', mood: 'surprised' },
        { text: 'Je suis Octave, conservateur. Huit bras : c’est très pratique pour épousseter les vitrines.', mood: 'happy' },
        { text: 'Ici, nous soignons les créatures de la crique avant de les accueillir dans nos bassins.' },
        { text: 'Et là-haut, la salle des fossiles ! Pour l’instant… surtout des socles vides. Si vous creusez la plage, apportez-moi vos trouvailles !', mood: 'blush' },
      ], () => this.octaveMenu());
      return;
    }
    this.octaveMenu();
  }

  private octaveMenu(): void {
    const m = this.save.museum;
    const opts: MenuOption[] = [];
    if (m.bag.length) opts.push({ label: `Donner mes trouvailles (${m.bag.length})`, sub: 'Fossiles et trésors de la plage', pick: () => this.donateFinds() });
    if (m.mission?.stage === 'carry') {
      const c = MU.CREATURE_BY_ID[m.mission.creature];
      opts.push({ label: `Confier : ${c.name}`, sub: 'À l’infirmerie, pour quelques jours de soins', pick: () => {
        MU.admit(m);
        this.persist();
        this.drawMuseum();
        this.audio?.play('chime');
        this.octaveSay([
          { text: `Oh, pauvre petite chose. Posons-la dans le bassin de soins.`, mood: 'sad' },
          { text: `Passez la soigner une fois par jour. Dans ${c.careDays} jours, elle sera prête pour son bassin !`, mood: 'happy' },
        ]);
      } });
    }
    if (!m.mission && MU.nextMissionCreature(m)) {
      opts.push({ label: 'Une mission ?', sub: 'Une créature de la crique a besoin d’aide', pick: () => {
        const id = MU.assignMission(m)!;
        const c = MU.CREATURE_BY_ID[id];
        this.persist();
        this.drawMuseum();
        this.drawCoveExtras();
        this.updateHud(true);
        this.octaveSay([{ text: c.rescue.story, mood: 'sad' }, { text: 'Allez-y vite ! Je l’ai noté sous votre horloge, pour ne pas l’oublier.', mood: 'happy' }]);
      } });
    }
    if (m.mission?.stage === 'find') {
      const c = MU.CREATURE_BY_ID[m.mission.creature];
      opts.push({ label: 'Rappelle-moi la mission', pick: () => this.octaveSay([{ text: c.rescue.story }]) });
    }
    if (!m.mission && !MU.nextMissionCreature(m) && MU.canSail(m, this.save.clock.day)) {
      opts.push({ label: 'Et maintenant ?', pick: () => this.octaveSay([{ text: 'Toutes les créatures de la crique sont sauvées ! Il reste le grand large… Maëlle vous y emmènera, au ponton.', mood: 'happy' }]) });
    }
    const total = CREATURES.length;
    this.mode = 'talk';
    this.ui.menu({
      title: 'Octave, conservateur',
      text: `Aquarium : ${m.donated.length}/${total} · Fossiles : ${m.finds.length}/${MU.ALL_FINDS.length}${MU.seaUnlocked(m) ? ' · La mer est ouverte !' : ''}`,
      options: opts,
      cancel: 'Au revoir, Octave',
      onClose: () => this.unfocus(),
    });
  }

  private donateFinds(): void {
    const m = this.save.museum;
    const given = MU.donateFinds(m);
    this.persist();
    this.drawMuseum();
    this.audio?.play('levelUp');
    const lines: Line[] = [];
    for (const f of given) {
      const [kind, key] = f.split(':');
      if (kind === 'tresor') {
        const t = TREASURES.find((x) => x.id === key)!;
        lines.push({ text: `${t.name} ! Magnifique.`, mood: 'surprised' }, { text: t.fact, mood: 'happy' });
      } else {
        const sk = kind as MU.Skeleton;
        lines.push({ text: `${MU.findName(f)} ! Je l’installe tout de suite sur le squelette.`, mood: 'happy' });
        if (MU.skeletonProgress(m, sk) === 8) lines.push({ text: `Le ${MU.SKELETONS[sk].name.toLowerCase()} est complet ! Regardez-le !`, mood: 'surprised' }, { text: MU.SKELETONS[sk].fact, mood: 'happy' });
      }
    }
    if (!lines.length) lines.push({ text: 'Hmm, tout cela est déjà exposé ! Mais merci.', mood: 'neutral' });
    this.octaveSay(lines);
  }

  private infirmary(): void {
    const m = this.save.museum;
    if (m.mission?.stage !== 'care') {
      this.showHint('Le bassin de soins est vide. Octave a peut-être une mission pour toi.', 2600);
      return;
    }
    const c = MU.CREATURE_BY_ID[m.mission.creature];
    const res = MU.care(m, this.save.clock.day);
    this.persist();
    if (res === 'done-today') {
      this.showHint(`${c.name} se repose. Reviens demain pour le prochain soin.`, 2600);
      return;
    }
    this.workAnim();
    this.audio?.play('bubble');
    for (let k = 0; k < 6; k++) {
      const b = this.add.image(INFIRMARY.x - 8 + k * 3, M_Y + INFIRMARY.y - 4, 'emote-heart').setScale(0.4).setDepth(9999);
      this.tweens.add({ targets: b, y: b.y - 16 - k * 2, alpha: 0, delay: k * 80, duration: 800, onComplete: () => b.destroy() });
    }
    const soin = ['Tu lui donnes à manger, tout doucement.', 'Tu changes l’eau du bassin de soins.', 'Tu nettoies délicatement sa blessure.'][(m.mission.cared - 1) % 3];
    if (res === 'better') {
      this.drawMuseum();
      this.showHint(`${soin} ${c.name} va mieux (${m.mission.cared}/${c.careDays}).`, 3200);
      return;
    }
    this.mode = 'talk';
    this.ui.menu({
      title: `${c.name} est guéri·e !`,
      text: `${soin} Il est temps de rejoindre le bassin « ${MU.HABITAT_NAMES[c.habitat]} ».`,
      options: [{ label: 'Le relâcher dans son bassin', pick: () => {
        MU.release(m);
        this.persist();
        this.drawMuseum();
        this.updateHud(true);
        this.audio?.play('levelUp');
        const lines: Line[] = [{ text: `Regardez-le nager ! ${c.name}, bienvenue chez vous.`, mood: 'happy' }, { text: c.fact, mood: 'neutral' }];
        if (m.donated.length === MU.SEA_UNLOCK) lines.push({ text: 'Au fait… Maëlle dit que vous avez le pied marin. Allez la voir au ponton : elle vous emmènera sauver des créatures au large !', mood: 'surprised' });
        this.focusOn(DESK.x + 24, M_Y + DESK.y, 2.6, 40);
        this.octaveSay(lines);
      } }],
      onClose: () => { this.mode = 'walk'; },
    });
  }

  private tankInfo(h: MU.Habitat): void {
    const m = this.save.museum;
    const list = CREATURES.filter((c) => c.habitat === h);
    this.mode = 'talk';
    this.ui.menu({
      title: `${MU.HABITAT_NAMES[h]} · ${list.filter((c) => m.donated.includes(c.id)).length}/${list.length}`,
      text: h === 'large' ? 'Les créatures du large se sauvent en mer, avec Maëlle.' : 'Les créatures sauvées dans la crique, soignées par tes soins.',
      options: list.map((c) => m.donated.includes(c.id)
        ? { label: c.name, sub: c.fact, icon: iconUrl(`cri-${c.id}`, () => creatureArt(c.id)[0]), disabled: true }
        : { label: '???', sub: 'Pas encore sauvé·e', disabled: true }),
      cancel: 'Continuer la visite',
      onClose: () => { this.mode = 'walk'; },
    });
  }

  private skeletonInfo(sk: MU.Skeleton): void {
    const m = this.save.museum;
    const S = MU.SKELETONS[sk];
    const n = MU.skeletonProgress(m, sk);
    this.mode = 'talk';
    this.ui.menu({
      title: `${S.name} · ${n}/8`,
      text: n === 8 ? S.fact : 'Les pièces manquantes sont dessinées en pointillés. Creuse la plage pour les trouver !',
      options: SKELETON_PARTS.map((p) => ({ label: m.finds.includes(`${sk}:${p}`) ? S.parts[p] : '???', disabled: true })),
      cancel: 'Continuer la visite',
      onClose: () => { this.mode = 'walk'; },
    });
  }

  private vitrineInfo(): void {
    const m = this.save.museum;
    this.mode = 'talk';
    this.ui.menu({
      title: `Trésors du rivage · ${TREASURES.filter((t) => m.finds.includes(`tresor:${t.id}`)).length}/${TREASURES.length}`,
      options: TREASURES.map((t) => m.finds.includes(`tresor:${t.id}`)
        ? { label: t.name, sub: t.fact, icon: iconUrl(`tri-${t.id}`, () => treasureArt(t.id)), disabled: true }
        : { label: '???', disabled: true }),
      cancel: 'Continuer la visite',
      onClose: () => { this.mode = 'walk'; },
    });
  }

  // --------------------------------------------- missions et fouilles dans la crique

  private questText(): string {
    const m = this.save.museum;
    const ms = m.mission;
    if (ms) {
      const c = MU.CREATURE_BY_ID[ms.creature];
      if (ms.stage === 'find') return `À sauver : ${c.name}`;
      if (ms.stage === 'carry') return `Ramène ${c.name} à Octave`;
      return `Soins : ${c.name} (${ms.cared}/${c.careDays})`;
    }
    if (!m.metOctave) return 'Va voir le musée, près de la plage';
    if (MU.nextMissionCreature(m)) return 'Octave a une mission pour toi';
    if (MU.canSail(m, this.save.clock.day)) return 'Maëlle t’attend au ponton';
    return '';
  }

  /** Marqueur de mission, points à creuser, barque de Maëlle. */
  private drawCoveExtras(): void {
    this.extras.forEach((o) => o.destroy());
    this.extras = [];
    const m = this.save.museum;
    const day = this.save.clock.day;
    if (!this.digCandidates.length) {
      for (let ty = 0; ty < 44; ty++) for (let tx = 0; tx < 36; tx++) {
        const ch = MAP_ROWS[ty]?.[tx];
        if ((ch === 's' || ch === ',') && this.world.walk[ty][tx] && G.plotIndex(tx, ty) === null) this.digCandidates.push({ x: tx, y: ty });
      }
    }
    if (m.dugToday.day !== day) m.dugToday = { day, spots: [] };
    addRaster(this, 'digspot', digSpotArt());
    for (const i of MU.digSpots(day, this.digCandidates.length)) {
      if (m.dugToday.spots.includes(i)) continue;
      const p = this.digCandidates[i];
      const s = this.add.sprite(p.x * TILE + 8, p.y * TILE + 10, 'digspot', 0).setDepth(-6);
      this.time.addEvent({ delay: 400, loop: true, callback: () => s.active && s.setFrame((s.frame.name as unknown as number) === 1 ? 0 : 1) });
      s.setData('dig', i);
      this.extras.push(s);
    }
    const ms = m.mission;
    if (ms?.stage === 'find') {
      const c = MU.CREATURE_BY_ID[ms.creature];
      if (c.spot) {
        addRaster(this, `cr-${c.id}`, creatureArt(c.id));
        addRaster(this, 'net', netArt());
        const x = c.spot[0] * TILE + 8;
        const y = c.spot[1] * TILE + 10;
        const cr = this.add.sprite(x, y, `cr-${c.id}`, 0).setDepth(y).setScale(0.8);
        const net = this.add.image(x, y, 'net').setDepth(y + 0.1).setScale(0.9);
        const e = this.add.image(x, y - 16, 'emote-excl').setDepth(9999);
        this.tweens.add({ targets: e, y: e.y - 2, yoyo: true, repeat: -1, duration: 500 });
        this.tweens.add({ targets: cr, x: x + 1, yoyo: true, repeat: -1, duration: 180 });
        cr.setData('mission', true);
        this.extras.push(cr, net, e);
      }
    }
  }

  private tapExtras(x: number, y: number): boolean {
    const m = this.save.museum;
    for (const o of this.extras) {
      const s = o as Phaser.GameObjects.Sprite;
      if (!s.getData) continue;
      if (Math.abs(s.x - x) > 10 || Math.abs(s.y - y) > 10) continue;
      if (s.getData('mission')) {
        const c = MU.CREATURE_BY_ID[m.mission!.creature];
        const [sx, sy] = c.spot!;
        this.walkTo(this.player, { x: sx, y: sy }, () => {
          this.face(this.player, s.x, s.y);
          this.focusOn(s.x, s.y, 3, 0);
          this.startRescue(c.id, 'cove');
        });
        return true;
      }
      const i = s.getData('dig') as number | undefined;
      if (i !== undefined) {
        const p = this.digCandidates[i];
        this.walkTo(this.player, { x: p.x, y: p.y }, () => this.digAt(i, s));
        return true;
      }
    }
    // la barque de Maëlle, au bout du ponton
    const bx = (PIER.x + PIER.w) * TILE + 20;
    const by = (PIER.y + 4) * TILE;
    if (Math.abs(x - bx) < 20 && Math.abs(y - by) < 14) {
      this.walkTo(this.player, { x: PIER.x + 1, y: PIER.y + 4 }, () => this.openBoat());
      return true;
    }
    return false;
  }

  private digAt(i: number, s: Phaser.GameObjects.Sprite): void {
    const m = this.save.museum;
    const res = MU.dig(m, this.save.clock.day, i, Math.random);
    if (!res) return;
    this.workAnim();
    this.audio?.play('scrub');
    s.destroy();
    this.extras = this.extras.filter((o) => o !== s);
    const [kind, key] = res.find.split(':');
    const icon = kind === 'tresor' ? iconUrl(`tri-${key}`, () => treasureArt(key)) : iconUrl('bone', () => skeletonPart('trex', 'cou'));
    if (res.duplicate) this.save.farm.coins += 30;
    this.persist();
    this.updateHud(true);
    this.mode = 'talk';
    this.ui.menu({
      title: res.duplicate ? 'Encore un !' : 'Une trouvaille !',
      text: res.duplicate
        ? `${MU.findName(res.find)}… Le musée en a déjà un. Octave te le rachète pour sa réserve : +30 pièces.`
        : `${MU.findName(res.find)} ! Apporte-le à Octave, au musée.`,
      options: [{ label: MU.findName(res.find), icon, disabled: true }],
      cancel: 'Super !',
      onClose: () => { this.mode = 'walk'; },
    });
  }

  private openBoat(): void {
    const m = this.save.museum;
    const day = this.save.clock.day;
    const maelle = this.npcs.get('maelle')!;
    const here = maelle.sprite.visible;
    let text: string;
    const options: MenuOption[] = [];
    if (!MU.seaUnlocked(m)) text = `« La Mouette », le bateau de Maëlle. Elle t’emmènera en mer quand l’aquarium aura ${MU.SEA_UNLOCK} pensionnaires (${m.donated.length}/${MU.SEA_UNLOCK}).`;
    else if (m.mission) text = 'Maëlle : « Finis d’abord la mission en cours. Un sauvetage à la fois. »';
    else if (m.lastSeaDay === day) text = 'Maëlle : « Une sortie par jour. La mer a besoin de repos, et moi aussi. »';
    else if (!here) text = 'Maëlle n’est pas là. Elle sort en mer le matin et en journée.';
    else if (!MU.canSail(m, day)) text = 'Toutes les créatures du large ont été sauvées. Bravo !';
    else {
      text = 'Maëlle : « Prête… ou prêt ? Le large nous attend. On ne sait jamais qui on va croiser. »';
      options.push({ label: 'Partir en mer avec Maëlle', pick: () => this.sailAway() });
    }
    this.mode = 'talk';
    this.ui.menu({ title: 'La Mouette', text, options, cancel: 'Plus tard', onClose: () => { this.mode = 'walk'; } });
  }

  private sailAway(): void {
    const id = MU.sail(this.save.museum, this.save.clock.day, Math.random);
    if (!id) return;
    this.persist();
    this.veil.textContent = 'Au large, avec Maëlle…';
    this.veil.classList.add('on');
    this.audio?.play('chime');
    this.time.delayedCall(1200, () => this.startRescue(id, 'sea'));
  }

  private startRescue(id: string, where: 'cove' | 'sea'): void {
    const c = MU.CREATURE_BY_ID[id];
    this.rescuing = true;
    this.mode = 'talk';
    this.updateHud(true);
    const story = where === 'sea'
      ? `Un ${c.name.toLowerCase()} est pris au piège ! Maëlle approche le bateau tout doucement.`
      : c.rescue.story;
    rescueOverlay(this.uiRoot, {
      art: creatureArt(id)[0].toCanvas().toDataURL(),
      net: netArt().toCanvas().toDataURL(),
      scene: where === 'sea' ? 'sea' : c.habitat === 'mare' ? 'pond' : 'beach',
      title: c.name, story, verb: c.rescue.verb, taps: c.rescue.taps,
      done: where === 'sea' ? `Libre ! Maëlle le hisse délicatement à bord, dans un bac d’eau de mer. « On le ramène à Octave. »` : c.rescue.done,
      onTap: () => this.audio?.play('scrub'),
    }, () => {
      MU.rescued(this.save.museum);
      this.rescuing = false;
      this.audio?.play('levelUp');
      this.persist();
      this.drawCoveExtras();
      this.drawMuseum();
      if (where === 'sea') {
        this.veil.classList.remove('on');
        this.mode = 'walk';
      } else this.unfocus();
      this.updateHud(true);
      this.showHint(`Ramène ${c.name} à Octave, au musée`, 3500);
    });
  }

  // ------------------------------------------------------------ la journée

  private setupLighting(): void {
    if (!this.textures.exists('glow-warm')) {
      const c = this.textures.createCanvas('glow-warm', 64, 64)!;
      const ctx = c.getContext();
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(255,220,140,0.9)');
      g.addColorStop(0.35, 'rgba(255,180,90,0.35)');
      g.addColorStop(1, 'rgba(255,160,80,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
      c.refresh();
      const d = this.textures.createCanvas('firefly', 8, 8)!;
      const dc = d.getContext();
      const fg = dc.createRadialGradient(4, 4, 0, 4, 4, 4);
      fg.addColorStop(0, 'rgba(240,255,160,1)');
      fg.addColorStop(0.4, 'rgba(200,255,120,0.6)');
      fg.addColorStop(1, 'rgba(200,255,120,0)');
      dc.fillStyle = fg;
      dc.fillRect(0, 0, 8, 8);
      d.refresh();
    }
    this.lightRect = this.add.rectangle(0, 0, WORLD_W, WORLD_H, 0xffffff).setOrigin(0).setDepth(9700).setBlendMode(Phaser.BlendModes.MULTIPLY);
    const glow = (x: number, y: number, scale: number, base = 1) => {
      const img = this.add.image(x, y, 'glow-warm').setDepth(9800).setBlendMode(Phaser.BlendModes.ADD).setScale(scale).setAlpha(0);
      this.glows.push({ img, base });
    };
    for (const p of this.world.props) {
      if (p.kind === 'lighthouse') {
        glow(p.x, p.y - 64, 1.3);
        const bt = this.textures.createCanvas('beam', 160, 40)!;
        const bc = bt.getContext();
        const bg = bc.createLinearGradient(0, 0, 160, 0);
        bg.addColorStop(0, 'rgba(255,240,180,0.7)');
        bg.addColorStop(1, 'rgba(255,240,180,0)');
        bc.fillStyle = bg;
        bc.beginPath();
        bc.moveTo(0, 18);
        bc.lineTo(160, 0);
        bc.lineTo(160, 40);
        bc.lineTo(0, 22);
        bc.fill();
        bt.refresh();
        this.beam = this.add.image(p.x, p.y - 64, 'beam').setOrigin(0, 0.5).setDepth(9810).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
      }
      if (p.kind === 'lantern') {
        glow(p.x, p.y - 20, 0.9);
        glow(p.x, p.y - 2, 1.4, 0.35);
      }
    }
    // fenêtres de la maison et de l'aquarium
    const hx = (HOUSE.x + HOUSE.w / 2) * TILE - 56;
    const hy = (HOUSE.y + HOUSE.h) * TILE + 6 - 96;
    for (const [wx, wy] of [[27, 67], [85, 67], [30, 26]]) glow(hx + wx, hy + wy, 0.7, 0.8);
    const ax = (AQUARIUM.x + 3.5) * TILE - 52;
    const ay = (AQUARIUM.y + AQUARIUM.h) * TILE + 4 - 88;
    glow(ax + 32, ay + 60, 1.1, 0.7);
    for (let k = 0; k < 18; k++) {
      const x = (3 + Math.random() * 30) * TILE;
      const y = (6 + Math.random() * 22) * TILE;
      const img = this.add.image(x, y, 'firefly').setDepth(9850).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
      this.fireflies.push({ img, x, y, t: Math.random() * 100 });
    }
  }

  private updateLighting(time: number): void {
    const { multiply, dark } = lighting(hourOf(this.save.clock));
    this.lightRect.setFillStyle(multiply);
    // le faisceau du phare balaie la mer la nuit (il tourne toutes les dix secondes)
    this.beam?.setAlpha(dark * 0.55).setRotation(((time / 10000) % 1) * Math.PI * 2).setScale(1, 0.6 + Math.abs(Math.sin(time / 3183)) * 0.4);
    for (const g of this.glows) g.img.setAlpha(dark * g.base * (0.9 + Math.sin(time / 300 + g.img.x) * 0.06));
    const t = time / 1000;
    for (const f of this.fireflies) {
      f.img.setPosition(f.x + Math.sin(t * 0.4 + f.t) * 22 + Math.sin(t * 1.7 + f.t) * 4, f.y + Math.cos(t * 0.3 + f.t) * 14);
      f.img.setAlpha(Math.max(0, dark - 0.4) * (0.5 + 0.5 * Math.sin(t * 2.2 + f.t * 3)));
    }
  }

  /** Les habitués arrivent le matin et rentrent chez eux le soir. */
  private updateSchedules(): void {
    const h = hourOf(this.save.clock);
    for (const [id, w] of this.npcs) {
      const here = present(id, h);
      const s = w.sprite;
      if (here && !s.visible) {
        const spot = SPOTS[id];
        s.setPosition(spot.x * TILE, spot.y * TILE).setVisible(true).setAlpha(0);
        this.tweens.add({ targets: s, alpha: 1, duration: 800 });
        if (!this.save.rel[id].seen.includes('intro')) this.emote(w, 'excl');
      } else if (!here && s.visible && !w.busy && s.alpha === 1) {
        w.path = [];
        this.emote(w, null);
        this.tweens.add({ targets: s, alpha: 0, duration: 800, onComplete: () => s.setVisible(false) });
      }
    }
  }

  private makeHud(): HTMLElement {
    const root = document.createElement('div');
    root.className = 'cove-hud';
    const card = document.createElement('div');
    card.className = 'clock-card';
    const date = document.createElement('div');
    date.className = 'clock-date';
    const time = document.createElement('div');
    time.className = 'clock-time';
    const sun = document.createElement('span');
    sun.className = 'sun-ico';
    const tt = document.createElement('span');
    time.append(sun, tt);
    const coins = document.createElement('div');
    coins.className = 'clock-coins';
    const quest = document.createElement('div');
    quest.className = 'clock-quest';
    card.append(date, time, coins, quest);
    this.questEl = quest;
    const bag = document.createElement('button');
    bag.className = 'bag-btn';
    const bi = document.createElement('img');
    bi.src = iconUrl('bag', () => seedIcon('radis'));
    bag.append(bi);
    bag.addEventListener('click', () => this.openBag());
    const social = document.createElement('button');
    social.className = 'bag-btn heart-btn';
    social.textContent = '♥';
    social.addEventListener('click', () => this.openSocial());
    root.append(card, bag, social);
    this.hud = { root, date, time: tt, sun, coins };
    this.updateHud(true);
    return root;
  }

  private updateHud(force = false): void {
    this.hudT = 0.5;
    if (!this.hud) return;
    if (this.questEl) this.questEl.textContent = this.questText();
    const c = this.save.clock;
    this.hud.date.textContent = dateText(c.day);
    this.hud.time.textContent = timeText(c.minute);
    const h = hourOf(c);
    this.hud.sun.className = h >= 19 || h < 6 ? 'sun-ico moon' : 'sun-ico';
    this.hud.time.parentElement!.classList.toggle('late', c.minute >= DAY_LATE);
    if (force || this.hud.coins.textContent !== String(this.save.farm.coins)) {
      this.hud.coins.innerHTML = '<i></i>';
      this.hud.coins.append(`${this.save.farm.coins}`);
    }
    this.hud.root.classList.toggle('hide', this.mode !== 'walk' || !!this.ui?.open);
  }

  private openBag(): void {
    if (this.mode !== 'walk' || this.ui.open) return;
    const f = this.save.farm;
    const opts = [
      ...G.CROP_LIST.filter((c) => f.bag[c]).map((c) => ({ label: `${G.CROPS[c].name} ×${f.bag[c]}`, sub: `${G.CROPS[c].sell} p.`, icon: itemUrl(c), disabled: true })),
      ...G.CROP_LIST.filter((c) => f.seeds[c]).map((c) => ({ label: `Graines de ${G.CROPS[c].plural} ×${f.seeds[c]}`, icon: seedUrl(c), disabled: true })),
    ];
    this.ui.menu({
      title: 'Ton sac',
      text: opts.length ? 'Offre tes récoltes aux habitués, ou dépose-les dans le coffre près de la maison pour les vendre.' : 'Ton sac est vide. Les graines s’achètent au présentoir, près du potager.',
      options: opts,
      cancel: 'Fermer',
    });
  }

  // ------------------------------------------------------------- le potager

  private drawPlots(): void {
    this.plotObjs.forEach((o) => o.destroy());
    this.plotObjs = [];
    this.save.farm.plots.forEach((p, i) => {
      const tx = G.PLOT_X + (i % G.PLOT_COLS);
      const ty = G.PLOT_Y + Math.floor(i / G.PLOT_COLS);
      if (p.watered) this.plotObjs.push(this.add.rectangle(tx * TILE + 1, ty * TILE + 1, TILE - 2, TILE - 2, 0x1e0e08, 0.35).setOrigin(0).setDepth(-6.5));
      if (!p.crop) return;
      const st = G.stage(p);
      const key = `crop-${p.crop}-${st}`;
      addRaster(this, key, cropArt(p.crop, st));
      const spr = this.add.image(tx * TILE + 8, ty * TILE + 17, key).setOrigin(0.5, 1).setDepth(ty * TILE + 14);
      this.plotObjs.push(spr);
      if (st === 3) {
        const sp = this.add.circle(tx * TILE + 13, ty * TILE + 3, 1, 0xffffff).setDepth(9999);
        this.tweens.add({ targets: sp, alpha: 0.1, yoyo: true, repeat: -1, duration: 500 });
        this.plotObjs.push(sp);
      }
    });
  }

  /** Un objet du décor sous le doigt ? Le soigneur y va, puis agit. */
  private tapObject(x: number, y: number, tx: number, ty: number): boolean {
    const plot = G.plotIndex(tx, ty);
    if (plot !== null) {
      this.walkTo(this.player, { x: tx, y: ty }, () => this.plotAction(plot, tx, ty), { x: tx * TILE + 8, y: ty * TILE + 15 });
      return true;
    }
    const near = (px: number, py: number, rx: number, ry: number) => Math.abs(x - px) < rx && y > py - ry && y < py + 3;
    if (near(10.9 * TILE, 11.9 * TILE, 12, 18)) {
      this.walkTo(this.player, { x: 10, y: 12 }, () => this.openBin());
      return true;
    }
    if (near(6.7 * TILE, 12.9 * TILE, 14, 24)) {
      this.walkTo(this.player, { x: 7, y: 13 }, () => this.openStand());
      return true;
    }
    const hx = (HOUSE.x + HOUSE.w / 2) * TILE;
    const hy = (HOUSE.y + HOUSE.h) * TILE + 6;
    if (Math.abs(x - hx) < 56 && y > hy - 96 && y < hy) {
      this.walkTo(this.player, { x: HOUSE.doorX, y: HOUSE.y + HOUSE.h }, () => {
        this.face(this.player, hx, hy - 20);
        this.openHouse();
      }, { x: HOUSE.doorX * TILE + 8, y: (HOUSE.y + HOUSE.h) * TILE + 10 });
      return true;
    }
    const ax = (AQUARIUM.x + 3.5) * TILE;
    const ay = (AQUARIUM.y + AQUARIUM.h) * TILE + 4;
    if (Math.abs(x - ax) < 52 && y > ay - 88 && y < ay) {
      this.walkTo(this.player, { x: Math.floor(AQUARIUM.doorX), y: Math.floor(AQUARIUM.doorY) }, () => {
        this.face(this.player, AQUARIUM.doorX * TILE, ay - 30);
        this.openAquarium();
      });
      return true;
    }
    return false;
  }

  private plotAction(i: number, tx: number, ty: number): void {
    const f = this.save.farm;
    const p = f.plots[i];
    this.face(this.player, tx * TILE + 8, ty * TILE);
    if (!p.crop) {
      const owned = G.CROP_LIST.filter((c) => (f.seeds[c] ?? 0) > 0);
      this.ui.menu({
        title: 'Que planter ici ?',
        text: owned.length ? undefined : 'Tu n’as plus de graines. Le présentoir, à côté du potager, en vend.',
        options: owned.map((c) => ({
          label: `${G.CROPS[c].name} (×${f.seeds[c]})`, sub: G.CROPS[c].blurb, icon: seedUrl(c),
          pick: () => {
            G.plant(f, i, c);
            this.audio?.play('place');
            this.drawPlots();
            this.persist();
            this.showHint(`${G.CROPS[c].name} planté${c === 'fraise' || c === 'lavande' ? 'e' : ''} et arrosé${c === 'fraise' || c === 'lavande' ? 'e' : ''} !`, 2200);
          },
        })),
        cancel: 'Rien pour l’instant',
      });
      return;
    }
    if (G.isReady(p)) {
      const c = G.harvest(f, i)!;
      this.audio?.play('coin');
      const key = `itemtex-${c}`;
      addRaster(this, key, itemIcon(c));
      const pop = this.add.image(tx * TILE + 8, ty * TILE + 4, key).setDepth(9999);
      this.tweens.add({ targets: pop, y: pop.y - 14, duration: 300, ease: 'Back.easeOut' });
      this.tweens.add({ targets: pop, x: this.player.sprite.x, y: this.player.sprite.y - 16, alpha: 0, scale: 0.5, delay: 500, duration: 350, onComplete: () => pop.destroy() });
      this.drawPlots();
      this.persist();
      this.showHint(`+1 ${G.CROPS[c].name}`, 1600);
      return;
    }
    if (G.water(f, i)) {
      this.audio?.play('bubble');
      for (let k = 0; k < 6; k++) {
        const d = this.add.rectangle(tx * TILE + 3 + k * 2, ty * TILE - 2, 1, 2, 0x8ad8ff).setDepth(9999);
        this.tweens.add({ targets: d, y: ty * TILE + 10, alpha: 0, delay: k * 50, duration: 400, onComplete: () => d.destroy() });
      }
      this.drawPlots();
      this.persist();
      const left = G.CROPS[p.crop].days - p.grown;
      this.showHint(left > 1 ? `Arrosé. Encore ${left} nuits.` : 'Arrosé. Prêt demain matin !', 1800);
      return;
    }
    this.showHint(`Déjà arrosé aujourd’hui. Encore ${G.CROPS[p.crop].days - p.grown} nuit(s).`, 1800);
  }

  private openStand(): void {
    const f = this.save.farm;
    this.ui.menu({
      title: 'Présentoir à graines',
      text: `Tu as ${f.coins} pièces. On paie dans la boîte en fer, c’est la confiance.`,
      options: G.CROP_LIST.map((c) => ({
        label: `Graines de ${G.CROPS[c].plural}`, sub: `${G.CROPS[c].seed} p. · ${G.CROPS[c].blurb}`, icon: seedUrl(c), disabled: f.coins < G.CROPS[c].seed,
        pick: () => {
          if (G.buySeed(f, c)) this.audio?.play('coin');
          this.updateHud(true);
          this.persist();
          this.openStand();
        },
      })),
      cancel: 'Merci, c’est tout',
    });
  }

  private openBin(): void {
    const f = this.save.farm;
    const inBag = G.CROP_LIST.filter((c) => f.bag[c]);
    const inBin = G.CROP_LIST.filter((c) => f.bin[c]);
    this.ui.menu({
      title: 'Coffre d’expédition',
      text: `Ce que tu déposes ici est vendu pendant la nuit. Ce soir : ${G.binValue(f)} pièces.`,
      options: [
        ...inBag.map((c) => ({
          label: `Déposer ${G.CROPS[c].plural} (×${f.bag[c]})`, sub: `${G.CROPS[c].sell} p. pièce`, icon: itemUrl(c),
          pick: () => {
            G.ship(f, c, f.bag[c]!);
            this.audio?.play('place');
            this.persist();
            this.openBin();
          },
        })),
        ...inBin.map((c) => ({
          label: `Reprendre ${G.CROPS[c].plural} (×${f.bin[c]})`, icon: itemUrl(c),
          pick: () => {
            G.unship(f, c);
            this.persist();
            this.openBin();
          },
        })),
      ],
      cancel: inBag.length || inBin.length ? 'C’est bon' : 'Rien à expédier',
    });
  }

  private openHouse(): void {
    const c = this.save.clock;
    const early = c.minute < 18 * 60;
    this.ui.menu({
      title: 'La maison du soigneur',
      text: early ? `Il n’est que ${timeText(c.minute)}. La journée est encore belle…` : `Il est ${timeText(c.minute)}. Le lit a l’air très confortable.`,
      options: [{ label: 'Aller dormir', sub: 'Finir la journée', pick: () => this.sleep(false) }],
      cancel: 'Pas encore',
    });
  }

  private openAquarium(): void {
    this.ui.menu({
      title: 'L’aquarium de la crique',
      text: 'Un grand musée : les bassins des créatures sauvées, et les squelettes de la salle des fossiles.',
      options: [{
        label: 'Entrer', sub: 'Le musée, l’aquarium et Octave, le conservateur',
        pick: () => {
          this.enterMuseum();
        },
      }],
      cancel: 'Plus tard',
    });
  }

  /** Fin de journée : fondu, les plantes poussent, le coffre est vendu, nouveau matin. */
  private sleep(passedOut: boolean): void {
    if (this.sleeping) return;
    this.sleeping = true;
    this.ui.close();
    this.veil.textContent = passedOut ? 'Tu t’endors d’épuisement…' : 'Bonne nuit…';
    this.veil.classList.add('on');
    this.audio?.play('chime');
    this.time.delayedCall(1300, () => {
      const f = this.save.farm;
      const day = this.save.clock.day;
      const recap = G.night(f);
      if (passedOut) f.coins = Math.max(0, f.coins - 10);
      this.save.clock = { day: day + 1, minute: DAY_START };
      this.player.path = [];
      this.player.sprite.setPosition(HOUSE.doorX * TILE + 8, (HOUSE.y + HOUSE.h) * TILE + 12);
      this.face(this.player, this.player.sprite.x, this.player.sprite.y + 10);
      this.cameras.main.centerOn(this.player.sprite.x, this.player.sprite.y);
      for (const [id, w] of this.npcs) {
        w.path = [];
        w.sprite.setPosition(SPOTS[id].x * TILE, SPOTS[id].y * TILE);
      }
      this.drawPlots();
      if (this.area === 'museum') this.setArea('cove');
      this.drawCoveExtras();
      this.drawMuseum();
      this.persist();
      this.updateHud(true);
      const lines = [
        ...recap.sold.map((s) => `${G.CROPS[s.crop].name} ×${s.qty} … ${s.coins} p.`),
        recap.total ? `Ventes de la nuit : ${recap.total} pièces.` : 'Rien n’a été vendu cette nuit.',
        recap.grew ? `${recap.grew} plante${recap.grew > 1 ? 's ont' : ' a'} poussé${recap.ready ? `, ${recap.ready} prête${recap.ready > 1 ? 's' : ''} à récolter` : ''}.` : 'Pense à arroser ton potager.',
        passedOut ? 'Tu t’es endormi[|e|·e] dehors… Marcel t’a ramené[|e|·e]. (-10 pièces pour le café.)' : '',
      ].filter(Boolean);
      this.ui.menu({
        title: `Fin du jour ${day}`,
        text: lines.join('\n'),
        options: [],
        cancel: `Bonjour, ${dateText(day + 1).toLowerCase()} !`,
        onClose: () => {
          this.veil.classList.remove('on');
          this.sleeping = false;
          this.audio?.play('bubble');
        },
      });
    });
  }

  // ------------------------------------------------------------- décors

  /** Planche de contrôle : personnages et portraits agrandis (?crique&sheet). */
  private showSheets(): void {
    this.cameras.main.setBackgroundColor('#5ca84c');
    if (new URLSearchParams(location.search).has('museum')) {
      CREATURES.forEach((c, i) => {
        addRaster(this, `cr-${c.id}`, creatureArt(c.id));
        this.add.image(4 + (i % 5) * 46, 6 + Math.floor(i / 5) * 34, `cr-${c.id}`).setOrigin(0);
      });
      (['trex', 'plesio'] as const).forEach((sk, k) => SKELETON_PARTS.forEach((p, j) => {
        addRaster(this, `sk-${sk}-${p}`, j < 5 ? skeletonPart(sk, p) : ghostPart(sk, p));
        this.add.image(0, 140 + k * 82, `sk-${sk}-${p}`).setOrigin(0);
      }));
      TREASURES.forEach((t, i) => {
        addRaster(this, `tr-${t.id}`, treasureArt(t.id));
        this.add.image(130 + i * 16, 310, `tr-${t.id}`).setOrigin(0);
      });
      addRaster(this, 'octave', octaveSprite());
      this.add.image(130, 140, 'octave').setOrigin(0).setScale(2);
      return;
    }
    const pid = new URLSearchParams(location.search).get('portraits');
    if (pid) {
      MOODS.forEach((m, i) => {
        addRaster(this, `p-${m}`, [portrait(pid as Npc, { mood: m }), portrait(pid as Npc, { mood: m, talk: true }), portrait(pid as Npc, { mood: m, blink: true })]);
        for (let k = 0; k < 3; k++) this.add.image(8 + k * 76, 6 + i * 70, `p-${m}`, k).setOrigin(0);
      });
      return;
    }
    (['player', ...NPCS] as CastId[]).forEach((id, row) => {
      const frames = actorSheet(id === 'player' ? playerLook(this.profile) : LOOKS[id]);
      addRaster(this, `actor-${id}`, frames);
      frames.forEach((_, i) => this.add.image(4 + (i % 12) * 19.5, 6 + row * 30, `actor-${id}`, i).setOrigin(0));
    });
  }

  private placeProp(p: Prop): void {
    const unique = ['cottage', 'pier', 'boat', 'mailbox', 'bench', 'fence', 'lantern', 'bin', 'stand', 'aquarium', 'kiosk', 'lighthouse'].includes(p.kind);
    const s = p.seed % 12;
    const key = `cove-${p.kind}-${unique ? 0 : s}`;
    switch (p.kind) {
      case 'oak': addRaster(this, key, oak(s).frames); break;
      case 'autumn': addRaster(this, key, oak(s, true).frames); break;
      case 'pine': addRaster(this, key, pine(s).frames); break;
      case 'bush': addRaster(this, key, bush(s)); break;
      case 'berry': addRaster(this, key, bush(s, true)); break;
      case 'rock': addRaster(this, key, rock(s)); break;
      case 'bigrock': addRaster(this, key, rock(s, 1.7)); break;
      case 'reeds': addRaster(this, key, reeds(s)); break;
      case 'lily': addRaster(this, key, lilypad(s, false)); break;
      case 'lilyflower': addRaster(this, key, lilypad(s, true)); break;
      case 'flowers': addRaster(this, key, flowerPatch(s)); break;
      case 'cottage': addRaster(this, key, cottage()); break;
      case 'pier': addRaster(this, key, pier(PIER.w, PIER.h)); break;
      case 'fence': addRaster(this, key, fence(4)); break;
      case 'mailbox': addRaster(this, key, mailbox()); break;
      case 'bench': addRaster(this, key, bench()); break;
      case 'boat': addRaster(this, key, boat()); break;
      case 'lantern': addRaster(this, key, lantern()); break;
      case 'bin': addRaster(this, key, shippingBin()); break;
      case 'stand': addRaster(this, key, seedStand()); break;
      case 'aquarium': addRaster(this, key, aquariumHall()); break;
      case 'kiosk': addRaster(this, key, kiosk()); break;
      case 'lighthouse': addRaster(this, key, lighthouse()); break;
    }
    if (p.kind === 'aquarium') {
      const sign = textTexture(this.textures, 'AQUARIUM', '#1f6a78', null, 'small');
      this.add.image(Math.round(p.x), Math.round(p.y - 88 + 21), sign).setDepth(p.y + 0.5);
    }
    if (p.kind === 'pier') {
      this.add.image(p.x, p.y, key).setOrigin(0.5, 0).setDepth(-5);
      return;
    }
    const sprite = this.add.sprite(Math.round(p.x), Math.round(p.y), key, 0).setOrigin(0.5, 1);
    sprite.setDepth(p.flat ? (p.kind === 'lily' || p.kind === 'lilyflower' ? -7 : -6) : p.y);
    if (p.kind === 'oak' || p.kind === 'autumn' || p.kind === 'pine') this.swaying.push(sprite);
    if (p.kind === 'lily' || p.kind === 'lilyflower' || p.kind === 'boat') {
      this.tweens.add({ targets: sprite, y: sprite.y + 1, yoyo: true, repeat: -1, duration: 1600 + (p.seed % 7) * 200, ease: 'Sine.easeInOut' });
    }
  }
}
