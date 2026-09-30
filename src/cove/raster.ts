// Petit toolkit de dessin pixel par pixel : tout le pixel art de la crique est
// peint ici (sol, arbres, personnages, portraits), sans image externe.

export type RGB = number; // 0xRRGGBB

export function hex(s: string): RGB {
  return parseInt(s.replace('#', ''), 16);
}

export function mixRGB(a: RGB, b: RGB, t: number): RGB {
  const ch = (s: number) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

/** Hachage entier → [0, 1). */
export function hash(x: number, y: number, seed = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Bruit de valeur lissé, entre 0 et 1. */
export function noise(x: number, y: number, seed = 0): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = smooth(x - xi);
  const yf = smooth(y - yi);
  const a = hash(xi, yi, seed);
  const b = hash(xi + 1, yi, seed);
  const c = hash(xi, yi + 1, seed);
  const d = hash(xi + 1, yi + 1, seed);
  return (a * (1 - xf) + b * xf) * (1 - yf) + (c * (1 - xf) + d * xf) * yf;
}

/** Bruit fractal (plusieurs octaves). */
export function fbm(x: number, y: number, seed = 0, octaves = 3): number {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += noise(x, y, seed + o * 17) * amp;
    norm += amp;
    amp *= 0.5;
    x *= 2;
    y *= 2;
  }
  return sum / norm;
}

/** Matrice de Bayer 4×4 pour des dégradés tramés façon pixel art. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const dither = (x: number, y: number) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;

/** Choisit une teinte dans une rampe (sombre → claire) selon t ∈ [0,1], avec tramage. */
export function ramp(colors: RGB[], t: number, x: number, y: number, ditherAmount = 1): RGB {
  const v = Math.max(0, Math.min(0.9999, t)) * (colors.length - 1);
  const i = Math.floor(v);
  const f = v - i;
  const pick = f + (dither(x, y) - 0.5) * ditherAmount > 0.5 ? i + 1 : i;
  return colors[Math.min(colors.length - 1, pick)];
}

export class Raster {
  readonly data: Uint8ClampedArray;

  constructor(readonly w: number, readonly h: number) {
    this.data = new Uint8ClampedArray(w * h * 4);
  }

  inside(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  set(x: number, y: number, c: RGB, a = 255): void {
    x |= 0;
    y |= 0;
    if (!this.inside(x, y)) return;
    const i = (y * this.w + x) * 4;
    this.data[i] = (c >> 16) & 255;
    this.data[i + 1] = (c >> 8) & 255;
    this.data[i + 2] = c & 255;
    this.data[i + 3] = a;
  }

  /** Mélange une couleur par-dessus (ombres, lumières douces). */
  blend(x: number, y: number, c: RGB, a: number): void {
    x |= 0;
    y |= 0;
    if (!this.inside(x, y)) return;
    const i = (y * this.w + x) * 4;
    const da = this.data[i + 3] / 255;
    if (da === 0) {
      this.set(x, y, c, Math.round(a * 255));
      return;
    }
    this.data[i] = this.data[i] * (1 - a) + ((c >> 16) & 255) * a;
    this.data[i + 1] = this.data[i + 1] * (1 - a) + ((c >> 8) & 255) * a;
    this.data[i + 2] = this.data[i + 2] * (1 - a) + (c & 255) * a;
    this.data[i + 3] = Math.min(255, this.data[i + 3] + a * 255 * (1 - da));
  }

  alpha(x: number, y: number): number {
    if (!this.inside(x, y)) return 0;
    return this.data[(y * this.w + x) * 4 + 3];
  }

  get(x: number, y: number): RGB {
    const i = (y * this.w + x) * 4;
    return (this.data[i] << 16) | (this.data[i + 1] << 8) | this.data[i + 2];
  }

  rect(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c);
  }

  /** Ellipse pleine ; `shade` peut colorer chaque pixel selon sa position normalisée (-1..1). */
  ellipse(cx: number, cy: number, rx: number, ry: number, c: RGB | ((nx: number, ny: number, x: number, y: number) => RGB | null)): void {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const nx = (x + 0.5 - cx) / rx;
        const ny = (y + 0.5 - cy) / ry;
        if (nx * nx + ny * ny > 1) continue;
        const col = typeof c === 'function' ? c(nx, ny, x, y) : c;
        if (col !== null) this.set(x, y, col);
      }
    }
  }

  /** Ombre portée douce (ellipse translucide). */
  shadow(cx: number, cy: number, rx: number, ry: number, a = 0.28): void {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const nx = (x + 0.5 - cx) / rx;
        const ny = (y + 0.5 - cy) / ry;
        const d = nx * nx + ny * ny;
        if (d > 1) continue;
        this.blend(x, y, 0x1e2a3a, d > 0.6 ? a * 0.6 : a);
      }
    }
  }

  /** Contour d'1 px autour de tout ce qui est opaque (couleur sombre teintée plutôt que noir). */
  outline(color: RGB, diagonals = false): void {
    const add: [number, number][] = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.alpha(x, y) > 0) continue;
        const n = this.alpha(x - 1, y) > 128 || this.alpha(x + 1, y) > 128 || this.alpha(x, y - 1) > 128 || this.alpha(x, y + 1) > 128
          || (diagonals && (this.alpha(x - 1, y - 1) > 128 || this.alpha(x + 1, y + 1) > 128 || this.alpha(x + 1, y - 1) > 128 || this.alpha(x - 1, y + 1) > 128));
        if (n) add.push([x, y]);
      }
    }
    for (const [x, y] of add) this.set(x, y, color);
  }

  /** Copie une autre image (pixels opaques seulement). */
  draw(src: Raster, ox: number, oy: number, flipX = false): void {
    for (let y = 0; y < src.h; y++) {
      for (let x = 0; x < src.w; x++) {
        const sx = flipX ? src.w - 1 - x : x;
        const a = src.alpha(sx, y);
        if (a === 0) continue;
        if (a === 255) this.set(ox + x, oy + y, src.get(sx, y));
        else this.blend(ox + x, oy + y, src.get(sx, y), a / 255);
      }
    }
  }

  toCanvas(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = this.w;
    c.height = this.h;
    c.getContext('2d')!.putImageData(new ImageData(this.data as unknown as Uint8ClampedArray<ArrayBuffer>, this.w, this.h), 0, 0);
    return c;
  }
}
