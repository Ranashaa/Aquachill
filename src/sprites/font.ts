// Mini police pixel 3×5 pour les textes dessinés dans le monde (plaques, gains).
// Les longs textes (carnet, fiches) sont en HTML.

/** Chaque glyphe : 5 lignes (3 à 5 pixels de large), séparées par des espaces. */
const GLYPHS: Record<string, string> = {
  A: '.#. #.# ### #.# #.#', B: '##. #.# ##. #.# ##.', C: '.## #.. #.. #.. .##', D: '##. #.# #.# #.# ##.',
  E: '### #.. ##. #.. ###', F: '### #.. ##. #.. #..', G: '.## #.. #.# #.# .##', H: '#.# #.# ### #.# #.#',
  I: '### .#. .#. .#. ###', J: '..# ..# ..# #.# .#.', K: '#.# #.# ##. #.# #.#', L: '#.. #.. #.. #.. ###',
  M: '#...# ##.## #.#.# #...# #...#', N: '#..# ##.# #.## #..# #..#', O: '.#. #.# #.# #.# .#.', P: '##. #.# ##. #.. #..',
  Q: '.##. #..# #..# #.#. .#.#', R: '##. #.# ##. #.# #.#', S: '.## #.. .#. ..# ##.', T: '### .#. .#. .#. .#.',
  U: '#.# #.# #.# #.# ###', V: '#.# #.# #.# #.# .#.', W: '#...# #...# #.#.# ##.## #...#', X: '#.# #.# .#. #.# #.#',
  Y: '#.# #.# .#. .#. .#.', Z: '### ..# .#. #.. ###',
  '0': '### #.# #.# #.# ###', '1': '.#. ##. .#. .#. ###', '2': '##. ..# .#. #.. ###', '3': '##. ..# .#. ..# ##.',
  '4': '#.# #.# ### ..# ..#', '5': '### #.. ##. ..# ##.', '6': '.## #.. ### #.# ###', '7': '### ..# .#. .#. .#.',
  '8': '### #.# ### #.# ###', '9': '### #.# ### ..# ##.',
  '+': '... .#. ### .#. ...', '-': '... ... ### ... ...', '!': '.#. .#. .#. ... .#.', '?': '##. ..# .#. ... .#.',
  '.': '... ... ... ... .#.', ',': '... ... ... .#. #..', ':': '... .#. ... .#. ...', "'": '.#. .#. ... ... ...',
  '/': '..# ..# .#. #.. #..', '(': '.#. #.. #.. #.. .#.', ')': '.#. ..# ..# ..# .#.', '°': '.#. #.# .#. ... ...',
  ' ': '... ... ... ... ...',
};

const PARSED: Record<string, { w: number; rows: string[] }> = Object.fromEntries(
  Object.entries(GLYPHS).map(([ch, g]) => {
    const rows = g.split(' ');
    return [ch, { w: rows[0].length, rows }];
  }),
);

export const GLYPH_H = 5;

export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}

function glyph(ch: string) {
  return PARSED[ch] ?? PARSED['?'];
}

export function measureText(text: string): number {
  const t = normalizeText(text);
  let w = 0;
  for (const ch of t) w += glyph(ch).w + 1;
  return Math.max(0, w - 1);
}

export function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  let cx = x;
  for (const ch of normalizeText(text)) {
    const g = glyph(ch);
    g.rows.forEach((row, ry) => {
      for (let rx = 0; rx < row.length; rx++) if (row[rx] === '#') ctx.fillRect(cx + rx, y + ry, 1, 1);
    });
    cx += g.w + 1;
  }
}
