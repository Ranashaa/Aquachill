import type { SpriteDef } from '../SpriteFactory';

export const UI_SPRITES: Record<string, SpriteDef> = {
  coin: {
    palette: { o: '#c8862a', y: '#ffd23a', Y: '#fff3a0' },
    rows: [
      '..ooo..',
      '.oyyyo.',
      'oyYyyyo',
      'oyYyyyo',
      'oyyyyyo',
      '.oyyyo.',
      '..ooo..',
    ],
  },
  starcoin: {
    palette: { o: '#c85a9a', y: '#ff9ad8', Y: '#fff0fa', s: '#ffffff' },
    rows: [
      '...o...',
      '..oyo..',
      'ooyYyoo',
      'oyyYyyo',
      '.oyyyo.',
      'oyo.oyo',
      'oo...oo',
    ],
  },
  heart: {
    palette: { h: '#ff6f91', H: '#ffd0dc' },
    rows: ['.h.h.', 'hHhhh', 'hhhhh', '.hhh.', '..h..'],
  },
  bubble: {
    palette: { b: '#d8f4ff', w: '#ffffff' },
    rows: ['.bb.', 'bw.b', 'b..b', '.bb.'],
  },
  sparkle: {
    palette: { w: '#fff6b0', W: '#ffffff' },
    rows: ['..w..', '..w..', 'wwWww', '..w..', '..w..'],
  },
  star: {
    palette: { y: '#ffd23a', Y: '#fff3a0', o: '#c8862a' },
    rows: ['...o...', '..oyo..', 'ooyYyoo', 'oyyyyyo', '.oyyyo.', 'oyo.oyo', 'oo...oo'],
  },
  question: {
    palette: { w: '#ffffff', k: '#3a3656', b: '#c8d8f0' },
    rows: [
      '.bwwwb.',
      'bwkkkwb',
      'bwwwkwb',
      'bwwkkwb',
      'bwwwwwb',
      'bwwkwwb',
      '.bwwwb.',
      '...b...',
    ],
  },
  crane: {
    palette: { y: '#ffc23a', k: '#3a3656', g: '#8a8a94' },
    rows: [
      'yyyyyyyyyyyyyyy',
      'y.y.y.y.y.y.y.y',
      'yyyyyyyyyyyyyyy',
      '....y......g...',
      '....y......g...',
      '....y......k...',
      '....y..........',
      '....y..........',
      '...yyy.........',
    ],
  },
};
