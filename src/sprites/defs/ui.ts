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
  book: {
    palette: { k: '#3a3656', W: '#ffffff', b: '#9fb8e8', r: '#ff8a5c' },
    rows: [
      '.kkk.kkk.',
      'kWWWkWWWk',
      'kWbbkbbWk',
      'kWWWkWWWk',
      'kWbbkbbWk',
      'kWWWkWWWk',
      'kkkkrkkkk',
      '....r....',
    ],
  },
  gear: {
    palette: { k: '#3a3656', g: '#8a86a8' },
    rows: ['..k.k..', '.kkkkk.', 'kkggkkk', '.kg.gk.', 'kkkgkkk', '.kkkkk.', '..k.k..'],
  },
  thermo: {
    palette: { k: '#3a3656', w: '#ffffff', r: '#ff5a5a' },
    rows: ['..k..', '.kwk.', '.kwk.', '.krk.', '.krk.', '.krk.', 'krrrk', 'krrrk', '.kkk.'],
  },
  plant: {
    palette: { g: '#5faf4a', G: '#3f8f3a', k: '#c8653a' },
    rows: ['...g...', '.g.g.g.', '.gGgG..', '..gGg.g', 'g..G.gg', '.gGGg..', '.kkkkk.', '..kkk..'],
  },
  fishicon: {
    palette: { o: '#ff7b1c', w: '#fff8ee', k: '#3a3656' },
    rows: ['....ooo..', 'o..owoooo', 'oooowooko', 'o..owoooo', '....ooo..'],
  },
  speaker: {
    palette: { k: '#3a3656' },
    rows: ['...k....', '..kk..k.', 'kkkk.k..', 'kkkk.k.k', 'kkkk.k..', '..kk..k.', '...k....'],
  },
  mute: {
    palette: { k: '#3a3656', r: '#e84a5f' },
    rows: ['...k....', '..kk....', 'kkkk.r.r', 'kkkk..r.', 'kkkk.r.r', '..kk....', '...k....'],
  },
  star5: {
    palette: { y: '#ffd23a' },
    rows: ['..y..', '.yyy.', 'yyyyy', '.yyy.', '.y.y.'],
  },
  star5off: {
    palette: { y: '#6a6490' },
    rows: ['..y..', '.yyy.', 'yyyyy', '.yyy.', '.y.y.'],
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
