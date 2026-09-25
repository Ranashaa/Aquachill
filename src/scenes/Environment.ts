// Ciel, soleil/lune, étoiles, nuages et silhouette de la ville, selon l'heure réelle.
import Phaser from 'phaser';
import { GAME_H, GAME_W } from '../config';
import { daylightAt, hourOf, type Daylight } from '../systems/daylight';
import { hash01 } from '../systems/rng';
import { cloudTexture, hexToRgb, mix } from './art';

/** Heure forcée par `?hour=21` (pratique pour tester), sinon heure locale. */
export function currentHour(): number {
  const forced = new URLSearchParams(location.search).get('hour');
  return forced !== null && forced !== '' ? Number(forced) : hourOf(new Date());
}

interface Building {
  x: number;
  w: number;
  h: number;
  roof: number;
}

function city(seed: number, minH: number, maxH: number): Building[] {
  const out: Building[] = [];
  let x = -4;
  let i = 0;
  while (x < GAME_W + 4) {
    const w = 14 + Math.floor(hash01(seed + i * 7) * 18);
    const h = minH + Math.floor(hash01(seed + i * 13) * (maxH - minH));
    out.push({ x, w, h, roof: Math.floor(hash01(seed + i * 29) * 3) });
    x += w + Math.floor(hash01(seed + i * 3) * 3);
    i++;
  }
  return out;
}

export class Environment {
  private skyTex: Phaser.Textures.CanvasTexture;
  private sun: Phaser.GameObjects.Arc;
  private moon: Phaser.GameObjects.Arc;
  private stars: Phaser.GameObjects.Rectangle[] = [];
  private clouds: Phaser.GameObjects.Image[] = [];
  private far: { tex: Phaser.Textures.CanvasTexture; img: Phaser.GameObjects.Image; blocks: Building[] };
  private near: { tex: Phaser.Textures.CanvasTexture; img: Phaser.GameObjects.Image; blocks: Building[] };
  private lastNight = -1;
  private timer = 0;
  light: Daylight;

  constructor(scene: Phaser.Scene) {
    const tex = scene.textures;
    if (tex.exists('env-sky')) tex.remove('env-sky');
    this.skyTex = tex.createCanvas('env-sky', GAME_W, GAME_H)!;
    scene.add.image(0, 0, 'env-sky').setOrigin(0).setScrollFactor(0).setDepth(-100);

    for (let i = 0; i < 60; i++) {
      const s = scene.add
        .rectangle(Math.floor(hash01(i * 3) * GAME_W), Math.floor(hash01(i * 5 + 1) * GAME_H * 0.8), 1, 1, 0xffffff)
        .setScrollFactor(0)
        .setDepth(-99);
      this.stars.push(s);
      scene.tweens.add({ targets: s, alpha: 0.2, yoyo: true, repeat: -1, duration: 800 + hash01(i) * 2000, delay: hash01(i * 11) * 2000 });
    }
    this.sun = scene.add.circle(0, 0, 9, 0xfff0a0).setScrollFactor(0).setDepth(-98);
    this.moon = scene.add.circle(0, 0, 7, 0xf4f0e0).setScrollFactor(0).setDepth(-98);
    const cloud = cloudTexture(tex);
    for (let i = 0; i < 6; i++) {
      this.clouds.push(
        scene.add.image(hash01(i * 17) * GAME_W, 20 + i * 45, cloud).setScrollFactor(0.3, 0.15).setDepth(-95),
      );
    }
    const layer = (key: string, h: number, seed: number, minH: number, maxH: number, depth: number) => {
      if (tex.exists(key)) tex.remove(key);
      const t = tex.createCanvas(key, GAME_W, h)!;
      const img = scene.add.image(0, 0, key).setOrigin(0, 1).setDepth(depth);
      return { tex: t, img, blocks: city(seed, minH, maxH) };
    };
    this.far = layer('env-far', 130, 11, 40, 125, -92);
    this.near = layer('env-near', 90, 71, 20, 80, -91);
    this.light = daylightAt(currentHour());
    this.refresh();
  }

  /** Place la ville derrière le toit (elle dépasse au-dessus). */
  anchor(roofTop: number): void {
    this.far.img.y = roofTop + 70;
    this.near.img.y = roofTop + 60;
  }

  get night(): number {
    return this.light.night;
  }

  private refresh(): void {
    const dl = (this.light = daylightAt(currentHour()));
    // ciel tramé
    const ctx = this.skyTex.getContext();
    const img = ctx.createImageData(GAME_W, GAME_H);
    const bands = 10;
    for (let y = 0; y < GAME_H; y++) {
      const t = y / GAME_H;
      const band = Math.floor(t * bands);
      const frac = t * bands - band;
      const c0 = hexToRgb(rgbToHex(mix(dl.skyTop, dl.skyBottom, band / bands)));
      const c1 = hexToRgb(rgbToHex(mix(dl.skyTop, dl.skyBottom, (band + 1) / bands)));
      for (let x = 0; x < GAME_W; x++) {
        const c = ((x + y) % 2 === 0 ? 0.25 : 0.75) < frac ? c1 : c0;
        const i = (y * GAME_W + x) * 4;
        img.data[i] = c[0];
        img.data[i + 1] = c[1];
        img.data[i + 2] = c[2];
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    this.skyTex.refresh();

    this.stars.forEach((s) => s.setVisible(dl.night > 0.3).setAlpha(dl.night));
    const arc = (t: number) => ({ x: 20 + t * (GAME_W - 40), y: 90 - Math.sin(t * Math.PI) * 60 });
    this.sun.setVisible(dl.sun !== null);
    if (dl.sun !== null) this.sun.setPosition(arc(dl.sun).x, arc(dl.sun).y);
    this.moon.setVisible(dl.moon !== null && dl.night > 0.3);
    if (dl.moon !== null) this.moon.setPosition(arc(dl.moon).x, arc(dl.moon).y);
    this.clouds.forEach((c) => c.setAlpha(1 - dl.night * 0.75).setTint(dl.night > 0.5 ? 0x8a88b0 : 0xffffff));

    if (Math.abs(dl.night - this.lastNight) > 0.04) {
      this.lastNight = dl.night;
      this.drawCity(this.far, mix('#a8c4dc', '#2e2c58', dl.night), 0.25, dl.night);
      this.drawCity(this.near, mix('#7f9cc0', '#1e1c40', dl.night), 0.4, dl.night);
    }
  }

  private drawCity(
    layer: { tex: Phaser.Textures.CanvasTexture; blocks: Building[] },
    color: string,
    litChance: number,
    night: number,
  ): void {
    const ctx = layer.tex.getContext();
    const H = layer.tex.height;
    ctx.clearRect(0, 0, GAME_W, H);
    const windowDay = 'rgba(255,255,255,0.25)';
    layer.blocks.forEach((b, bi) => {
      const top = H - b.h;
      ctx.fillStyle = color;
      ctx.fillRect(b.x, top, b.w, b.h);
      if (b.roof === 1) ctx.fillRect(b.x + Math.floor(b.w / 2), top - 6, 1, 6); // antenne
      if (b.roof === 2) ctx.fillRect(b.x + 3, top - 3, b.w - 6, 3); // édicule
      for (let y = top + 4; y < H - 3; y += 5) {
        for (let x = b.x + 3; x < b.x + b.w - 3; x += 4) {
          const lit = hash01(bi * 977 + x * 31 + y * 17) < litChance;
          if (night > 0.35 && lit) ctx.fillStyle = '#ffe08a';
          else if (night <= 0.35) ctx.fillStyle = windowDay;
          else continue;
          ctx.fillRect(x, y, 2, 2);
        }
      }
    });
    layer.tex.refresh();
  }

  update(dt: number): void {
    for (const c of this.clouds) {
      c.x += dt * 2;
      if (c.x > GAME_W + 30) c.x = -30;
    }
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = 30;
      this.refresh();
    }
  }
}

function rgbToHex(rgb: string): string {
  const m = rgb.match(/\d+/g)!.map(Number);
  return `#${m.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
