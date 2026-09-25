// Sons et musique synthétisés en WebAudio : aucun fichier audio externe.
// Musique : nappe d'accords doux + notes pentatoniques aléatoires avec écho.

export type Sfx = 'bubble' | 'coin' | 'scrub' | 'newFish' | 'build' | 'click' | 'star' | 'levelUp' | 'clean' | 'place';

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

// Cmaj7 – Am7 – Fmaj7 – G6 (en notes MIDI)
const CHORDS = [
  [48, 55, 59, 64],
  [45, 52, 55, 60],
  [41, 48, 52, 57],
  [43, 50, 55, 59],
];
const PENTA = [72, 74, 76, 79, 81, 84, 86, 88];
const BEAT = 60 / 66;

export class AudioEngine {
  private ctx?: AudioContext;
  private master?: GainNode;
  private musicBus?: GainNode;
  private sfxBus?: GainNode;
  private echo?: DelayNode;
  private noise?: AudioBuffer;
  private nextBeat = 0;
  private beat = 0;
  private timer?: number;
  private lastScrub = 0;

  constructor(private muted: boolean) {}

  get isMuted(): boolean {
    return this.muted;
  }

  /** À appeler lors d'une interaction utilisateur (politique d'autoplay des navigateurs). */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!Ctor) return;
    const ctx: AudioContext = new Ctor();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.8;
    this.master.connect(ctx.destination);

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 2200;
    lowpass.connect(this.master);

    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = 0.16;
    this.musicBus.connect(lowpass);

    this.echo = ctx.createDelay(1.5);
    this.echo.delayTime.value = BEAT * 0.75;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.35;
    this.echo.connect(feedback);
    feedback.connect(this.echo);
    this.echo.connect(lowpass);

    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = 0.35;
    this.sfxBus.connect(this.master);

    this.noise = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    this.nextBeat = ctx.currentTime + 0.2;
    this.timer = window.setInterval(() => this.schedule(), 200);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(muted ? 0 : 0.8, this.ctx.currentTime, 0.05);
  }

  suspend(): void {
    void this.ctx?.suspend();
  }

  resume(): void {
    void this.ctx?.resume();
  }

  // ---------------------------------------------------------------- musique

  private schedule(): void {
    const ctx = this.ctx!;
    while (this.nextBeat < ctx.currentTime + 0.6) {
      const t = this.nextBeat;
      const bar = Math.floor(this.beat / 4);
      if (this.beat % 8 === 0) {
        const chord = CHORDS[Math.floor(bar / 2) % CHORDS.length];
        chord.forEach((n) => this.pad(midi(n), t, BEAT * 8));
      }
      if (Math.random() < 0.45) {
        const note = PENTA[Math.floor(Math.random() * PENTA.length)];
        this.pluck(midi(note), t + (Math.random() < 0.3 ? BEAT / 2 : 0));
      }
      this.beat++;
      this.nextBeat += BEAT;
    }
  }

  private pad(freq: number, t: number, dur: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    osc.detune.value = (Math.random() - 0.5) * 8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.09, t + 1.8);
    g.gain.setValueAtTime(0.09, t + dur - 1.5);
    g.gain.linearRampToValueAtTime(0, t + dur + 0.5);
    osc.connect(g);
    g.connect(this.musicBus!);
    osc.start(t);
    osc.stop(t + dur + 0.6);
  }

  private pluck(freq: number, t: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.22, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    osc.connect(g);
    g.connect(this.musicBus!);
    g.connect(this.echo!);
    osc.start(t);
    osc.stop(t + 1.3);
  }

  // ------------------------------------------------------------------ bruitages

  private tone(freq: number, t: number, dur: number, type: OscillatorType = 'sine', vol = 0.3, slideTo?: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g);
    g.connect(this.sfxBus!);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  play(name: Sfx): void {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    switch (name) {
      case 'bubble':
        this.tone(380, t, 0.14, 'sine', 0.25, 900);
        break;
      case 'coin':
        this.tone(1318, t, 0.08, 'triangle', 0.18);
        this.tone(1760, t + 0.07, 0.18, 'triangle', 0.18);
        break;
      case 'click':
        this.tone(660, t, 0.05, 'triangle', 0.15);
        break;
      case 'place':
        this.tone(330, t, 0.12, 'sine', 0.3, 200);
        this.tone(520, t + 0.05, 0.16, 'sine', 0.2, 900);
        break;
      case 'scrub': {
        if (t - this.lastScrub < 0.09) return;
        this.lastScrub = t;
        const src = this.ctx.createBufferSource();
        src.buffer = this.noise!;
        const bp = this.ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 2500 + Math.random() * 1500;
        bp.Q.value = 3;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.25, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        src.connect(bp);
        bp.connect(g);
        g.connect(this.sfxBus!);
        src.start(t);
        src.stop(t + 0.1);
        break;
      }
      case 'clean':
        [76, 79, 84, 88].forEach((n, i) => this.tone(midi(n), t + i * 0.07, 0.3, 'triangle', 0.15));
        break;
      case 'newFish':
        [72, 76, 79, 84].forEach((n, i) => this.tone(midi(n), t + i * 0.1, 0.4, 'sine', 0.22));
        this.tone(300, t, 0.2, 'sine', 0.2, 800);
        break;
      case 'star':
        [84, 88, 91, 96].forEach((n, i) => this.tone(midi(n), t + i * 0.06, 0.25, 'triangle', 0.12));
        break;
      case 'levelUp':
        [60, 64, 67, 72, 76, 79].forEach((n, i) => this.tone(midi(n), t + i * 0.08, 0.5, 'triangle', 0.16));
        break;
      case 'build':
        [48, 55, 60, 64, 67].forEach((n) => this.tone(midi(n), t, 1.2, 'triangle', 0.1));
        [72, 76, 79].forEach((n, i) => this.tone(midi(n), t + 0.3 + i * 0.1, 0.5, 'sine', 0.18));
        break;
    }
  }

  destroy(): void {
    if (this.timer) clearInterval(this.timer);
    void this.ctx?.close();
  }
}
