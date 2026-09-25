// Mini police pixel 3×5 pour les textes dessinés dans le monde (plaques, gains).
// Les longs textes (carnet, fiches) sont en HTML.

/** Chaque glyphe : 5 lignes de 3 pixels, séparées par des espaces. */
const GLYPHS: Record<string, string> = {
  A: '.#. #.# ### #.# #.#', B: '##. #.# ##. #.# ##.', C: '.## #.. #.. #.. .##', D: '##. #.# #.# #.# ##.',
  E: '### #.. ##. #.. ###', F: '### #.. ##. #.. #..', G: '.## #.. #.# #.# .##', H: '#.# #.# ### #.# #.#',
  I: '### .#. .#. .#. ###', J: '..# ..# ..# #.# .#.', K: '#.# #.# ##. #.# #.#', L: '#.. #.. #.. #.. ###',
  M: '#.# ### ### #.# #.#', N: '### #.# #.# #.# #.#', O: '.#. #.# #.# #.# .#.', P: '##. #.# ##. #.. #..',
  Q: '.#. #.# #.# ##. .##', R: '##. #.# ##. #.# #.#', S: '.## #.. .#. ..# ##.', T: '### .#. .#. .#. .#.',
  U: '#.# #.# #.# #.# ###', V: '#.# #.# #.# #.# .#.', W: '#.# #.# ### ### #.#', X: '#.# #.# .#. #.# #.#',
  Y: '#.# #.# .#. .#. .#.', Z: '### ..# .#. #.. ###',
  '0': '### #.# #.# #.# ###', '1': '.#. ##. .#. .#. ###', '2': '##. ..# .#. #.. ###', '3': '##. ..# .#. ..# ##.',
  '4': '#.# #.# ### ..# ..#', '5': '### #.. ##. ..# ##.', '6': '.## #.. ### #.# ###', '7': '### ..# .#. .#. .#.',
  '8': '### #.# ### #.# ###', '9': '### #.# ### ..# ##.',
  '+': '... .#. ### .#. ...', '-': '... ... ### ... ...', '!': '.#. .#. .#. ... .#.', '?': '##. ..# .#. ... .#.',
  '.': '... ... ... ... .#.', ',': '... ... ... .#. #..', ':': '... .#. ... .#. ...', "'": '.#. .#. ... ... ...',
  '/': '..# ..# .#. #.. #..', '(': '.#. #.. #.. #.. .#.', ')': '.#. ..# ..# ..# .#.', '°': '.#. #.# .#. ... ...',
  ' ': '... ... ... ... ...',
};

const BITS: Record<string, string> = Object.fromEntries(
  Object.entries(GLYPHS).map(([ch, g]) => [ch, g.replace(/ /g, '')]),
);

export const GLYPH_W = 3;
export const GLYPH_H = 5;

export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
}

export function measureText(text: string): number {
  const t = normalizeText(text);
  return t.length === 0 ? 0 : t.length * (GLYPH_W + 1) - 1;
}

export function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  const t = normalizeText(text);
  for (let i = 0; i < t.length; i++) {
    const bits = BITS[t[i]] ?? BITS['?'];
    for (let p = 0; p < 15; p++) {
      if (bits[p] === '#') ctx.fillRect(x + i * (GLYPH_W + 1) + (p % 3), y + Math.floor(p / 3), 1, 1);
    }
  }
}
