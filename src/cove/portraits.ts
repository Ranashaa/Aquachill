// Grands portraits des habitués (64×64), peints au pixel : expressions, clignement
// des yeux et bouche qui bouge pendant qu'ils parlent.
import { hash, hex, mixRGB, noise, ramp, Raster, type RGB } from './raster';
import type { CastId } from './cast';

export type Mood = 'neutral' | 'happy' | 'sad' | 'surprised' | 'grumpy' | 'blush';
export const MOODS: Mood[] = ['neutral', 'happy', 'sad', 'surprised', 'grumpy', 'blush'];

interface PortraitSpec {
  skin: string;
  hair: string;
  eyes: string;
  brows: string;
  style: 'marcel' | 'lila' | 'gobie' | 'nina';
  outfit: string;
  outfit2: string;
}

const SPECS: Record<Exclude<CastId, 'player'>, PortraitSpec> = {
  marcel: { skin: '#e4ac84', hair: '#d8d8e0', eyes: '#4a6a9a', brows: '#e8e8f0', style: 'marcel', outfit: '#f0b030', outfit2: '#2e4e86' },
  lila: { skin: '#a46a44', hair: '#2a1a1e', eyes: '#3a2418', brows: '#1a1014', style: 'lila', outfit: '#ff7ab0', outfit2: '#ffffff' },
  gobie: { skin: '#f6d4b4', hair: '#ecc464', eyes: '#3a8a6a', brows: '#b88a3a', style: 'gobie', outfit: '#f6f6f2', outfit2: '#5a7ac0' },
  nina: { skin: '#fad8bc', hair: '#8a64d4', eyes: '#6a3a8a', brows: '#5a3a9a', style: 'nina', outfit: '#40c0b4', outfit2: '#2a2a3a' },
};

const S = 64;
const INK = hex('#2a1a2a');

function tones(base: string, n = 5): RGB[] {
  const c = hex(base);
  const out: RGB[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    out.push(t < 0.6 ? mixRGB(mixRGB(c, 0x3a1a4a, 0.5), c, t / 0.6) : mixRGB(c, 0xfff4e8, (t - 0.6) / 0.4 * 0.55));
  }
  return out;
}

/** Contour intérieur : assombrit les pixels d'un calque au bord d'un autre. */
function edge(r: Raster, layer: Raster, color: RGB): void {
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      if (!layer.alpha(x, y)) continue;
      if (!layer.alpha(x - 1, y) || !layer.alpha(x + 1, y) || !layer.alpha(x, y - 1) || !layer.alpha(x, y + 1)) r.set(x, y, color);
      else r.set(x, y, layer.get(x, y));
    }
  }
}

export interface PortraitOpts {
  mood: Mood;
  blink?: boolean;
  talk?: boolean;
}

export function portrait(id: Exclude<CastId, 'player'>, o: PortraitOpts): Raster {
  const sp = SPECS[id];
  const r = new Raster(S, S);
  const skin = tones(sp.skin);
  const hair = tones(sp.hair);
  const cloth = tones(sp.outfit);
  const cloth2 = tones(sp.outfit2);
  const cx = 32;
  const cy = 27;
  const child = sp.style === 'lila';
  const headRx = child ? 17 : 16;
  const headRy = child ? 17 : 18.5;

  // ---------------------------------------------------- cheveux de derrière
  const back = new Raster(S, S);
  if (sp.style === 'gobie') {
    for (let y = 10; y < 62; y++) {
      for (let x = 8; x < 57; x++) {
        const dx = x - cx;
        const width = 21 - Math.max(0, y - 48) * 0.4 + Math.sin(y / 3) * 1.2;
        if (Math.abs(dx) > width) continue;
        const wave = Math.sin(y / 2.5 + dx / 3) * 0.2;
        back.set(x, y, ramp(hair, 0.35 - Math.abs(dx) / 60 + wave + (noise(x / 2, y / 4, 3) - 0.5) * 0.3, x, y, 0.3));
      }
    }
  }
  if (sp.style === 'lila') {
    // le chignon
    back.ellipse(cx, 6, 9, 7, (nx, ny, x, y) => ramp(hair, 0.55 - ny * 0.4 - nx * 0.2 + (hash(x, y, 1) - 0.5) * 0.25, x, y, 0.2));
  }
  edge(r, back, hair[0]);

  // ---------------------------------------------------- épaules et vêtements
  const body = new Raster(S, S);
  for (let y = 46; y < S; y++) {
    const half = Math.min(27, 10 + (y - 46) * 2.6);
    for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) {
      const nx = (x - cx) / half;
      let t = 0.62 - nx * 0.3 - (y - 46) / 60;
      if (Math.abs(nx) > 0.82) t -= 0.25;
      body.set(x, y, ramp(cloth, t, x, y, 0.15));
    }
  }
  // détails de tenue
  if (sp.style === 'marcel') {
    // ciré jaune : col relevé et boutons
    for (let y = 46; y < 52; y++) for (let x = cx - 11 + (y - 46); x < cx - 5; x++) body.set(x, y, cloth[4]);
    for (let y = 46; y < 52; y++) for (let x = cx + 5; x < cx + 11 - (y - 46); x++) body.set(x, y, cloth[3]);
    for (let y = 52; y < S; y += 5) body.set(cx, y, hex('#3a3a4a')), body.set(cx, y + 1, hex('#6a6a7a'));
    for (let y = 50; y < S; y++) body.set(cx - 1, y, cloth[1]);
  } else if (sp.style === 'lila') {
    // col Claudine blanc
    body.ellipse(cx - 5, 49, 6, 3.5, (_nx, ny, x, y) => ramp(cloth2, 0.7 - ny * 0.3, x, y, 0));
    body.ellipse(cx + 5, 49, 6, 3.5, (_nx, ny, x, y) => ramp(cloth2, 0.55 - ny * 0.3, x, y, 0));
    body.set(cx, 52, hex('#ff4a8a'));
    body.set(cx - 1, 52, hex('#ff4a8a'));
  } else if (sp.style === 'gobie') {
    // blouse blanche, revers, chemise bleue, stylo dans la poche
    for (let y = 46; y < S; y++) {
      const open = Math.max(0, 8 - (y - 46) * 0.45);
      for (let x = Math.round(cx - open); x <= Math.round(cx + open); x++) body.set(x, y, ramp(cloth2, 0.6 - (x - cx) / 20, x, y, 0));
      body.set(Math.round(cx - open) - 1, y, cloth[1]);
      body.set(Math.round(cx + open) + 1, y, cloth[1]);
    }
    for (let y = 54; y < 62; y++) body.set(cx + 15, y, hex('#e8453c'));
    body.set(cx + 15, 53, hex('#3a3a4a'));
    for (let x = cx + 12; x < cx + 20; x++) body.set(x, 57, cloth[1]);
  } else {
    // veste turquoise, t-shirt sombre, sangle et appareil photo
    for (let y = 46; y < S; y++) {
      const open = Math.max(0, 6 - (y - 46) * 0.2);
      for (let x = Math.round(cx - open); x <= Math.round(cx + open); x++) body.set(x, y, ramp(cloth2, 0.5, x, y, 0));
    }
    for (let k = 0; k < 16; k++) body.set(cx - 14 + k, 47 + k, hex('#3a3a4a'));
    for (let y = 54; y < 63; y++) {
      for (let x = cx + 1; x < cx + 15; x++) {
        const border = y === 54 || y === 62 || x === cx + 1 || x === cx + 14;
        body.set(x, y, border ? hex('#1a1a24') : y < 57 ? hex('#4a4a5a') : hex('#2e2e3a'));
      }
    }
    body.ellipse(cx + 8, 59, 3.2, 3.2, (nx, ny) => (nx * nx + ny * ny < 0.3 ? hex('#8ac8f0') : hex('#101018')));
    body.set(cx + 7, 58, 0xffffff);
    body.rect(cx + 3, 55, 3, 1, hex('#e8453c'));
  }
  // cou
  for (let y = 40; y < 50; y++) for (let x = cx - 5; x <= cx + 5; x++) body.set(x, y, y < 45 ? skin[1] : ramp(skin, 0.45 - (x - cx) / 14, x, y, 0));
  const bodyOut = new Raster(S, S);
  bodyOut.draw(body, 0, 0);
  edge(r, bodyOut, INK);

  // ---------------------------------------------------- tête
  const head = new Raster(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const ny = (y + 0.5 - cy) / headRy;
      const jaw = ny > 0.15 ? 1 - (ny - 0.15) ** 2 * (child ? 0.4 : 0.55) : 1;
      const nx = (x + 0.5 - cx) / (headRx * jaw);
      if (nx * nx + ny * ny > 1) continue;
      let t = 0.66 - nx * 0.28 - ny * 0.12;
      if (nx > 0.55) t -= 0.18;
      if (ny > 0.75) t -= 0.2;
      head.set(x, y, ramp(skin, t, x, y, 0.1));
    }
  }
  // oreilles
  for (const ex of [cx - headRx - 0.5, cx + headRx + 0.5]) {
    head.ellipse(ex, cy + 3, 2.2, 3.6, (nx, _ny, x, y) => ramp(skin, ex < cx ? 0.55 - nx * 0.1 : 0.35, x, y, 0));
    head.set(Math.round(ex), cy + 3, skin[1]);
  }
  edge(r, head, mixRGB(skin[0], INK, 0.5));

  // ---------------------------------------------------- visage
  const eyeY = cy + 2;
  const eyeDX = child ? 8 : 7.5;
  const eyeC = tones(sp.eyes);
  const blink = o.blink;
  const m = o.mood;
  for (const side of [-1, 1]) {
    const ex = Math.round(cx + side * eyeDX);
    if (blink || m === 'happy') {
      // yeux fermés : un arc (souriant quand heureux)
      if (m === 'happy' && !blink) {
        // ^ ^ : un arc joyeux
        for (let k = -3; k <= 3; k++) r.set(ex + k, eyeY - 1 + Math.round(Math.abs(k) * 0.6), INK);
        for (let k = -2; k <= 2; k++) r.set(ex + k, eyeY + Math.round(Math.abs(k) * 0.6), mixRGB(skin[2], INK, 0.25));
      } else {
        for (let k = -3; k <= 3; k++) r.set(ex + k, eyeY + 1 + (Math.abs(k) === 3 ? -1 : 0), INK);
        if (side > 0) r.set(ex + 4, eyeY - 1, INK);
        else r.set(ex - 4, eyeY - 1, INK);
      }
    } else {
      // œil en amande : blanc, grand iris dégradé, pupille, deux reflets
      const big = m === 'surprised' ? 1 : 0;
      const h = (child ? 6 : 5) + big;
      const top = eyeY - 2 - big;
      const half = 3 + big;
      const lid = m === 'grumpy' || m === 'sad' ? 1 : 0;
      for (let y = top; y < top + h; y++) {
        const edgeRow = y === top || y === top + h - 1;
        for (let x = ex - half; x <= ex + half; x++) {
          if (edgeRow && Math.abs(x - ex) === half) continue;
          r.set(x, y, y === top ? 0xe8e0e4 : 0xfbf6f0);
        }
      }
      const iw = child ? 2 : 2;
      for (let y = top; y < top + h; y++) {
        for (let x = ex - iw; x <= ex + iw - 1 + (child ? 1 : 0); x++) {
          const k = (y - top) / (h - 1);
          const edgeRow = y === top || y === top + h - 1;
          if (edgeRow && (x === ex - iw || x === ex + iw - 1 + (child ? 1 : 0))) continue;
          r.set(x, y, eyeC[k < 0.25 ? 0 : k < 0.6 ? 1 : k < 0.85 ? 2 : 3]);
        }
      }
      r.set(ex - 1, top + 2, INK);
      r.set(ex, top + 2, INK);
      r.set(ex - 1, top + 3, INK);
      r.set(ex, top + 3, eyeC[0]);
      r.set(ex - 2, top + 1, 0xffffff);
      r.set(ex - 1, top + 1, 0xffffff);
      r.set(ex - 2, top + 2, 0xffffff);
      r.set(ex + 1, top + h - 2, mixRGB(eyeC[4], 0xffffff, 0.5));
      // cils et paupière
      for (let x = ex - half; x <= ex + half; x++) r.set(x, top - 1, INK);
      r.set(ex - half - 1, top, INK);
      r.set(ex + half + 1, top, INK);
      if (sp.style !== 'marcel') {
        r.set(ex + side * (half + 2), top - 1, INK);
        r.set(ex + side * (half + 2), top - 2, INK);
      }
      for (let x = ex - half + 1; x <= ex + half - 1; x++) r.set(x, top + h, mixRGB(skin[1], skin[2], 0.5));
      if (lid) for (let x = ex - half; x <= ex + half; x++) r.set(x, top, INK), r.set(x, top - 1, skin[1]);
    }
    // sourcils selon l'humeur
    const by = eyeY - (child ? 6 : 5) - (m === 'surprised' ? 2 : 0);
    const brow = hex(sp.brows);
    for (let k = -3; k <= 2; k++) {
      const x = ex + k * side;
      let dy = 0;
      if (m === 'sad') dy = Math.round((-k) * 0.45);
      if (m === 'grumpy') dy = Math.round((k + 1) * 0.5);
      if (m === 'happy' || m === 'blush') dy = Math.abs(k) === 3 ? 1 : 0;
      r.set(x, by + dy, brow);
      if (sp.style === 'marcel') r.set(x, by + dy - 1, brow); // gros sourcils broussailleux
    }
    // joues
    if (m === 'blush' || m === 'happy' || child) {
      const bc = mixRGB(skin[2], hex('#ff5a78'), m === 'blush' ? 0.55 : 0.32);
      for (let k = -2; k <= 1; k++) r.set(ex + k + side, eyeY + 5, bc), r.set(ex + k + side, eyeY + 6, bc);
      if (m === 'blush') for (let k = -1; k <= 1; k += 2) r.set(ex + k, eyeY + 5, mixRGB(bc, 0xffffff, 0.3));
    }
  }
  for (const side of [-1, 1]) r.set(Math.round(cx + side * (eyeDX + 1)), eyeY + 5, side < 0 ? skin[4] : skin[3]);
  if (sp.style === 'lila') {
    // taches de rousseur
    for (const [fx, fy] of [[-8, 5], [-6, 6], [-9, 7], [7, 5], [9, 6], [6, 7]]) r.set(cx + fx, eyeY + fy, skin[1]);
  }
  // nez
  r.set(cx + 1, eyeY + 5, skin[1]);
  r.set(cx + 1, eyeY + 6, skin[1]);
  r.set(cx, eyeY + 7, skin[1]);
  r.set(cx + 1, eyeY + 7, skin[0]);
  r.set(cx - 1, eyeY + 5, skin[4]);
  // bouche
  const my = eyeY + 10 + (child ? 0 : 1);
  const lip = mixRGB(skin[1], hex('#a0304a'), 0.45);
  const open = o.talk;
  if (m === 'surprised') {
    r.ellipse(cx, my + 1, 2, open ? 2.6 : 2, INK);
    r.set(cx, my + 2, hex('#e8506a'));
  } else if (m === 'sad') {
    for (let k = -3; k <= 3; k++) r.set(cx + k, my + (Math.abs(k) > 1 ? 1 : 0), INK);
    if (open) r.set(cx, my + 1, hex('#6a1a2a'));
  } else if (m === 'grumpy') {
    for (let k = -3; k <= 3; k++) r.set(cx + k, my + (k === -3 || k === 3 ? 1 : 0), INK);
    if (open) for (let k = -1; k <= 1; k++) r.set(cx + k, my + 1, hex('#6a1a2a'));
  } else if (m === 'happy' || m === 'blush') {
    const w = m === 'happy' ? 4 : 3;
    for (let k = -w; k <= w; k++) r.set(cx + k, my + (Math.abs(k) >= w - 1 ? 0 : 1), INK);
    if (open || m === 'happy') {
      for (let k = -w + 2; k <= w - 2; k++) r.set(cx + k, my + 2, hex('#7a1a30'));
      for (let k = -1; k <= 1; k++) r.set(cx + k, my + 3, hex('#e8607a'));
      for (let k = -w + 2; k <= w - 2; k++) r.set(cx + k, my + 1, 0xffffff);
    }
  } else {
    for (let k = -2; k <= 2; k++) r.set(cx + k, my, open ? INK : lip);
    if (open) {
      for (let k = -1; k <= 1; k++) r.set(cx + k, my + 1, hex('#7a1a30'));
      r.set(cx, my + 2, INK);
    }
  }

  // ---------------------------------------------------- cheveux de devant, chapeaux, barbe, lunettes
  const front = new Raster(S, S);
  if (sp.style === 'marcel') {
    // barbe blanche fournie
    for (let y = eyeY + 5; y < 54; y++) {
      for (let x = cx - 18; x <= cx + 18; x++) {
        const dy = (y - (eyeY + 5)) / 20;
        const half = (headRx + 0.5) * (1 - dy * dy * 0.7) + Math.sin(y * 1.3 + x) * 0.8;
        if (Math.abs(x - cx) > half) continue;
        // on laisse voir la bouche sous la moustache
        if (y >= my - 1 && y <= my + 3 && Math.abs(x - cx) < 4 && y > my - 1) continue;
        if (y < eyeY + 9 && Math.abs(x - cx) < 11 && !(y >= my - 3)) continue;
        const curl = noise(x / 2, y / 2, 5);
        front.set(x, y, ramp(hair, 0.55 - (x - cx) / 40 - dy * 0.25 + (curl - 0.5) * 0.4, x, y, 0.3));
      }
    }
    // moustache
    for (let k = -6; k <= 6; k++) {
      front.set(cx + k, my - 2 + (Math.abs(k) > 4 ? 1 : 0), ramp(hair, 0.7 - Math.abs(k) / 20, cx + k, 0, 0));
      front.set(cx + k, my - 1 + (Math.abs(k) > 4 ? 1 : 0), ramp(hair, 0.45, cx + k, 1, 0));
    }
    // mèches grises au-dessus des oreilles
    for (const side of [-1, 1]) for (let y = cy - 6; y < cy + 2; y++) for (let k = 0; k < 3; k++) front.set(cx + side * (headRx - 1 + k), y, ramp(hair, 0.5 + k * 0.1, 0, y, 0));
    // casquette de marin
    const cap = tones(sp.outfit2);
    for (let y = 3; y < cy - 5; y++) {
      for (let x = cx - 19; x <= cx + 19; x++) {
        const nx = (x - cx) / 19;
        const ny = (y - (cy - 5)) / 22;
        if (nx * nx + ny * ny > 1) continue;
        front.set(x, y, ramp(cap, 0.6 - nx * 0.35 - (y < 10 ? -0.2 : 0), x, y, 0.3));
      }
    }
    for (let x = cx - 19; x <= cx + 19; x++) {
      front.set(x, cy - 5, cap[0]);
      front.set(x, cy - 4, cap[1]);
    }
    for (let x = cx - 3; x <= cx + 3; x++) front.set(x, 12, hex('#e0b048')), front.set(x, 13, hex('#a87a28'));
  } else if (sp.style === 'lila') {
    // cheveux crépus bouclés autour du front, barrette
    for (let y = 6; y < cy - 2; y++) {
      for (let x = cx - 20; x <= cx + 20; x++) {
        const nx = (x - cx) / 20;
        const ny = (y - (cy - 2)) / 20;
        const curl = Math.sin(x * 1.3) * 0.08 + Math.sin(y * 1.7) * 0.06;
        if (nx * nx + ny * ny > 1 + curl) continue;
        if (y > cy - 8 && Math.abs(nx) < 0.62 && hash(x, 0, 4) < 0.7 && y > cy - 6 + Math.sin(x) * 1.5) continue;
        front.set(x, y, ramp(hair, 0.5 - nx * 0.3 - ny * 0.25 + (hash(x >> 1, y >> 1, 6) - 0.5) * 0.4, x, y, 0.3));
      }
    }
    for (const side of [-1, 1]) for (let y = cy - 4; y < cy + 6; y++) {
      for (let k = 0; k < 3; k++) front.set(cx + side * (headRx + k - 1), y, ramp(hair, 0.35 + (hash(y, k, 8)) * 0.3, 0, y, 0));
    }
    front.rect(cx + 8, 10, 6, 3, hex('#ff5a9a'));
    front.set(cx + 9, 10, hex('#ffb0d0'));
  } else if (sp.style === 'gobie') {
    // frange balayée sur le côté, crayon oublié dans les cheveux
    for (let y = 4; y < cy - 1; y++) {
      for (let x = cx - 20; x <= cx + 20; x++) {
        const nx = (x - cx) / 19.5;
        const ny = (y - (cy - 1)) / 22;
        if (nx * nx + ny * ny > 1) continue;
        const sweep = cy - 8 + (x - cx) * 0.3;
        if (y > sweep && Math.abs(nx) < 0.78) continue;
        front.set(x, y, ramp(hair, 0.55 - nx * 0.25 + Math.sin(x / 2 + y / 5) * 0.12, x, y, 0.3));
      }
    }
    for (const side of [-1, 1]) for (let y = cy - 4; y < 46; y++) for (let k = 0; k < 4; k++) {
      front.set(cx + side * (headRx - 1 + k), y, ramp(hair, 0.45 + k * 0.05 + Math.sin(y / 2) * 0.1, 0, y, 0));
    }
    for (let k = 0; k < 11; k++) front.set(cx - 19 + k, 11 - Math.floor(k / 3), k < 2 ? hex('#ffb0a0') : k > 8 ? hex('#3a3a4a') : hex('#ffd23a'));
  } else {
    // carré violet à frange droite, boucle d'oreille
    for (let y = 5; y < 46; y++) {
      for (let x = cx - 21; x <= cx + 21; x++) {
        const nx = (x - cx) / 20.5;
        const ny = (y - cy) / 23;
        if (nx * nx + ny * ny > 1 && y < cy) continue;
        if (Math.abs(x - cx) > 20.5) continue;
        if (y > cy - 7 && Math.abs(x - cx) < 14.5) continue; // visage
        if (y >= cy - 9 && y <= cy - 7 && Math.abs(x - cx) < 14.5 && hash(x, 1, 9) < 0.3) continue;
        front.set(x, y, ramp(hair, 0.55 - nx * 0.25 + (y > 40 ? -0.2 : 0) + ((x & 3) === 0 ? 0.12 : 0), x, y, 0.25));
      }
    }
    front.set(cx - headRx - 1, cy + 7, hex('#ffd23a'));
    front.set(cx - headRx - 1, cy + 8, hex('#ffd23a'));
  }
  // ombre douce des cheveux sur le front
  for (let y = 1; y < S; y++) {
    for (let x = 0; x < S; x++) {
      if (!head.alpha(x, y) || front.alpha(x, y)) continue;
      if (front.alpha(x, y - 1) || front.alpha(x, y - 2)) {
        const c = r.get(x, y);
        if (c !== INK && c !== 0xfbf8f4) r.set(x, y, mixRGB(c, skin[0], 0.45));
      }
    }
  }
  if (sp.style !== 'marcel') {
    for (let y = 0; y < cy - 3; y++) {
      for (let x = 0; x < S; x++) {
        if (!front.alpha(x, y)) continue;
        const d = Math.hypot((x - cx) / (headRx + 3), (y - cy + 2) / (headRy + 2));
        if (d > 0.74 && d < 0.8 && (x + y) % 4 !== 0 && x < cx + 8) front.set(x, y, hair[4]);
      }
    }
  }
  const fr = new Raster(S, S);
  fr.draw(front, 0, 0);
  edge(r, fr, mixRGB(hair[0], INK, 0.5));

  if (sp.style === 'gobie') {
    // lunettes rondes (par-dessus la frange)
    for (const side of [-1, 1]) {
      const ex = Math.round(cx + side * eyeDX);
      for (let a = 0; a < 40; a++) {
        const ang = (a / 40) * Math.PI * 2;
        r.set(Math.round(ex + Math.cos(ang) * 4.4), Math.round(eyeY + 0.5 + Math.sin(ang) * 3.8), hex('#8a5a3a'));
      }
      r.set(ex + 2, eyeY - 2, 0xffffff);
    }
    for (let x = cx - 2; x <= cx + 2; x++) r.set(x, eyeY - 1, hex('#8a5a3a'));
  }

  r.outline(INK);
  return r;
}
