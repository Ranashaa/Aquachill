// Boîte de dialogue façon Stardew : grand portrait animé, plaque au nom,
// texte qui s'écrit, choix qui changent la relation.
import { CHARACTERS, hearts, MAX_HEARTS, type Choice, type Line, type Npc, type Relation, type Topic } from './dialogue';
import { portrait, type Mood } from './portraits';

const cache = new Map<string, string>();
function portraitUrl(id: Npc, mood: Mood, variant: 'base' | 'talk' | 'blink'): string {
  const key = `${id}:${mood}:${variant}`;
  let url = cache.get(key);
  if (!url) {
    url = portrait(id, { mood, talk: variant === 'talk', blink: variant === 'blink' }).toCanvas().toDataURL();
    cache.set(key, url);
  }
  return url;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = cls;
  if (text) e.textContent = text;
  return e;
}

export interface DialogueHooks {
  onChoice(choice: Choice): void;
  onClose(): void;
}

export class DialogueUI {
  private box: HTMLElement | null = null;
  private timers: number[] = [];

  constructor(private root: HTMLElement) {}

  get open(): boolean {
    return !!this.box;
  }

  show(id: Npc, rel: Relation, script: { lines: Line[]; topic?: Topic }, hooks: DialogueHooks): void {
    this.close();
    const c = CHARACTERS[id];
    const wrap = el('div', 'dlg');
    const top = el('div', 'dlg-top');
    const frame = el('div', 'dlg-frame');
    const img = el('img', 'dlg-portrait');
    img.alt = c.name;
    frame.append(img);
    const plate = el('div', 'dlg-plate');
    plate.append(el('div', 'dlg-name', c.name), el('div', 'dlg-role', c.role));
    const heartRow = el('div', 'dlg-hearts');
    const renderHearts = () => {
      heartRow.replaceChildren();
      const n = hearts(rel);
      for (let i = 0; i < MAX_HEARTS; i++) heartRow.append(el('span', i < n ? 'h on' : 'h', '♥'));
    };
    renderHearts();
    plate.append(heartRow);
    top.append(frame, plate);
    const box = el('div', 'dlg-box');
    const text = el('div', 'dlg-text');
    const next = el('div', 'dlg-next', '▼');
    const choices = el('div', 'dlg-choices');
    box.append(text, next);
    wrap.append(top, box, choices);
    this.root.append(wrap);
    this.box = wrap;
    requestAnimationFrame(() => wrap.classList.add('in'));

    let mood: Mood = 'neutral';
    let talking = false;
    let blink = false;
    const paint = () => {
      img.src = portraitUrl(id, mood, blink ? 'blink' : talking ? 'talk' : 'base');
    };
    // la bouche bouge pendant qu'on parle, et on cligne des yeux de temps en temps
    let mouth = false;
    this.timers.push(window.setInterval(() => {
      if (!talking) return;
      mouth = !mouth;
      img.src = portraitUrl(id, mood, blink ? 'blink' : mouth ? 'talk' : 'base');
    }, 130));
    this.timers.push(window.setInterval(() => {
      blink = true;
      paint();
      window.setTimeout(() => {
        blink = false;
        paint();
      }, 140);
    }, 3200));

    let queue: Line[] = [];
    let typing: number | null = null;
    let full = '';
    let onLineDone: (() => void) | null = null;
    const say = (line: Line, done: () => void) => {
      mood = line.mood ?? 'neutral';
      full = line.text;
      talking = true;
      next.classList.remove('on');
      let i = 0;
      text.textContent = '';
      paint();
      onLineDone = done;
      if (typing) clearInterval(typing);
      typing = window.setInterval(() => {
        i += 1;
        text.textContent = full.slice(0, i);
        if (i >= full.length) finishTyping();
      }, 28);
    };
    const finishTyping = () => {
      if (typing) clearInterval(typing);
      typing = null;
      text.textContent = full;
      talking = false;
      paint();
      const cb = onLineDone;
      onLineDone = null;
      cb?.();
    };
    const play = (lines: Line[], end: () => void) => {
      queue = [...lines];
      const step = () => {
        const line = queue.shift();
        if (!line) return end();
        say(line, () => {
          if (queue.length) next.classList.add('on');
          else end();
        });
        advance = step;
      };
      step();
    };
    let advance: (() => void) | null = null;
    let closing = false;
    const finish = () => {
      next.classList.add('on');
      advance = () => {
        if (closing) return;
        closing = true;
        this.close();
        hooks.onClose();
      };
    };
    box.addEventListener('click', () => {
      if (typing) return finishTyping();
      if (choices.childElementCount) return;
      advance?.();
    });

    const offerChoices = (topic: Topic) => {
      next.classList.remove('on');
      advance = null;
      topic.choices.forEach((ch, k) => {
        const b = el('button', 'dlg-choice', ch.text);
        b.style.animationDelay = `${k * 70}ms`;
        b.addEventListener('click', () => {
          choices.replaceChildren();
          const before = hearts(rel);
          hooks.onChoice(ch);
          renderHearts();
          this.pop(frame, ch.delta, hearts(rel) > before);
          play(ch.reply, finish);
        });
        choices.append(b);
      });
    };

    play(script.lines, () => (script.topic ? offerChoices(script.topic) : finish()));
  }

  /** Petit cœur (ou nuage) qui s'envole du portrait selon la réaction. */
  private pop(frame: HTMLElement, delta: number, levelUp: boolean): void {
    const p = el('div', `dlg-pop ${delta > 0 ? 'good' : delta < 0 ? 'bad' : 'meh'}`, delta > 0 ? (levelUp ? '♥ +1' : '♥') : delta < 0 ? '…' : '·');
    frame.append(p);
    window.setTimeout(() => p.remove(), 1400);
  }

  close(): void {
    this.timers.forEach((t) => clearInterval(t));
    this.timers = [];
    const b = this.box;
    this.box = null;
    if (!b) return;
    b.classList.remove('in');
    window.setTimeout(() => b.remove(), 250);
  }
}
